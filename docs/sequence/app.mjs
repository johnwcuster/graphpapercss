import {renderCatalogue} from './catalogue-picker.mjs';
import {setupCSSExport} from './css-export.mjs';
import {setupDelivery} from './delivery.mjs';
import {catalogueKind,familyLayouts,relationship,widthOrder,proportionChoices,chooseNearby,equalLayout} from './catalogue-navigation.mjs';
import { sourcePalette } from '../assets/graph-paper/tools/shared/source.mjs';
import {
  arrangements, arrangement, thresholds, defaultState, normalizeState, needsRulerMeasurement,
  supports, countMessage, activeStep, diagram, placementsFor, candidateMarkup, retiredSelections,
  resolvedSteps, addTransition, selectStep, moveTransition, editSpacing, editPadding, editVerticalSpacing, editSelection, exactOptions, exactTuple, exactStatus
} from './model.mjs';

const $ = selector => document.querySelector(selector);
const sourceColors = sourcePalette;
let state = defaultState();
try {
  const encoded = new URL(location.href).searchParams.get('state');
  if (encoded && encoded.length < 12000) {
    const parsed = JSON.parse(encoded);
    state = normalizeState(parsed);
    if (retiredSelections(parsed).length) {
      $('#load-notice').textContent = 'This saved exploration included layout names that are no longer available. Those selections were replaced with Stack; their transition widths were retained.';
      $('#load-notice').hidden = false;
    }
  }
} catch { /* A malformed exploration link opens the documented default. */ }
let revision = 0, previewActive = null, urlTimer, timelineSignature = '', browserEnhanced = true, browserArithmetic = true, editorContext = '';
const frame = $('#preview');
const selected = () => state.steps.find(step => step.id === state.selected) ?? state.steps[0];
const widthLabel = step => step.rem ? `From ${step.rem}rem` : 'Base';
const paddingLabel = bits => bits ? `${bits} ${bits === 1 ? 'bit' : 'bits'}` : 'None';
const verticalLabel = bits => bits === null ? 'Layout default' : bits === 0 ? 'Zero' : paddingLabel(bits);
const announce = message => { $('#announcement').textContent = message; };
const cssExport=setupCSSExport({getState:()=>state,announce});
const delivery=setupDelivery({getState:()=>state,announce});

function fitPreviewDisplay() {
  // Scale the rendered iframe, not its viewport or its document's font sizes.
  // Queries, ruler geometry, and exported classes continue to use state.width.
  const available = $('#preview-scroll').clientWidth;
  if (!available) return;
  const focused=document.activeElement,focusRect=focused?.getBoundingClientRect();
  const keepFocusVisible=$('.preview-area').contains(focused)&&focusRect.height>0&&focusRect.top>=0&&focusRect.bottom<=innerHeight;
  const scale = Math.min(1, available / state.width);
  const width = state.width * scale;
  const height = Number(frame.height) * scale;
  const stage = $('#viewport-stage');
  $('.viewport-wrap').style.width = `${width}px`;
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  stage.dataset.scale = String(scale);
  frame.style.transform = `scale(${scale})`;
  $('#ruler-scale').hidden = !state.ruler;
  $('#viewport-caption').textContent = `${state.width}px viewport · ${Math.round(scale * 100)}% display scale`;
  // A zoom/resize can rescale the preview after native focus scrolling. Keep
  // an already visible editorial control in view when the preview changes height.
  if(keepFocusVisible){
    const rect=focused.getBoundingClientRect();
    if(rect.top<0||rect.bottom>innerHeight)focused.scrollIntoView({block:'nearest'});
  }
}

function persist() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const url = new URL(location.href);
    url.searchParams.set('state', JSON.stringify(state));
    history.replaceState(null, '', url);
  }, 160);
}
function send() {
  revision++;
  frame.dataset.ready = 'false';
  frame.width = state.width;
  frame.contentWindow.postMessage({ type: 'gp-sequence-update', state, revision }, location.origin);
  $('#width').value = state.width;
  $('#width-number').value = state.width;
  fitPreviewDisplay();
  updatePreviewSummary();
  persist();
}

function updatePreviewSummary() {
  const steps = resolvedSteps(state);
  const step = steps.find(step => step.id === previewActive) ?? activeStep(state);
  const warning = countMessage(step.layout, state.count, {...state,spacing:step.spacing}, step.config);
  const featureWarning = !browserArithmetic ? 'This browser lacks required CSS arithmetic. Review the source-order stacked fallback.' : !browserEnhanced && ['two','three','four','mosaic'].includes(arrangement(step.layout).family) ? arrangement(step.layout).family === 'two' ? 'This browser uses the equal-pairs compatibility layout; spanning endpoints are retained.' : 'This browser lacks native item-count arithmetic. The selected layout uses a source-order stack.' : '';
  $('#preview-warning').textContent = [warning,featureWarning].filter(Boolean).join(' ');
  $('#preview-warning').hidden = !warning && !featureWarning;
  // A normalized 0–200rem sequence overview. Preview width never changes the scale.
  const nextTimelineSignature = JSON.stringify([state.steps, step.id]);
  if (nextTimelineSignature !== timelineSignature) {
    const focusedPreview = document.activeElement?.dataset.preview;
    $('#timeline').innerHTML = steps.map((candidate, i) => {
      const end = steps[i + 1]?.rem ?? 200;
      const options=thresholds.map(t=>`<option value="${t.rem}" ${t.rem===candidate.rem?'selected':''} ${steps.some(s=>s.id!==candidate.id&&s.rem===t.rem)?'disabled':''}>${t.rem}rem · ${t.rem*16}px</option>`).join('');
      return `<div class="timeline-step" style="flex:${end-candidate.rem}"><button type="button" data-preview="${candidate.id}" aria-pressed="${candidate.id===step.id}" aria-label="Preview ${widthLabel(candidate)}: ${arrangement(candidate.layout).label}"><strong>${arrangement(candidate.layout).label}</strong><span>${candidate.rem?`${candidate.rem}rem`:'0'}–${steps[i+1]?`${steps[i+1].rem}rem`:'∞'}</span></button>${candidate.rem?`<button type="button" id="timeline-actions-${candidate.id}" class="timeline-chevron" data-timeline-actions="${candidate.id}" popovertarget="timeline-menu-${candidate.id}" aria-expanded="false" aria-controls="timeline-menu-${candidate.id}" aria-label="Actions for ${widthLabel(candidate)} transition"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg></button><div id="timeline-menu-${candidate.id}" class="timeline-menu" data-timeline-menu="${candidate.id}" popover="auto" role="dialog" aria-label="Actions for ${widthLabel(candidate)} transition"><label for="timeline-threshold-${candidate.id}">Minimum viewport width</label><select id="timeline-threshold-${candidate.id}" data-timeline-threshold="${candidate.id}">${options}</select><button type="button" data-remove-transition="${candidate.id}">Remove transition</button><p>Removes this width and its layout, gutter, vertical-spacing, padding, and placement overrides. Source items are kept.</p></div>`:''}</div>`;
    }).join('');
    timelineSignature = nextTimelineSignature;
    if (focusedPreview) $('#timeline').querySelector(`[data-preview="${focusedPreview}"]`)?.focus({ preventScroll: true });
  }
  for (const node of document.querySelectorAll('[data-step]')) {
    const tag = node.querySelector('.current-tag');
    tag.hidden = node.dataset.step !== step.id;
  }
}

function render() {
  const panelScroll = $('#composition-panel').scrollTop;
  const choicesScroll = $('#layout-choices').scrollTop;
  const exactScroll = $('#exact-options').scrollTop;
  const focused = document.activeElement;
  const focusKey = focused?.dataset.focus ?? focused?.id;
  const steps = resolvedSteps(state);
  const step = steps.find(candidate => candidate.id === state.selected) ?? steps[0];
  const countLabel = `${state.count} ${state.count === 1 ? 'item' : 'items'}`;
  if ($('#item-count').textContent !== countLabel) $('#item-count').textContent = countLabel;
  $('#source-stack').innerHTML = Array.from({length:state.count}, (_,i)=>sourceColors[i % sourceColors.length]).map(color => `<i style="--source-color:${color}"></i>`).join('');
  $('#remove-item').disabled = state.count <= 1;
  $('#add-item').disabled = state.count >= 14;
  const editor = $('#layout-editor');
  editor.remove();
  $('#steps').innerHTML = steps.map(candidate => `<button class="step" type="button" data-step="${candidate.id}" data-focus="step-${candidate.id}" aria-expanded="${candidate.id === step.id}" aria-controls="layout-editor" aria-pressed="${candidate.id === step.id}" aria-label="Edit ${widthLabel(candidate)}: ${arrangement(candidate.layout).label}">${diagram(candidate.layout, state.count, '', {spacing:candidate.spacing, measured:needsRulerMeasurement(state), ...candidate.config})}<span><span class="step-title">${widthLabel(candidate)}${candidate.rem ? ' · Viewport' : ' · Every width'}</span><span class="step-subtitle">${arrangement(candidate.layout).label} · ${candidate.spacing} · vertical ${verticalLabel(candidate.verticalSpacing).toLowerCase()} · padding ${paddingLabel(candidate.padding).toLowerCase()}${candidate.inherited ? ' · Layout inherited' : ''}${countMessage(candidate.layout,state.count,{...state,spacing:candidate.spacing},candidate.config) ? ' · Fallback' : ''}</span><span class="current-tag" hidden>IN PREVIEW</span></span></button>`).join('');
  $(`[data-step="${step.id}"]`).after(editor);
  $('#transition-options').innerHTML = thresholds.map(threshold => {
    const used = state.steps.some(candidate => candidate.rem === threshold.rem);
    return `<button type="button" data-add-rem="${threshold.rem}" aria-pressed="${used}" aria-label="${used ? 'Remove' : 'Add'} ${threshold.rem}rem transition"><span aria-hidden="true">${used ? '✓' : '+'}</span> ${threshold.rem}rem · ${threshold.rem * 16}px${used ? ' · Remove' : ''}</button>`;
  }).join('') + '<p class="hint">Select an added width to remove its viewport-specific layout section. Source items are kept.</p>';
  $('#editing-heading').textContent = `${widthLabel(step)}${step.rem ? ' · Viewport' : ' layout'}`;
  $('.threshold-row').hidden = !step.rem;
  $('#base-note').hidden = Boolean(step.rem);
  $('#inheritance-note').hidden = !step.rem;
  const from = steps.find(candidate => candidate.id === step.inheritedFrom);
  $('#inheritance-text').textContent = step.inherited
    ? `Inherits ${arrangement(step.layout).label} from ${from.rem ? `${from.rem}rem` : 'Base'}. Gutters, vertical spacing, and padding inherit separately.`
    : 'This viewport has its own layout and placement selection.';
  $('#inherit-layout').hidden = step.inherited || !step.rem;
  $('#threshold').innerHTML = thresholds.map(threshold => `<option value="${threshold.rem}" ${threshold.rem === step.rem ? 'selected' : ''} ${state.steps.some(candidate => candidate.id !== step.id && candidate.rem === threshold.rem) ? 'disabled' : ''}>${threshold.rem}rem · ${threshold.prefix} · ${threshold.rem * 16}px*</option>`).join('');
  const warning = countMessage(step.layout, state.count, {...state,spacing:step.spacing}, step.config);
  $('#selection-warning').textContent = warning;
  $('#selection-warning').hidden = !warning;
  const family = arrangement(step.layout).family;
  $('#family').value = catalogueKind(arrangement(step.layout));
  $('#spacing').innerHTML = `${step.rem?`<option value="inherit">Use previous · ${steps[steps.indexOf(step)-1].spacing}</option>`:''}${['full','neat','thin','wide','ruled'].map(name=>`<option value="${name}">${name[0].toUpperCase()+name.slice(1)} · ${{full:64,neat:60,thin:59,wide:58,ruled:56}[name]} bits</option>`).join('')}`;
  $('#rule-help').hidden=step.spacing!=='ruled';
  $('#spacing').value = step.spacingInherited ? 'inherit' : step.spacing;
  $('#vertical-spacing').innerHTML = `${step.rem ? `<option value="inherit">Use previous · ${verticalLabel(steps[steps.indexOf(step)-1].verticalSpacing)}</option>` : '<option value="default">Layout default</option>'}<option value="0">Zero</option><option value="1">1 bit</option><option value="2">2 bits</option>`;
  $('#vertical-spacing').value = step.verticalSpacingInherited ? 'inherit' : step.verticalSpacing === null ? 'default' : String(step.verticalSpacing);
  $('#item-padding').innerHTML = `${step.rem ? `<option value="inherit">Use previous · ${paddingLabel(steps[steps.indexOf(step)-1].padding)}</option>` : ''}<option value="0">None</option><option value="1">1 bit</option><option value="2">2 bits</option>`;
  $('#item-padding').value = step.paddingInherited ? 'inherit' : String(step.padding);
  $('#spacing-summary').textContent = `${step.spacing[0].toUpperCase()+step.spacing.slice(1)} · vertical ${verticalLabel(step.verticalSpacing).replace('Layout default','default').toLowerCase()} · padding ${paddingLabel(step.padding).toLowerCase()}`;
  $('#layout-choices').innerHTML = renderCatalogue(step,state.count);
  renderRefinements(step);
  const nextContext = `${step.id}:${family}`;
  if (editorContext === nextContext) {
    $('#composition-panel').scrollTop = panelScroll;
    $('#layout-choices').scrollTop = choicesScroll;
    $('#exact-options').scrollTop = exactScroll;
  }
  editorContext = nextContext;
  $('#markup').textContent = candidateMarkup(state);
  cssExport.update();
  delivery.update();
  for (const key of ['ruler', 'source', 'inspector']) $(`#${key}`).checked = state[key];
  previewActive = null;
  updatePreviewSummary();
  renderBoundaries();
  if (focusKey) {
    const restored = document.getElementById(focusKey) ?? [...document.querySelectorAll('[data-focus]')].find(node => node.dataset.focus === focusKey);
    if (restored && !restored.disabled && !restored.closest('[hidden]')) restored.focus({ preventScroll: true });
  }
  send();
}

function resize(width) {
  state.width = Math.min(3200, Math.max(280, Math.round(width)));
  previewActive = null;
  state.selected = activeStep(state).id;
  render();
}
function chooseStep(id) {
  selectStep(state, id);
  render();
}
$('#width').addEventListener('input', event => resize(Number(event.target.value)));
$('#width-number').addEventListener('change', event => {
  const value = event.target.valueAsNumber;
  if (Number.isFinite(value)) resize(value);
  else event.target.value = state.width;
});
$('#vertical-spacing').addEventListener('change', event => {
  editVerticalSpacing(state,['inherit','default'].includes(event.target.value)?null:Number(event.target.value));render();
  announce('Vertical spacing updated. Layout, gutters, and item padding retained.');
});
$('#item-padding').addEventListener('change', event => {
  editPadding(state,event.target.value==='inherit'?null:Number(event.target.value));render();
  announce('Item padding updated for this transition. Later inherited choices follow it; layout and gutters retained.');
});
$('#fit').addEventListener('click', () => resize($('#preview-scroll').clientWidth));
for (const key of ['ruler', 'source', 'inspector']) $(`#${key}`).addEventListener('change', event => { state[key] = event.target.checked; send(); });
$('#steps').addEventListener('click', event => {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  chooseStep(button.dataset.step);
});
function pickLayout(id){
  if(!id)return;
  const previous=arrangement(resolvedSteps(state).find(s=>s.id===selected().id).layout),next=arrangement(id);
  editSelection(state,{layout:id});render();
  announce(`${next.weights?next.weights.join(' to '):next.id} selected.${previous.family!==next.family?' Placement refinements reset for this family.':' Placement refinements retained.'} Preview width unchanged.`);
}
$('#layout-choices').addEventListener('change',event=>{
  const p=arrangement(resolvedSteps(state).find(s=>s.id===selected().id).layout),{name,value,id}=event.target;
  if(name==='region-count')pickLayout(equalLayout(value).id);
  else if(name==='width-relationship'){
    const candidates=familyLayouts(p.family).filter(q=>relationship(q)===value);
    pickLayout(chooseNearby(p,candidates.filter(q=>widthOrder(q)===widthOrder(p)).length?candidates.filter(q=>widthOrder(q)===widthOrder(p)):candidates)?.id);
  }else if(name==='width-order')pickLayout(chooseNearby(p,familyLayouts(p.family).filter(q=>relationship(q)===relationship(p)&&widthOrder(q)===value))?.id);
  else if(name==='full-width-items'){
    editSelection(state,{config:{arrangement:value}});render();
    announce('Full-width items updated. Column proportions, spacing, and traversal retained.');
  }
  else if(name==='simple-layout')pickLayout(value);
  else if(id==='proportion')pickLayout(proportionChoices(p)[Number(value)]?.id);
});
$('#layout-choices').addEventListener('click',event=>{
  const button=event.target.closest('[data-proportion-step]');if(!button)return;
  const p=arrangement(resolvedSteps(state).find(s=>s.id===selected().id).layout),choices=proportionChoices(p),index=choices.findIndex(q=>q.id===p.id);
  pickLayout(choices[index+Number(button.dataset.proportionStep)]?.id);
});
$('#family').addEventListener('change',event=>{
  const kind=event.target.value;
  pickLayout(kind==='regions'?equalLayout('two').id:kind==='mosaic'?`mosaic-${Math.max(6,Math.min(13,state.count))}`:kind==='peers'?'peers-2':'stack');
});
$('#spacing').addEventListener('change', event => { editSpacing(state,event.target.value==='inherit'?null:event.target.value);render();announce('Gutters updated for this transition; later inherited gutter choices follow it.'); });
const refinementLabels={allocation:'Allocation',fewer:'Fewer items on',traversal:'Traversal'};
function renderRefinements(step) {
  const family=arrangement(step.layout).family, config=step.config;
  const options={};
  if(['two','four'].includes(family))options.allocation=['closest','stronger'];
  if(family==='two')options.fewer=['left','right'];
  if(family==='two')options.traversal=['left-to-right','right-to-left'];
  if(family==='three')options.traversal=state.count===3?['left-to-right','right-to-left','center-first']:['left-to-right','center-first'];
  if(family==='four' && new Set(arrangement(step.layout).weights).size>1)options.traversal=['left-to-right','widest-first'];
  $('#refinements').hidden=!['two','three','four'].includes(family);
  $('#placement-note').textContent = family==='three' && config.traversal==='right-to-left' && state.count!==3 ? 'Right-to-left is retained; left-to-right applies unless there are exactly three items.' : family==='four' && config.traversal==='widest-first' && new Set(arrangement(step.layout).weights).size===1 ? 'Widest-first is retained; equal widths use left-to-right traversal.' : '';
  if(options.traversal && !options.traversal.includes(config.traversal)) options.traversal.push(config.traversal);
  $('#refinement-controls').innerHTML=Object.entries(options).map(([key,values])=>`<label>${refinementLabels[key]}<select data-config="${key}" id="config-${key}">${values.map(v=>`<option value="${v}" ${config[key]===v?'selected':''}>${v.replaceAll('-',' ')}</option>`).join('')}</select></label>`).join('');
  const keys=family==='three'?['left','center','right']:family==='four'?['left','center-left','center-right','right']:family==='two'&&config.arrangement!=='across'?['left','right']:[];
  $('#exact-controls').hidden=!keys.length;
  const valid=exactOptions(step.layout,state.count,config), requested=exactTuple(step.layout,config);
  const hasRequest=Object.values(config.exact).some(Boolean), accepted=valid.some(option=>option.tuple.join('-')===requested.join('-'));
  const above=family==='two' && config.arrangement!=='across' && config.arrangement!=='last-below';
  const below=family==='two' && config.arrangement!=='across' && config.arrangement!=='first-above';
  const automaticPositions=placementsFor(step.layout,state.count,{...config,exact:{}}).slice(above?1:0,below?-1:undefined);
  const starts=[...new Set(automaticPositions.map(p=>p.start))].sort((a,b)=>a-b);
  const automaticCounts=starts.length===keys.length?starts.map(start=>automaticPositions.filter(p=>p.start===start).length).join(' + '):'';
  const preview=exact=>diagram(step.layout,state.count,'',{...config,exact,spacing:step.spacing,measured:needsRulerMeasurement(state)});
  $('#exact-options').innerHTML=`<label class="layout-choice"><input type="radio" name="exact-choice" value="automatic" data-focus="exact-automatic" ${hasRequest?'':'checked'}><span>${preview({})}</span><strong>Automatic${automaticCounts?` · ${automaticCounts}`:''}</strong></label>`+
    (hasRequest&&!accepted?`<label class="layout-choice retained-request"><input type="radio" name="exact-choice" checked disabled><span></span><span><strong>${requested.join(' + ')} · Unavailable</strong><small>Source count or spanning selection changed. Automatic allocation is active. Choose Automatic to clear this request, or select a valid allocation below.</small></span></label>`:'')+
    valid.map(option=>`<label class="layout-choice"><input type="radio" name="exact-choice" value="${option.tuple.join('-')}" data-focus="exact-${option.tuple.join('-')}" ${hasRequest&&option.tuple.join('-')===requested.join('-')?'checked':''}><span>${preview(option.exact)}</span><span><strong>${option.tuple.join(' + ')}</strong><small>${keys.map((key,i)=>`${key.replaceAll('-',' ')}: ${option.tuple[i]}`).join(' · ')}</small></span></label>`).join('');
  $('#exact-status').textContent=exactStatus(step.layout,state.count,config);
  $('#exact-note').textContent=family==='two'?'Choose supporting-region counts from left to right; spanning endpoints are excluded. Only valid allocations for the current source count are shown.':'Choose region counts from left to right. Only valid allocations for the current source count are shown.';

}
$('#refinements').addEventListener('change', event=>{
  const key=event.target.dataset.config;
  const step=resolvedSteps(state).find(s=>s.id===state.selected);
  if(key)editSelection(state,{config:{[key]:event.target.value}});
  else if(event.target.name==='exact-choice') {
    const option=exactOptions(step.layout,state.count,step.config).find(o=>o.tuple.join('-')===event.target.value);
    if(event.target.value!=='automatic'&&!option)return;
    editSelection(state,{config:{exact:option?.exact??{}}});
  }
  else return;
  render(); announce('Placement updated for this transition; inherited later transitions follow it.');
});
function changeTransition(id,rem,fromTimeline=false) {
  if(!moveTransition(state,id,rem))return;
  previewActive=null;
  render();
  if(fromTimeline)document.getElementById(`timeline-actions-${id}`)?.focus({preventScroll:true});
  announce(`Transition moved to ${rem}rem. Layout, gutters, vertical spacing, padding, and placement selections kept.`);
}
$('#threshold').addEventListener('change', event => changeTransition(state.selected,Number(event.target.value)));
$('#timeline').addEventListener('change',event=>{
  const select=event.target.closest('[data-timeline-threshold]');
  if(select)changeTransition(select.dataset.timelineThreshold,Number(select.value),true);
});
$('#transition-options').addEventListener('click', event => {
  const button = event.target.closest('[data-add-rem]');
  if (!button || button.disabled) return;
  const existing = state.steps.find(step => step.rem === Number(button.dataset.addRem));
  if (existing) { removeTransition(existing, true); return; }
  const step = addTransition(state, Number(button.dataset.addRem));
  if (!step) return;
  $('#add-transition-menu').open = false;
  if ($('#composition-panel').hidden) $('#panel-toggle').click();
  chooseStep(step.id);
  $('#threshold').focus();
  announce(`Transition added at ${step.rem}rem. Inherits ${arrangement(activeStep(state).layout).label}; markup unchanged.`);
});
$('#inherit-layout').addEventListener('click', () => {
  if (!selected().rem) return;
  selected().layout = null; selected().config = null;
  render();
  $(`[data-step="${state.selected}"]`).focus();
  announce('Previous layout and placement inherited. Gutter, vertical-spacing, and padding selections kept.');
});
function removeTransition(step, fromPicker = false, fromTimeline = false) {
  if (!step.rem) return;
  if (!window.confirm(`Remove the ${step.rem}rem transition?\n\nThis removes its viewport-specific layout section and any breakpoint class it adds, not source content. The preceding layout will carry forward until another explicit layout selection. Other explicit transitions are kept.`)) return;
  const index = state.steps.indexOf(step);
  state.steps.splice(index, 1); state.selected = activeStep(state).id;
  $('#add-transition-menu').open = false;
  render();
  if (fromPicker) $('#add-transition-menu summary').focus({ preventScroll: true });
  else if(fromTimeline)document.querySelector(`[data-preview="${state.selected}"]`)?.focus({preventScroll:true});
  else document.querySelector(`[data-step="${state.selected}"]`).focus();
  announce(`${step.rem}rem transition and its viewport-specific layout section removed. Source items kept. The preceding layout carries forward until another explicit selection.`);
}
$('#remove-transition').addEventListener('click', () => removeTransition(selected()));
for (const [selector, delta] of [['#remove-item', -1], ['#add-item', 1]]) $(selector).addEventListener('click', () => {
  state.count = Math.min(14, Math.max(1, state.count + delta)); render();
  announce(`${state.count} items. Layout selections retained.${resolvedSteps(state).some(s => !supports(s.layout, state.count)) ? ' Incompatible selections preview a source-order stack.' : ''}`);
});
$('#timeline').addEventListener('click', event => {
  const remove=event.target.closest('[data-remove-transition]');
  if(remove){const step=state.steps.find(s=>s.id===remove.dataset.removeTransition);if(step)removeTransition(step,false,true);return;}
  const button = event.target.closest('[data-preview]');
  if (!button) return;
  chooseStep(button.dataset.preview);
});

// Native popovers provide Escape and outside-click dismissal in the top layer,
// so the timeline's horizontal scrolling cannot clip the action panel.
function positionTimelineMenu(menu) {
  const trigger=document.getElementById(`timeline-actions-${menu.dataset.timelineMenu}`);
  if(!trigger)return;
  const rect=trigger.getBoundingClientRect(),width=menu.offsetWidth||Math.min(288,innerWidth-32),height=menu.offsetHeight||190;
  const left=Math.max(16,Math.min(rect.right-width,innerWidth-width-16));
  const top=rect.bottom+6+height<=innerHeight-16?rect.bottom+6:Math.max(16,rect.top-height-6);
  menu.style.left=`${left}px`;menu.style.top=`${top}px`;
}
$('#timeline').addEventListener('beforetoggle',event=>{
  if(event.target.matches('.timeline-menu')&&event.newState==='open')positionTimelineMenu(event.target);
},true);
$('#timeline').addEventListener('toggle',event=>{
  if(!event.target.matches('.timeline-menu'))return;
  const open=event.newState==='open';
  document.getElementById(`timeline-actions-${event.target.dataset.timelineMenu}`)?.setAttribute('aria-expanded',String(open));
  if(open)positionTimelineMenu(event.target);
},true);
function repositionTimelineMenus(){document.querySelectorAll('.timeline-menu:popover-open').forEach(positionTimelineMenu);}
window.addEventListener('resize',repositionTimelineMenus);
document.addEventListener('scroll',repositionTimelineMenus,true);

// Boundary controls belong to the preview, not the authored sequence.
function renderBoundaries() {
  let element = $('#boundary-controls');
  if (!element) {
    element = document.createElement('div'); element.id = 'boundary-controls'; element.className = 'boundary-controls';
    element.setAttribute('role', 'group'); element.setAttribute('aria-label', 'Test viewport transitions');
    $('.sequence-strip').append(element);
  }
  const transitions = state.steps.filter(step => step.rem);
  element.hidden = !transitions.length;
  element.innerHTML = transitions.map(step => `<span><strong>${step.rem}rem</strong><button type="button" data-width="${step.rem * 16 - 1}" aria-label="Preview just below ${step.rem}rem">−1px</button><button type="button" data-width="${step.rem * 16 + 1}" aria-label="Preview just above ${step.rem}rem">+1px</button></span>`).join('') + '<small>*Pixel references assume 16px/rem.</small>';
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-width]');
  if (button) resize(Number(button.dataset.width));
});

let panelBeforeHide = true;
function focusWorkbenchControl(control) {
  // A scrolling header may be off screen when focus returns from the panel.
  control.focus({preventScroll:getComputedStyle($('.rail')).position === 'sticky'});
}
function setPanel(open, moveFocus = false) {
  const panel = $('#composition-panel');
  if (!open && (moveFocus || panel.contains(document.activeElement))) focusWorkbenchControl($('#panel-toggle'));
  panel.hidden = !open;
  document.body.classList.toggle('panel-hidden', !open);
  $('#panel-toggle').textContent = open ? 'Hide layout controls' : 'Show layout controls';
  $('#panel-toggle').setAttribute('aria-expanded', String(open));
  if (open && moveFocus) focusWorkbenchControl($('#composition-heading'));
  fitPreviewDisplay();
}
function setWorkbench(open) {
  if (!open) {
    panelBeforeHide = !$('#composition-panel').hidden;
    document.querySelectorAll('.timeline-menu:popover-open').forEach(menu => menu.hidePopover());
    document.querySelectorAll('.overlay-menu[open]').forEach(menu => {menu.open=false;});
  }
  $('.rail').hidden = !open;
  $('#workbench-show').hidden = open;
  document.body.classList.toggle('workbench-hidden', !open);
  setPanel(open && panelBeforeHide);
  document.documentElement.style.setProperty('--rail-height', open ? `${$('.rail').getBoundingClientRect().height}px` : '0px');
  focusWorkbenchControl(open ? $('#workbench-hide') : $('#workbench-show'));
  fitPreviewDisplay();
}
$('#panel-toggle').addEventListener('click', () => setPanel($('#composition-panel').hidden, true));
$('#panel-close').addEventListener('click', () => setPanel(false, true));
$('#workbench-hide').addEventListener('click', () => setWorkbench(false));
$('#workbench-show').addEventListener('click', () => setWorkbench(true));
document.addEventListener('keydown', event => {
  if (event.altKey && event.shiftKey && event.code === 'KeyG' && !event.repeat) {
    event.preventDefault();setWorkbench($('.rail').hidden);return;
  }
  if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector(':popover-open')) return;
  const disclosure=[...document.querySelectorAll('.overlay-menu[open]')].find(menu=>menu.contains(document.activeElement));
  if (disclosure) {event.preventDefault();disclosure.open=false;disclosure.querySelector('summary').focus();return;}
  if (event.target.closest('input, select, textarea')) return;
  if ($('#composition-panel').contains(document.activeElement)) {event.preventDefault();setPanel(false);}
});
document.addEventListener('click', event => {
  document.querySelectorAll('.overlay-menu[open]').forEach(menu => {if(!menu.contains(event.target))menu.open=false;});
});
async function copy(text, success) {
  try { await navigator.clipboard.writeText(text); announce(success); }
  catch { announce('Clipboard unavailable. Select and copy the HTML markup, or copy the exploration URL from your address bar.'); }
}
$('#copy-markup').addEventListener('click', () => copy(candidateMarkup(state), 'HTML copied. Use the matching 0.5.2 stylesheet; padding utilities are included.'));
$('#copy-link').addEventListener('click', () => {
  const url = new URL(location.href); url.searchParams.set('state', JSON.stringify(state));
  copy(url.href, 'Exploration link copied.');
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'gp-workbench-toggle') {setWorkbench($('.rail').hidden);return;}
  if (event.data?.type === 'gp-sequence-ready') { send(); return; }
  if (event.data?.type !== 'gp-sequence-preview' || event.data.revision !== revision) return;
  frame.dataset.ready = 'true';
  browserEnhanced = event.data.enhanced !== false;
  browserArithmetic = event.data.absoluteValue !== false;
  if (Number.isFinite(event.data.height)) {
    frame.height = Math.min(30000, Math.max(100, event.data.height));
    frame.style.height = `${frame.height}px`;
  }
  fitPreviewDisplay();
  previewActive = event.data.active;
  if (state.steps.some(step => step.id === previewActive) && state.selected !== previewActive) {
    state.selected = previewActive;
    render();
    return;
  }
  updatePreviewSummary();
});
frame.addEventListener('load', send);
// ResizeObserver delivers after layout. Defer geometry writes to the next
// frame so resizing the preview cannot invalidate the observer delivery itself.
let resizeFrame = 0;
const previewResizeObserver = new ResizeObserver(() => {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    const height = `${$('.rail').getBoundingClientRect().height}px`;
    if (document.documentElement.style.getPropertyValue('--rail-height') !== height) {
      document.documentElement.style.setProperty('--rail-height', height);
    }
    fitPreviewDisplay();
  });
});
previewResizeObserver.observe($('.rail'));
previewResizeObserver.observe($('#preview-scroll'));
render(); renderBoundaries();
