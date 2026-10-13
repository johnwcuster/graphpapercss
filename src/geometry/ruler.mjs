export const RULER_BITS = 64;
export const ALLOWED_LATTICES = new Set([20, 24]);

export function trackBits({ tracks, paddingStart, paddingEnd, gap }) {
  return (
    RULER_BITS - paddingStart - paddingEnd - (tracks - 1) * gap
  ) / tracks;
}

export function spanBits({ span, track, gap }) {
  return span * track + (span - 1) * gap;
}

export function macroLines(spans) {
  const lines = [1];
  let line = 1;

  for (const span of spans) {
    line += span;
    lines.push(line);
  }

  return lines;
}
