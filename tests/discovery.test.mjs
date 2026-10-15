import test from "node:test";
import assert from "node:assert/strict";
import { recipes, layoutsFor } from "../src/ruler/geometry.mjs";
import { recipeDescription, compositionDescription, suggestComposition, startingPoints } from "../src/ruler/discovery.mjs";

test("every discovery description corresponds to actual geometry and a valid composition", () => {
  for (const [id, recipe] of Object.entries(recipes)) {
    assert.deepEqual(recipeDescription(id).weights, recipe.weights);
    assert.ok(compositionDescription(id).includes("source order"));
    for (let count = 1; count <= 12; count++) {
      const suggestion = suggestComposition(id, count);
      if (suggestion) {
        assert.equal(suggestion.items, count);
        assert.ok(layoutsFor(recipe).some(layout => layout.id === suggestion.id));
        assert.ok(compositionDescription(id, suggestion.set, suggestion.flow));
      }
    }
    for (const layout of layoutsFor(recipe)) {
      const text = compositionDescription(id, layout.set, layout.flow);
      assert.ok(text.endsWith("Heights remain content-driven."));
      for (let i = 1; i <= layout.items; i++) assert.match(text, new RegExp(`\\b${i}\\b`));
    }
  }
  for (const point of startingPoints) assert.ok(compositionDescription(point.grid, point.set, point.flow));
  assert.throws(() => compositionDescription("grid_03a--07", "set_06", "flow_01"));
  assert.throws(() => compositionDescription("grid_03", null, "flow_02"));
  assert.equal(recipeDescription("grid_03a--04").contrast, "strong");
  assert.equal(recipeDescription("grid_03a--05").contrast, "gentle");
  assert.equal(recipeDescription("grid_03a--04").supports, "varied");
  assert.equal(recipeDescription("grid_03a--05").supports, "equal");
  assert.equal(suggestComposition("grid_03b--07",6).flow,"flow_01");
});
