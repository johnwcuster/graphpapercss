import assert from 'node:assert/strict';
import { checkAccessibility } from './configurator-accessibility.mjs';
import { checkEditorial } from './configurator-editorial.mjs';

export async function expandOptions(page, ids = ['illustration-toggle', 'set-options-toggle', 'gutter-options-toggle', 'band-options-toggle']) {
  for (const id of ids) if (await page.locator('#' + id).getAttribute('aria-expanded') === 'false') await page.click('#' + id);
}

export async function clickBoundary(page, key) {
  if (!(await page.locator('#transition-menu').evaluate(node => node.open))) await page.click('#transition-menu > summary');
  await page.click(`[data-boundary="${key}"]`);
}

export async function selectBand(page, band) {
  await expandOptions(page, ['band-options-toggle']);
  await page.click(`#band-choices [data-band="${band || 'default'}"]`);
}

export async function selectGrid(page, grid) {
  await expandOptions(page, ['illustration-toggle']);
  const match = /^grid_(\d{2})([a-d]?)(?:--(\d{2}))?$/.exec(grid);
  // Clear the numbered variant before changing letters; some combinations do not exist.
  if (await page.locator('[data-choice-key="variant-choices:default"]').isEnabled())
    await page.click('[data-choice-key="variant-choices:default"]');
  await page.click(`[data-choice-key="family-choices:${match[1]}"]`);
  if (await page.locator('[data-choice-key="variant-choices:default"]').isEnabled())
    await page.click('[data-choice-key="variant-choices:default"]');
  const letter = `[data-choice-key="letter-choices:${match[2] || 'default'}"]`;
  if (!(await page.locator(letter).isEnabled()) && match[3]) {
    // grid_04d has numbered recipes only: enter via a compatible letter first.
    await page.click('[data-choice-key="letter-choices:a"]');
  }
  if (await page.locator(letter).isEnabled()) await page.click(letter);
  if (match[3]) await page.click(`[data-choice-key="variant-choices:${match[3]}"]`);
  if (!(await page.locator(letter).getAttribute('aria-checked') === 'true')) await page.click(letter);
}
export const selected = (page, key) => page.evaluate(key => new URL(location.href).searchParams.get(key), key);

export async function setSourceCount(page, count) {
  assert.ok(count >= 1 && count <= 8);
  const items = () => page.locator('#composition > article').count();
  while (await items() < count) await page.click('#source-add');
  while (await items() > count) await page.click('#source-remove');
}

export async function checkWorkbench(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  await expandOptions(page);
  const width = () => page.locator('#preview').evaluate(node => node.getBoundingClientRect().width);
  assert.equal(await page.locator('#starting-points').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Move the lead to the center', exact: true }).count(), 0);
  assert.equal(await page.locator('#undo').count(), 0);
  assert.equal(await page.locator('#reserve-space, #compare, #comparison').count(), 0);
  const panelSummaries = await page.locator('#workbench-panel summary').allTextContents();
  assert.equal(panelSummaries.includes('How controls interact'), false);
  assert.equal(panelSummaries.includes('Migration reference'), false);
  assert.equal(await page.locator('.panel-heading kbd').textContent(), '⌥ ⇧ G');
  const originalUrl = page.url();
  assert.equal(await page.locator('#workbench-rail #panel-toggle').count(), 0);
  assert.equal(await page.locator('#panel-toggle').isVisible(), false);
  assert.equal(await page.locator('.rail-preview #width, .rail-preview #transition-menu, .rail-preview .overlay-menu').count(), 3);
  assert.equal(await page.locator('.rail-utilities #workbench-hide').textContent(), 'Hide workbench');
  assert.equal(await page.locator('#panel-close').textContent(), 'Close panel');
  const [help] = await Promise.all([page.waitForEvent('popup'), page.click('#workbench-help')]);
  await help.waitForLoadState('domcontentloaded');
  assert.equal(await help.locator('h1').textContent(), 'Configurator help');
  assert.equal(await help.locator('#controls').textContent(), 'How controls interact');
  assert.equal(await help.locator('#migration').textContent(), 'Migration reference');
  await help.close();
  assert.equal(page.url(), originalUrl);
  await page.click('[data-choice-key="flow-choices:flow_02"]');
  await setSourceCount(page, 3);
  assert.equal(await selected(page, 'set'), 'set_06');
  assert.equal(await selected(page, 'flow'), 'flow_02');
  await page.click('[data-choice-key="set-choices:set_03"]');
  assert.equal(await selected(page, 'set'), 'set_03');
  await page.click('[data-choice-key="set-choices:set_06"]');
  await page.click('[data-choice-key="flow-choices:flow_02"]');
  assert.equal(await selected(page, 'set'), 'set_06');
  assert.equal(await selected(page, 'flow'), 'flow_02');
  assert.equal(await page.locator('#composition > article').count(), 3);
  await setSourceCount(page, 4);
  assert.equal(await page.locator('#composition > article').count(), 4);
  await setSourceCount(page, 6);
  assert.equal(await page.locator('#composition > article').count(), 6);
  assert.equal(await selected(page, 'flow'), 'flow_02');
  await page.click('[data-choice-key="flow-choices:default"]');
  assert.equal(await selected(page, 'flow'), 'default');
  await page.locator('#width').evaluate(node => {
    for (const width of [1100, 1200, 1300]) { node.value = width; node.dispatchEvent(new Event('input')); }
    node.dispatchEvent(new Event('change'));
  });
  await page.locator('#width').evaluate(node => { node.value = 1024; node.dispatchEvent(new Event('input')); });
  assert.equal(await width(), 1024);
  const content = await page.locator('#composition > article').first().elementHandle();
  await content.evaluate(node => { node.querySelector('h3').textContent = 'Preserve this edited headline'; });
  assert.equal(await width(), 1024);
  assert.equal(await page.locator('#inspection-overlay').getAttribute('data-mismatches'), '0');

  // Floating controls stay available when the document scrolls, without resizing it.
  await page.evaluate(() => scrollTo(0, 500));
  assert.equal(await page.locator('#workbench-rail').evaluate(node => Math.round(node.getBoundingClientRect().top)), 0);
  for (const dock of ['right', 'bottom', 'left', 'top']) {
    await page.selectOption('#dock', dock);
    assert.equal(await page.locator('#workbench').getAttribute('data-dock'), dock);
    assert.equal(await width(), 1024);
    assert.equal(await page.locator('#workspace').getAttribute('data-control-dock'), dock);
    assert.equal(await page.locator('#workspace').getAttribute('data-reserved'), null);
    assert.equal(await page.locator('#workbench').getAttribute('data-panel-dock'), 'right');
    for (const panelDock of ['left', 'right']) {
      await page.selectOption('#panel-dock', panelDock);
      assert.equal(await page.locator('#workbench').getAttribute('data-panel-dock'), panelDock);
      assert.equal(await page.locator('#workbench').getAttribute('data-dock'), dock);
      assert.equal(await width(), 1024);
      const panelBounds = await page.locator('#workbench-panel').boundingBox();
      assert.ok(panelDock === 'left' ? panelBounds.x < 220 : panelBounds.x > 600);
    }
    const hideBounds = await page.locator('#workbench-hide').boundingBox();
    await page.click('#workbench-hide');
    const showBounds = await page.locator('#workbench-launcher').boundingBox();
    assert.ok(Math.abs((dock === 'left' ? showBounds.x - hideBounds.x : showBounds.x + showBounds.width - hideBounds.x - hideBounds.width)) < 1);
    assert.ok(Math.abs((dock === 'bottom' ? showBounds.y + showBounds.height - hideBounds.y - hideBounds.height : showBounds.y - hideBounds.y)) < 1);
    assert.equal(await page.locator('#workbench-launcher svg[aria-hidden="true"]').count(), 1);
    await page.click('#workbench-launcher');
  }
  await page.click('#workbench-hide');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'workbench-launcher');
  assert.equal(await page.locator('#workbench-rail').isVisible(), false);
  assert.equal(await page.locator('#workbench-launcher').isVisible(), true);
  assert.equal(await width(), 1024);
  await page.keyboard.press('Alt+Shift+g');
  assert.equal(await page.locator('#workbench-rail').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'workbench-hide');
  await page.click('#panel-close');
  assert.equal(await page.locator('#panel-toggle svg[aria-hidden="true"]').count(), 1);
  assert.equal(await page.locator('#workbench-panel').isVisible(), false);
  assert.equal(await page.locator('#panel-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#panel-toggle').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'panel-toggle');
  await page.click('#panel-toggle');
  assert.equal(await page.evaluate(() => document.activeElement.matches('.panel-heading h2')), true);
  assert.equal(await page.locator('#panel-toggle').isVisible(), false);
  assert.equal(await page.locator('#family-choices [aria-checked="true"]').evaluate(node => getComputedStyle(node, '::after').content), '"✓"');

  await page.click('[data-choice-key="letter-choices:b"]');
  assert.equal(await selected(page, 'grid'), 'grid_03b--07');
  await page.getByRole('radio', { name: 'Default', exact: true }).and(page.locator('#variant-choices button')).click();
  assert.equal(await selected(page, 'grid'), 'grid_03b');
  assert.equal(await content.evaluate(node => node.isConnected && node.querySelector('h3').textContent), 'Preserve this edited headline');
  await page.click('[data-choice-key="family-choices:05"]');
  assert.equal(await selected(page, 'grid'), 'grid_05');
  assert.equal(await selected(page, 'set'), 'none');
  assert.equal(await page.locator('[data-choice-key="set-choices:set_06"]').isDisabled(), true);
  assert.equal(await page.locator('[data-choice-key="flow-choices:flow_01"]').isDisabled(), true);
  await selectGrid(page, 'grid_03b');
  await page.click('[data-choice-key="set-choices:set_06"]');
  assert.equal(await selected(page, 'grid'), 'grid_03b');
  assert.equal(await selected(page, 'set'), 'set_06');
  assert.equal(await page.locator('#family-choices [aria-checked="true"]').getAttribute('data-choice-key'), 'family-choices:03');

  await selectGrid(page, 'grid_03');
  await setSourceCount(page, 3);
  assert.equal(await selected(page, 'set'), 'set_06');
  await page.click('[data-choice-key="set-choices:set_03"]');
  await page.click('#field-choices [data-field="wide"]');
  await selectBand(page, '02');
  assert.equal(await page.locator('#flow-choices [aria-checked="true"]').count(), 1);
  await clickBoundary(page, 'expanded-below');
  assert.equal(await page.locator('#width').inputValue(), '911');
  assert.match(await page.locator('#summary').textContent(), /^compact/);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '913');
  assert.match(await page.locator('#summary').textContent(), /^expanded/);
  assert.match(await page.locator('#markup').textContent(), /gp_band--02/);
  assert.doesNotMatch(await page.locator('#markup').textContent(), /doc-composition|is-stacked|inspection/);

  // Each overlay is independent, and drawing overlays never alters the items.
  await page.locator('.overlay-menu summary').click();
  await page.check('#layout-guide'); await page.check('#band-guide');
  await page.waitForFunction(() => document.querySelectorAll('.item-box').length === 3 && document.querySelectorAll('.band-bracket').length === 3);
  assert.equal(await page.locator('.item-source').count(), 3);
  await page.uncheck('#source-guide');
  await page.waitForFunction(() => document.querySelectorAll('.item-source').length === 0);
  assert.equal(await page.locator('.band-bracket').count(), 3);
  await page.uncheck('#breakpoint-guide');
  assert.equal(await page.locator('#width-scale').isVisible(), false);
  await page.check('#breakpoint-guide');
  await page.check('#macro-guide');
  assert.equal(await page.locator('#macro-overlay.visible span').count(), 3);
  await page.locator('.overlay-menu summary').click();
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.mismatches === '0');

  // Deliberate host CSS interference must be measured, not masked by a diagram.
  await page.locator('#composition > article').first().evaluate(node => { node.style.width = '50px'; });
  await page.waitForFunction(() => Number(document.querySelector('#inspection-overlay').dataset.mismatches) > 0);
  await page.locator('#composition > article').first().evaluate(node => { node.style.removeProperty('width'); });
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.mismatches === '0');
  await page.locator('#width').evaluate(node => { node.value = 280; node.dispatchEvent(new Event('input')); });
  await page.waitForFunction(() => document.querySelectorAll('.under-pressure').length === 3);
  assert.match(await page.locator('#summary').textContent(), /^stacked/);

  // On small screens the shell can be dismissed and keyboard focus is restored.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const root = document.getElementById('workbench'), rail = document.getElementById('workbench-rail');
    return root.style.getPropertyValue('--rail-offset') === `${Math.ceil(rail.getBoundingClientRect().height)}px`;
  });
  // Capture the resized viewport before pointer checks; WebKit can otherwise
  // still hit-test the previous fixed-rail positions during its first paint.
  await page.screenshot({ path: `test-results/configurator-mobile-${engine}.png`, fullPage: false });
  await page.click('#workbench-hide');
  assert.equal(await page.locator('#workbench-launcher').isVisible(), true);
  await page.click('#workbench-launcher');
  assert.equal(await page.locator('#workbench-rail').isVisible(), true);
  assert.equal(await width(), 280);
  if (engine === 'chromium') await page.screenshot({ path: 'test-results/configurator-workbench-mobile.png', fullPage: false });
  await page.setViewportSize({ width: 1280, height: 900 });
  await checkTransitionPreview(page, origin, engine);
  await checkSetOptions(page, origin, engine);
  await checkGutterChoices(page, origin, engine);
  await checkBandChoices(page, origin, engine);
  await checkIllustrationDisclosure(page, origin, engine);
  await checkVariantStates(page, origin, engine);
  await checkSourceControls(page, origin, engine);
  await checkResponsiveFeedback(page, origin, engine);
  await checkAccessibility(page, origin, engine);
  await checkEditorial(page, origin, engine);
  if (engine === 'chromium') {
    await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&width=1024`);
    await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
    await page.screenshot({ path: 'test-results/configurator-workbench.png', fullPage: false });
  }
  console.log(`${engine}: workbench docking, visibility/focus, recipe choices, boundaries, DOM preservation, overlays, measured interference, and mobile PASS`);
}

async function checkTransitionPreview(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03&set=set_03&field=wide&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.equal(await page.locator('#responsive-sequence, #sequence-toggle, #sequence-states').count(), 0);
  assert.equal(await page.locator('#workbench-panel #boundary-steps').count(), 0);
  assert.equal(await page.locator('#workbench-rail #boundary-steps').count(), 1);
  const menu = page.locator('#transition-menu'), toggle = menu.locator('summary');
  assert.equal(await menu.evaluate(node => node.open), false);
  const url = page.url();
  await toggle.focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#boundary-steps').isVisible(), true);
  assert.equal(page.url(), url);
  assert.equal(await page.locator('#width').inputValue(), '1024');
  assert.equal(await page.locator('#undo').count(), 0);
  assert.equal(await page.locator('#boundary-steps button').count(), 4);
  await clickBoundary(page, 'compact-below');
  assert.equal(await page.locator('#width').inputValue(), '479');
  assert.match(await page.locator('#summary').textContent(), /^stacked/);
  await clickBoundary(page, 'compact-above');
  assert.equal(await page.locator('#width').inputValue(), '481');
  assert.match(await page.locator('#summary').textContent(), /^compact/);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '961');
  assert.match(await page.locator('#summary').textContent(), /^expanded/);
  await clickBoundary(page, 'compact-above');
  assert.equal(await page.locator('#width').inputValue(), '481');
  await page.click('#panel-dock');
  assert.equal(await menu.evaluate(node => node.open), false, 'Clicking outside dismisses the preview menu');
  await toggle.click();
  await page.keyboard.press('Escape');
  assert.equal(await menu.evaluate(node => node.open), false);
  assert.equal(await page.evaluate(() => document.activeElement.parentElement.id), 'transition-menu');
  await selectBand(page, '02');
  assert.equal(await page.locator('#width').inputValue(), '481');
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '913');
  for (const dock of ['left', 'right', 'bottom', 'top']) {
    await page.selectOption('#dock', dock);
    if (!(await menu.evaluate(node => node.open))) await toggle.click();
    assert.equal(await page.locator('#boundary-steps').isVisible(), true);
    await clickBoundary(page, 'expanded-below');
    assert.equal(await page.locator('#width').inputValue(), '911');
    await toggle.click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `test-results/configurator-transitions-mobile-${engine}.png`, fullPage: false });
  await toggle.click();
  const bounds = await page.locator('.transition-options').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '913');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 900 });
  if (engine === 'chromium') {
    await toggle.click();
    await page.screenshot({ path: 'test-results/configurator-test-transitions.png', fullPage: false });
  }
  console.log(`${engine}: rail transition tests, exact resize targets, live thresholds, one-time width, Escape, docking, and mobile PASS`);
}

async function checkSetOptions(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&flow=flow_02&items=6&field=wide&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  const toggle = page.locator('#set-options-toggle');
  for (const id of ['illustration-toggle', 'set-options-toggle', 'gutter-options-toggle', 'band-options-toggle']) {
    assert.equal(await page.locator('#' + id).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#' + id).textContent(), 'Show options');
    assert.equal(await page.locator('#' + id).evaluate(button => {
      const panel = button.closest('.options-panel');
      return panel.dataset.expanded === 'false'
        && button.parentElement === panel
        && button.getAttribute('aria-controls').split(' ').every(id => panel.querySelector('.options-content').contains(document.getElementById(id)));
    }), true, 'Disclosure and all controlled choices share one visual group');
  }
  for (const group of ['letter', 'variant', 'flow', 'field', 'band']) {
    assert.equal(await page.locator(`#${group}-choices button:visible`).count(), 1);
    assert.equal(await page.locator(`#${group}-choices button:visible`).getAttribute('aria-checked'), 'true');
  }
  assert.equal(await page.locator('#family-choices button:visible').count(), 5);
  assert.equal(await page.locator('#set-choices button:visible').count(), 5);
  if (engine === 'chromium') await page.screenshot({ path: 'test-results/configurator-collapsed-defaults.png', fullPage: false });
  assert.equal(await toggle.getAttribute('aria-controls'), 'flow-choices');
  const boxes = () => page.locator('#composition > article').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return [r.left, r.top, r.width, r.height];
  }));
  const before = await boxes();
  await toggle.focus(); await page.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await toggle.evaluate(button => button.closest('.options-panel').dataset.expanded), 'true');
  await page.keyboard.press('Space');
  assert.equal(await toggle.textContent(), 'Show options');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.evaluate(button => button.closest('.options-panel').dataset.expanded), 'false');
  assert.equal(await page.locator('#set-choices button:visible').count(), 5);
  assert.equal(await page.locator('#flow-choices button:visible').count(), 1);
  assert.equal(await page.locator('#set-choices [aria-checked="true"]').getAttribute('data-choice-key'), 'set-choices:set_06');
  assert.equal(await page.locator('#flow-choices button:visible').getAttribute('data-choice-key'), 'flow-choices:flow_02');
  assert.deepEqual(await boxes(), before);
  assert.equal(await page.locator('#illustration-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#gutter-options-toggle').getAttribute('aria-expanded'), 'false');
  await page.click('[data-choice-key="set-choices:none"]');
  assert.equal(await selected(page, 'flow'), 'default');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#flow-choices button:visible').count(), 1);
  assert.equal(await page.locator('#flow-choices button:visible').getAttribute('data-choice-key'), 'flow-choices:default');
  await page.click('[data-choice-key="set-choices:set_06"]');
  assert.equal(await selected(page, 'set'), 'set_06');
  assert.equal(await selected(page, 'flow'), 'default');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await page.click('[data-choice-key="family-choices:05"]');
  assert.equal(await page.locator('#set-choices [aria-checked="true"]').getAttribute('data-choice-key'), 'set-choices:none');
  assert.equal(await page.locator('#flow-choices button:visible').getAttribute('data-choice-key'), 'flow-choices:default');
  await selectGrid(page, 'grid_03a--07');
  await page.click('[data-choice-key="set-choices:set_06"]');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#set-choices [aria-checked="true"]').getAttribute('data-choice-key'), 'set-choices:set_06');
  assert.equal(await page.locator('#flow-choices button:visible').getAttribute('data-choice-key'), 'flow-choices:default');
  await toggle.click();
  assert.equal(await toggle.textContent(), 'Hide options');
  assert.equal(await page.locator('#set-choices button:visible').count(), 5);
  assert.equal(await page.locator('#flow-choices button:visible').count(), 8);
  await page.click('[data-choice-key="set-choices:set_03"]');
  await toggle.click();
  assert.equal(await page.locator('#set-choices [aria-checked="true"]').getAttribute('data-choice-key'), 'set-choices:set_03');
  assert.equal(await page.locator('#set-choices button:visible').count(), 5);
  assert.equal(await page.locator('#flow-choices button:visible').getAttribute('aria-checked'), 'true');
  console.log(`${engine}: always-visible position counts, collapsed Flow updates/defaults, and keyboard disclosure PASS`);
}

async function checkGutterChoices(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&flow=default&items=6&field=wide&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.equal(await page.locator('#field').count(), 0);
  assert.equal(await page.locator('fieldset', { has: page.locator('#field-choices') }).locator('legend').textContent(), 'Usable width');
  assert.equal(await page.locator('fieldset', { has: page.locator('#field-choices') }).locator('.choices-heading').textContent(), 'Gutters');
  assert.deepEqual(await page.locator('#field-choices .gutter-name').allTextContents(), ['full · 64 bits', 'neat · 60 bits', 'thin · 59 bits', 'wide · 58 bits', 'ruled · 56 bits']);
  const gutterToggle = page.locator('#gutter-options-toggle');
  assert.equal(await gutterToggle.getAttribute('aria-expanded'), 'false');
  await gutterToggle.focus(); await page.keyboard.press('Space');
  assert.equal(await gutterToggle.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Space');
  assert.equal(await gutterToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await gutterToggle.textContent(), 'Show options');
  assert.equal(await page.locator('#field-choices button:visible').count(), 1);
  assert.equal(await page.locator('#field-choices button:visible').getAttribute('data-field'), 'wide');
  await expandOptions(page, ['illustration-toggle']);
  await page.click('[data-choice-key="variant-choices:01"]');
  await page.click('[data-choice-key="variant-choices:07"]');
  assert.equal(await gutterToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#field-choices button:visible').count(), 1);
  await gutterToggle.click();
  assert.equal(await gutterToggle.textContent(), 'Hide options');
  assert.equal(await page.locator('#field-choices button:visible').count(), 5);
  const content = await page.locator('#composition > article').first().elementHandle();
  await content.evaluate(node => node.querySelector('h3').textContent = 'Gutter edits preserve content');
  for (const [field, inset, end, gap] of [['full',0,64,0], ['neat',2,62,0], ['thin',2,61,1], ['wide',3,61,2], ['ruled',4,60,2]]) {
    const button = page.locator(`#field-choices [data-field="${field}"]`);
    await button.click();
    assert.equal(await selected(page, 'field'), field);
    assert.equal(await button.getAttribute('aria-checked'), 'true');
    assert.equal(await page.locator('#field-choices [aria-checked="true"]').count(), 1);
    assert.equal(await page.locator('#preview').evaluate(node => node.getBoundingClientRect().width), 1024);
    assert.equal(await page.locator('#composition > article').count(), 6);
    assert.equal(await content.evaluate(node => node.isConnected && node.querySelector('h3').textContent), 'Gutter edits preserve content');
    const boxes = await button.locator('rect').evaluateAll(nodes => nodes.map(node => ({ x: Number(node.getAttribute('x')), width: Number(node.getAttribute('width')) })));
    assert.equal(boxes[0].x, inset * 3);
    assert.equal(boxes[1].x + boxes[1].width, end * 3);
    assert.equal(boxes[1].x - boxes[0].x - boxes[0].width, gap * 3);
    assert.equal(await button.locator('.gutter-rule').count(), field === 'ruled' ? 1 : 0);
    if (field === 'ruled') assert.equal(Number(await button.locator('.gutter-rule').getAttribute('x1')), boxes[0].x + boxes[0].width + gap * 1.5);
    assert.equal(await page.locator('#rule-customization').isVisible(), field === 'ruled');
    assert.match(await page.locator('#markup').textContent(), new RegExp(`gp_field--${field}`));
  }
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.mismatches === '0');
  await gutterToggle.click();
  assert.equal(await page.locator('#field-choices button:visible').getAttribute('data-field'), 'ruled');
  assert.equal(await page.locator('#rule-customization').isVisible(), true);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedRuleCss = text; } } }));
  await page.click('#copy-rule-css');
  assert.equal(await page.evaluate(() => window.__copiedRuleCss), await page.locator('#rule-css').textContent());
  const style = await page.addStyleTag({ content: await page.locator('#rule-css').textContent() });
  const marker = page.locator('#composition > .gp_rule--end').first();
  assert.equal(await marker.evaluate(node => getComputedStyle(node, '::after').backgroundColor), 'rgb(134, 80, 61)');
  assert.notEqual(await marker.evaluate(node => getComputedStyle(node, '::after').content), 'none');
  await style.evaluate(node => node.remove());
  assert.equal(await marker.evaluate(node => getComputedStyle(node, '::after').backgroundColor), await marker.evaluate(node => getComputedStyle(node).color));
  if (engine === 'chromium') {
    await page.locator('#rule-css').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-gutters-rules.png', fullPage: false });
  }
  await expandOptions(page, ['gutter-options-toggle']);
  await page.click('#field-choices [data-field="wide"]');
  await gutterToggle.click();
  assert.equal(await selected(page, 'field'), 'wide');
  assert.equal(await page.locator('#rule-customization').isVisible(), false);
  assert.equal(await page.locator('#field-choices button:visible').getAttribute('data-field'), 'wide');
  assert.equal(await gutterToggle.getAttribute('aria-expanded'), 'false');
  await gutterToggle.click();
  await page.click('#field-choices [data-field="ruled"]');
  await page.locator('#width').evaluate(node => { node.value = 320; node.dispatchEvent(new Event('input')); });
  assert.equal(await page.locator('#rule-customization').isVisible(), true);
  assert.equal(await marker.evaluate(node => getComputedStyle(node, '::after').content), 'none');
  await page.locator('#width').evaluate(node => { node.value = 1024; node.dispatchEvent(new Event('input')); });
  await selectBand(page, '02');
  const threshold = await page.locator('#band-choices [aria-checked="true"] .band-thresholds').textContent();
  await page.click('#field-choices [data-field="full"]');
  assert.notEqual(await page.locator('#band-choices [aria-checked="true"] .band-thresholds').textContent(), threshold);
  assert.equal(await page.locator('#width').inputValue(), '1024');
  await page.click('#field-choices [data-field="ruled"]');
  assert.equal(await selected(page, 'field'), 'ruled');
  assert.equal(await page.locator('#band-choices [aria-checked="true"] .band-thresholds').textContent(), threshold);
  console.log(`${engine}: illustrated gutters, exact insets/gaps, ruler rule placement, copyable working color CSS, and band coupling PASS`);
}

async function checkBandChoices(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_02a--07&set=set_03&flow=default&items=4&field=thin&width=961`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.equal(await page.locator('#band').count(), 0);
  assert.equal(await page.locator('#band-pressure, #response-state, #response-policy, #response-thresholds, #response-why').count(), 0);
  assert.equal(await page.locator('.response-introduction #band-calculation #response-calculation').count(), 1);
  assert.equal(await page.locator('#band-calculation').evaluate(node => node.open), false);
  assert.equal(await page.locator('#responsive-design legend').textContent(), 'Responsive design');
  assert.equal(await page.locator('#field-choices').locator('..').locator('#band-choices').count(), 0);
  const toggle = page.locator('#band-options-toggle');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#band-choices button:visible').count(), 1);
  await toggle.focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#band-choices button:visible').count(), 4);
  assert.match(await page.locator('.band-legend').textContent(), /Preview width.*Default · 30 \/ 60rem/);
  assert.equal(await page.locator('#band-choices .band-default-reference').count(), 8);
  for (const timeline of await page.locator('#band-choices .band-timeline').all()) {
    assert.deepEqual(await timeline.locator('.band-default-reference').evaluateAll(nodes => nodes.map(node => node.dataset.rem)), ['30', '60']);
    assert.equal(await timeline.locator('.band-default-reference').first().evaluate(node => getComputedStyle(node).borderLeftStyle), 'dashed');
    const references = await timeline.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return [...node.querySelectorAll('.band-default-reference')].map(mark => (mark.getBoundingClientRect().left - rect.left) / rect.width);
    });
    assert.ok(Math.abs(references[0] - 480 / 3200) < .001);
    assert.ok(Math.abs(references[1] - 960 / 3200) < .001);
  }
  const markers = () => page.locator('#band-choices .band-current').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().left));
  const positions = await markers();
  assert.ok(positions.every(x => Math.abs(x - positions[0]) < 1), 'All bands use a shared current-width marker');
  const band02 = page.locator('#band-choices [data-band="02"]');
  assert.equal(await band02.getAttribute('data-effect'), 'different');
  assert.equal(await band02.isEnabled(), true);
  assert.equal(await band02.locator('.band-timeline').evaluate(node => getComputedStyle(node).filter), 'none');
  assert.doesNotMatch(await band02.locator('.band-effect').textContent(), /same layout/);
  assert.match(await page.locator('#band-axis').textContent(), /0–3200px/);
  const boxes = () => page.locator('#composition > article').evaluateAll(nodes => nodes.map(node => {
    // Compare the composition, not its page offset as descriptive text reflows.
    const r = node.getBoundingClientRect(), canvas = node.closest('#preview').getBoundingClientRect();
    return [r.left - canvas.left, r.top - canvas.top, r.width, r.height];
  }));
  const before = await boxes();
  const axis = await page.locator('#band-axis').textContent();
  await band02.click();
  assert.match(await page.locator('#response-calculation').textContent(), /narrowest defined position spans 22 of 64/);
  assert.equal(await selected(page, 'band'), '02');
  assert.equal(await page.locator('#width').inputValue(), '961');
  assert.equal(await page.locator('#band-axis').textContent(), axis);
  assert.deepEqual(await markers(), positions);
  const after = await boxes();
  assert.equal(after.length, before.length);
  after.forEach((box, item) => box.forEach((value, coordinate) => {
    assert.ok(Math.abs(value - before[item][coordinate]) < .01, 'Equivalent arrangements stay unchanged despite different transitions');
  }));
  assert.match(await page.locator('#markup').textContent(), /gp_band--02/);
  assert.match(await page.locator('[data-boundary="expanded-above"]').textContent(), /753px/);
  if (engine === 'chromium') {
    await page.locator('#band-choices').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-responsive-bands.png', fullPage: false });
  }
  await toggle.click();
  await selectBand(page, '');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#band-choices button:visible').getAttribute('data-band'), 'default');
  await selectBand(page, '02');
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '753');
  const band03 = page.locator('#band-choices [data-band="03"]');
  assert.equal(await band03.getAttribute('data-effect'), 'different');
  await band03.click();
  assert.equal(await page.locator('#width').inputValue(), '753');
  assert.match(await page.locator('#summary').textContent(), /^compact/);
  await selectBand(page, '02');
  assert.match(await page.locator('#summary').textContent(), /^expanded/);
  await page.goto(`${origin}/docs/configurator.html?grid=grid_02&set=set_03&field=wide&band=01&width=449`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  const shared = page.locator('#band-choices [data-band="01"]');
  assert.equal(await shared.isVisible(), true, 'Band links retain the selected preview');
  assert.equal(await shared.locator('.band-segment.compact').count(), 0);
  assert.match(await shared.locator('.band-thresholds').textContent(), /no compact interval/);
  const fixedReferences = await shared.locator('.band-default-reference').evaluateAll(nodes => nodes.map(node => node.style.left));
  await page.locator('#width').evaluate(node => { node.value = 1600; node.dispatchEvent(new Event('input')); });
  assert.match(await page.locator('#band-axis').textContent(), /0–3200px/);
  assert.deepEqual(await shared.locator('.band-default-reference').evaluateAll(nodes => nodes.map(node => node.style.left)), fixedReferences);
  assert.equal(await shared.locator('.band-current').evaluate(node => node.style.left), '50%');
  await page.goto(`${origin}/docs/configurator.html?grid=grid_02&set=set_05&field=wide&width=8192`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.match(await page.locator('#band-axis').textContent(), /0–3200px.*8192px.*off-scale/);
  assert.equal(await page.locator('#band-choices [aria-checked="true"] .band-current.off-scale').count(), 1);
  for (const segment of await page.locator('#band-choices .band-segment').all()) assert.ok(await segment.evaluate(node => parseFloat(node.style.left) + parseFloat(node.style.width) <= 100.001));
  console.log(`${engine}: separate responsive fieldset, four band timelines, shared axis, same-layout policy changes, fixed canvas, and skipped compact interval PASS`);
}

async function checkIllustrationDisclosure(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03c&set=none&flow=default&items=6&field=wide&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  const toggle = page.locator('#illustration-toggle');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#letter-choices button:visible').count(), 1);
  await expandOptions(page, ['illustration-toggle']);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#letter-choices button:visible').count(), 5);
  const equivalent = page.locator('[data-choice-key="letter-choices:d"]');
  assert.equal(await equivalent.getAttribute('data-effect'), 'same');
  assert.equal(await equivalent.isEnabled(), true);
  assert.match(await equivalent.locator('.choice-note').textContent(), /Same layout and transitions/);
  assert.equal(await equivalent.locator('svg').first().evaluate(node => getComputedStyle(node).filter), 'grayscale(1)');
  assert.equal(await page.locator('#letter-choices [aria-checked="true"] svg').first().evaluate(node => getComputedStyle(node).filter), 'none');
  if (engine === 'chromium') {
    await equivalent.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-equivalent-illustration.png', fullPage: false });
  }
  await toggle.focus(); await page.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  for (const group of ['letter', 'variant']) {
    assert.equal(await page.locator(`#${group}-choices button:visible`).count(), 1);
    assert.equal(await page.locator(`#${group}-choices button:visible`).getAttribute('aria-checked'), 'true');
    assert.equal(await page.locator(`#${group}-choices button:visible svg`).count(), group === 'letter' ? 2 : 1);
  }
  assert.equal(await selected(page, 'grid'), 'grid_03c');
  await page.click('[data-choice-key="family-choices:05"]');
  assert.equal(await page.locator('#letter-choices button:visible').count(), 1);
  assert.equal(await page.locator('#letter-choices button:visible .choice-label').textContent(), 'Default');
  await page.click('[data-choice-key="family-choices:03"]');
  await expandOptions(page, ['illustration-toggle']);
  await page.click('[data-choice-key="letter-choices:c"]');
  await toggle.click();
  assert.equal(await page.locator('#letter-choices button:visible .choice-label').textContent(), 'c');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  if (engine === 'chromium') {
    await toggle.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-selected-illustrations.png', fullPage: false });
  }
  await toggle.click();
  assert.equal(await page.locator('#letter-choices button:visible').count(), 5);
  await equivalent.click();
  assert.equal(await selected(page, 'grid'), 'grid_03d');
  await page.click('[data-choice-key="variant-choices:01"]');
  const unavailable = page.locator('[data-choice-key="letter-choices:default"]');
  assert.equal(await unavailable.isDisabled(), true);
  assert.equal(await unavailable.locator('.choice-label').textContent(), 'Default (Unavailable)');
  assert.equal(await unavailable.locator('.choice-unavailable').textContent(), 'Unselect the --01 variant below.');
  assert.doesNotMatch(await unavailable.textContent(), /set_|flow_/);
  if (engine === 'chromium') {
    await unavailable.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-letter-guidance.png', fullPage: false });
  }
  await page.click('[data-choice-key="variant-choices:default"]');
  assert.equal(await unavailable.isEnabled(), true);
  await unavailable.click();
  assert.equal(await selected(page, 'grid'), 'grid_03');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  console.log(`${engine}: illustration disclosure, retained selection, desaturated equivalents, and actionable letter availability PASS`);
}

async function checkVariantStates(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a&set=set_06&flow=default&items=6&field=wide&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  await expandOptions(page, ['illustration-toggle']);
  assert.equal(await page.locator('#macro-region-panel .choices-heading').textContent(), 'Variants when expanded');
  const variant = page.locator('[data-choice-key="variant-choices:01"]');
  assert.equal(await variant.getAttribute('data-effect'), 'different');
  assert.deepEqual(await variant.locator('.width-change').evaluateAll(nodes => nodes.map(node => [node.dataset.widthChange, Number(node.dataset.deltaBits)])), [['unchanged', 0], ['wider', 2], ['narrower', -2]]);
  assert.match(await variant.getAttribute('title'), /Widths vs grid_03a: region 1 unchanged; region 2 wider by 2 bits; region 3 narrower by 2 bits/);
  assert.equal(await page.locator('#letter-choices .width-change, #flow-choices .width-change').count(), 0);
  const boxes = () => page.locator('#composition > article').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(); return { left: rect.left, width: rect.width };
  }));
  const before = await boxes();
  await variant.click();
  const after = await boxes();
  assert.ok(Math.abs(after[1].width - before[1].width - 32) < 1);
  assert.ok(Math.abs(after[3].left - before[3].left - 32) < 1);
  assert.ok(Math.abs(before[3].width - after[3].width - 32) < 1);
  if (engine === 'chromium') {
    await variant.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-variant-width-cues.png', fullPage: false });
  }
  await setSourceCount(page, 1);
  const defaultVariant = page.locator('[data-choice-key="variant-choices:default"]');
  assert.equal(await defaultVariant.getAttribute('data-effect'), 'same');
  assert.equal(await defaultVariant.isEnabled(), true);
  assert.equal(await defaultVariant.evaluate(node => getComputedStyle(node).borderTopWidth), '0px');
  assert.equal(await defaultVariant.locator('svg').evaluate(node => getComputedStyle(node).filter), 'grayscale(1)');
  assert.match(await defaultVariant.locator('.choice-note').textContent(), /Same layout and transitions/);
  if (engine === 'chromium') {
    await defaultVariant.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-equivalent-variant.png', fullPage: false });
  }
  const single = await boxes();
  await defaultVariant.click();
  assert.deepEqual(await boxes(), single);
  assert.equal(await defaultVariant.getAttribute('data-effect'), 'selected');
  assert.equal(await defaultVariant.locator('svg').evaluate(node => getComputedStyle(node).filter), 'none');
  await selectGrid(page, 'grid_04d--01');
  assert.match(await page.locator('#variant-width-key').textContent(), /No unnumbered Default/);
  assert.equal(await page.locator('#variant-choices .width-change').count(), 0);
  console.log(`${engine}: real variant differences and equivalent-variant visual states PASS`);
}

async function checkSourceControls(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&items=12&width=1024`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.deepEqual(await page.locator('#workbench-panel > section').evaluateAll(nodes => nodes.map(node => node.id)), ['source-section', 'design-section']);
  assert.equal(await page.locator('#item-count').count(), 0);
  assert.equal(await page.locator('#composition > article').count(), 8);
  assert.equal(await page.locator('#source-count').textContent(), '8 items');
  for (const removed of ['source-toggle', 'source-controls', 'source-items']) assert.equal(await page.locator('#' + removed).count(), 0);
  assert.deepEqual(await page.locator('.source-incrementors').evaluate(node => [...node.children].map(child => child.id)), ['source-remove', 'source-count', 'source-add']);
  assert.equal(await page.locator('#source-count svg rect').count(), 8);
  assert.equal(await page.locator('#source-count svg').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#source-count svg text').count(), 0);
  assert.equal(await page.locator('#source-add').isDisabled(), true);
  assert.equal(new URL(page.url()).searchParams.get('items'), '8');
  const colors = await page.locator('#source-count svg rect').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill));
  assert.equal(new Set(colors).size, 8);
  assert.deepEqual(await page.locator('.item-source').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor)), colors);
  assert.equal(await page.locator('#source-remove').getAttribute('aria-label'), 'Remove last source item');
  await page.locator('#source-remove').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#composition > article').count(), 7);
  assert.equal(await page.locator('#source-count').textContent(), '7 items');
  assert.equal(await page.locator('#source-count svg rect').count(), 7);
  assert.equal(await selected(page, 'set'), 'set_06');
  assert.equal(await selected(page, 'flow'), 'default');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source-remove');
  await page.click('#source-add');
  assert.equal(await page.locator('#composition > article').count(), 8);
  assert.equal(await page.locator('#source-add').isDisabled(), true);
  await page.locator('#composition > article').first().evaluate(node => node.querySelector('h3').textContent = 'Source content survives');
  await setSourceCount(page, 1);
  assert.equal(await page.locator('#source-remove').isDisabled(), true);
  assert.equal(await page.locator('#source-count').textContent(), '1 item');
  assert.equal(await page.locator('#source-count svg rect').count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source-add', 'At the lower limit focus moves to the available incrementor');
  assert.equal(await page.locator('#composition > article h3').first().textContent(), 'Source content survives');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#composition > article').count(), 2);
  await setSourceCount(page, 7);
  await page.locator('#source-add').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#composition > article').count(), 8);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source-remove', 'At the upper limit focus moves to the available incrementor');
  assert.deepEqual(await page.locator('#source-count svg rect').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill)), colors);
  const placementGroup = page.locator('#set-choices').locator('..');
  assert.equal(await placementGroup.locator('legend').textContent(), 'Set within macro regions');
  assert.deepEqual(await placementGroup.locator('.choices-heading').allTextContents(), ['Number of positions', 'Flow between positions']);
  assert.equal(await page.locator('#flow-choices .preview-caption').count(), 0);
  await expandOptions(page, ['set-options-toggle']);
  for (const previewWidth of [280, 600, 1024]) {
    await page.locator('#width').evaluate((node, value) => { node.value = value; node.dispatchEvent(new Event('input')); }, previewWidth);
    for (const svg of await page.locator('#flow-choices button:not(:disabled) svg').all()) {
      assert.deepEqual(await svg.locator('text').allTextContents(), ['1','2','3','4','5','6','7','8']);
      const heights = await svg.locator('rect').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('height'))));
      assert.ok(heights.every(height => height >= 10.99), 'Every Flow position, including 7/8, has room for its source number');
    }
  }
  if (engine === 'chromium') {
    await page.locator('#flow-choices').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-flow-eight-items.png', fullPage: false });
  }
  if (engine === 'chromium') {
    await page.locator('#source-heading').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-source-incrementors.png', fullPage: false });
  }
  console.log(`${engine}: compact Source incrementors, bright stack, one/eight-item limits, keyboard/focus, and DOM preservation PASS`);
}

async function checkResponsiveFeedback(page, origin, engine) {
  await page.goto(`${origin}/docs/configurator.html?grid=grid_03a--07&set=set_06&width=600`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  await expandOptions(page, ['illustration-toggle']);
  assert.equal(await page.locator('#choice-context').textContent(), 'Preview: 600px · Compact');
  const alternative = page.locator('#letter-choices [data-choice-key="letter-choices:b"]');
  assert.equal(await alternative.getAttribute('data-effect'), 'different');
  assert.equal(await alternative.isEnabled(), true);
  assert.match(await alternative.getAttribute('title'), /same way when compact/);
  assert.equal(await alternative.evaluate(node => getComputedStyle(node).borderTopWidth), '1px');
  assert.equal(await alternative.locator('svg').first().evaluate(node => getComputedStyle(node).filter), 'none');
  assert.equal(await alternative.locator('.choice-note').count(), 0, 'A future expanded difference must remain a meaningful choice');
  assert.deepEqual(await alternative.locator('svg').evaluateAll(nodes => nodes.map(node => node.dataset.state)), ['compact', 'expanded']);
  assert.equal(await page.locator('[data-choice-key="letter-choices:default"]').isDisabled(), true);
  assert.equal(await page.locator('[data-choice-key="letter-choices:default"]').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
  const fills = await page.locator('#letter-choices svg rect, #variant-choices svg rect').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill));
  assert.equal(new Set(fills).size, 1, 'Geometry previews use one neutral color');
  const flowFills = await page.locator('#flow-choices button[aria-checked="true"] svg rect').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill));
  const canvasFills = await page.locator('#composition > article').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
  assert.deepEqual(flowFills, canvasFills, 'Flow uses the light canvas tints');
  for (const removed of ['selection-notice', 'thumbnail-view', 'grid', 'family', 'set', 'flow', 'choice-details', 'count-warning', 'match-set', 'occupancy'])
    assert.equal(await page.locator('#' + removed).count(), 0);
  assert.deepEqual(await page.locator('#family-choices .choice-label').allTextContents(), ['2', '3', '4', '5', '6']);
  assert.deepEqual(await page.locator('#set-choices .choice-label').allTextContents(), ['Default', '3', '4', '5', '6']);
  assert.equal(await page.locator('#letter-choices').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 1);
  if (engine === 'chromium') {
    await alternative.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-design-controls.png', fullPage: false });
  }
  const geometry = () => page.locator('#composition > article').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(), canvas = node.closest('#preview').getBoundingClientRect();
    return [r.x - canvas.x, r.y - canvas.y, r.width, r.height];
  }));
  const before = await geometry();
  await alternative.click();
  assert.equal(await selected(page, 'grid'), 'grid_03b--07');
  const after = await geometry();
  assert.equal(after.length, before.length);
  after.forEach((box, item) => box.forEach((value, coordinate) => {
    assert.ok(Math.abs(value - before[item][coordinate]) < .01, 'Equivalent occupied geometry stays unchanged within floating-point precision');
  }));
  assert.match(await page.locator('#panel-field-classes').textContent(), /grid_03b--07/);
  assert.equal(await page.locator('[data-choice-key="letter-choices:b"]').getAttribute('data-effect'), 'selected');
  assert.equal(await page.locator('[data-choice-key="letter-choices:b"]').evaluate(node => getComputedStyle(node).borderTopWidth), '2px');
  assert.match(await page.locator('#summary').textContent(), /^compact/);
  await page.click('[data-choice-key="letter-choices:a"]');
  assert.equal(await selected(page, 'grid'), 'grid_03a--07');

  await page.goto(`${origin}/docs/configurator.html?grid=grid_02a--07&set=set_03&items=4&field=thin&width=961`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.equal(await page.locator('#panel-canvas-classes').textContent(), 'gp_canvas');
  assert.equal(await page.locator('[data-choice-key="letter-choices:b"]').isDisabled(), true, '02b--07 must not silently substitute the unnumbered recipe');
  assert.equal(await page.locator('#panel-field-classes').textContent(), await page.locator('#active-classes').textContent());
  assert.doesNotMatch(await page.locator('#panel-field-classes').textContent(), /doc-composition|is-stacked/);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedFieldClasses = text; } } }));
  await page.click('#copy-field-classes');
  assert.equal(await page.evaluate(() => window.__copiedFieldClasses), await page.locator('#panel-field-classes').textContent());
  if (engine === 'chromium') {
    await page.locator('#flow-choices').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/configurator-design-flow.png', fullPage: false });
  }
  await selectBand(page, '02');
  assert.equal(await page.locator('#width').inputValue(), '961');
  assert.match(await page.locator('#band-choices [aria-checked="true"] .band-effect').textContent(), /Expanded at current preview width/);
  assert.match(await page.locator('#band-choices [aria-checked="true"] .band-name').textContent(), /Band 02.*16rem/);
  assert.match(await page.locator('#threshold-change').textContent(), /960px → 752px.*Preview width stays 961px/);
  assert.match(await page.locator('[data-boundary="expanded-above"]').textContent(), /Above.*753px/);
  assert.equal(await page.locator('#width').inputValue(), '961');
  const rectangles = await geometry();
  assert.equal(rectangles.length, 4);
  assert.ok(Math.abs(rectangles[3][2] - 961 * 59 / 64) < 1);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '753');
  await selectBand(page, '03');
  assert.equal(await page.locator('#width').inputValue(), '753');
  assert.match(await page.locator('#summary').textContent(), /^compact/);
  assert.match(await page.locator('#threshold-change').textContent(), /Preview width stays 753px; the layout is compact/);
  await page.click('[data-choice-key="family-choices:04"]');
  assert.equal(await page.locator('#width').inputValue(), '753');
  const target = await page.locator('[data-boundary="expanded-above"]').getAttribute('title');
  const targetWidth = Number(target.match(/preview width to (\d+)px/)[1]);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), String(targetWidth));
  assert.match(await page.locator('#summary').textContent(), /^expanded/);
  if (engine === 'chromium') await page.screenshot({ path: 'test-results/configurator-response-feedback.png', fullPage: false });
  await page.goto(`${origin}/docs/configurator.html?grid=grid_02&set=set_03&items=3&field=wide&band=01&width=449`);
  await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
  assert.equal(await page.locator('#boundary-steps button').count(), 2);
  assert.match(await page.locator('#boundary-steps h3').textContent(), /Stacked → Expanded.*448px/);
  await clickBoundary(page, 'expanded-below');
  assert.equal(await page.locator('#width').inputValue(), '447');
  assert.match(await page.locator('#summary').textContent(), /^stacked/);
  await clickBoundary(page, 'expanded-above');
  assert.equal(await page.locator('#width').inputValue(), '449');
  assert.match(await page.locator('#summary').textContent(), /^expanded/);
  const topEdges = await page.locator('#composition > article').evaluateAll(nodes => nodes.slice(0, 2).map(node => node.getBoundingClientRect().top));
  assert.ok(Math.abs(topEdges[0] - topEdges[1]) < 1, 'Band-expanded items below 30rem must not retain stacked-only host margins');
  if (engine === 'chromium') await page.screenshot({ path: 'test-results/configurator-shared-transition.png', fullPage: false });
  console.log(`${engine}: applied classes, selectable same-here choices, state-aware thumbnails, band explanations, fixed-width threshold changes, and resize targets PASS`);
}
