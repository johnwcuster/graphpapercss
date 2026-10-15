import test from "node:test";
import assert from "node:assert/strict";
import { emitRulerCss } from "../src/ruler/emit.mjs";
import { recipes, layoutsFor } from "../src/ruler/geometry.mjs";
import { compactPatterns } from "../src/manifest/compact.mjs";

function splitSelectors(source) {
  const selectors = []; let depth = 0, start = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "(") depth++;
    if (source[i] === ")") depth--;
    if (source[i] === "," && depth === 0) { selectors.push(source.slice(start, i).trim()); start = i + 1; }
  }
  assert.equal(depth, 0);
  selectors.push(source.slice(start).trim());
  return selectors;
}

test("factored placement selectors retain exact coverage, specificity and declarations", () => {
  const actual = new Map();
  for (const [, selectorList, body] of emitRulerCss().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/--gp-[ec]-1-column:\s*var/.test(body)) continue;
    const declarations = [...body.matchAll(/(--gp-[ec]-\d+-(?:column|row|start-rule|end-rule)):\s*([^;]+);/g)];
    for (const selector of splitSelectors(selectorList)) {
      // Every :is() argument has exactly one class, preserving 0,3,0 for
      // defaults and 0,4,0 for explicit flows. No :where() weakening either.
      assert.match(selector, /^\.gp_field(?:\.grid_[\w-]+|:is\(\.grid_[\w-]+(?:,\.grid_[\w-]+)*\))\.set_0[3-6](?:\.flow_\d+)?$/);
      const group = selector.match(/:is\(([^)]+)\)/);
      const expanded = group ? group[1].split(",").map(id => selector.replace(group[0], id)) : [selector];
      for (const key of expanded) {
        if (!actual.has(key)) actual.set(key, {});
        for (const [, property, value] of declarations) {
          assert.equal(Object.hasOwn(actual.get(key), property), false, `${key}: duplicate ${property}`);
          actual.get(key)[property] = value.trim();
        }
      }
    }
  }
  let count = 0;
  for (const [id, recipe] of Object.entries(recipes)) for (const layout of layoutsFor(recipe)) {
    const selector = `.gp_field.${id}.${layout.set}${layout.flow ? `.${layout.flow}` : ""}`, expected = {};
    for (const p of layout.states.expanded.placements) {
      expected[`--gp-e-${p.item}-column`] = `var(--gp-macro-start-${p.column[0]}) / var(--gp-macro-end-${p.column[1] - 1})`;
      expected[`--gp-e-${p.item}-row`] = p.row.join(" / ");
      expected[`--gp-e-${p.item}-start-rule`] = `var(--gp-macro-start-rule-${p.column[0]})`;
      expected[`--gp-e-${p.item}-end-rule`] = `var(--gp-macro-end-rule-${p.column[1] - 1})`;
    }
    for (const p of compactPatterns[layout.states.compact]) {
      expected[`--gp-c-${p.item}-column`] = `var(--gp-compact-${p.count}-${p.index})`;
      expected[`--gp-c-${p.item}-row`] = p.row.join(" / ");
      expected[`--gp-c-${p.item}-start-rule`] = p.index === 0 ? "none" : '""';
      expected[`--gp-c-${p.item}-end-rule`] = p.index === p.count - 1 ? "none" : '""';
    }
    assert.deepEqual(actual.get(selector), expected, selector); count++;
  }
  assert.equal(actual.size, count, "no extra selectors or dropped supported combinations");
  assert.equal(count, 1039);
});

test("each responsive placement pattern is emitted once per state", () => {
  const groups = { expanded: new Set(), compact: new Set() };
  for (const recipe of Object.values(recipes)) for (const layout of layoutsFor(recipe)) {
    groups.expanded.add(JSON.stringify(layout.states.expanded.placements));
    groups.compact.add(JSON.stringify(compactPatterns[layout.states.compact]));
  }
  const counts = { expanded: 0, compact: 0 };
  for (const [, , body] of emitRulerCss().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const expanded = /--gp-e-1-column:\s*var/.test(body);
    const compact = /--gp-c-1-column:\s*var/.test(body);
    assert.ok(!(expanded && compact), "responsive states must not be bundled");
    if (expanded) counts.expanded++;
    if (compact) counts.compact++;
  }
  assert.deepEqual(counts, { expanded: groups.expanded.size, compact: groups.compact.size });
  assert.equal(counts.compact, 5);
});
