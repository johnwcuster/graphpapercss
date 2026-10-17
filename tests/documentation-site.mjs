import assert from 'node:assert/strict';
import { sitePages } from '../scripts/docs-template.mjs';
import { recipes, fields, layoutsFor, expandedPlacements, compactPlacements, sequentialPlacements } from '../src/ruler/geometry.mjs';
import { bandThresholds } from '../src/ruler/bands.mjs';

export async function checkDocumentationSite(page, origin, engine) {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    for (const [id] of sitePages) {
      await page.goto(`${origin}/docs/${id}.html`);
      if (id === 'configurator') {
        await page.waitForFunction(() => document.querySelector('#inspection-overlay').dataset.ready === 'true');
        await page.click('#workbench-hide');
      }
      if (id === 'geometry-changes') await page.waitForFunction(() => document.querySelectorAll('#reviews > section').length === 12);
      if (id === 'legacy-reference') {
        const reference = page.frameLocator('#legacy-preview');
        await reference.locator('#reference article').first().waitFor();
        assert.equal(await reference.locator('#reference article').count(), 3);
        assert.equal(await reference.locator('link[href*="main.css"]').count(), 0, 'The legacy renderer must not load modern core');
      }
      const nav = page.getByRole('navigation', { name: 'Site navigation', exact: true });
      assert.equal(await nav.count(), 1, id);
      assert.equal(await nav.locator('[aria-current="page"]').getAttribute('href'), `./${id}.html`);
      assert.equal(await page.locator('h1').count(), 1, id);
      assert.equal(await page.locator('a[href*=".md"]').count(), 0, id);
      const ruler = page.getByRole('checkbox', { name: '64-bit ruler', exact: true });
      assert.equal(await ruler.count(), 1, `${id}: shared ruler toggle`);
      const widths = ['index', 'authoring', 'site-authoring', 'responsive-design', 'class-reference', 'configurator'].includes(id) ? [320, 640, 1024, 1231, 1233, 1440, 1920, 2560] : [320, 640, 1440];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const sheet = await nav.evaluate(node => {
          const bounds = node.closest('.gp_canvas').getBoundingClientRect();
          return { x: bounds.x, width: bounds.width };
        });
        assert.ok(Math.abs(sheet.x) < 1 && Math.abs(sheet.width - width) < 1, `${id}/${width}: ruler starts at page edges without a bounded shell`);
        for (const reading of await page.locator('.editorial-prose.grid_03c--07 > div').all()) {
          const box = await reading.boundingBox();
          const limit = await reading.evaluate(node => parseFloat(getComputedStyle(node).maxInlineSize));
          const readingLayout = layoutsFor(recipes['grid_03c--07']).find(layout => layout.set === 'set_03' && !layout.flow);
          const thresholds = bandThresholds(recipes['grid_03c--07'], 'wide', readingLayout, '01');
          const areaWidth = (width >= thresholds.expanded * 16 ? 34 : 58) * width / 64;
          assert.ok(Math.abs(box.width - Math.min(areaWidth, limit)) < 1, `${id}/${width}: typographic measure within the recipe`);
          assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 1, `${id}/${width}: central reading position`);
        }
        if (['responsive-design', 'site-authoring'].includes(id)) {
          const heading = await page.locator('.editorial-intro > header').boundingBox();
          for (const reading of await page.locator('.editorial-prose > div').all()) {
            const box = await reading.boundingBox();
            assert.ok(Math.abs(box.x - heading.x) < 1, `${id}/${width}: recurring title/prose/table left edge`);
          }
          assert.equal(await page.locator('.editorial-wide-data').count(), 0, 'Small tables do not turn the section into a wide data view');
        }
        for (const data of await page.locator('.editorial-wide-data > div').all()) {
          const box = await data.boundingBox();
          const limit = await data.evaluate(node => parseFloat(getComputedStyle(node).maxInlineSize));
          assert.ok(Math.abs(box.width - Math.min(58 * width / 64, limit)) < 1, 'Wide reference data has a task-specific measure');
          assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 1, 'Wide reference data remains centered');
        }
        const state = sheet.width >= 960 ? 'expanded' : sheet.width >= 480 ? 'compact' : 'stacked';
        const layout = layoutsFor(recipes.grid_03).find(l => l.set === 'set_03' && !l.flow);
        const placements = state === 'stacked' ? sequentialPlacements(recipes.grid_03, 'wide', 3, state)
          : state === 'expanded' ? expandedPlacements(recipes.grid_03, 'wide', layout) : compactPlacements('wide', layout);
        for (let i = 0; i < 3; i++) {
          const bounds = await nav.locator(':scope > *').nth(i).boundingBox(), position = placements.find(p => p.item === i + 1);
          assert.ok(Math.abs(bounds.x - sheet.x - (fields.wide.start + position.lines[0] - 1) * sheet.width / 64) < 1, `${id}/${width}: navigation alignment`);
          assert.ok(Math.abs(bounds.width - (position.lines[1] - position.lines[0]) * sheet.width / 64) < 1, `${id}/${width}: navigation width`);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id}/${width}: no page overflow`);
        if (['index', 'class-reference'].includes(id)) {
          const sheetNode = page.locator('.editorial-sheet').first();
          const before = await sheetNode.boundingBox();
          await ruler.check();
          const overlay = await sheetNode.evaluate(node => {
            const style = getComputedStyle(node, '::after');
            return { content: style.content, height: parseFloat(style.height), width: parseFloat(style.width), backgroundSize: style.backgroundSize, pointerEvents: style.pointerEvents };
          });
          assert.equal(overlay.content, '""');
          assert.ok(Math.abs(overlay.height - before.height) < 1, 'ruler covers the full document canvas height');
          assert.ok(Math.abs(overlay.width - before.width) < 1, 'ruler follows the actual canvas width');
          assert.match(overlay.backgroundSize, /^1\.5625% 100%$/);
          assert.equal(overlay.pointerEvents, 'none', 'ruler cannot intercept page controls');
          const after = await sheetNode.boundingBox();
          assert.equal(after.width, before.width, 'toggle does not resize the canvas');
          assert.equal(after.height, before.height, 'toggle does not change content height');
          if (engine === 'chromium' && id === 'index' && width === 1440) await page.screenshot({ path: 'test-results/docs-site-ruler.png' });
          await ruler.focus();
          await page.keyboard.press('Space');
          assert.equal(await ruler.isChecked(), false, 'native keyboard toggle');
        }
        for (const link of await nav.locator('a').all()) {
          const bounds = await link.boundingBox();
          assert.ok(bounds.height >= 24, `${id}/${width}: navigation link target size`);
        }
        if (engine === 'chromium' && ['index', 'getting-started', 'authoring', 'site-authoring', 'responsive-design', 'class-reference', 'alignment', 'architecture', 'geometry-record', 'legacy-reference'].includes(id) && [320, 1440, 2560].includes(width)) {
          await page.screenshot({ path: `test-results/docs-${id}-${width}.png` });
        }
        if (engine === 'chromium' && id === 'responsive-design' && width === 2560) {
          await page.locator('.editorial-prose').first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: 'test-results/responsive-design-reading-2560.png' });
        }
      }
    }
    await page.goto(`${origin}/docs/authoring.html`);
    await page.getByRole('checkbox', { name: '64-bit ruler', exact: true }).check();
    await page.goto(`${origin}/docs/class-reference.html`);
    const remembered = page.getByRole('checkbox', { name: '64-bit ruler', exact: true });
    assert.equal(await remembered.isChecked(), true, 'ruler preference survives page navigation');
    await remembered.uncheck();
    await page.reload();
    assert.equal(await page.getByRole('checkbox', { name: '64-bit ruler', exact: true }).isChecked(), false);
    // Run the actual copyable examples, not parallel hand-maintained fixtures.
    await page.goto(`${origin}/docs/alignment.html`);
    const examples = await page.locator('pre code.language-html').allTextContents();
    assert.equal(examples.length, 2);
    for (const [index, markup] of examples.entries()) {
      await page.setContent(`<link rel="stylesheet" href="${origin}/docs/assets/graph-paper/main.css">${markup}`, { waitUntil: 'networkidle' });
      for (const width of [320, 640, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const outer = page.locator('.gp_canvas').first();
        const field = outer.locator(':scope > .gp_field');
        const bounds = await outer.boundingBox();
        const state = bounds.width >= 960 ? 'expanded' : bounds.width >= 480 ? 'compact' : 'stacked';
        const placements = sequentialPlacements(recipes.grid_02, 'wide', 2, state);
        for (let item = 0; item < 2; item++) {
          const box = await field.locator(':scope > *').nth(item).boundingBox();
          const lines = placements[item].lines;
          assert.ok(Math.abs(box.x - bounds.x - (fields.wide.start + lines[0] - 1) * bounds.width / 64) < 1, `alignment example ${index}/${width}: item edge`);
          assert.ok(Math.abs(box.width - (lines[1] - lines[0]) * bounds.width / 64) < 1, `alignment example ${index}/${width}: item width`);
        }
        if (index === 0) {
          const wrapper = await page.locator('.gp_subgrid').boundingBox();
          const inset = state === 'stacked' ? 0 : bounds.width / 64;
          for (const child of await page.locator('.gp_subgrid > *').all()) {
            const box = await child.boundingBox();
            assert.ok(Math.abs(box.x - wrapper.x - inset) < 1 && Math.abs(box.width - wrapper.width + 2 * inset) < 1, 'subgrid example uses outer-ruler bit inset');
          }
        } else {
          const inner = page.locator('.gp_canvas .gp_canvas');
          const innerBounds = await inner.boundingBox();
          const display = await inner.locator(':scope > .gp_field').evaluate(node => getComputedStyle(node).display);
          assert.equal(display, innerBounds.width < 480 ? 'block' : 'grid', 'nested canvas uses its own width');
          if (width === 1024) assert.equal(display, 'block', 'inner remains stacked while outer is expanded');
        }
      }
    }
    assert.deepEqual(errors, []);
  } finally { page.off('pageerror', onError); }
  await page.setViewportSize({ width: 1280, height: 900 });
  console.log(`${engine}: ${sitePages.length} documentation pages, shared navigation geometry/current page, HTML links, 320px reflow, and legacy isolation PASS`);
}
