import {verticalSpacingClass} from '../assets/graph-paper/src/core/vertical-spacing.mjs';
import {paddingClass} from '../assets/graph-paper/src/core/padding.mjs';
import { layouts, hinges, spacingModes, controlPolicies, exactCountRegions } from '../assets/graph-paper/src/core/catalogue.mjs';
import { placements, pairExactCountsEligible, exactCountsEligible, fourExactCountsEligible } from '../assets/graph-paper/src/core/geometry.mjs';
import { sourceItems } from './content.mjs';

// The oracle is for thumbnails only; the iframe renders css/main.css.
export const thresholds = hinges.map(([rem, prefix]) => ({ rem, prefix }));
const title = p => p.family === 'stack' ? 'Stack' : p.family === 'peers' ? `${p.columns} equal peers` : p.family === 'mosaic' ? `Mosaic · ${p.count} items` : `${p.family[0].toUpperCase() + p.family.slice(1)} · ${p.weights.join(':')}`;
export const arrangements = layouts.map(p => ({ ...p, label: title(p), sample: p.count ?? Math.max(6, p.columns ?? 1) }));
export const arrangement = id => arrangements.find(p => p.id === id);
export const retiredSelections = value => Array.isArray(value?.steps) ? value.steps.filter(s => s?.layout && !arrangement(s.layout)).map(s => s.layout) : [];
export const defaultConfig = () => ({ allocation: 'closest', fewer: 'left', traversal: 'left-to-right', arrangement: 'across', exact: {} });
const choices = Object.fromEntries(Object.entries(controlPolicies).map(([family,options])=>[family,Object.keys(options)]));
export const exactKeys = exactCountRegions;
export function normalizeConfig(value) {
  const config = defaultConfig();
  for (const key of Object.keys(choices)) if (choices[key].includes(value?.[key])) config[key] = value[key];
  for (const key of exactKeys) if (Number.isInteger(value?.exact?.[key]) && value.exact[key] >= 0 && value.exact[key] <= 14) config.exact[key] = value.exact[key];
  return config;
}
export const defaultState = () => ({ count: 6, width: 375, spacing: 'neat', steps: [{ id: 'base', rem: 0, layout: 'stack', spacing: null, verticalSpacing: null, padding: 0, config: defaultConfig() }], selected: 'base', ruler: false, source: true, inspector: false });
export function normalizeState(value) {
  const initial = defaultState();
  if (!value || typeof value !== 'object') return initial;
  const legacyPadding = value.itemSpacing === true ? value.paddingBits === 2 ? 2 : 1 : 0;
  const seen = new Set();
  const steps = Array.isArray(value.steps) ? value.steps.filter(s => {
    if (!s || !Number.isInteger(s.rem) || (s.rem !== 0 && !thresholds.some(t => t.rem === s.rem)) || seen.has(s.rem)) return false;
    seen.add(s.rem); return true;
  }).sort((a,b) => a.rem-b.rem).map((s,i) => ({ id:s.rem ? `t${i+1}` : 'base', rem:s.rem, spacing:Object.hasOwn(spacingModes,s.spacing)?s.spacing:null, verticalSpacing:[0,1,2].includes(s.verticalSpacing)?s.verticalSpacing:null, padding:[0,1,2].includes(s.padding)?s.padding:s.rem?null:legacyPadding, layout:s.layout === null && s.rem ? null : arrangement(s.layout)?.id ?? 'stack', config:s.layout === null && s.rem ? null : normalizeConfig(s.config) })) : [{...initial.steps[0],padding:legacyPadding}];
  if (!steps.some(s => !s.rem)) steps.unshift({...initial.steps[0],padding:legacyPadding});
  const state = { ...initial, count:Number.isInteger(value.count) && value.count>=1 && value.count<=14 ? value.count : 6, width:Number.isInteger(value.width) && value.width>=280 && value.width<=3200 ? value.width : 375, spacing:Object.hasOwn(spacingModes,value.spacing) ? value.spacing : 'neat', steps, ruler:value.ruler === true, source:value.source !== false, inspector:value.inspector === true };
  state.selected=activeStep(state).id;
  return state;
}
export function resolvedSteps(state) {
  let layout='stack', config=defaultConfig(), from='base', spacing=state.spacing??'neat', verticalSpacing=null, padding=state.itemSpacing === true ? state.paddingBits === 2 ? 2 : 1 : 0;
  return [...state.steps].sort((a,b)=>a.rem-b.rem).map(s => {
    const inherited=s.layout===null;
    if (!inherited) { layout=s.layout; config=normalizeConfig(s.config); from=s.id; }
    if(Object.hasOwn(spacingModes,s.spacing))spacing=s.spacing;
    if([0,1,2].includes(s.padding))padding=s.padding;
    if([0,1,2].includes(s.verticalSpacing))verticalSpacing=s.verticalSpacing;
    return {...s,layout,spacing,verticalSpacing,verticalSpacingInherited:s.rem>0&&![0,1,2].includes(s.verticalSpacing),padding,paddingInherited:s.rem>0&&![0,1,2].includes(s.padding),spacingInherited:s.rem>0&&!Object.hasOwn(spacingModes,s.spacing),config:structuredClone(config),inherited,inheritedFrom:from};
  });
}
// Column rules require capture across the authored sequence. Mosaic gutters
// and padding resolve from assigned tracks without measuring the ruler.
export const needsColumnRules = state => resolvedSteps(state).some(step=>step.spacing==='ruled'&&!['stack','mosaic'].includes(arrangement(step.layout).family));
export const needsRulerMeasurement = state => needsColumnRules(state);
export const rulerClasses = state => ['gp_ruler',...(needsRulerMeasurement(state)?['gp_ruler--measure']:[])];
export function editSelection(state, patch) {
  const step=state.steps.find(s=>s.id===state.selected), current=resolvedSteps(state).find(s=>s.id===step.id);
  step.config=patch.layout && arrangement(patch.layout).family!==arrangement(current.layout).family ? defaultConfig() : current.config;
  step.layout=patch.layout ?? current.layout;
  if(patch.config) step.config=normalizeConfig({...step.config,...patch.config});
}
export function addTransition(state,rem) {
  if(!thresholds.some(t=>t.rem===rem)||state.steps.some(s=>s.rem===rem))return null;
  const step={id:`t${Math.max(0,...state.steps.map(s=>Number(s.id.slice(1))||0))+1}`,rem,layout:null,spacing:null,verticalSpacing:null,padding:null,config:null};
  state.steps.push(step);state.steps.sort((a,b)=>a.rem-b.rem);return step;
}
export function editSpacing(state,value) {
  const step=state.steps.find(s=>s.id===state.selected);
  if(!step || !(value===null || Object.hasOwn(spacingModes,value)))return false;
  step.spacing=value;return true;
}
export function editPadding(state,value) {
  const step=state.steps.find(s=>s.id===state.selected);
  if(!step || !(value===null || [0,1,2].includes(value)))return false;
  step.padding=value;return true;
}
export function editVerticalSpacing(state,value) {
  const step=state.steps.find(s=>s.id===state.selected);
  if(!step || !(value===null || [0,1,2].includes(value)))return false;
  step.verticalSpacing=value;return true;
}
export function moveTransition(state,id,rem) {
  const step=state.steps.find(s=>s.id===id);
  if(!step?.rem || !thresholds.some(t=>t.rem===rem) || state.steps.some(s=>s.id!==id&&s.rem===rem))return false;
  step.rem=rem;state.steps.sort((a,b)=>a.rem-b.rem);selectStep(state,id);return true;
}
export const activeStep = (state,width=state.width,remPixels=16) => resolvedSteps(state).filter(s=>s.rem*remPixels<=width).at(-1);
export function selectStep(state,id) { const step=state.steps.find(s=>s.id===id);if(!step)return;if(activeStep(state).id!==id)state.width=step.rem?step.rem*16+1:375;state.selected=id; }
export function supports(id,count) { const p=arrangement(id);return !!p && (p.family==='mosaic'?p.count===count:count>=({two:2,three:3,four:4}[p.family]??1)); }
export function countMessage(id,count,state={spacing:'neat'},config=defaultConfig()) {
  const p=arrangement(id);if(!p)return 'Unknown layout.';
  if(!supports(id,count))return `Needs ${p.count??({two:2,three:3,four:4}[p.family])} items${p.family==='mosaic'?' exactly':' or more'}; ${count} supplied. Source-order stack; selection retained.`;
  if(p.family==='mosaic'&&!['neat','thin'].includes(state.spacing))return 'Mosaics use Neat or Thin gutters. Source-order stack; selection retained.';
  if(p.family==='two'&&count-Number(config.arrangement!=='across'&&config.arrangement!=='last-below')-Number(config.arrangement!=='across'&&config.arrangement!=='first-above')<2)return 'Full-width items need at least two supporting items. Source-order stack; selection retained.';
  return '';
}
export function sequenceClasses(state) {
  let previous='stack';const tokens=[];
  for(const s of resolvedSteps(state)) { if(s.inherited||s.layout===previous)continue;previous=s.layout;tokens.push(s.rem?`gp_${thresholds.find(t=>t.rem===s.rem).prefix}--${s.layout}`:`gp_layout--${s.layout}`); }
  if(!tokens.length)tokens.push('gp_layout--stack');
  let previousConfig=defaultConfig();
  for(const step of resolvedSteps(state)) {
    for(const key of Object.keys(controlPolicies))if(step.config[key]!==previousConfig[key])tokens.push(`gp_${step.rem?thresholds.find(t=>t.rem===step.rem).prefix+'-':''}${key}--${step.config[key]}`);
    previousConfig=step.config;
  }
  let previousSpacing;
  for(const step of resolvedSteps(state)) {
    if(step.spacing!==previousSpacing)tokens.push(`gp_${step.rem?thresholds.find(t=>t.rem===step.rem).prefix+'-':''}spacing--${step.spacing}`);
    previousSpacing=step.spacing;
  }
  let previousVertical=null;
  for(const step of resolvedSteps(state)) {
    if(step.verticalSpacing!==previousVertical)tokens.push(verticalSpacingClass(step.verticalSpacing,step.rem?thresholds.find(t=>t.rem===step.rem).prefix:''));
    previousVertical=step.verticalSpacing;
  }
  return tokens;
}
export function candidateInlineStyle(state) {
  let previous={};const declarations=[];
  for(const step of resolvedSteps(state)) {
    for(const key of exactKeys) {
      const value=step.config.exact[key]??0;
      if(value!==(previous[key]??0))declarations.push(`--gp-${step.rem?thresholds.find(t=>t.rem===step.rem).prefix+'-':''}exact-count-${key}: ${value};`);
    }
    previous=step.config.exact;
  }
  return declarations.join(' ');
}
export const sourceMarkup = (count,rules=false) => sourceItems.slice(0,count).map(item=>rules?item.replace('<article class="','<article class="gp_rule--end '):item).join('\n');
export function itemSpacingClasses(state) {
  let previous=0;const tokens=[];
  for(const step of resolvedSteps(state)){
    if(step.padding!==previous)tokens.push(paddingClass(step.padding,step.rem?thresholds.find(t=>t.rem===step.rem).prefix:''));
    previous=step.padding;
  }
  return tokens;
}
export function candidateMarkup(state) {
  const inline=candidateInlineStyle(state);
  const itemClasses=[...(needsColumnRules(state)?['gp_rule--end']:[]),...itemSpacingClasses(state)];
  return `<div class="${rulerClasses(state).join(' ')}">\n  <section class="${sequenceClasses(state).join(' ')}"${inline?`\n    style="${inline}"`:''}>\n${Array.from({length:state.count},(_,i)=>`    <article${itemClasses.length?` class="${itemClasses.join(' ')}"`:''}><!-- Item ${i+1} --></article>`).join('\n')}\n  </section>\n</div>`;
}
export function exactRegionKeys(id) {
  return arrangement(id).family==='four'?['left','center-left','center-right','right']:arrangement(id).family==='three'?['left','center','right']:['left','right'];
}
export function exactOptions(id,count,config) {
  const family=arrangement(id).family, keys=exactRegionKeys(id);
  if(!['two','three','four'].includes(family)||family==='two'&&config.arrangement==='across')return [];
  const n=count-(family==='two'?Number(config.arrangement!=='last-below')+Number(config.arrangement!=='first-above'):0);
  const eligible=family==='four'?fourExactCountsEligible:family==='three'?exactCountsEligible:pairExactCountsEligible;
  const result=[];
  function visit(prefix,remaining) {
    if(prefix.length===keys.length-1) {
      const tuple=[...prefix,remaining];
      if(eligible(n,tuple))result.push({tuple,exact:Object.fromEntries(keys.map((key,i)=>[key,tuple[i]]))});
      return;
    }
    for(let value=1;value<=remaining-(keys.length-prefix.length-1);value++)visit([...prefix,value],remaining-value);
  }
  if(n>=keys.length)visit([],n);
  return result;
}
export function exactTuple(id, config) {
  const family=arrangement(id).family;
  const keys=family==='four'?['left','center-left','center-right','right']:family==='three'?['left','center','right']:['left','right'];
  return keys.map(key=>config.exact?.[key]??0);
}
export function exactStatus(id,count,config) {
  const family=arrangement(id).family;
  if(!Object.values(config.exact).some(Boolean))return 'Automatic allocation.';
  const tuple=exactTuple(id,config), excluded=Number(config.arrangement!=='across'&&config.arrangement!=='last-below')+Number(config.arrangement!=='across'&&config.arrangement!=='first-above');
  const accepted=family==='four'?fourExactCountsEligible(count,tuple):family==='three'?exactCountsEligible(count,tuple):family==='two'&&config.arrangement!=='across'&&pairExactCountsEligible(count-excluded,tuple);
  return accepted ? `Exact counts applied: ${tuple.join(' + ')}.` : 'Exact request does not fit this count or allocation contract. Automatic allocation applies; request retained.';
}
export function placementsFor(id,count,settings={}) { const args={id,count,spacing:'neat',...settings}; if(args.exact&&!Array.isArray(args.exact))args.exact=exactTuple(id,args);return placements(args); }
export function diagram(id,count,suffix='',settings={}) {
  const option=arrangement(id),actual=settings.actualCount||supports(id,count)?count:option.count??option.sample;
  const positions=placementsFor(id,actual,settings), rows=Math.max(...positions.map(p=>p.row+p.rowspan))-1;
  return `<svg viewBox="0 0 128 78" aria-hidden="true" focusable="false">${positions.map((p,i)=>{const x=p.start*2,y=3+(p.row-1)/rows*72,w=p.span*2,h=Math.max(1,p.rowspan/rows*72-2);return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/><text x="${x+w/2}" y="${y+h/2+3}">${i+1}${suffix}</text>`;}).join('')}</svg>`;
}
