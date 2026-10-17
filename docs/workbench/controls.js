import { fields, recipes, layoutsFor, resolveColumns } from '../assets/graph-paper/src/ruler/geometry.mjs';
import { recipeParts, selectAlternative, recipeSelection, designOptions, letterAvailability, variantWidthChanges, diagramItems, transitionBoundaries } from './model.mjs';
import { compareChoice, responseFor, bandComparisons } from './response.mjs';
import { sourceStyle } from './source.mjs';
import { describeDiagram, describeControl, radioChoice } from './accessibility.mjs';

function diagram(id, set, flow, count, field, state, sourceColors = false, widthChanges) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const inset = widthChanges === undefined ? 0 : 16;
  const items = diagramItems(id, set, flow, count, field, state);
  // Flow previews can include full-width fallback items 7/8. Give every box
  // enough height for its number instead of compressing everything into 56 units.
  const verticalScale = sourceColors ? Math.max(1, 12 / Math.min(...items.map(item => item.height))) : 1;
  svg.setAttribute('viewBox', `0 0 100 ${56 * verticalScale + inset}`); svg.setAttribute('aria-hidden', 'true');
  svg.dataset.state = state;
  for (const { region, center: x, width, delta, change } of widthChanges ?? []) {
    const mark = document.createElementNS(ns, 'g'), path = document.createElementNS(ns, 'path');
    mark.classList.add('width-change'); mark.dataset.region = region; mark.dataset.widthChange = change; mark.dataset.deltaBits = delta;
    const half = Math.min(7, width * .35), head = Math.min(2, half * .6), gap = Math.min(1.5, half * .3), y = 7;
    path.setAttribute('d', change === 'wider'
      ? `M${x-half},${y}H${x+half} M${x-half+head},${y-head}L${x-half},${y}L${x-half+head},${y+head} M${x+half-head},${y-head}L${x+half},${y}L${x+half-head},${y+head}`
      : change === 'narrower'
        ? `M${x-half},${y}H${x-gap} M${x-gap-head},${y-head}L${x-gap},${y}L${x-gap-head},${y+head} M${x+half},${y}H${x+gap} M${x+gap+head},${y-head}L${x+gap},${y}L${x+gap+head},${y+head}`
        : `M${x-2},${y}H${x+2}`);
    mark.append(path); svg.append(mark);
  }
  const content = document.createElementNS(ns, 'g'); content.setAttribute('transform', `translate(0 ${inset})`); svg.append(content);
  for (const item of items) {
    const rect = document.createElementNS(ns, 'rect'), number = document.createElementNS(ns, 'text');
    rect.style.fill = sourceColors ? sourceStyle(item.item).tint : 'var(--site-tint)';
    number.style.fill = 'var(--site-ink)';
    for (const [key, value] of Object.entries({ x: item.x + .5, y: item.y * verticalScale + .5, width: Math.max(0, item.width - 1), height: Math.max(0, item.height * verticalScale - 1) })) rect.setAttribute(key, value);
    number.setAttribute('x', item.x + item.width / 2); number.setAttribute('y', (item.y + item.height / 2) * verticalScale);
    number.textContent = item.item; content.append(rect, number);
  }
  return svg;
}

export function renderChoices({ id, set, flow, count, field, band, width, rem, onGrid, onSet, onFlow }) {
  const parts = recipeParts(id), $ = selector => document.getElementById(selector);
  const current = { grid: id, set, flow, items: count, field, band, width };
  const state = responseFor(current, rem).state;
  $('choice-context').textContent = `Preview: ${width}px · ${state[0].toUpperCase() + state.slice(1)}`;
  $('variant-width-key').textContent = variantWidthChanges(id, field)
    ? 'Compared with Default: ←→ wider · →← narrower · — same'
    : 'No unnumbered Default for this letter; width comparison unavailable.';
  const focused = document.activeElement?.dataset.choiceKey;
  function choices(target, entries, mode) {
    $(target).replaceChildren(...entries.map(({ key, label, selected, disabled = false, grid = id, selectedSet, selectedFlow, click }) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'design-choice';
      button.disabled = disabled;
      button.dataset.choiceKey = `${target}:${key}`;
      radioChoice(button, selected);
      const name = document.createElement('span'); name.className = 'choice-label'; name.textContent = label;
      button.append(name);
      if (disabled) {
        if (mode === 'paired') name.textContent += ' (Unavailable)';
        button.dataset.effect = 'unavailable';
        button.title = `${grid}${selectedSet ? ` · ${selectedSet}` : ''}${selectedFlow ? ` · ${selectedFlow}` : ''}: this CSS combination does not exist.`;
        if (mode !== 'number') {
          const unavailable = document.createElement('span'); unavailable.className = 'choice-unavailable';
          unavailable.textContent = mode === 'paired' ? letterAvailability(id, key) : 'Unavailable';
          if (mode === 'paired') button.title = unavailable.textContent;
          button.append(unavailable);
        }
      } else {
        const next = selectedSet !== undefined ? recipeSelection(grid, selectedSet, flow)
          : selectedFlow !== undefined ? { grid, set, flow: selectedFlow } : recipeSelection(grid, set, flow);
        const candidate = { ...current, ...next }, comparison = compareChoice(current, candidate, rem);
        const candidateResponse = responseFor(candidate, rem);
        button.dataset.effect = selected ? 'selected' : comparison.equivalent ? 'same' : 'different';
        button.title = `${grid} · ${next.set} · ${next.flow}. ${mode === 'flow' ? `Preview: ${candidateResponse.state} at ${width}px. ` : ''}${comparison.reason}`;
        button.title += ' ' + (mode === 'paired'
          ? (candidateResponse.thresholds.compact < candidateResponse.thresholds.expanded ? describeDiagram(candidate, 'compact') + ' ' : 'No compact interval. ') + describeDiagram(candidate, 'expanded')
          : describeDiagram(candidate, mode === 'flow' ? candidateResponse.state : 'expanded'));
        const widthChanges = mode === 'expanded' ? variantWidthChanges(grid, field) : undefined;
        if (widthChanges) button.title += ` Widths vs ${widthChanges[0].baseline}: ${widthChanges.map(region => `region ${region.region} ${region.change}${region.delta ? ` by ${Math.abs(region.delta)} bits` : ''}`).join('; ')}.`;
        if (next.set !== set || next.flow !== flow) button.title += ` Compatibility adjustment: ${next.set}, ${next.flow}.`;
        if (mode !== 'number') {
          const previews = document.createElement('span'); previews.className = mode === 'paired' ? 'paired-previews' : 'single-preview';
          const states = mode === 'paired' ? ['compact', 'expanded'] : [mode === 'flow' ? candidateResponse.state : 'expanded'];
          button.dataset.previewState = mode === 'paired' ? 'compact expanded' : states[0];
          for (const previewState of states) {
            const preview = document.createElement('span'); preview.className = 'choice-preview';
            if (mode !== 'flow') {
              const caption = document.createElement('span'); caption.className = 'preview-caption';
              caption.textContent = previewState[0].toUpperCase() + previewState.slice(1);
              preview.append(caption);
            }
            if (previewState === 'compact' && candidateResponse.thresholds.compact === candidateResponse.thresholds.expanded) {
              const unavailable = document.createElement('span'); unavailable.className = 'choice-unavailable'; unavailable.textContent = 'No compact interval';
              preview.append(unavailable);
            } else preview.append(diagram(grid, next.set, next.flow, count, field, previewState, mode === 'flow', widthChanges));
            previews.append(preview);
          }
          button.append(previews);
          if (!selected && comparison.equivalent) {
            const note = document.createElement('span'); note.className = 'choice-note';
            note.textContent = 'Same layout and transitions.';
            button.append(note);
          }
        }
        button.addEventListener('click', click);
      }
      button.setAttribute('aria-label', name.textContent);
      describeControl(button, button.title);
      return button;
    }));
  }
  choices('family-choices', ['02', '03', '04', '05', '06'].map(family => {
    const grid = selectAlternative(id, 'family', family);
    return { key: family, label: String(Number(family)), selected: family === parts.family, grid, click: () => onGrid(grid) };
  }), 'number');
  choices('letter-choices', designOptions(id, 'letter').map(option => ({ ...option, click: () => onGrid(option.grid) })), 'paired');
  choices('variant-choices', designOptions(id, 'variant').map(option => ({ ...option, click: () => onGrid(option.grid) })), 'expanded');
  const layouts = layoutsFor(recipes[id]);
  choices('set-choices', ['none', 'set_03', 'set_04', 'set_05', 'set_06'].map(value => ({
    key: value, label: value === 'none' ? 'Default' : String(Number(value.slice(-2))), selected: value === set,
    selectedSet: value, disabled: value !== 'none' && !layouts.some(layout => layout.set === value), click: () => onSet(value)
  })), 'number');
  choices('flow-choices', ['default', ...Array.from({ length: 7 }, (_, i) => `flow_0${i + 1}`)].map(value => ({
    key: value, label: value === 'default' ? 'Default' : value, selected: value === flow, selectedFlow: value,
    disabled: value !== 'default' && !layouts.some(layout => layout.set === set && layout.flow === value), click: () => onFlow(value)
  })), 'flow');
  if (focused) for (const button of document.querySelectorAll('[data-choice-key]')) {
    if (button.dataset.choiceKey === focused && !button.disabled) button.focus({ preventScroll: true });
  }
}

export function renderBands(selection, rem, onBand) {
  const target = document.getElementById('band-choices'), focused = document.activeElement?.dataset.band;
  const { choices, maximum } = bandComparisons(selection, rem);
  document.getElementById('band-axis').textContent = `Preview width: 0–${maximum}px · current ${selection.width}px${selection.width > maximum ? ' (off-scale →)' : ''}`;
  target.replaceChildren(...choices.map(choice => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'design-choice';
    const selected = choice.band === selection.band;
    button.dataset.band = choice.band || 'default'; button.dataset.state = choice.state;
    button.dataset.effect = selected ? 'selected' : choice.comparison.equivalent ? 'same' : 'different';
    radioChoice(button, selected);
    const name = document.createElement('span'); name.className = 'band-name'; name.textContent = choice.label;
    const timeline = document.createElement('span'); timeline.className = 'band-timeline'; timeline.setAttribute('aria-hidden', 'true');
    const intervals = [['stacked', 0, choice.compactPx], ['compact', choice.compactPx, choice.expandedPx], ['expanded', choice.expandedPx, maximum]];
    for (const [state, start, end] of intervals) {
      const visibleStart = Math.min(start, maximum), visibleEnd = Math.min(end, maximum);
      if (visibleStart >= visibleEnd) continue;
      const segment = document.createElement('span'); segment.className = `band-segment ${state}`; segment.dataset.state = state;
      segment.style.left = `${visibleStart / maximum * 100}%`; segment.style.width = `${(visibleEnd - visibleStart) / maximum * 100}%`;
      segment.textContent = state[0].toUpperCase(); timeline.append(segment);
    }
    for (const value of [30, 60]) {
      if (value * rem > maximum) continue;
      const reference = document.createElement('span'); reference.className = 'band-default-reference'; reference.dataset.rem = value;
      reference.style.left = `${value * rem / maximum * 100}%`; timeline.append(reference);
    }
    const marker = document.createElement('span'); marker.className = 'band-current'; marker.style.left = `${Math.min(selection.width, maximum) / maximum * 100}%`;
    if (selection.width > maximum) { marker.classList.add('off-scale'); marker.textContent = '→'; }
    timeline.append(marker);
    const thresholds = document.createElement('span'); thresholds.className = 'band-thresholds';
    thresholds.textContent = choice.compactPx === choice.expandedPx ? `Stacked → Expanded at ${choice.expandedPx}px · no compact interval`
      : `Compact ≥ ${choice.compactPx}px · Expanded ≥ ${choice.expandedPx}px`;
    const effect = document.createElement('span'); effect.className = 'band-effect';
    effect.textContent = `${choice.state[0].toUpperCase() + choice.state.slice(1)} at current preview width${!selected && choice.comparison.equivalent ? ' · equivalent transitions' : ''}${choice.expandedPx > maximum ? ' · expanded starts off-scale →' : ''}`;
    button.title = `${choice.band ? `gp_band--${choice.band}` : 'No band class'}. ${thresholds.textContent}. ${choice.comparison.reason} Preview width stays ${selection.width}px.`;
    button.setAttribute('aria-label', choice.label);
    button.append(name, timeline, thresholds, effect);
    describeControl(button, `${effect.textContent}. ${button.title}`);
    button.addEventListener('click', () => onBand(choice.band)); return button;
  }));
  if (focused) target.querySelector(`[data-band="${focused}"]`)?.focus({ preventScroll: true });
}

export function renderGutters({ field, onField }) {
  const target = document.getElementById('field-choices'), focused = document.activeElement?.dataset.field;
  const ns = 'http://www.w3.org/2000/svg';
  target.replaceChildren(...Object.entries(fields).map(([id, geometry]) => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.field = id;
    radioChoice(button, id === field);
    const name = document.createElement('span'); name.className = 'gutter-name';
    name.textContent = `${id} · ${geometry.end - geometry.start} bits`;
    const detail = document.createElement('span'); detail.className = 'gutter-detail';
    const rightInset = 64 - geometry.end;
    detail.textContent = `${geometry.gutter}-bit gutters · ${geometry.start === rightInset ? `${geometry.start}-bit outer insets` : `inset ${geometry.start} bits left, ${rightInset} right`}`;
    const description = `${id}: ${geometry.end - geometry.start} usable bits; ${geometry.gutter}-bit gutters; ${geometry.start} bits inset left, ${64 - geometry.end} right${id === 'ruled' ? '; centered column rule' : ''}. Two-region illustration.`;
    button.title = description; button.setAttribute('aria-label', name.textContent);
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 192 32'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    // The whole 64-bit canvas is visible, including zero insets for full.
    for (const [index, column] of resolveColumns(recipes.grid_02, id).entries()) {
      const rect = document.createElementNS(ns, 'rect'); rect.classList.add('gutter-region');
      rect.setAttribute('x', String(column.start * 3)); rect.setAttribute('y', '4');
      rect.setAttribute('width', String((column.end - column.start) * 3)); rect.setAttribute('height', '24');
      rect.style.fill = index ? 'color-mix(in srgb, var(--site-accent) 12%, var(--site-tint))' : 'var(--site-tint)'; svg.append(rect);
    }
    if (id === 'ruled') {
      const columns = resolveColumns(recipes.grid_02, id), line = document.createElementNS(ns, 'line'); line.classList.add('gutter-rule');
      line.setAttribute('x1', String((columns[0].end + geometry.gutter / 2) * 3)); line.setAttribute('x2', line.getAttribute('x1'));
      line.setAttribute('y1', '4'); line.setAttribute('y2', '28'); svg.append(line);
    }
    button.append(name, svg, detail); describeControl(button, description);
    button.addEventListener('click', () => onField(id)); return button;
  }));
  if (focused) target.querySelector(`[data-field="${focused}"]`)?.focus({ preventScroll: true });
}

export function renderBoundaries({ thresholds, defaults, rem, width, enabled, stage, scale, steps, onWidth }) {
  const focused = steps.contains(document.activeElement) ? document.activeElement.dataset.boundary : null;
  const capital = value => value[0].toUpperCase() + value.slice(1);
  steps.replaceChildren(...transitionBoundaries(thresholds, rem).map(transition => {
    const row = document.createElement('section'); row.className = 'transition-row'; row.dataset.transition = transition.state;
    const heading = document.createElement('h3'), at = document.createElement('span');
    heading.textContent = `${capital(transition.from)} → ${capital(transition.to)}`;
    at.textContent = `${transition.at}px`; heading.append(at);
    const actions = document.createElement('div'); actions.className = 'transition-actions';
    for (const side of ['below', 'above']) {
      const value = transition[side === 'below' ? 'before' : 'after'];
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${side === 'below' ? 'Below' : 'Above'} · ${value}px`;
      button.title = `Set preview width to ${value}px (1px ${side} the ${transition.from} → ${transition.to} transition). Later recipe or band changes do not resize the preview.`;
      button.setAttribute('aria-label', `${button.textContent}: resize just ${side} ${transition.from} to ${transition.to}`);
      button.dataset.boundary = `${transition.state}-${side}`;
      button.addEventListener('click', () => onWidth(value)); actions.append(button);
    }
    row.append(heading, actions); return row;
  }));
  if (focused) steps.querySelector(`[data-boundary="${focused}"]`)?.focus({ preventScroll: true });
  stage.style.width = `${Math.max(width, defaults.expanded * rem, thresholds.expanded * rem) + 90}px`;
  scale.hidden = !enabled;
  scale.replaceChildren();
  function marker(px, text, kind) {
    const mark = document.createElement('div'); mark.className = `threshold ${kind}`; mark.style.left = `${px}px`;
    const label = document.createElement('span'); label.textContent = text; mark.append(label); scale.append(mark);
  }
  const grouped = new Map();
  for (const state of ['compact', 'expanded']) {
    const value = thresholds[state];
    grouped.set(value, [...(grouped.get(value) ?? []), state]);
  }
  for (const [value, states] of grouped) marker(value * rem, `${states.join(' / ')} ≥ ${value}rem · ${Math.round(value * rem)}px`, 'active');
  if (thresholds.minimum) for (const state of ['compact', 'expanded']) marker(defaults[state] * rem, `default ${defaults[state]}rem`, 'reference');
  marker(width, `${width}px preview`, 'current');
}
