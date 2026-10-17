import { diagramItems } from './model.mjs';

// Describe the same occupied geometry as the illustration, including fallback items.
export function describeDiagram(selection, state) {
  const items = diagramItems(selection.grid, selection.set, selection.flow, selection.items, selection.field, state);
  if (state === 'stacked') return `Stacked: items ${items.map(item => item.item).join(', ')} in source order, each full width.`;
  const groups = new Map();
  for (const item of items) {
    const key = `${item.x}:${item.width}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return `${state[0].toUpperCase() + state.slice(1)}: ` + [...groups.values()]
    .sort((a, b) => a[0].x - b[0].x || a[0].y - b[0].y)
    .map(group => {
      group.sort((a, b) => a.y - b.y);
      const { x, width } = group[0], center = x + width / 2;
      const position = width > 99 ? 'full width' : center < 40 ? 'on the left' : center > 60 ? 'on the right' : 'in the center';
      return `${group.length > 1 ? 'items' : 'item'} ${group.map(item => item.item).join(', ')}${group.length > 1 ? ' stacked' : ''} ${position}${width > 99 ? '' : ` (about ${Math.round(width)}% of the field width)`}`;
    }).join('; ') + '.';
}

export function describeControl(button, text) {
  const description = document.createElement('span');
  description.hidden = true;
  description.id = `description-${button.dataset.choiceKey ?? button.dataset.band ?? button.dataset.field}`;
  description.textContent = text;
  button.setAttribute('aria-describedby', description.id);
  button.append(description);
}

export function radioChoice(button, selected) {
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', String(selected));
  button.tabIndex = selected && !button.disabled ? 0 : -1;
}
