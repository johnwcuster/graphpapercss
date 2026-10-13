import { macroLines } from "../geometry/ruler.mjs";

function gridSelector(gridName) {
  return `.${gridName}`;
}

function gridNamesForLayout(grids, layout) {
  return Object.entries(grids)
    .filter(([, grid]) => layout.families.includes(grid.family))
    .map(([gridName]) => gridName);
}

function selectorForLayout(gridNames, layout, standalone = false) {
  const flowSelector = layout.flow
    ? `.${layout.flow}`
    : ":not(.flow_01, .flow_02, .flow_03, .flow_04, .flow_05, .flow_06, .flow_07)";
  return `${whereGridList(gridNames, standalone)}.${layout.set}${flowSelector}`;
}

function whereGridList(gridNames, standalone = false) {
  const gridList = `:where(\n  ${gridNames.map(gridSelector).join(",\n  ")}\n)`;
  return standalone ? `:where(${gridList}:not(.gp_canvas *))` : gridList;
}

function groupEntries(entries, keyFor) {
  const groups = new Map();

  for (const entry of entries) {
    const key = keyFor(entry);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return groups;
}

function placementVariableRule(selector, placements, macro = false) {
  const declarations = placements.flatMap(({ item, column, lines, row }) => {
    const columnValue = macro
      ? `var(--gp-macro-${column[0]}) / var(--gp-macro-${column[1]})`
      : `${lines[0]} / ${lines[1]}`;
    return [
      `  --gp-item-${item}-column: ${columnValue};`,
      `  --gp-item-${item}-row: ${row[0]} / ${row[1]};`
    ];
  });

  return `${selector} {\n${declarations.join("\n")}\n}`;
}

function compactRules({ compactPatterns, grids, layouts, standalone = false }) {
  const gridNames = Object.keys(grids);
  const rules = [];
  const compactGridSelector = `${whereGridList(gridNames, standalone)}:is(.set_03, .set_04, .set_05, .set_06)`;

  rules.push(`${compactGridSelector} {
  grid-template-columns: repeat(24, minmax(0, 1fr));
}`);

  const byPattern = groupEntries(layouts, (layout) => layout.states.compact);

  for (const [patternName, patternLayouts] of byPattern) {
    const selectors = patternLayouts.map((layout) =>
      selectorForLayout(gridNamesForLayout(grids, layout), layout, standalone)
    );
    const selector = `:is(\n  ${selectors.join(",\n  ")}\n)`;
    rules.push(placementVariableRule(selector, compactPatterns[patternName]));
  }

  return rules.join("\n\n");
}

function expandedPlacementRules({ grids, layouts, standalone = false }) {
  const rules = [];
  const byPlacement = groupEntries(
    layouts,
    (layout) => JSON.stringify(layout.states.expanded.placements)
  );

  for (const placementLayouts of byPlacement.values()) {
    const selectors = placementLayouts.map((layout) =>
      selectorForLayout(gridNamesForLayout(grids, layout), layout, standalone)
    );
    const selector = selectors.length === 1
      ? selectors[0]
      : `:is(\n  ${selectors.join(",\n  ")}\n)`;
    rules.push(placementVariableRule(
      selector,
      placementLayouts[0].states.expanded.placements,
      true
    ));
  }

  return rules.join("\n\n");
}

function placementConsumerRules({ layouts }) {
  const rules = [];
  const setCounts = new Map(layouts.map((layout) => [layout.set, layout.items]));
  const maximumItemCount = Math.max(...setCounts.values());

  for (let item = 1; item <= maximumItemCount; item += 1) {
    const setNames = [...setCounts]
      .filter(([, itemCount]) => item <= itemCount)
      .map(([setName]) => `.${setName}`);
    rules.push(`:is(${setNames.join(", ")}) > :nth-child(${item}) {
  grid-column: var(--gp-item-${item}-column, auto);
  grid-row: var(--gp-item-${item}-row, auto);
}`);
  }

  return rules.join("\n\n");
}

function geometryRules({ grids, standalone = false }) {
  const entries = Object.entries(grids);
  const gridNames = entries.map(([gridName]) => gridName);
  const byLattice = groupEntries(entries, ([, grid]) => grid.lattice);
  const bySpans = groupEntries(
    entries,
    ([, grid]) => `${grid.lattice}:${grid.spans.join(",")}`
  );
  const rules = [];

  rules.push(`${whereGridList(gridNames, standalone)} {
  display: grid;
  column-gap: var(--gp-gap);
  padding-block: 0;
  padding-inline: var(--gp-padding-start) var(--gp-padding-end);
}`);
  rules.push(`${whereGridList(gridNames, standalone)} > * {
  margin-block-end: 0;
}`);

  for (const [lattice, latticeEntries] of byLattice) {
    rules.push(`${whereGridList(latticeEntries.map(([gridName]) => gridName), standalone)} {
  grid-template-columns: repeat(${lattice}, minmax(0, 1fr));
}`);
  }

  for (const spanEntries of bySpans.values()) {
    const names = spanEntries.map(([gridName]) => gridName);
    const grid = spanEntries[0][1];
    const lines = macroLines(grid.spans);
    const list = whereGridList(names, standalone);

    rules.push(`${list} {
${lines.map((line, index) => `  --gp-macro-${index + 1}: ${line};`).join("\n")}
}`);

    grid.spans.forEach((span, index) => {
      rules.push(`${list} > :nth-child(${index + 1}) {
  grid-column: ${lines[index]} / ${lines[index + 1]};
  grid-row: 1 / 2;
}`);
    });
  }

  return rules.join("\n\n");
}

function indent(css) {
  return css
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
}

function rhythmDeclarations(rhythm) {
  const gap = rhythm.gap === 0 ? "0" : `calc(${rhythm.gap} * var(--gp-bit))`;
  return `  --gp-padding-start: calc(${rhythm.paddingStart} * var(--gp-bit));
  --gp-padding-end: calc(${rhythm.paddingEnd} * var(--gp-bit));
  --gp-gap: ${gap};`;
}

export function emitPrototypeCss({ compactPatterns, grids, layouts, responsive, rhythms }) {
  const gridNames = Object.keys(grids);
  const gridList = whereGridList(gridNames);
  const geometry = geometryRules({ grids });
  const compact = compactRules({ compactPatterns, grids, layouts });
  const expanded = expandedPlacementRules({ grids, layouts });
  const standaloneGeometry = geometryRules({ grids, standalone: true });
  const standaloneCompact = compactRules({ compactPatterns, grids, layouts, standalone: true });
  const standaloneExpanded = expandedPlacementRules({ grids, layouts, standalone: true });
  const placementConsumers = placementConsumerRules({ layouts });

  return `/*
 * Graph Paper CSS 1.0 geometry prototype
 * GENERATED FILE — DO NOT EDIT DIRECTLY
 * Source: src/geometry + src/manifest + src/emit/prototype.mjs
 *
 * Contract:
 * - Graph Paper grids use border-box sizing.
 * - A grid may be a descendant of .gp_canvas, but an intervening size-query
 *   container establishes a different coordinate system and is unsupported.
 * - Standalone grids retain viewport-relative geometry and media-query states.
 */

:root {
  --gp-bit: 1.5625vw;
  --gp-cell: 3.125vw;
  --gp-line: 1.5rem;
  --gp-rule-width: 1px;
  --gp-rule-color: #d0d3d4;
  --gp-rule-offset: 0px;
${rhythmDeclarations(rhythms.wide)}
}

.gp_canvas {
  container-name: gp-canvas;
  container-type: inline-size;
${rhythmDeclarations(rhythms.wide)}
}

.gp_canvas.gp_rhythm--thin {
${rhythmDeclarations(rhythms.thin)}
}

.gp_canvas.gp_rhythm--neat {
${rhythmDeclarations(rhythms.neat)}
}

@supports (width: 1cqi) {
  .gp_canvas {
    --gp-bit: 1.5625cqi;
    --gp-cell: 3.125cqi;
  }
}

${gridList} {
  box-sizing: border-box;
  display: block;
  inline-size: 100%;
  padding: 1.5rem;
}

${gridList} > * {
  box-sizing: border-box;
  display: block;
  inline-size: 100%;
  min-inline-size: 0;
  margin-block-end: 1.5rem;
}

/* Continue a parent grid's columns through a semantic wrapper. */
.gp_subgrid {
  display: grid;
  grid-template-columns: subgrid;
}

${placementConsumers}

/* Explicit editorial treatments replace the legacy selector matrix. */
.gp_inset--bit {
  padding-inline: var(--gp-bit);
}

.gp_treatment--rule {
  --gp-rule-offset: calc(var(--gp-gap) / 2);
}

.gp_rule--start,
.gp_rule--end {
  position: relative;
}

.gp_rule--start::before,
.gp_rule--end::after {
  position: absolute;
  inset-block: 0;
  inline-size: var(--gp-rule-width);
  background: var(--gp-rule-color);
  content: "";
  pointer-events: none;
}

.gp_rule--start::before {
  inset-inline-start: calc(0px - var(--gp-rule-offset));
}

.gp_rule--end::after {
  inset-inline-end: calc(0px - var(--gp-rule-offset));
}

/* Optical correction does not participate in grid geometry. */
.gp_optical {
  translate: var(--gp-optical-x, 0) var(--gp-optical-y, 0);
}

/* Explicit opt-out; doubled class matches generated set-placement specificity. */
.gp_place.gp_place {
  grid-column: var(--gp-column-start, auto) / var(--gp-column-end, auto);
  grid-row: var(--gp-row-start, auto) / var(--gp-row-end, auto);
}

@container gp-canvas (min-width: ${responsive.compact}) {
${indent(geometry)}
}

@container gp-canvas (min-width: ${responsive.compact}) and (max-width: 59.999rem) {
${indent(compact)}
}

@container gp-canvas (min-width: ${responsive.expanded}) {
${indent(expanded)}
}

/* A compatibility path for existing markup without .gp_canvas. */
@media screen and (min-width: ${responsive.compact}) {
${indent(standaloneGeometry)}
}

@media screen and (min-width: ${responsive.compact}) and (max-width: 59.999rem) {
${indent(standaloneCompact)}
}

@media screen and (min-width: ${responsive.expanded}) {
${indent(standaloneExpanded)}
}

`;
}
