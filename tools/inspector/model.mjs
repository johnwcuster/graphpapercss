import { fields, recipes, layoutsFor } from '../../src/legacy/0.4/ruler/geometry.mjs';
import { bands } from '../../src/legacy/0.4/manifest/bands.mjs';
import { recipeSelection } from '../shared/composition.mjs';

// Only these composition tokens are owned by an editing session. In particular,
// canvas, subgrid, rule markers, IDs, styles and host classes are never replaced.
export const isCompositionClass = value => /^(?:grid_\d{2}[a-d]?(?:--\d{2})?|set_\d{2}|flow_\d{2}|gp_field--[\w-]+|gp_band--[\w-]+)$/.test(value);
export const compositionClasses = classes => [...classes].filter(isCompositionClass);
export function selectionClasses(selection) {
  return [`gp_field--${selection.field}`, selection.grid,
    ...(selection.set !== 'none' ? [selection.set] : []),
    ...(selection.flow !== 'default' ? [selection.flow] : []),
    ...(selection.band ? [`gp_band--${selection.band}`] : [])];
}
export function readSelection(classes) {
  const tokens = [...classes], owned = compositionClasses(tokens);
  const one = prefix => owned.filter(value => value.startsWith(prefix));
  const grids = one('grid_'), sets = one('set_'), flows = one('flow_');
  const field = one('gp_field--'), band = one('gp_band--');
  if (grids.length !== 1 || field.length !== 1 || sets.length > 1 || flows.length > 1 || band.length > 1) {
    throw new Error('Use one recipe and one named field, with at most one set, flow and band.');
  }
  const selection = { grid: grids[0], field: field[0].slice(10), set: sets[0] ?? 'none', flow: flows[0] ?? 'default', band: band[0]?.slice(9) ?? '' };
  if (!recipes[selection.grid] || !fields[selection.field] || selection.band && !bands[selection.band]) throw new Error('This composition uses classes unknown to this tool version.');
  if (selection.set === 'none' ? selection.flow !== 'default' : !layoutsFor(recipes[selection.grid]).some(l => l.set === selection.set && (l.flow ?? 'default') === selection.flow)) {
    throw new Error('This grid / set / flow combination is unsupported.');
  }
  return selection;
}
export function changeSelection(selection, key, value) {
  const next = { ...selection, [key]: value };
  if (key === 'grid' || key === 'set') Object.assign(next, recipeSelection(next.grid, next.set, next.flow));
  // Validate generated and externally supplied selections by the same contract.
  readSelection(selectionClasses(next));
  return next;
}
export const sameClasses = (a, b) => [...a].sort().join(' ') === [...b].sort().join(' ');

export function replaceCompositionClasses(element, next) {
  element.classList.remove(...compositionClasses(element.classList));
  if (next.length) element.classList.add(...next);
}

export function discoverFields(root) {
  const candidates = [...(root.matches?.('.gp_field') ? [root] : []), ...root.querySelectorAll('.gp_field')];
  return candidates.filter(node => [...node.classList].some(value => value.startsWith('grid_')));
}
