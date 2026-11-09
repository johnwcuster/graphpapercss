import {equal,sum} from './expressions.mjs';

export const layoutCode=plan=>equal('var(--gp-layout)',plan.code);

// Factor equal coefficients and omit zero terms without adding CSS properties.
export function groupedLayoutTerms(plans,coefficient,code=layoutCode){
 const buckets=new Map();
 for(const plan of plans){
  const value=coefficient(plan);if(!value)continue;
  if(!buckets.has(value))buckets.set(value,[]);
  buckets.get(value).push(code(plan));
 }
 return sum([...buckets].map(([value,terms])=>value===1?`(${sum(terms)})`:`${value} * (${sum(terms)})`));
}

// --gp-layout is registered as an integer. A dense family needs only bounds;
// sparse/empty catalogues retain exact membership, including unknown-ID gaps.
// Do not renumber public tokens or widen membership to enable this shortcut.
export function layoutMembership(plans){
 const codes=plans.map(p=>p.code).sort((a,b)=>a-b);
 if(codes.length&&codes.every((n,i)=>Number.isSafeInteger(n)&&n===codes[0]+i)){
  return `clamp(0,min(calc(var(--gp-layout) - ${codes[0]-1}),calc(${codes.at(-1)+1} - var(--gp-layout))),1)`;
 }
 return `calc(${sum(plans.map(layoutCode))})`;
}
