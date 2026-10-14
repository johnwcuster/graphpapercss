import { fields, recipes, layoutsFor, resolveColumns, expandedPlacements, compactPlacements } from "./ruler/geometry.mjs";

export function validateManifest() {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  for (const [name, field] of Object.entries(fields)) {
    assert(Number.isInteger(field.start) && Number.isInteger(field.end) && field.start >= 0 && field.end <= 64 && field.start < field.end, `${name}: invalid field`);
    for (const [id, recipe] of Object.entries(recipes)) {
      const columns = resolveColumns(recipe, name);
      assert(columns[0].start === field.start && columns.at(-1).end === field.end, `${id}/${name}: field does not close`);
      columns.forEach((column, i) => {
        assert(Number.isInteger(column.start) && Number.isInteger(column.end) && column.start < column.end, `${id}/${name}: invalid macro boundary`);
        if (i) assert(column.start - columns[i - 1].end === field.gutter, `${id}/${name}: invalid gutter`);
      });
      for (const layout of layoutsFor(recipe)) for (const placements of [expandedPlacements(recipe, name, layout), compactPlacements(name, layout)]) {
        assert(placements.length === layout.items && new Set(placements.map(p => p.item)).size === layout.items, `${layout.id}: incomplete source items`);
        for (const p of placements) {
          assert(Number.isInteger(p.item) && p.item >= 1 && p.item <= layout.items, `${layout.id}: invalid source item`);
          assert(p.lines.every(Number.isInteger) && p.lines[0] >= 1 && p.lines[0] < p.lines[1] && p.lines[1] <= field.end - field.start + 1, `${layout.id}: invalid horizontal range`);
          assert(p.row.every(Number.isInteger) && p.row[0] >= 1 && p.row[0] < p.row[1], `${layout.id}: invalid row range`);
          for (const q of placements) if (p.item !== q.item) {
            assert(!(p.lines[0] < q.lines[1] && q.lines[0] < p.lines[1] && p.row[0] < q.row[1] && q.row[0] < p.row[1]), `${layout.id}: unexpected overlap`);
          }
        }
      }
    }
  }
}
