import { bands } from "../manifest/bands.mjs";
import { recipes, fields, layoutsFor, resolveColumns, expandedPlacements, compactPlacements } from "./geometry.mjs";

// Conservative prototype: every recipe position is relevant, including empty
// positions. Content, typography and inner padding are not measured at runtime.
export function bandThresholds(recipe, fieldName, layout, band) {
  const minimum = bands[band];
  if (!Object.hasOwn(bands, band)) throw new Error(`Unknown band: ${band}`);
  if (!Number.isFinite(minimum) || minimum <= 0) throw new Error(`Invalid minimum for band: ${band}`);
  const expanded = layout ? expandedPlacements(recipe, fieldName, layout)
    : resolveColumns(recipe, fieldName).map(c => ({ lines: [c.start, c.end] }));
  const compact = layout ? compactPlacements(fieldName, layout)
    : resolveColumns({ weights: [1, 1] }, fieldName).map(c => ({ lines: [c.start, c.end] }));
  const width = placements => Math.min(...placements.map(p => p.lines[1] - p.lines[0]));
  const expandedBits = width(expanded), compactBits = width(compact);
  const compactRem = Math.ceil(minimum * 64 / compactBits);
  // If compact offers no useful intermediate interval, transition directly.
  const expandedRem = Math.max(compactRem, Math.ceil(minimum * 64 / expandedBits));
  return { minimum, expandedBits, compactBits, expanded: expandedRem, compact: compactRem };
}

export const bandSelector = `:where(${Object.keys(bands).map(id => `.gp_band--${id}`).join(",")})`;
export const withoutBands = `:not(:where(${Object.keys(bands).map(id => `.gp_band--${id}`).join(",")}))`;

export function emitBandCss() {
  const parts = [`/* Graph Paper CSS — experimental responsive bands. MIT license. Load after main.css.
   Minimum useful slot widths, not content detection. */
.gp_field${bandSelector} { display: block; --gp-subgrid-display: block; }`];
  const named = ":where(.set_03,.set_04,.set_05,.set_06)";
  for (let i = 1; i <= 6; i++) {
    parts.push(`.gp_field${bandSelector}${named} > :nth-child(${i}) {\n${["e", "c"].flatMap(state => ["column", "row", "start-rule", "end-rule"].map(key => `  --gp-band-${state}-${key}: var(--gp-${state}-${i}-${key}, ${key === "column" ? "1 / -1" : key === "row" ? "auto" : "none"});`)).join("\n")}\n}`);
  }
  const byColumns = new Map();
  for (const [id, recipe] of Object.entries(recipes)) {
    if (!byColumns.has(recipe.columns)) byColumns.set(recipe.columns, []);
    byColumns.get(recipe.columns).push(`.${id}`);
  }
  for (const [count, ids] of byColumns) for (let i = 0; i < count; i++) {
    parts.push(`.gp_field${bandSelector}:where(${ids.join(",")})${withoutNamed()} > :nth-child(${count}n + ${i + 1}) {\n  --gp-band-e-column: var(--gp-macro-start-${i + 1}) / var(--gp-macro-end-${i + 1});\n  --gp-band-e-row: auto;\n  --gp-band-e-start-rule: var(--gp-macro-start-rule-${i + 1});\n  --gp-band-e-end-rule: var(--gp-macro-end-rule-${i + 1});\n}`);
  }
  for (let i = 0; i < 2; i++) parts.push(`.gp_field${bandSelector}${withoutNamed()} > :nth-child(2n + ${i + 1}) {\n  --gp-band-c-column: var(--gp-compact-2-${i});\n  --gp-band-c-row: auto;\n  --gp-band-c-start-rule: ${i ? '\"\"' : "none"};\n  --gp-band-c-end-rule: ${i ? "none" : '\"\"'};\n}`);

  // Group by threshold, then field/condition, factoring grid alternatives.
  // Most expanded geometries have the same limiting span for every set/flow.
  const queries = new Map();
  const add = (state, rem, field, band, tail, id) => {
    const key = `${state}:${rem}`;
    if (!queries.has(key)) queries.set(key, { state, rem, groups: new Map() });
    const groups = queries.get(key).groups, condition = `:where(.gp_field--${field}.gp_band--${band})`;
    const group = `${condition}|${tail}`;
    if (!groups.has(group)) groups.set(group, { condition, tail, ids: [] });
    groups.get(group).ids.push(`.${id}`);
  };
  for (const [id, recipe] of Object.entries(recipes)) for (const field of Object.keys(fields)) for (const band of Object.keys(bands)) {
    const layouts = layoutsFor(recipe);
    const entries = [null, ...layouts].map(layout => ({ layout, thresholds: bandThresholds(recipe, field, layout, band) }));
    for (const state of ["compact", "expanded"]) {
      if (new Set(entries.map(e => e.thresholds[state])).size === 1) {
        add(state, entries[0].thresholds[state], field, band, "", id);
      } else {
        const baseline = entries[0].thresholds[state], exceptions = new Map();
        const record = (rem, tail) => {
          if (rem === baseline) return;
          if (!exceptions.has(rem)) exceptions.set(rem, []);
          exceptions.get(rem).push(tail);
        };
        for (const set of new Set(layouts.map(l => l.set))) {
          const selected = entries.filter(e => e.layout?.set === set);
          if (new Set(selected.map(e => e.thresholds[state])).size === 1) {
            record(selected[0].thresholds[state], `.${set}`);
          } else {
            const flows = selected.filter(e => e.layout.flow).map(e => `.${e.layout.flow}`);
            for (const { layout, thresholds } of selected) record(thresholds[state], `.${set}${layout.flow ? `.${layout.flow}` : `:not(:where(${flows.join(",")}))`}`);
          }
        }
        const allExceptions = [...exceptions.values()].flat();
        add(state, baseline, field, band, `:not(:where(${allExceptions.join(",")}))`, id);
        for (const [rem, tails] of exceptions) add(state, rem, field, band, `:where(${tails.join(",")})`, id);
      }
    }
  }
  for (const { state, rem, groups } of [...queries.values()].sort((a, b) => (a.state === b.state ? a.rem - b.rem : a.state === "compact" ? -1 : 1))) {
    const roots = [...groups.values()].map(({ condition, tail, ids }) => `.gp_field${condition}:where(${[...new Set(ids)].join(",")})${tail}`);
    const prefix = state === "expanded" ? "e" : "c";
    const rules = [];
    if (state === "compact") rules.push(`${roots.join(",\n")} { display: grid; --gp-subgrid-display: grid; }`);
    rules.push(`${roots.map(root => `${root} > *`).join(",\n")} {\n  grid-column: var(--gp-band-${prefix}-column, 1 / -1);\n  grid-row: var(--gp-band-${prefix}-row, auto);\n  --gp-start-rule: var(--gp-band-${prefix}-start-rule, none);\n  --gp-end-rule: var(--gp-band-${prefix}-end-rule, none);\n}`);
    parts.push(`@container gp-canvas (min-width: ${rem}rem) {\n${rules.join("\n")}\n}`);
  }
  return parts.join("\n\n");
}

function withoutNamed() { return ":not(:where(.set_03,.set_04,.set_05,.set_06))"; }
