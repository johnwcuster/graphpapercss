import { fields, recipes, layoutsFor, expandedPlacements, compactPlacements, sequentialPlacements } from '../assets/graph-paper/src/ruler/geometry.mjs';
import { responsive } from '../assets/graph-paper/src/manifest/responsive.mjs';
import { bands } from '../assets/graph-paper/src/manifest/bands.mjs';
import { bandThresholds } from '../assets/graph-paper/src/ruler/bands.mjs';

export const defaultThresholds = { compact: parseFloat(responsive.compact), expanded: parseFloat(responsive.expanded) };
export const stateAt = (width, thresholds, rem = 16) => width >= thresholds.expanded * rem ? 'expanded' : width >= thresholds.compact * rem ? 'compact' : 'stacked';

export function responseFor(selection, rem = 16) {
  const recipe = recipes[selection.grid];
  const layout = layoutsFor(recipe).find(l => l.set === selection.set && (l.flow ?? 'default') === selection.flow);
  const thresholds = selection.band ? bandThresholds(recipe, selection.field, layout, selection.band) : { ...defaultThresholds };
  return { recipe, layout, thresholds, state: stateAt(selection.width, thresholds, rem) };
}

// A conservative structural comparison, not a claim of equal host typography.
// Explicit rows are retained even when positions are empty. Fallback items keep
// auto rows, just as the CSS does, rather than inventing an author placement.
export function occupiedGeometry(selection, rem = 16, overrideState) {
  const { recipe, layout, state: actualState } = responseFor(selection, rem);
  const state = overrideState ?? actualState, field = fields[selection.field];
  const placements = state === 'stacked' ? sequentialPlacements(recipe, selection.field, selection.items, state)
    : layout ? (state === 'expanded' ? expandedPlacements(recipe, selection.field, layout) : compactPlacements(selection.field, layout))
      : sequentialPlacements(recipe, selection.field, selection.items, state);
  return Array.from({ length: selection.items }, (_, i) => {
    const p = placements.find(p => p.item === i + 1);
    return { item: i + 1,
      start: field.start + (p?.lines[0] ?? 1) - 1,
      end: field.start + (p?.lines[1] ?? field.end - field.start + 1) - 1,
      row: p?.row ?? 'auto',
      endRule: Boolean(state !== 'stacked' && selection.field === 'ruled' && p && p.lines[1] < field.end - field.start + 1)
    };
  });
}

export function compareChoice(current, candidate, rem = 16) {
  const before = responseFor(current, rem), after = responseFor(candidate, rem);
  const same = (a, b, state) => JSON.stringify(occupiedGeometry(a, rem, state)) === JSON.stringify(occupiedGeometry(b, rem, state));
  const policyChanged = before.thresholds.compact !== after.thresholds.compact || before.thresholds.expanded !== after.thresholds.expanded;
  const sameHere = before.state === after.state && same(current, candidate);
  const equivalent = !policyChanged && ['stacked', 'compact', 'expanded']
    .filter(state => state !== 'compact' || before.thresholds.compact < before.thresholds.expanded)
    .every(state => same(current, candidate, state));
  if (!sameHere) return { sameHere: false, equivalent, policyChanged, reason: `Changes the current ${before.state} composition${before.state !== after.state ? ` to ${after.state}` : ''}.` };
  let reason;
  if (equivalent) reason = 'Same item arrangement and transition widths across responsive states.';
  else if (before.state === 'stacked') reason = 'Items are stacked in source order; differences may appear at wider widths.';
  else if (before.state === 'compact') reason = 'These options place the current items the same way when compact; expanded layouts may differ.';
  else {
    const positions = Math.max(current.items, candidate.items, before.layout?.items ?? before.recipe.columns, after.layout?.items ?? after.recipe.columns);
    reason = same({ ...current, items: positions }, { ...candidate, items: positions })
      ? 'The occupied item placements are equivalent in this expanded view.'
      : 'The differences affect unoccupied positions in this view.';
  }
  if (policyChanged) reason += ' Transition widths differ, so the layouts may differ at another width.';
  return { sameHere: true, equivalent, policyChanged, reason };
}

export function bandComparisons(selection, rem = 16) {
  const choices = ['', ...Object.keys(bands)].map(band => {
    const candidate = { ...selection, band }, response = responseFor(candidate, rem);
    return { band, label: band ? `Band ${band} · ${bands[band]}rem minimum` : 'Default · fixed 30 / 60rem',
      ...response, comparison: compareChoice(selection, candidate, rem),
      compactPx: response.thresholds.compact * rem, expandedPx: response.thresholds.expanded * rem };
  });
  // Absolute canvas-width scale: neither the recipe, band, nor width can rescale it.
  const maximum = 3200;
  return { choices, maximum };
}

export function thresholdNotice(before, after, rem = 16) {
  const a = responseFor(before, rem), b = responseFor(after, rem);
  const changes = ['compact', 'expanded'].filter(state => a.thresholds[state] !== b.thresholds[state]);
  if (!changes.length || before.width !== after.width) return '';
  return `${changes.map(state => `${state[0].toUpperCase() + state.slice(1)} transition: ${a.thresholds[state] * rem}px → ${b.thresholds[state] * rem}px`).join('; ')}. Preview width stays ${after.width}px; the layout is ${b.state}.`;
}

export function responseExplanation(selection, rem = 16) {
  const { state, thresholds } = responseFor(selection, rem);
  const usual = stateAt(selection.width, defaultThresholds, rem);
  return {
    state: `${state[0].toUpperCase() + state.slice(1)} · preview width ${selection.width}px`,
    policy: thresholds.minimum ? `gp_band--${selection.band} requests a ${thresholds.minimum}rem minimum position width. It changes transition timing, not the recipe or preview width.`
      : `No band class: use the default ${defaultThresholds.compact}rem / ${defaultThresholds.expanded}rem canvas thresholds.`,
    thresholds: `compact ≥ ${thresholds.compact}rem (${thresholds.compact * rem}px); expanded ≥ ${thresholds.expanded}rem (${thresholds.expanded * rem}px).${thresholds.compact === thresholds.expanded ? ' No separate compact interval: the composition moves directly from stacked to expanded.' : ''}`,
    why: thresholds.minimum ? `${usual === state ? `Default and this band both show the ${state} layout at this width.` : `Without a band this width would show ${usual}; the selected band shows ${state}.`} Default expanded begins at ${defaultThresholds.expanded * rem}px. Changing settings keeps the preview width unchanged.`
      : 'Recipe proportions are used in the expanded layout; compact uses its simplified arrangement; stacked keeps source order. Test transitions sets the preview width once, not continuously.',
    calculation: thresholds.minimum ? `The narrowest defined position spans ${thresholds.expandedBits} of 64 ruler bits when expanded and ${thresholds.compactBits} when compact. Graph Paper rounds each transition width upward to a whole rem. Expanded never starts before compact. Every defined position counts, including empty ones. Your padding and text are not measured; a stacked layout can still be narrower than the requested minimum.`
      : 'Default uses the fixed 30rem and 60rem canvas widths. A band instead calculates transitions from the narrowest defined position. Changing gutters, recipe, number of positions, or flow can change that position’s width.'
  };
}
