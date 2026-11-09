import {spacingModes,four as plans} from './catalogue.mjs';
export {plans};
export const defaultPlan='graded-6-5-4-3';
export function availableTraversals(id) {
  const plan=plans.find(p=>p.id===id);if(!plan)throw Error('Unknown four-region proportion');
  return plan.equal?['left-to-right']:['left-to-right','widest-first'];
}
export function normalizeTraversal(id,traversal) {
  if(!['left-to-right','widest-first'].includes(traversal))throw Error('Unknown four-region traversal');
  return availableTraversals(id).includes(traversal)?traversal:'left-to-right';
}
export function effectiveWeights(plan,spacing='neat') {
  return spacing==='wide'&&plan.wideWeights?plan.wideWeights:plan.weights;
}
export function positions(id,options={}) {
  const plan=plans.find(p=>p.id===id);if(!plan)throw Error('Invalid four-region geometry');
  return regionPositions(effectiveWeights(plan,options.spacing),{...options,traversal:normalizeTraversal(id,options.traversal??'widest-first')});
}
export function regionPositions(weights,{tracks=64,spacing='neat',stacked=false,traversal='widest-first'}={}) {
  const settings=spacingModes[spacing];
  if(!Array.isArray(weights)||weights.length!==4||!weights.every(n=>Number.isFinite(n)&&n>0)||!settings||!Number.isInteger(tracks)||tracks<1) throw Error('Invalid four-region geometry');
  if(!['left-to-right','widest-first'].includes(traversal)) throw Error('Unknown four-region traversal');
  const inset=Math.min(settings[0],tracks-1),tail=Math.min(settings[1],tracks-inset-1),usable=tracks-inset-tail;
  if(stacked||usable<4) return Array.from({length:4},(_,i)=>({source:i+1,slot:0,start:inset,end:tracks-tail,span:usable,row:i+1}));
  const gap=Math.min(settings[2],Math.floor((usable-4)/3)),content=usable-3*gap;
  const total=weights.reduce((a,b)=>a+b,0),boundaries=[0];let cumulative=0;
  for(let i=1;i<4;i++) {
    cumulative+=weights[i-1];
    boundaries.push(Math.min(content-(4-i),Math.max(boundaries[i-1]+1,Math.round(content*cumulative/total))));
  }
  boundaries.push(content);
  // Source traversal is independent of physical widths.
  const ranked=weights.map((weight,slot)=>({weight,slot}));
  if(traversal==='widest-first') ranked.sort((a,b)=>b.weight-a.weight||a.slot-b.slot);
  return ranked.map(({slot},i)=>({source:i+1,slot,start:inset+boundaries[slot]+slot*gap,end:inset+boundaries[slot+1]+slot*gap,span:boundaries[slot+1]-boundaries[slot],row:1}));
}
export function physicalOrder(id) { return positions(id).sort((a,b)=>a.slot-b.slot).map(p=>p.source); }
