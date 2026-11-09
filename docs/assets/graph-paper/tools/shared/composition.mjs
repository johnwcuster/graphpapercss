import { recipes, fields, layoutsFor, expandedPlacements, compactPlacements, sequentialPlacements } from '../../src/legacy/0.4/ruler/geometry.mjs';

export function compatibleLayout(id, set, flow) {
  return layoutsFor(recipes[id]).find(layout => layout.set === set && (layout.flow ?? 'default') === flow)
    ?? layoutsFor(recipes[id]).find(layout => layout.set === set && !layout.flow)
    ?? null;
}

export function recipeSelection(id, set, flow) {
  const layout = compatibleLayout(id, set, flow);
  return { grid: id, set: layout?.set ?? 'none', flow: layout?.flow ?? 'default' };
}

// Shared schematic geometry. Extra named-set items retain full-width fallback.
export function diagramItems(id, set, flow, count = 6, fieldName = 'wide', state = 'expanded') {
  if (count === 0) return [];
  const layout = compatibleLayout(id, set, flow);
  const placements = state === 'stacked' ? sequentialPlacements(recipes[id], fieldName, count, state)
    : layout ? state === 'expanded' ? expandedPlacements(recipes[id], fieldName, layout) : compactPlacements(fieldName, layout)
      : sequentialPlacements(recipes[id], fieldName, count, state);
  const span = fields[fieldName].end - fields[fieldName].start;
  let lastRow = Math.max(...placements.filter(p => p.item <= count).map(p => p.row[1]));
  for (let item = placements.length + 1; item <= count; item++) placements.push({ item, lines: [1, span + 1], row: [lastRow, ++lastRow] });
  const rows = Math.max(...placements.map(p => p.row[1] - 1));
  return placements.filter(p => p.item <= count).map(p => ({
    item: p.item, x: (p.lines[0] - 1) / span * 100,
    width: (p.lines[1] - p.lines[0]) / span * 100,
    y: (p.row[0] - 1) / rows * 56, height: (p.row[1] - p.row[0]) / rows * 56
  }));
}
