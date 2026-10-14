import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { grids } from "../src/manifest/grids.mjs";
import { layouts } from "../src/manifest/layouts.mjs";

test("the only historical baseline is released 0.2.3 and covers every retained grid", async () => {
  const baseline = JSON.parse(await readFile(new URL("./fixtures/legacy-geometry.json", import.meta.url), "utf8"));
  const css = await readFile(new URL("../css/legacy/main.css", import.meta.url));
  assert.equal(baseline.source.version, "0.2.3");
  assert.equal(createHash("sha256").update(css).digest("hex"), baseline.source.sha256);
  assert.equal(baseline.records.length, 216);
  assert.deepEqual([...new Set(baseline.records.map(r => r.id))].sort(), Object.keys(grids).sort());
});

test("normalized flows preserve the released 0.2.3 source items and row relationships", async () => {
  const capture = JSON.parse(await readFile(new URL("./fixtures/legacy-layouts.json", import.meta.url), "utf8"));
  const css = await readFile(new URL("../css/legacy/main.css", import.meta.url));
  assert.equal(createHash("sha256").update(css).digest("hex"), capture.source.sha256);
  assert.equal(Object.keys(capture.configurations).length, 416);
  assert.equal(layouts.length, 90);
  assert.equal(layouts.reduce((n, layout) => n + layout.families.length, 0), 161);
  for (const layout of layouts) for (const family of layout.families) {
    const flow = layout.flow ? Number(layout.flow.slice(-2)) : "default";
    assert.deepEqual(layout.states.expanded.placements, capture.configurations[`${family}|${layout.items}|${flow}`].placements);
  }
  const alias = flow => layouts.find(l => l.families.includes("02") && l.set === "set_03" && l.flow === flow).states.expanded.placements;
  assert.deepEqual(alias("flow_02"), alias("flow_03"));
  assert.deepEqual(alias("flow_04"), alias("flow_05"));
});
