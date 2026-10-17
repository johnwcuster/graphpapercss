import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, fields, resolveColumns, layoutsFor } from '../src/ruler/geometry.mjs';
import { recipeParts, alternatives, selectAlternative, compatibleLayout, recipeSelection, designOptions, letterAvailability, variantWidthChanges, diagramItems, boundarySteps } from '../docs/workbench/model.mjs';

test('workbench recipe controls expose only real alternatives, including unnumbered defaults', () => {
  for (const id of Object.keys(recipes)) {
    const parts = recipeParts(id);
    assert.equal(selectAlternative(id, 'family', parts.family), id);
    assert.equal(selectAlternative(id, 'letter', parts.letter), id);
    assert.equal(selectAlternative(id, 'variant', parts.variant), id);
    for (const candidate of alternatives(id, 'variant')) {
      assert.equal(recipeParts(candidate).family, parts.family);
      assert.equal(recipeParts(candidate).letter, parts.letter);
    }
    for (const family of ['02', '03', '04', '05', '06']) assert.ok(recipes[selectAlternative(id, 'family', family)]);
  }
  assert.equal(selectAlternative('grid_03a--07', 'letter', 'b'), 'grid_03b--07');
  assert.equal(selectAlternative('grid_03a--07', 'variant', ''), 'grid_03a');
  assert.equal(selectAlternative('grid_02a--07', 'letter', 'b'), 'grid_02b');
  assert.throws(() => recipeParts('grid_03a--99'));
});

test('recipe exploration retains compatible hierarchy and uses explicit defaults when unavailable', () => {
  for (const id of Object.keys(recipes)) for (const layout of layoutsFor(recipes[id])) {
    assert.deepEqual(recipeSelection(id, layout.set, layout.flow ?? 'default'), { grid: id, set: layout.set, flow: layout.flow ?? 'default' });
  }
  assert.deepEqual(recipeSelection('grid_05', 'set_06', 'flow_01'), { grid: 'grid_05', set: 'none', flow: 'default' });
  assert.deepEqual(recipeSelection('grid_05', 'set_05', 'flow_01'), { grid: 'grid_05', set: 'set_05', flow: 'default' });
});

test('Design choices disable only missing exact combinations and every recipe remains reachable', () => {
  for (const id of Object.keys(recipes)) for (const dimension of ['letter', 'variant']) {
    const options = designOptions(id, dimension);
    assert.equal(options.filter(option => option.selected).length, 1);
    assert.equal(options.find(option => option.selected).disabled, false);
    for (const option of options) {
      assert.equal(option.disabled, !recipes[option.grid]);
      const unchanged = dimension === 'letter' ? 'variant' : 'letter';
      if (!option.disabled) assert.equal(recipeParts(option.grid)[unchanged], recipeParts(id)[unchanged]);
    }
  }
  assert.equal(designOptions('grid_02a--07', 'letter').find(option => option.key === 'b').disabled, true);
  assert.equal(designOptions('grid_04a', 'letter').find(option => option.key === 'd').disabled, true);
  assert.equal(designOptions('grid_04a--01', 'letter').find(option => option.key === 'd').grid, 'grid_04d--01');
  // Traverse actual enabled family/letter/variant edges, not the removed catalogue.
  const reached = new Set(['grid_03a--07']), pending = [...reached];
  while (pending.length) {
    const id = pending.pop();
    const next = ['02', '03', '04', '05', '06'].map(family => selectAlternative(id, 'family', family));
    next.push(...['letter', 'variant'].flatMap(dimension => designOptions(id, dimension).filter(option => !option.disabled).map(option => option.grid)));
    for (const candidate of next) if (!reached.has(candidate)) { reached.add(candidate); pending.push(candidate); }
  }
  assert.equal(reached.size, Object.keys(recipes).length);
});

test('unavailable letter guidance gives the next valid action without a descriptive preamble', () => {
  assert.equal(letterAvailability('grid_03a--07', 'default'), 'Unselect the --07 variant below.');
  assert.equal(letterAvailability('grid_02a--07', 'b'), 'Unselect the --07 variant below.');
  assert.equal(letterAvailability('grid_04', 'd'), 'Select a here first.');
  assert.equal(letterAvailability('grid_04d--01', 'default'), 'Select a here first.');
  assert.equal(letterAvailability('grid_05', 'a'), 'Choose 2 macro regions above.');
  for (const id of Object.keys(recipes)) for (const option of designOptions(id, 'letter')) {
    const message = letterAvailability(id, option.key);
    assert.equal(Boolean(message), option.disabled);
    if (message) {
      assert.match(message, /^(Choose|Select|Unselect)/);
      assert.doesNotMatch(message, /set_|flow_/);
    }
  }
});

test('workbench thumbnails show actual expanded occupancy and preserve source numbering', () => {
  for (const id of Object.keys(recipes)) for (const layout of layoutsFor(recipes[id])) {
    const flow = layout.flow ?? 'default';
    assert.equal(compatibleLayout(id, layout.set, flow).id, layout.id);
    const items = diagramItems(id, layout.set, flow, layout.items);
    assert.deepEqual(items.map(p => p.item).sort(), Array.from({ length: layout.items }, (_, i) => i + 1));
    for (const item of items) {
      assert.ok(item.width > 0 && item.height > 0);
      assert.ok(item.x >= 0 && item.x + item.width <= 100.00001);
      assert.ok(item.y >= 0 && item.y + item.height <= 56.00001);
    }
  }
  assert.equal(diagramItems('grid_03', 'none', 'default', 12).length, 12);
  assert.equal(compatibleLayout('grid_05', 'set_03', 'flow_01'), null);
});

test('variant width cues compare whole-bit macro widths with the same-letter Default in every field', () => {
  assert.deepEqual(variantWidthChanges('grid_03a--01', 'wide').map(region => region.delta), [0, 2, -2]);
  assert.deepEqual(variantWidthChanges('grid_03a--01', 'wide').map(region => region.change), ['unchanged', 'wider', 'narrower']);
  assert.equal(variantWidthChanges('grid_04d--01', 'wide'), null);
  for (const id of Object.keys(recipes)) for (const field of Object.keys(fields)) {
    const cues = variantWidthChanges(id, field), parts = recipeParts(id), baseline = `grid_${parts.family}${parts.letter}`;
    if (!recipes[baseline]) { assert.equal(cues, null); continue; }
    const defaults = resolveColumns(recipes[baseline], field), columns = resolveColumns(recipes[id], field);
    assert.equal(cues.length, columns.length);
    assert.equal(cues.reduce((sum, region) => sum + region.delta, 0), 0);
    for (const [index, cue] of cues.entries()) {
      assert.equal(cue.baseline, baseline);
      assert.equal(cue.delta, columns[index].end - columns[index].start - defaults[index].end + defaults[index].start);
      assert.ok(Number.isInteger(cue.delta));
      assert.ok(cue.center > 0 && cue.center < 100 && cue.width > 0);
    }
  }
});

test('boundary stepping stays strictly either side of each threshold, including fractional root sizes', () => {
  for (const rem of [16, 19.5, 20.25]) for (const thresholds of [{ compact: 30, expanded: 60 }, { compact: 37, expanded: 57 }, { compact: 57, expanded: 57 }]) {
    for (const step of boundarySteps(thresholds, rem)) {
      assert.equal(Number.isInteger(step.width), true);
      assert.ok(step.side === 'below' ? step.width < thresholds[step.state] * rem : step.width > thresholds[step.state] * rem);
    }
  }
});
