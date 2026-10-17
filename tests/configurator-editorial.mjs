import assert from 'node:assert/strict';
import { recipes, layoutsFor, fields, expandedPlacements, compactPlacements, sequentialPlacements } from '../src/ruler/geometry.mjs';
import { bandThresholds } from '../src/ruler/bands.mjs';

export async function checkEditorial(page, origin, engine) {
  for (const document of ['configurator', 'configurator-help']) {
    await page.goto(`${origin}/docs/${document}.html?grid=grid_03a--07&set=set_06&items=6&width=1024`);
    if (document === 'configurator') {
      await page.waitForFunction(() => window.getComputedStyle(globalThis.document.querySelector('#preview')).width === '1024px');
      await page.click('#workbench-hide');
    }
    for (const width of [320, 640, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const sheet = page.locator('.editorial-sheet');
      const ruler = await sheet.boundingBox();
      const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      for (const composition of await page.locator('[data-editorial="intro"], [data-editorial="markup"], [data-editorial="example"], [data-editorial="help-intro"]').all()) {
        const { grid, set, band } = await composition.evaluate(node => ({ grid: [...node.classList].find(c => c.startsWith('grid_')), set: [...node.classList].find(c => c.startsWith('set_')), band: [...node.classList].find(c => c.startsWith('gp_band--'))?.slice(-2) }));
        const layout = set && layoutsFor(recipes[grid]).find(layout => layout.set === set && !layout.flow);
        const thresholds = band ? bandThresholds(recipes[grid], 'wide', layout, band) : { compact: 30, expanded: 60 };
        const state = ruler.width >= thresholds.expanded * rem ? 'expanded' : ruler.width >= thresholds.compact * rem ? 'compact' : 'stacked';
        const count = await composition.locator(':scope > *').count();
        const expected = state === 'stacked' ? sequentialPlacements(recipes[grid], 'wide', count, state)
          : layout ? (state === 'expanded' ? expandedPlacements(recipes[grid], 'wide', layout) : compactPlacements('wide', layout))
            : sequentialPlacements(recipes[grid], 'wide', count, state);
        for (let i = 0; i < count; i++) {
          const bounds = await composition.locator(':scope > *').nth(i).boundingBox(), position = expected.find(p => p.item === i + 1);
          const bit = ruler.width / 64;
          const measuredLimit = i === 0 && await composition.evaluate(node => node.classList.contains('editorial-intro'))
            ? await composition.locator(':scope > *').nth(i).evaluate(node => parseFloat(getComputedStyle(node).maxInlineSize)) : Infinity;
          const areaWidth = (position.lines[1] - position.lines[0]) * bit;
          const expectedWidth = Math.min(areaWidth, measuredLimit);
          const expectedStart = ruler.x + (fields.wide.start + position.lines[0] - 1) * bit + (areaWidth - expectedWidth) / 2;
          assert.ok(Math.abs(bounds.x - expectedStart) < 1, `${document}/${width}/${grid}: item ${i + 1} start`);
          assert.ok(Math.abs(bounds.width - expectedWidth) < 1, `${document}/${width}/${grid}: item ${i + 1} width`);
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${document}/${width}: no page-level horizontal overflow`);
      if (document === 'configurator' && width === 640) {
        assert.ok(await page.locator('[data-editorial="intro"] > div').first().evaluate(node => {
          const field = node.parentElement.getBoundingClientRect();
          return Math.abs(node.getBoundingClientRect().width - field.width) < 1;
        }), 'The documentation band gives the introduction a full reading width before the preview stacks');
      }
      if (document === 'configurator') {
        assert.equal(await page.locator('#preview').evaluate(node => node.getBoundingClientRect().width), 1024);
        assert.equal(await page.locator('#composition').evaluate(node => node.classList.contains('is-stacked')), false, 'A stacked document must not stack its independent 1024px preview');
      } else {
        assert.equal(await page.locator('.editorial-prose h2').count(), 5);
        assert.ok(await page.locator('.editorial-prose p').first().evaluate(node => node.getBoundingClientRect().width <= parseFloat(getComputedStyle(node).fontSize) * 50));
      }
      if (engine === 'chromium' && [320, 1440].includes(width)) {
        await page.screenshot({ path: `test-results/${document}-editorial-${width}.png`, fullPage: document === 'configurator-help' });
        if (document === 'configurator' && width === 1440) {
          await page.locator('[data-editorial="markup"]').scrollIntoViewIfNeeded();
          await page.screenshot({ path: 'test-results/configurator-editorial-markup.png' });
          await page.locator('[data-editorial="example"]').first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: 'test-results/configurator-editorial-examples.png' });
        }
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  console.log(`${engine}: editorial ruler alignment, recipe geometry, 320px reflow, reading measure, and independent preview PASS`);
}
