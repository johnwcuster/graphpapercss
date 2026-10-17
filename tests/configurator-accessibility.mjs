import assert from 'node:assert/strict';

export async function checkAccessibility(page, origin, engine) {
  const url = `${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&items=6&width=1024`;
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  for (const id of ['illustration-toggle', 'set-options-toggle', 'gutter-options-toggle', 'band-options-toggle']) {
    const toggle = page.locator('#' + id);
    assert.ok((await toggle.getAttribute('aria-label')).startsWith(await toggle.textContent()));
    await toggle.click();
  }
  for (const group of await page.getByRole('radiogroup').all()) {
    assert.equal(await group.locator('[role="radio"][tabindex="0"]').count(), 1);
    assert.equal(await group.locator('[aria-checked="true"]').count(), 1);
  }
  const active = () => page.evaluate(() => ({ key: document.activeElement.dataset.choiceKey, checked: document.activeElement.getAttribute('aria-checked') }));
  await page.locator('#family-choices [aria-checked="true"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await active(), { key: 'family-choices:04', checked: 'true' });
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual(await active(), { key: 'family-choices:03', checked: 'true' });
  // Family changes intentionally normalize unsupported variants. Reset to a
  // recipe with an unavailable Default to verify keyboard skipping separately.
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  await page.click('#illustration-toggle');
  await page.locator('#letter-choices [aria-checked="true"]').focus();
  await page.keyboard.press('Home');
  assert.deepEqual(await active(), { key: 'letter-choices:a', checked: 'true' });
  await page.keyboard.press('End');
  assert.equal((await active()).checked, 'true');
  assert.equal(await page.evaluate(() => document.activeElement.disabled), false);
  await page.keyboard.press('Home');
  const choice = page.locator('#letter-choices [aria-checked="true"]');
  assert.equal(await choice.getAttribute('aria-label'), 'a');
  assert.match(await choice.evaluate(node => document.getElementById(node.getAttribute('aria-describedby')).textContent), /Compact:.*Expanded:.*item 1.*left/);
  await page.locator('#panel-dock').focus(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#workbench-panel').isVisible(), true, 'Escape in a native selector must not dismiss its panel');
  await page.locator('#source-count').evaluate(node => {
    window.__countMutations = 0;
    new MutationObserver(() => window.__countMutations++).observe(node, { childList: true, subtree: true });
  });
  await page.locator('#width').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => window.__countMutations), 0);
  assert.equal(await page.locator('#width').getAttribute('aria-valuetext'), '1026 pixels');
  await page.click('#source-add');
  assert.equal(await page.locator('#source-count').textContent(), '7 items');
  await page.click('[data-choice-key="family-choices:05"]');
  assert.match(await page.locator('#control-announcement').textContent(), /Positions: Default/);

  // The tools are nonmodal: page focus remains on the intended page element.
  await page.selectOption('#panel-dock', 'left');
  await page.locator('#workspace nav a').first().focus();
  assert.equal(await page.locator('#workbench-panel').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.matches('#workspace nav a')), true);
  assert.equal(await page.evaluate(() => {
    const node = document.activeElement, bounds = node.getBoundingClientRect();
    return node.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2));
  }), true, 'The reopen control must not obscure page focus either');
  await page.click('#panel-toggle');
  assert.equal(await page.locator('#workbench-panel').isVisible(), true);
  await page.locator('#workbench-panel').evaluate(node => { node.scrollTop = node.scrollHeight; });
  await page.locator('#source-add').focus();
  assert.ok(await page.evaluate(() => document.querySelector('#source-add').getBoundingClientRect().top >= document.querySelector('.panel-heading').getBoundingClientRect().bottom));

  for (const dock of ['left', 'right', 'top', 'bottom']) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.selectOption('#dock', dock);
    for (const panelDock of ['left', 'right']) {
      await page.selectOption('#panel-dock', panelDock);
      assert.ok(await page.locator('#workbench-panel').evaluate(panel => {
        const b = panel.getBoundingClientRect();
        return b.left >= 0 && b.right <= innerWidth && panel.scrollWidth <= panel.clientWidth + 1 && b.width >= 280;
      }), `${dock}/${panelDock}: settings must reflow without horizontal overflow at 320px`);
    }
  }
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('#family-choices [aria-checked="true"]').evaluate(node => getComputedStyle(node, '::after').content), '"✓"');
  await page.emulateMedia({ forcedColors: 'none' });
  if (engine === 'chromium') await page.screenshot({ path: 'test-results/configurator-accessibility-320.png' });
  await page.setViewportSize({ width: 1280, height: 900 });
  console.log(`${engine}: accessible names/descriptions, radio navigation, restrained announcements, Escape, visible focus, 320px reflow, and forced colors PASS`);
}
