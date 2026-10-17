import { recipes, fields, layoutsFor, resolveColumns, expandedPlacements, compactPlacements, sequentialPlacements } from '../assets/graph-paper/src/ruler/geometry.mjs';

export function recipeParts(id) {
  const match = /^grid_(\d{2})([a-d]?)(?:--(\d{2}))?$/.exec(id);
  if (!match || !recipes[id]) throw new Error(`Unknown recipe: ${id}`);
  return { family: match[1], letter: match[2], variant: match[3] ?? '' };
}

export function alternatives(id, dimension) {
  const current = recipeParts(id);
  return Object.keys(recipes).filter(candidate => {
    const parts = recipeParts(candidate);
    return parts.family === current.family && (dimension === 'letter' || parts.letter === current.letter);
  });
}

// Preserve the other decision where possible; never invent a missing class.
export function selectAlternative(id, dimension, value) {
  const current = recipeParts(id);
  const candidates = Object.keys(recipes).filter(candidate => {
    const parts = recipeParts(candidate);
    return parts.family === (dimension === 'family' ? value : current.family)
      && (dimension !== 'variant' || parts.variant === value)
      && (dimension !== 'letter' || parts.letter === value)
      && (dimension !== 'variant' || parts.letter === current.letter);
  });
  return candidates.find(candidate => {
    const parts = recipeParts(candidate);
    return (dimension === 'variant' || parts.variant === current.variant)
      && (dimension !== 'family' || parts.letter === current.letter);
  }) ?? candidates.find(candidate => !recipeParts(candidate).variant) ?? candidates[0];
}

export function compatibleLayout(id, set, flow) {
  return layoutsFor(recipes[id]).find(layout => layout.set === set && (layout.flow ?? 'default') === flow)
    ?? layoutsFor(recipes[id]).find(layout => layout.set === set && !layout.flow)
    ?? null;
}

export function recipeSelection(id, set, flow) {
  const layout = compatibleLayout(id, set, flow);
  return { grid: id, set: layout?.set ?? 'none', flow: layout?.flow ?? 'default' };
}

// Unlike family changes, these controls never substitute another variant.
export function designOptions(id, dimension) {
  const parts = recipeParts(id);
  const values = dimension === 'letter' ? ['', 'a', 'b', 'c', 'd']
    : ['', ...new Set(alternatives(id, 'letter').map(candidate => recipeParts(candidate).variant).filter(Boolean))].sort();
  return values.map(value => {
    const letter = dimension === 'letter' ? value : parts.letter;
    const variant = dimension === 'variant' ? value : parts.variant;
    const grid = `grid_${parts.family}${letter}${variant ? `--${variant}` : ''}`;
    return { key: value || 'default', label: value ? dimension === 'letter' ? value : `--${value}` : 'Default',
      grid, selected: grid === id, disabled: !recipes[grid] };
  });
}

// Compare macro widths, including unoccupied regions, against this letter's
// unnumbered recipe. Never substitute a different letter as a missing baseline.
export function variantWidthChanges(id, fieldName) {
  const { family, letter } = recipeParts(id), baseline = `grid_${family}${letter}`;
  if (!recipes[baseline]) return null;
  const defaults = resolveColumns(recipes[baseline], fieldName), span = fields[fieldName].end - fields[fieldName].start;
  return resolveColumns(recipes[id], fieldName).map((column, index) => {
    const delta = column.end - column.start - (defaults[index].end - defaults[index].start);
    return { region: index + 1, baseline, delta, change: delta > 0 ? 'wider' : delta < 0 ? 'narrower' : 'unchanged',
      center: ((column.start + column.end) / 2 - fields[fieldName].start) / span * 100,
      width: (column.end - column.start) / span * 100 };
  });
}

export function letterAvailability(id, key) {
  const letter = key === 'default' ? '' : key;
  const parts = recipeParts(id);
  if (!designOptions(id, 'letter').find(option => option.key === (letter || 'default'))?.disabled) return '';
  const familyRecipes = Object.keys(recipes).filter(candidate => recipeParts(candidate).family === parts.family);
  if (!familyRecipes.some(candidate => recipeParts(candidate).letter === letter)) {
    const families = [...new Set(Object.keys(recipes).filter(candidate => recipeParts(candidate).letter === letter).map(candidate => Number(recipeParts(candidate).family)))];
    return `Choose ${families[0]} macro regions above.`;
  }
  // Find a real, short route through enabled controls; e.g. 04d has no Default
  // variant, so returning to the unlettered recipe needs a bridge through a/b/c.
  const pending = [{ grid: id, steps: [] }], visited = new Set([id]);
  for (const { grid, steps } of pending) {
    for (const dimension of ['variant', 'letter']) for (const option of designOptions(grid, dimension)) {
      if (option.disabled || visited.has(option.grid)) continue;
      const action = dimension === 'variant'
        ? option.key === 'default' ? `Unselect the --${recipeParts(grid).variant} variant below.` : `Select the ${option.label} variant below.`
        : `Select ${option.label} here first.`;
      const next = [...steps, action];
      if (recipeParts(option.grid).letter === letter) return next[0];
      visited.add(option.grid); pending.push({ grid: option.grid, steps: next });
    }
  }
  return 'Change the macro-region count above.';
}

// Current-field/state occupancy. Extra children retain full-width auto-row
// fallback and appear below the named positions in this schematic preview.
export function diagramItems(id, set, flow, count = 6, fieldName = 'wide', state = 'expanded') {
  const layout = compatibleLayout(id, set, flow);
  const placements = state === 'stacked' ? sequentialPlacements(recipes[id], fieldName, count, state)
    : layout ? state === 'expanded' ? expandedPlacements(recipes[id], fieldName, layout) : compactPlacements(fieldName, layout)
      : sequentialPlacements(recipes[id], fieldName, count, state);
  const span = fields[fieldName].end - fields[fieldName].start;
  let lastRow = Math.max(...placements.filter(p => p.item <= count).map(p => p.row[1]));
  for (let item = placements.length + 1; item <= count; item++) placements.push({ item, lines: [1, span + 1], row: [lastRow, ++lastRow] });
  const rows = Math.max(...placements.map(p => p.row[1] - 1));
  return placements.filter(p => p.item <= count).map(p => ({
    item: p.item, x: (p.lines[0] - 1) / span * 100,
    width: (p.lines[1] - p.lines[0]) / span * 100,
    y: (p.row[0] - 1) / rows * 56, height: (p.row[1] - p.row[0]) / rows * 56
  }));
}

export function boundarySteps(thresholds, rem) {
  return ['compact', 'expanded'].flatMap(state => [-1, 1].map(offset => ({
    state, side: offset < 0 ? 'below' : 'above',
    width: offset < 0 ? Math.ceil(thresholds[state] * rem) - 1 : Math.floor(thresholds[state] * rem) + 1
  })));
}

export function transitionBoundaries(thresholds, rem = 16) {
  const shared = thresholds.compact === thresholds.expanded;
  return (shared ? ['expanded'] : ['compact', 'expanded']).map(state => {
    const at = thresholds[state] * rem;
    return { state, from: state === 'compact' || shared ? 'stacked' : 'compact', to: state,
      at, before: Math.ceil(at) - 1, after: Math.floor(at) + 1 };
  });
}
