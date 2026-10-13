const full = [1, 25];
const halfStart = [1, 13];
const halfEnd = [13, 25];

export const compactPatterns = {
  set03: [
    { item: 1, lines: full, row: [1, 2] },
    { item: 2, lines: halfStart, row: [2, 3] },
    { item: 3, lines: halfEnd, row: [2, 3] }
  ],
  set04: [
    { item: 1, lines: full, row: [1, 2] },
    { item: 2, lines: [1, 9], row: [2, 3] },
    { item: 3, lines: [9, 17], row: [2, 3] },
    { item: 4, lines: [17, 25], row: [2, 3] }
  ],
  set05: [
    { item: 1, lines: full, row: [1, 2] },
    { item: 2, lines: halfStart, row: [2, 3] },
    { item: 3, lines: halfEnd, row: [2, 3] },
    { item: 4, lines: halfStart, row: [3, 4] },
    { item: 5, lines: halfEnd, row: [3, 4] }
  ],
  set06: [
    { item: 1, lines: halfStart, row: [1, 2] },
    { item: 2, lines: halfEnd, row: [1, 2] },
    { item: 3, lines: halfStart, row: [2, 3] },
    { item: 4, lines: halfEnd, row: [2, 3] },
    { item: 5, lines: halfStart, row: [3, 4] },
    { item: 6, lines: halfEnd, row: [3, 4] }
  ],
  set06Flow: [
    { item: 1, lines: full, row: [1, 2] },
    { item: 2, lines: halfStart, row: [2, 3] },
    { item: 3, lines: halfEnd, row: [2, 3] },
    { item: 4, lines: [1, 9], row: [3, 4] },
    { item: 5, lines: [9, 17], row: [3, 4] },
    { item: 6, lines: [17, 25], row: [3, 4] }
  ]
};
