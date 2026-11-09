// Series identity for authoring overlays, never styling for host content.
export const sourcePalette = Object.freeze(['#4477aa', '#ee6677', '#228833', '#ccbb44', '#66ccee', '#aa3377', '#bbbbbb', '#222222']);
function channels(hex) { return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)); }
function luminance(hex) {
  return channels(hex).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
export function contrastRatio(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
export function sourceStyle(item) {
  const color = sourcePalette[(Math.max(1, Math.trunc(Number(item) || 1)) - 1) % sourcePalette.length];
  const ink = contrastRatio(color, '#ffffff') > contrastRatio(color, '#000000') ? '#ffffff' : '#000000';
  const tint = '#' + channels(color).map(v => Math.round(v * .12 + 255 * .88).toString(16).padStart(2, '0')).join('');
  return { color, ink, tint };
}
