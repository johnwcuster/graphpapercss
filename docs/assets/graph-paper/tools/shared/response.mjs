import { recipes, layoutsFor } from '../../src/legacy/0.4/ruler/geometry.mjs';
import { responsive } from '../../src/legacy/0.4/manifest/responsive.mjs';
import { bandThresholds } from '../../src/legacy/0.4/ruler/bands.mjs';

export const defaultThresholds = { compact: parseFloat(responsive.compact), expanded: parseFloat(responsive.expanded) };
export const stateAt = (width, thresholds, rem = 16) => width >= thresholds.expanded * rem ? 'expanded' : width >= thresholds.compact * rem ? 'compact' : 'stacked';

export function responseFor(selection, rem = 16) {
  const recipe = recipes[selection.grid];
  const layout = layoutsFor(recipe).find(l => l.set === selection.set && (l.flow ?? 'default') === selection.flow);
  const thresholds = selection.band ? bandThresholds(recipe, selection.field, layout, selection.band) : { ...defaultThresholds };
  return { recipe, layout, thresholds, state: stateAt(selection.width, thresholds, rem) };
}
