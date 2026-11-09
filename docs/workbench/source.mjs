import { sourceStyle } from '../assets/graph-paper/tools/shared/source.mjs';
export { sourcePalette, sourceStyle, contrastRatio } from '../assets/graph-paper/tools/shared/source.mjs';
// These item-count controls belong only to the documentation's sample content.
export const MAX_SOURCE_ITEMS = 8;

export function clampSourceCount(value, fallback = 1) {
  const parsed = Number(value);
  return Math.min(MAX_SOURCE_ITEMS, Math.max(1, value !== null && value !== undefined && value !== '' && Number.isFinite(parsed) ? Math.trunc(parsed) : fallback));
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
