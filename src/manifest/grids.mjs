function defineGrid(id, lattice, spans) {
  const match = id.match(/^grid_(0\d[a-d]?)(?:--(\d{2}))?$/);
  if (!match) throw new Error(`Invalid grid recipe ID: ${id}`);

  return [
    id,
    {
      columns: spans.length,
      family: match[1],
      lattice,
      spans,
      variant: match[2] ?? null
    }
  ];
}

// The ordering follows the legacy stylesheet so generated CSS and visual
// catalogs remain predictable. Spans are expressed in real lattice tracks.
const recipes = [
  defineGrid("grid_02", 20, [10, 10]),
  defineGrid("grid_02a", 20, [10, 10]),
  defineGrid("grid_02b", 20, [10, 10]),
  defineGrid("grid_02a--01", 24, [14, 10]),
  defineGrid("grid_02a--02", 20, [12, 8]),
  defineGrid("grid_02a--03", 24, [16, 8]),
  defineGrid("grid_02a--04", 20, [14, 6]),
  defineGrid("grid_02a--05", 24, [18, 6]),
  defineGrid("grid_02a--06", 20, [16, 4]),
  defineGrid("grid_02b--01", 24, [10, 14]),
  defineGrid("grid_02b--02", 20, [8, 12]),
  defineGrid("grid_02b--03", 24, [8, 16]),
  defineGrid("grid_02b--04", 20, [6, 14]),
  defineGrid("grid_02b--05", 24, [6, 18]),
  defineGrid("grid_02b--06", 20, [4, 16]),

  defineGrid("grid_03", 24, [8, 8, 8]),
  defineGrid("grid_03a", 24, [10, 7, 7]),
  defineGrid("grid_03b", 24, [7, 7, 10]),
  defineGrid("grid_03c", 24, [7, 10, 7]),
  defineGrid("grid_03d", 24, [7, 10, 7]),
  defineGrid("grid_03a--01", 24, [10, 8, 6]),
  defineGrid("grid_03a--02", 20, [10, 6, 4]),
  defineGrid("grid_03a--03", 24, [12, 8, 4]),
  defineGrid("grid_03a--04", 24, [14, 6, 4]),
  defineGrid("grid_03a--05", 20, [8, 6, 6]),
  defineGrid("grid_03a--06", 24, [12, 6, 6]),
  defineGrid("grid_03a--07", 20, [12, 4, 4]),
  defineGrid("grid_03a--08", 24, [16, 4, 4]),
  defineGrid("grid_03b--01", 24, [6, 8, 10]),
  defineGrid("grid_03b--02", 20, [4, 6, 10]),
  defineGrid("grid_03b--03", 24, [4, 8, 12]),
  defineGrid("grid_03b--04", 24, [4, 6, 14]),
  defineGrid("grid_03b--05", 20, [6, 6, 8]),
  defineGrid("grid_03b--06", 24, [6, 6, 12]),
  defineGrid("grid_03b--07", 20, [4, 4, 12]),
  defineGrid("grid_03b--08", 24, [4, 4, 16]),
  defineGrid("grid_03c--01", 24, [8, 10, 6]),
  defineGrid("grid_03c--02", 20, [6, 10, 4]),
  defineGrid("grid_03c--03", 24, [8, 12, 4]),
  defineGrid("grid_03c--04", 24, [6, 14, 4]),
  defineGrid("grid_03c--05", 20, [6, 8, 6]),
  defineGrid("grid_03c--06", 24, [6, 12, 6]),
  defineGrid("grid_03c--07", 20, [4, 12, 4]),
  defineGrid("grid_03c--08", 24, [4, 16, 4]),
  defineGrid("grid_03d--01", 24, [6, 10, 8]),
  defineGrid("grid_03d--02", 20, [4, 10, 6]),
  defineGrid("grid_03d--03", 24, [4, 12, 8]),
  defineGrid("grid_03d--04", 24, [4, 14, 6]),
  defineGrid("grid_03d--05", 20, [6, 8, 6]),
  defineGrid("grid_03d--06", 24, [6, 12, 6]),
  defineGrid("grid_03d--07", 20, [4, 12, 4]),
  defineGrid("grid_03d--08", 24, [4, 16, 4]),

  defineGrid("grid_04", 24, [6, 6, 6, 6]),
  defineGrid("grid_04a", 24, [6, 6, 6, 6]),
  defineGrid("grid_04b", 24, [6, 6, 6, 6]),
  defineGrid("grid_04c", 24, [6, 6, 6, 6]),
  defineGrid("grid_04a--01", 24, [8, 6, 6, 4]),
  defineGrid("grid_04a--02", 20, [7, 5, 4, 4]),
  defineGrid("grid_04a--03", 24, [10, 6, 4, 4]),
  defineGrid("grid_04a--04", 20, [8, 6, 3, 3]),
  defineGrid("grid_04b--01", 24, [4, 6, 8, 6]),
  defineGrid("grid_04b--02", 20, [4, 4, 7, 5]),
  defineGrid("grid_04b--03", 24, [4, 4, 10, 6]),
  defineGrid("grid_04b--04", 20, [3, 3, 8, 6]),
  defineGrid("grid_04c--01", 24, [6, 8, 6, 4]),
  defineGrid("grid_04c--02", 20, [5, 7, 4, 4]),
  defineGrid("grid_04c--03", 24, [6, 10, 4, 4]),
  defineGrid("grid_04c--04", 20, [6, 8, 3, 3]),
  defineGrid("grid_04d--01", 24, [6, 6, 8, 4]),
  defineGrid("grid_04d--02", 20, [4, 5, 7, 4]),
  defineGrid("grid_04d--03", 24, [4, 6, 10, 4]),
  defineGrid("grid_04d--04", 20, [3, 6, 8, 3])
];

export const grids = Object.fromEntries(recipes);
