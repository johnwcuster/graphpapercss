import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { gzipSync } from "node:zlib";
import { spanBits } from "../src/geometry/ruler.mjs";
import { rhythms } from "../src/geometry/rhythms.mjs";
import { compactPatterns } from "../src/manifest/compact.mjs";
import { grids } from "../src/manifest/grids.mjs";
import { layouts } from "../src/manifest/layouts.mjs";
import { sets } from "../src/manifest/sets.mjs";
import {
  validateGeneratedCss,
  validateLegacyGridCoverage,
  validateManifest
} from "../src/validate.mjs";

test("the wide lattice reproduces representative legacy widths", () => {
  assert.equal(rhythms.wide.tracks[20], 1);
  assert.equal(rhythms.wide.tracks[24], 0.5);
  assert.equal(spanBits({ span: 12, track: 1, gap: 2 }), 34);
  assert.equal(spanBits({ span: 10, track: 0.5, gap: 2 }), 23);
});

test("thin and neat lattices close on the 64-bit ruler", () => {
  assert.equal(rhythms.thin.tracks[20], 2);
  assert.equal(rhythms.thin.tracks[24], 1.5);
  assert.equal(rhythms.neat.tracks[20], 3);
  assert.equal(rhythms.neat.tracks[24], 2.5);
});

test("the prototype manifest satisfies geometry and placement invariants", () => {
  assert.doesNotThrow(() => validateManifest({ compactPatterns, grids, layouts, rhythms, sets }));
});

test("the grid manifest exactly matches all concrete legacy geometries", async () => {
  const inventory = JSON.parse(
    await readFile(new URL("./fixtures/legacy-inventory.json", import.meta.url), "utf8")
  );
  assert.equal(Object.keys(grids).length, 72);
  assert.doesNotThrow(() => validateLegacyGridCoverage(grids, inventory.gridGeometry));
});

test("the normalized layout matrix is tied to the browser-captured legacy source", async () => {
  const [capture, inventory] = await Promise.all([
    readFile(new URL("./fixtures/legacy-layout-capture.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("./fixtures/legacy-inventory.json", import.meta.url), "utf8").then(JSON.parse)
  ]);

  assert.equal(capture.source.sha256, inventory.source.sha256);
  assert.equal(capture.state, "expanded");
  assert.equal(Object.keys(capture.configurations).length, 416);
  assert.equal(layouts.length, 90);
  assert.equal(
    layouts.reduce((combinationCount, layout) => combinationCount + layout.families.length, 0),
    161
  );
});

test("known three-item legacy flow aliases remain explicit compatibility choices", () => {
  const layout = (flow) => layouts.find((candidate) =>
    candidate.families.includes("02") && candidate.set === "set_03" && candidate.flow === flow
  );

  assert.deepEqual(
    layout("flow_02").states.expanded.placements,
    layout("flow_03").states.expanded.placements
  );
  assert.deepEqual(
    layout("flow_04").states.expanded.placements,
    layout("flow_05").states.expanded.placements
  );
});

test("generated CSS is scoped and declares its box model", async () => {
  const css = await readFile(new URL("../css/next.css", import.meta.url), "utf8");
  assert.doesNotThrow(() => validateGeneratedCss(css));
  assert.match(css, /@container gp-canvas/);
  assert.match(css, /\.gp_canvas\.gp_rhythm--thin/);
  assert.match(css, /\.gp_canvas\.gp_rhythm--neat/);
  assert.match(css, /\.gp_subgrid\s*{[^}]*display: grid;[^}]*grid-template-columns: subgrid;/s);
  assert.match(css, /\.gp_treatment--rule\s*{[^}]*--gp-rule-offset:/s);
  assert.match(css, /\.gp_rule--start::before/);
  assert.match(css, /\.gp_rule--end::after/);
  assert.match(css, /\.gp_inset--bit/);
  assert.match(css, /\.gp_place\.gp_place\s*{[^}]*--gp-column-start/s);
  assert.match(css, /\.gp_optical\s*{[^}]*translate:/s);
  assert.match(css, /--gp-padding-start:/);
  assert.match(css, /--gp-gap:/);
  assert.doesNotMatch(css, /\[class\*=/);

  for (const gridName of Object.keys(grids)) {
    assert.match(css, new RegExp(`\\.${gridName.replaceAll("-", "\\-")}(?![\\w-])`));
  }

  assert.ok(gzipSync(css).byteLength < 12_000, "prototype CSS should remain below 12 KB gzipped");
});
