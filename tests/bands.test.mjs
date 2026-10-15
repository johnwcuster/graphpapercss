import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { bands } from "../src/manifest/bands.mjs";
import { bandThresholds, emitBandCss } from "../src/ruler/bands.mjs";
import { recipes, fields, layoutsFor } from "../src/ruler/geometry.mjs";

test("band scale is ordered and every supported geometry meets its declared minimum", () => {
  assert.deepEqual(Object.keys(bands), ["01", "02", "03"]);
  const values = Object.values(bands);
  assert.ok(values.every((v, i) => Number.isFinite(v) && v > 0 && (!i || v > values[i - 1])));
  for (const recipe of Object.values(recipes)) for (const field of Object.keys(fields)) for (const layout of [null, ...layoutsFor(recipe)]) {
    let previous = null;
    for (const band of Object.keys(bands)) {
      const t = bandThresholds(recipe, field, layout, band);
      assert.ok(t.expanded >= t.compact);
      assert.ok(t.expanded * t.expandedBits / 64 >= t.minimum);
      assert.ok(t.compact * t.compactBits / 64 >= t.minimum);
      if (previous) assert.ok(t.expanded >= previous.expanded && t.compact >= previous.compact);
      previous = t;
    }
  }
});

test("wide three-item profile derives the sketched thresholds; unknown bands fail explicitly", () => {
  const recipe = recipes.grid_03, layout = layoutsFor(recipe).find(l => l.set === "set_03" && !l.flow);
  assert.deepEqual(bandThresholds(recipe, "wide", layout, "02"), { minimum:16, expandedBits:18, compactBits:28, expanded:57, compact:37 });
  assert.throws(() => bandThresholds(recipe, "wide", layout, "04"), /Unknown band/);
});

test("optional band distribution is deterministic and bounded", async () => {
  const css = emitBandCss();
  assert.equal(css, emitBandCss());
  assert.equal(await readFile("css/bands.css", "utf8"), `${css}\n`);
  assert.ok(gzipSync(await readFile("css/bands.min.css")).length < 8000, "optional band prototype exceeds 8KB gzip ceiling");
});
