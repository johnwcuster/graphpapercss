// Inspector-only series colors; source numbers remain the non-color identity.
export const MAX_SOURCE_ITEMS = 8;
export const sourcePalette = Object.freeze(['#4477aa', '#ee6677', '#228833', '#ccbb44', '#66ccee', '#aa3377', '#bbbbbb', '#222222']);

export function clampSourceCount(value, fallback = 1) {
  const parsed = Number(value);
  return Math.min(MAX_SOURCE_ITEMS, Math.max(1, value !== null && value !== undefined && value !== '' && Number.isFinite(parsed) ? Math.trunc(parsed) : fallback));
}

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

export function createSourceControls({ remove, add, output, onCount }) {
  let count = 1;
  remove.addEventListener('click', () => {
    if (count <= 1) return;
    onCount(count - 1);
    if (remove.disabled) add.focus({ preventScroll: true });
  });
  add.addEventListener('click', () => {
    if (count >= MAX_SOURCE_ITEMS) return;
    onCount(count + 1);
    if (add.disabled) remove.focus({ preventScroll: true });
  });
  return {
    update(nextCount) {
      const next = clampSourceCount(nextCount);
      if (next === count && output.childElementCount) return;
      count = next;
      remove.disabled = count === 1;
      remove.title = count === 1 ? 'Keep at least one source item' : 'Remove the last item without changing set or flow';
      add.disabled = count >= MAX_SOURCE_ITEMS;
      add.title = add.disabled ? 'Maximum eight example items' : 'Append one item in source order';
      const ns = 'http://www.w3.org/2000/svg', stack = document.createElementNS(ns, 'svg');
      stack.classList.add('source-stack'); stack.setAttribute('viewBox', '0 0 24 60'); stack.setAttribute('aria-hidden', 'true');
      for (let item = 1; item <= count; item++) {
        const layer = document.createElementNS(ns, 'rect');
        layer.setAttribute('x', '2'); layer.setAttribute('y', String((60 - (count - 1) * 7 - 6) / 2 + (item - 1) * 7));
        layer.setAttribute('width', '20'); layer.setAttribute('height', '6'); layer.setAttribute('rx', '1');
        layer.style.fill = sourceStyle(item).color;
        stack.append(layer);
      }
      const label = document.createElement('span'); label.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
      output.replaceChildren(stack, label);
    }
  };
}
