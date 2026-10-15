// Accepted 0.2.3-to-1.0 whole-bit geometry changes.
// These intentionally break equality of the two small columns by one bit.
// Freeze explicit coordinates so future quantization edits cannot alter them.
const definitions = {
  grid_03a: {
    neat: [[2, 27], [27, 45], [45, 62]],
    thin: [[2, 26], [27, 44], [45, 61]],
    wide: [[3, 26], [28, 44], [46, 61]]
  },
  grid_03b: {
    neat: [[2, 20], [20, 37], [37, 62]],
    thin: [[2, 19], [20, 36], [37, 61]],
    wide: [[3, 19], [21, 36], [38, 61]]
  },
  grid_03c: {
    neat: [[2, 20], [20, 45], [45, 62]],
    thin: [[2, 19], [20, 44], [45, 61]],
    wide: [[3, 19], [21, 44], [46, 61]]
  },
  grid_03d: {
    neat: [[2, 20], [20, 45], [45, 62]],
    thin: [[2, 19], [20, 44], [45, 61]],
    wide: [[3, 19], [21, 44], [46, 61]]
  }
};
export const acceptedChanges = Object.freeze(Object.fromEntries(
  Object.entries(definitions).flatMap(([id, byField]) => Object.entries(byField).map(([field, columns]) => [
    `${id}/${field}`, Object.freeze(columns.map(([start, end]) => Object.freeze({ start, end })))
  ]))
));
