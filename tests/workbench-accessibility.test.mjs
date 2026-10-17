import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDiagram } from '../docs/workbench/accessibility.mjs';
import { recipes, layoutsFor } from '../docs/assets/graph-paper/src/ruler/geometry.mjs';

test('nonvisual previews describe occupied positions, stacking, and full-width fallback', () => {
  const selection = { grid: 'grid_03a--07', set: 'set_06', flow: 'default', items: 8, field: 'wide' };
  assert.match(describeDiagram(selection, 'expanded'), /item 1 on the left.*items 7, 8 stacked full width/);
  assert.match(describeDiagram(selection, 'stacked'), /1, 2, 3, 4, 5, 6, 7, 8 in source order/);
  for (const [grid, recipe] of Object.entries(recipes)) {
    const layout = layoutsFor(recipe)[0];
    for (const state of ['stacked', 'compact', 'expanded']) {
      const description = describeDiagram({ ...selection, grid, set: layout?.set ?? 'none', flow: layout?.flow ?? 'default' }, state);
      assert.doesNotMatch(description, /undefined|NaN/);
      assert.ok(description.startsWith(state[0].toUpperCase() + state.slice(1) + ':'));
    }
  }
});
