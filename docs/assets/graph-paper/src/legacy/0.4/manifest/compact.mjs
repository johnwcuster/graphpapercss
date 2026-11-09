// A compact row groups consecutive source items into equal-width slots.
function group(firstItem, count, row) {
  return Array.from({ length: count }, (_, index) => ({
    item: firstItem + index, count, index, row: [row, row + 1]
  }));
}

export const compactPatterns = {
  set03: [...group(1, 1, 1), ...group(2, 2, 2)],
  set04: [...group(1, 1, 1), ...group(2, 3, 2)],
  set05: [...group(1, 1, 1), ...group(2, 2, 2), ...group(4, 2, 3)],
  set06: [...group(1, 2, 1), ...group(3, 2, 2), ...group(5, 2, 3)],
  set06Flow: [...group(1, 1, 1), ...group(2, 2, 2), ...group(4, 3, 3)]
};
