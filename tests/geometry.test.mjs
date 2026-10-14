import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fields, recipes, resolveColumns, layoutsFor, expandedPlacements, compactPlacements, auditGeometry } from "../src/ruler/geometry.mjs";
import { emitRulerCss } from "../src/ruler/emit.mjs";
import { grids } from "../src/manifest/grids.mjs";
import { acceptedChanges } from "../src/ruler/accepted-changes.mjs";

test("canonical fields and every audited recipe close on integer ruler coordinates", async () => {
  assert.deepEqual(Object.values(fields).map(f => f.end - f.start), [64, 60, 59, 58, 56]);
  const baseline = JSON.parse(await readFile(new URL("./fixtures/legacy-geometry.json", import.meta.url), "utf8"));
  const audit = auditGeometry(baseline);
  assert.equal(audit.length, 72 * 3);
  assert.ok(Object.keys(grids).every(id => recipes[id]?.legacy));
  assert.equal(audit.filter(r => r.classification === "EXACT").length, 204);
  assert.equal(audit.filter(r => r.classification === "ACCEPTED").length, 12);
  assert.ok(audit.every(r => ["EXACT", "ACCEPTED"].includes(r.classification)));
  for (const r of audit) {
    const f = fields[r.field];
    assert.equal(r.candidate[0].start, f.start);
    assert.equal(r.candidate.at(-1).end, f.end);
    r.candidate.forEach((c, i) => {
      assert.ok(Number.isInteger(c.start) && Number.isInteger(c.end));
      assert.ok(c.start < c.end);
      if (i) assert.equal(c.start - r.candidate[i - 1].end, f.gutter);
    });
    if (r.classification === "EXACT") assert.deepEqual(r.candidate, r.legacy);
    if (r.classification === "NEAR") assert.ok(r.displacement <= 1 && r.hierarchyPreserved);
    if (r.classification === "ACCEPTED") {
      assert.deepEqual(r.candidate, acceptedChanges[`${r.id}/${r.field}`]);
      assert.equal(r.displacement, .5);
      assert.ok(r.acceptedReason);
    }
  }
});

test("equal 2–6 compositions and exact 5:3 split satisfy the steering arithmetic", () => {
  const expected = { neat: [30, 20, 15, 12, 10], thin: [29, 19, 14, 11, 9], wide: [28, 18, 13, 10, 8] };
  for (const [field, widths] of Object.entries(expected)) {
    widths.forEach((width, i) => {
      const columns = resolveColumns(recipes[`grid_0${i + 2}`], field);
      assert.ok(columns.every(c => c.end - c.start === width));
    });
  }
  assert.deepEqual(resolveColumns(recipes["grid_02a--07"], "wide"), [{ start: 3, end: 38 }, { start: 40, end: 61 }]);
});

test("expanded and compact placements preserve source items, row relationships and non-overlap", () => {
  for (const recipe of Object.values(recipes)) for (const [name, f] of Object.entries(fields)) {
    for (const layout of layoutsFor(recipe)) {
      const expanded = expandedPlacements(recipe, name, layout);
      assert.deepEqual(expanded.map(p => p.row), layout.states.expanded.placements.map(p => p.row));
      for (const placements of [expanded, compactPlacements(name, layout)]) {
        assert.deepEqual(placements.map(p => p.item).sort((a, b) => a - b), Array.from({ length: layout.items }, (_, i) => i + 1));
        for (const p of placements) {
          assert.ok(p.lines.every(Number.isInteger));
          assert.ok(p.lines[0] >= 1 && p.lines[1] <= f.end - f.start + 1 && p.lines[0] < p.lines[1]);
          for (const q of placements) if (p.item !== q.item) {
            const columnOverlap = p.lines[0] < q.lines[1] && q.lines[0] < p.lines[1];
            const rowOverlap = p.row[0] < q.row[1] && q.row[0] < p.row[1];
            assert.ok(!(columnOverlap && rowOverlap), `${layout.id}: unexpected overlap`);
          }
        }
      }
    }
  }
});

test("ruled gutters reserve whole-bit centers and generated core remains deterministic, canvas-only and host-spaced", async () => {
  for (const recipe of Object.values(recipes)) {
    const columns = resolveColumns(recipe, "ruled");
    columns.slice(0, -1).forEach((c, i) => assert.ok(Number.isInteger((c.end + columns[i + 1].start) / 2)));
  }
  const css = emitRulerCss();
  assert.equal(await readFile(new URL("../css/main.css", import.meta.url), "utf8"), css);
  assert.ok(css.includes("repeat(64, minmax(0, 1fr))"));
  assert.ok(!css.includes("@media") && !css.includes("!important"));
  assert.ok(!/row-gap\s*:|margin-block|1rem/.test(css), "core must not supply vertical spacing defaults");
  assert.ok(gzipSync(css).byteLength < 20000, "full readable ruler core exceeds 20 KB gzip budget");
});
