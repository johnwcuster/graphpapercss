// Read-only measurement layer. Its nodes live outside the inspected canvas.
import { sourceStyle } from './source.mjs';
export function createInspector({ canvas, field, overlay, summary }) {
  let config, frame;
  const observe = new ResizeObserver(schedule);
  const abort = new AbortController();
  const changed = new MutationObserver(schedule);
  observe.observe(canvas); observe.observe(field);
  changed.observe(field, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] });
  window.addEventListener('resize', schedule, { signal: abort.signal });
  function schedule() {
    cancelAnimationFrame(frame); frame = requestAnimationFrame(draw);
  }
  function node(className, text, x, y, width, height) {
    const element = document.createElement('div'); element.className = className;
    element.textContent = text;
    Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, ...(height === undefined ? {} : { height: `${height}px` }) });
    overlay.append(element); return element;
  }
  function draw() {
    if (!config) return;
    overlay.replaceChildren();
    const { flags, fieldGeometry, placements, thresholds, state, rem, selectedSource } = config;
    const parent = overlay.getBoundingClientRect(), ruler = canvas.getBoundingClientRect();
    const originX = ruler.left - parent.left, originY = ruler.top - parent.top;
    const bit = ruler.width / 64, extent = fieldGeometry.end - fieldGeometry.start;
    const items = [...field.children];
    if (flags.ruler) for (let i = 0; i <= 64; i += 8) {
      node('ruler-label', String(i), originX + bit * i, originY - 18, 24);
    }
    let minimum = Infinity, mismatches = 0;
    items.forEach((item, index) => {
      const box = item.getBoundingClientRect(), x = box.left - parent.left, y = box.top - parent.top;
      minimum = Math.min(minimum, box.width);
      const expected = state === 'stacked' ? null : placements.find(p => p.item === index + 1);
      const start = expected ? fieldGeometry.start + expected.lines[0] - 1 : fieldGeometry.start;
      const expectedWidth = expected ? expected.lines[1] - expected.lines[0] : extent;
      const differs = Math.abs(box.left - ruler.left - start * bit) > 1 || Math.abs(box.width - expectedWidth * bit) > 1;
      if (differs) mismatches++;
      const bits = box.width / bit;
      if (flags.layout) {
        node(`item-box${differs ? ' geometry-mismatch' : ''}`, '', x, y, box.width, box.height);
        node('item-measure', `${bits.toFixed(1)} bits · ${Math.round(box.width)}px${differs ? ' · differs from recipe' : ''}`, x, y + box.height - 21, box.width);
      }
      if (selectedSource === index + 1) {
        const selection = node('source-selection', '', x - 3, y - 3, box.width + 6, box.height + 6);
        selection.style.setProperty('--source-color', sourceStyle(index + 1).color);
        selection.dataset.sourceItem = String(index + 1);
      }
      if (flags.source) {
        const badge = node('item-source', String(index + 1), x + 3, y + 3, 22);
        const { color, ink } = sourceStyle(index + 1);
        badge.style.backgroundColor = color; badge.style.color = ink;
      }
      if (flags.band && thresholds.minimum) {
        const needed = thresholds.minimum * rem;
        const bracket = node(`band-bracket${box.width + 1 < needed ? ' under-pressure' : ''}`, `min ${thresholds.minimum}rem`, x, y + Math.min(32, box.height / 2), needed);
        bracket.title = `Item ${index + 1}: ${Math.round(box.width)}px outer width; band minimum ${needed}px. This width includes padding; text fit is not measured.`;
      }
    });
    summary.textContent = `Measured ${items.length} item boxes · narrowest ${Math.round(minimum)}px (${(minimum / rem).toFixed(1)}rem). ${thresholds.minimum ? `Band minimum: ${thresholds.minimum}rem. Item widths include padding; text fit is not measured. ` : ''}${mismatches ? `${mismatches} item(s) differ from expected horizontal recipe geometry.` : 'Horizontal edges match the current recipe.'}`;
    overlay.dataset.ready = 'true';
    overlay.dataset.mismatches = String(mismatches);
  }
  return {
    update(next) {
      config = next;
      observe.disconnect(); observe.observe(canvas); observe.observe(field);
      for (const item of field.children) observe.observe(item);
      schedule();
    },
    destroy() { cancelAnimationFrame(frame); observe.disconnect(); changed.disconnect(); abort.abort(); overlay.replaceChildren(); }
  };
}
