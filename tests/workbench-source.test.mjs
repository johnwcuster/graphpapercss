import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SOURCE_ITEMS, clampSourceCount, sourcePalette, sourceStyle, contrastRatio } from '../docs/workbench/source.mjs';

test('source item count is bounded to one through eight, including old shared links', () => {
  assert.equal(MAX_SOURCE_ITEMS, 8);
  for (const [value, expected] of [[-1,1],[0,1],[1,1],[3.7,3],[8,8],[9,8],[12,8],[100,8]]) assert.equal(clampSourceCount(value), expected);
  assert.equal(clampSourceCount(null, 6), 6);
  assert.equal(clampSourceCount('invalid', 6), 6);
  assert.equal(clampSourceCount(Infinity), 1);
});

test('eight stable source colors have contrasting numeric labels and readable content tints', () => {
  assert.equal(new Set(sourcePalette).size, MAX_SOURCE_ITEMS);
  for (let item = 1; item <= MAX_SOURCE_ITEMS; item++) {
    const { color, ink, tint } = sourceStyle(item);
    assert.equal(color, sourcePalette[item - 1]);
    assert.ok(contrastRatio(color, ink) >= 4.5, `Item ${item}: numeric label contrast`);
    assert.ok(contrastRatio(tint, '#283134') >= 4.5, `Item ${item}: host text contrast`);
    assert.deepEqual(sourceStyle(item), sourceStyle(item));
  }
});
