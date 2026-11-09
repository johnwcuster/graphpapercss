import { responsive } from "../manifest/responsive.mjs";
import { compactPatterns } from "../manifest/compact.mjs";
import { fields, recipes, layoutsFor, resolveColumns } from "./geometry.mjs";
import { withoutBands } from "./bands.mjs";

function expandedDeclarations(layout) {
  return layout.states.expanded.placements.map(p =>
    `  --gp-e-${p.item}-column: var(--gp-macro-start-${p.column[0]}) / var(--gp-macro-end-${p.column[1] - 1});\n  --gp-e-${p.item}-row: ${p.row.join(" / ")};\n  --gp-e-${p.item}-start-rule: var(--gp-macro-start-rule-${p.column[0]});\n  --gp-e-${p.item}-end-rule: var(--gp-macro-end-rule-${p.column[1] - 1});`).join("\n");
}

function compactDeclarations(layout) {
  return compactPatterns[layout.states.compact].map(p => {
    const { count, index } = p;
    return `  --gp-c-${p.item}-column: var(--gp-compact-${count}-${index});\n  --gp-c-${p.item}-row: ${p.row.join(" / ")};\n  --gp-c-${p.item}-start-rule: ${index === 0 ? "none" : '""'};\n  --gp-c-${p.item}-end-rule: ${index === count - 1 ? "none" : '""'};`;
  }).join("\n");
}

// Only group the grid class. Wrapping entire selectors in :is() would raise
// default-set specificity to that of explicit-flow branches in the same list.
function placementSelectors(entries) {
  const groups = new Map();
  for (const { id, set, flow } of entries) {
    const tail = `.${set}${flow ? `.${flow}` : ""}`;
    if (!groups.has(tail)) groups.set(tail, []);
    groups.get(tail).push(`.${id}`);
  }
  return [...groups].map(([tail, ids]) =>
    `.gp_field${ids.length === 1 ? ids[0] : `:is(${ids.join(",")})`}${tail}`).join(",\n");
}

export function emitRulerCss() {
  const parts = [`/* Graph Paper CSS 1.0 — generated canonical ruler core. MIT license. Canvas required. */
.gp_canvas {
  box-sizing: border-box;
  container: gp-canvas / inline-size;
  display: grid;
  grid-template-columns: repeat(64, minmax(0, 1fr));
  --gp-bit: 1.5625cqi;
  --gp-subgrid-display: grid;
}
.gp_canvas > * { grid-column: 1 / -1; min-width: 0; }
.gp_canvas > .gp_field {
  grid-column: var(--gp-field-start) / var(--gp-field-end);
}
.gp_field, .gp_subgrid { display: grid; grid-template-columns: subgrid; }
.gp_subgrid { display: var(--gp-subgrid-display, grid); }
.gp_field {
  --gp-subgrid-display: grid;
${["e", "c"].flatMap(prefix => Array.from({ length: 6 }, (_, i) => ["column", "row", "start-rule", "end-rule"].map(property => `  --gp-${prefix}-${i + 1}-${property}: initial;`).join("\n"))).join("\n")}
}
.gp_field > * { min-width: 0; grid-column: 1 / -1; --gp-start-rule: none; --gp-end-rule: none; }
.gp_inset--bit { padding-inline: var(--gp-bit); }
.gp_optical { translate: var(--gp-optical-x, 0em) var(--gp-optical-y, 0em); }
.gp_rule--start, .gp_rule--end { position: relative; }
.gp_field--ruled > .gp_rule--start::before,
.gp_field--ruled > .gp_rule--end::after {
  position: absolute; inset-block: 0;
  width: var(--gp-rule-width, 1px); background: var(--gp-rule-color, currentColor);
  pointer-events: none;
}
.gp_field--ruled > .gp_rule--start::before { content: var(--gp-start-rule, none); left: calc(-1 * var(--gp-bit)); translate: -50% 0; }
.gp_field--ruled > .gp_rule--end::after { content: var(--gp-end-rule, none); right: calc(-1 * var(--gp-bit)); translate: 50% 0; }
/* Explicit markers belong only to internal two-bit gutters, not outer edges. */`];
  for (const [name, field] of Object.entries(fields)) {
    const compact = [1, 2, 3].flatMap(count =>
      resolveColumns({ weights: Array(count).fill(1) }, name).map((c, index) =>
        `  --gp-compact-${count}-${index}: ${c.start - field.start + 1} / ${c.end - field.start + 1};`));
    parts.push(`.gp_field--${name} {\n  --gp-field-start: ${field.start + 1};\n  --gp-field-end: ${field.end + 1};\n${compact.join("\n")}\n}`);
  }
  // Geometry and flow are independent. Flow references macro variables rather
  // than repeating the entire placement matrix for every field and recipe.
  // Group states independently: many expanded arrangements share the same
  // compact pattern. Keeping them bundled duplicates compact declarations.
  const expandedGroups = new Map();
  const compactGroups = new Map();
  const geometryGroups = new Map();
  const ruleGroups = new Map();
  for (const [id, recipe] of Object.entries(recipes)) {
    if (!ruleGroups.has(recipe.columns)) ruleGroups.set(recipe.columns, []);
    ruleGroups.get(recipe.columns).push(`.gp_field.${id}`);
    for (const [name, field] of Object.entries(fields)) {
      const macro = resolveColumns(recipe, name).map((c, index) =>
        `  --gp-macro-start-${index + 1}: ${c.start - field.start + 1};\n  --gp-macro-end-${index + 1}: ${c.end - field.start + 1};`);
      const declaration = macro.join("\n");
      if (!geometryGroups.has(declaration)) geometryGroups.set(declaration, []);
      geometryGroups.get(declaration).push(`.gp_field--${name}.${id}`);
    }
    for (const layout of layoutsFor(recipe)) {
      for (const [groups, declaration] of [
        [expandedGroups, expandedDeclarations(layout)],
        [compactGroups, compactDeclarations(layout)]
      ]) {
        if (!groups.has(declaration)) groups.set(declaration, []);
        groups.get(declaration).push({ id, set: layout.set, flow: layout.flow });
      }
    }
  }
  for (const [declaration, selectors] of geometryGroups) parts.push(`${selectors.join(",\n")} {\n${declaration}\n}`);
  for (const [columns, selectors] of ruleGroups) {
    const declaration = Array.from({ length: columns }, (_, index) =>
      `  --gp-macro-start-rule-${index + 1}: ${index === 0 ? "none" : '""'};\n  --gp-macro-end-rule-${index + 1}: ${index === columns - 1 ? "none" : '""'};`).join("\n");
    parts.push(`${selectors.join(",\n")} {\n${declaration}\n}`);
    const bare = `.gp_field${withoutBands}:where(${selectors.map(s => s.replace(".gp_field", "")).join(",") }):not(:where(.set_03,.set_04,.set_05,.set_06))`;
    parts.push(`@container gp-canvas (min-width: ${responsive.expanded}) {\n${Array.from({ length: columns }, (_, i) => `${bare} > :nth-child(${columns}n + ${i + 1}) { grid-column: var(--gp-macro-start-${i + 1}) / var(--gp-macro-end-${i + 1}); --gp-start-rule: var(--gp-macro-start-rule-${i + 1}); --gp-end-rule: var(--gp-macro-end-rule-${i + 1}); }`).join("\n")}\n}`);
  }
  const allBare = `.gp_field${withoutBands}:where(${Object.keys(recipes).map(id => `.${id}`).join(",")}):not(:where(.set_03,.set_04,.set_05,.set_06))`;
  // Insert before expanded sequential rules so expanded wins at the boundary.
  parts.splice(parts.findIndex(part => part.startsWith("@container")), 0, `@container gp-canvas (min-width: ${responsive.compact}) {\n${Array.from({ length: 2 }, (_, i) => `${allBare} > :nth-child(2n + ${i + 1}) { grid-column: var(--gp-compact-2-${i}); --gp-start-rule: ${i ? '\"\"' : "none"}; --gp-end-rule: ${i ? "none" : '\"\"'}; }`).join("\n")}\n}`);
  parts.push(`@container gp-canvas (width < ${responsive.compact}) {\n${allBare} { display: block; --gp-subgrid-display: block; }\n}`);
  for (const groups of [expandedGroups, compactGroups]) {
    for (const [declaration, selectors] of groups) parts.push(`${placementSelectors(selectors)} {\n${declaration}\n}`);
  }
  const consumer = (prefix) => Array.from({ length: 6 }, (_, i) =>
    `.gp_field${withoutBands}:where(.set_03, .set_04, .set_05, .set_06) > :nth-child(${i + 1}) { grid-column: var(--gp-${prefix}-${i + 1}-column, 1 / -1); grid-row: var(--gp-${prefix}-${i + 1}-row, auto); --gp-start-rule: var(--gp-${prefix}-${i + 1}-start-rule, none); --gp-end-rule: var(--gp-${prefix}-${i + 1}-end-rule, none); }`).join("\n");
  parts.push(`@container gp-canvas (min-width: ${responsive.compact}) {\n${consumer("c")}\n}`);
  parts.push(`@container gp-canvas (min-width: ${responsive.expanded}) {\n${consumer("e")}\n}`);
  parts.push(`@container gp-canvas (width < ${responsive.compact}) {
  .gp_field${withoutBands}:is(.set_03, .set_04, .set_05, .set_06) { display: block; --gp-subgrid-display: block; }
  .gp_field--ruled${withoutBands} > .gp_rule--start::before, .gp_field--ruled${withoutBands} > .gp_rule--end::after { content: none; }
}`);
  parts.push(`.gp_place.gp_place { grid-column: var(--gp-column-start) / var(--gp-column-end); grid-row: var(--gp-row-start, auto) / var(--gp-row-end, auto); }`);
  return `${parts.join("\n\n")}\n`;
}
