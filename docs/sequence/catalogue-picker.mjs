import {arrangement,diagram,thresholds} from './model.mjs';
import {catalogueKind,relationship,relationshipLabels,relationships,orderChoices,proportionChoices,widthOrder,orderDescription,silhouette} from './catalogue-navigation.mjs';
const radios=(name,options,selected)=>options.map(({value,label,shape,description})=>`<label class="catalogue-option"><input type="radio" name="${name}" value="${value}" data-focus="${name}-${value}" ${value===selected?'checked':''} ${description?`aria-label="Columns, left to right: ${description}"`:''}>${shape?`<span class="width-silhouette">${shape}</span>`:''}<span>${label}</span></label>`).join('');
export const fullWidthChoices=[
 {value:'across',label:'None'},
 {value:'first-above',label:'First above'},
 {value:'last-below',label:'Last below'},
 {value:'first-above-last-below',label:'First above + last below'},
];
function fullWidthDiagram(value){
 const above=value==='first-above'||value==='first-above-last-below',below=value==='last-below'||value==='first-above-last-below';
 const top=above?20:2,bottom=below?44:62;
 return `<svg viewBox="0 0 120 64" aria-hidden="true" focusable="false">${above?'<rect class="full-width-highlight" x="2" y="2" width="116" height="14" rx="1"/>':''}<rect x="2" y="${top}" width="56" height="${bottom-top}" rx="1"/><rect x="62" y="${top}" width="56" height="${bottom-top}" rx="1"/>${below?'<rect class="full-width-highlight" x="2" y="48" width="116" height="14" rx="1"/>':''}</svg>`;
}
export function renderCatalogue(step,count){
 const p=arrangement(step.layout),kind=catalogueKind(p),relation=relationship(p);
 let controls='';
 if(kind==='regions'){
  controls+=`<fieldset class="catalogue-stage"><legend>Number of columns</legend><div class="catalogue-numbers">${radios('region-count',[['two','2'],['three','3'],['four','4']].map(([value,label])=>({value,label})),p.family)}</div></fieldset>`;
  if(p.family==='two')controls+=`<fieldset class="catalogue-stage"><legend>Full-width items</legend><div class="catalogue-endpoints">${radios('full-width-items',fullWidthChoices.map(q=>({...q,shape:fullWidthDiagram(q.value)})),step.config.arrangement)}</div><p class="hint">First and last refer to source order.</p></fieldset>`;
  controls+=`<fieldset class="catalogue-stage"><legend>Column widths</legend><div class="catalogue-relationships">${radios('width-relationship',relationships(p.family).map(value=>({value,label:relationshipLabels[value]})),relation)}</div></fieldset>`;
  if(relation!=='equal'){
   const orders=orderChoices(p.family,relation);
   controls+=`<fieldset class="catalogue-stage"><legend>Column order <small>Left to right</small></legend><div class="catalogue-orders">${radios('width-order',orders.map(q=>({value:widthOrder(q),label:orderDescription(q),description:orderDescription(q),shape:silhouette(widthOrder(q).split('-').map(r=>Number(r)+2))})),widthOrder(p))}</div></fieldset>`;
   const proportions=proportionChoices(p),index=proportions.findIndex(q=>q.id===p.id);
   if(proportions.length>1)controls+=`<fieldset class="catalogue-stage"><legend class="proportion-heading">Proportion <span class="proportion-value" aria-hidden="true">${p.weights.join(' : ')}</span></legend><div class="proportion-adjuster"><button type="button" data-proportion-step="-1" data-focus="proportion-less" aria-label="Less width contrast" ${index===0?'disabled':''}>−</button><label class="sr-only" for="proportion">Width contrast</label><input id="proportion" type="range" min="0" max="${proportions.length-1}" step="1" value="${index}" aria-valuetext="${p.weights.join(' to ')}; choice ${index+1} of ${proportions.length}"><button type="button" data-proportion-step="1" data-focus="proportion-more" aria-label="More width contrast" ${index===proportions.length-1?'disabled':''}>+</button></div><div class="proportion-ends"><span>Closer widths</span><span>Greater contrast</span></div></fieldset>`;
  }
 }else if(kind==='peers')controls+=`<fieldset class="catalogue-stage"><legend>Number across</legend><div class="catalogue-numbers">${radios('simple-layout',[2,3,4,5,6].map(n=>({value:`peers-${n}`,label:String(n)})),p.id)}</div></fieldset>`;
 else if(kind==='mosaic')controls+=`<fieldset class="catalogue-stage"><legend>Exact number of items</legend><div class="catalogue-numbers">${radios('simple-layout',Array.from({length:8},(_,i)=>({value:`mosaic-${i+6}`,label:String(i+6)})),p.id)}</div></fieldset>`;
 const prefix=step.rem?`gp_${thresholds.find(t=>t.rem===step.rem).prefix}--`:'gp_layout--';
 const label=p.weights?p.weights.join(' : '):p.family==='stack'?'Full width':p.family==='peers'?`${p.columns} equal widths`:`Map for ${p.count} items`;
 return controls+`<figure class="selected-layout"><figcaption><strong>${label}</strong><code>${prefix}${p.id}</code></figcaption>${diagram(p.id,count,'',{spacing:step.spacing,...step.config,actualCount:true})}</figure>`;
}
