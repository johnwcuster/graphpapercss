import { grids } from "../manifest/grids.mjs";
import { compactPatterns } from "../manifest/compact.mjs";
import { layouts } from "../manifest/layouts.mjs";
import { acceptedChanges } from "./accepted-changes.mjs";

// Coordinates are zero-based bits; CSS lines are coordinates + 1.
export const fields = Object.freeze({
  full: Object.freeze({ start: 0, end: 64, gutter: 0 }),
  neat: Object.freeze({ start: 2, end: 62, gutter: 0 }),
  thin: Object.freeze({ start: 2, end: 61, gutter: 1 }),
  wide: Object.freeze({ start: 3, end: 61, gutter: 2 }),
  ruled: Object.freeze({ start: 4, end: 60, gutter: 2 })
});

export const recipes = Object.fromEntries(Object.entries(grids)
  .map(([id, grid]) => [id, { ...grid, id, legacy: true }]));
Object.assign(recipes, {
  "grid_05": { columns: 5, family: "05", weights: [1, 1, 1, 1, 1] },
  "grid_06": { columns: 6, family: "06", weights: [1, 1, 1, 1, 1, 1] },
  // 5:3 content proportion; not a reinterpretation of an existing ID.
  "grid_02a--07": { columns: 2, family: "02a", weights: [5, 3] }
});

export function resolveColumns(recipe, fieldName) {
  const field = fields[fieldName];
  if (!field) throw new Error(`Unknown field: ${fieldName}`);
  const accepted = acceptedChanges[`${recipe.id}/${fieldName}`];
  if (accepted) return accepted.map(column => ({ ...column }));
  // Subtract structural gutter space from each neat-field content weight.
  // Full/ruled use the wide composition's proportions at their own extents.
  const inset = fieldName === "neat" ? 0 : fieldName === "thin" ? 1 : 2;
  const weights = recipe.legacy ? recipe.weights.map(weight => weight - inset) : recipe.weights;
  const available = field.end - field.start - field.gutter * (weights.length - 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  let previous = 0;
  return weights.map((weight, index) => {
    cumulative += weight;
    // Quantize cumulative content boundaries together, not widths separately.
    // Ties round toward the end of the field; closure is exact.
    const boundary = Math.round(available * cumulative / total);
    const column = {
      start: field.start + previous + index * field.gutter,
      end: field.start + boundary + index * field.gutter
    };
    previous = boundary;
    return column;
  });
}

export function layoutsFor(recipe) {
  if (recipe.legacy || recipe.family === "02a") {
    return layouts.filter(layout => layout.families.includes(recipe.family));
  }
  const set = `set_0${recipe.columns}`;
  return [{
    id: `${recipe.family}-${set}-default`, set, flow: null, items: recipe.columns,
    states: {
      expanded: { placements: Array.from({ length: recipe.columns }, (_, i) => ({
        item: i + 1, column: [i + 1, i + 2], row: [1, 2]
      })) },
      compact: `set0${recipe.columns}`, stacked: { sourceOrder: true }
    }
  }];
}

export function expandedPlacements(recipe, fieldName, layout) {
  const field = fields[fieldName];
  const columns = resolveColumns(recipe, fieldName);
  return layout.states.expanded.placements.map(p => ({
    item: p.item,
    // Field subgrids use local line indices. Ruler coordinates stay global.
    lines: [columns[p.column[0] - 1].start - field.start + 1,
      columns[p.column[1] - 2].end - field.start + 1],
    row: p.row
  }));
}

export function compactPlacements(fieldName, layout) {
  const field = fields[fieldName];
  const pattern = compactPatterns[layout.states.compact];
  return pattern.map(p => {
    const { count, index } = p;
    const columns = resolveColumns({ weights: Array(count).fill(1) }, fieldName);
    return { item: p.item,
      lines: [columns[index].start - field.start + 1, columns[index].end - field.start + 1],
      row: p.row };
  });
}

export function auditGeometry(baseline) {
  return baseline.records.map(({ id, field, columns: legacy }) => {
      const candidate = resolveColumns(recipes[id], field);
      const displacement = Math.max(...legacy.flatMap((c, i) =>
        [Math.abs(c.start - candidate[i].start), Math.abs(c.end - candidate[i].end)]));
      const hierarchyPreserved = legacy.every((c, i) => legacy.every((other, j) => {
        const before = Math.sign((c.end - c.start) - (other.end - other.start));
        const after = Math.sign((candidate[i].end - candidate[i].start) - (candidate[j].end - candidate[j].start));
        return before === after;
      }));
      return { id, field, legacy, candidate, displacement, hierarchyPreserved,
        classification: acceptedChanges[`${id}/${field}`] ? "ACCEPTED"
          : displacement === 0 ? "EXACT"
          : displacement <= 1 && hierarchyPreserved ? "NEAR" : "REVIEW",
        acceptedReason: acceptedChanges[`${id}/${field}`]
          ? "Approved whole-bit replacement: half-bit edge displacement and one-bit redistribution between formerly equal columns."
          : null,
        migrated: true };
    });
}
