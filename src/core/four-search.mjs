import {layouts} from './catalogue.mjs';
import {candidates,candidateSlots,pools} from './four-allocation.mjs';
import {equal as eq,sum} from './expressions.mjs';

export const fourSearchPeriod=24;
export const fourSearchSmallLimit=16;
const orderKey=order=>order.reduce((key,group,slot)=>key+group*4**slot,0);
const gcd=(a,b)=>b?gcd(b,a%b):a;
// Integer offsets with spread <=4 have no shared prime factors other than
// 2/3 unless equal. Once q>=4 every count is >=2, making equal neighbors
// invalid. Eligibility repeats every six q values, hence 24 source items.
export function validateFourSearchPools(source){
 if(source.length!==4||!source.every((pool,r)=>pool.length&&pool.every(offsets=>
  offsets.length===4&&offsets.every(Number.isInteger)&&Math.min(...offsets)>=-2&&
  Math.max(...offsets)-Math.min(...offsets)<=4&&offsets.reduce((a,b)=>a+b,0)===r)))
  throw Error('Four allocation pool violates periodic-search proof assumptions');
}
validateFourSearchPools(pools);

export const fourSearchOrders=[...new Map(layouts.filter(p=>p.family==='four').flatMap(p=>
 ['left-to-right','widest-first'].map(traversal=>{
  const slots=p.weights.map((w,slot)=>({w,slot}));
  if(traversal==='widest-first')slots.sort((a,b)=>b.w-a.w||a.slot-b.slot);
  const order=Array(4);slots.forEach(({slot},group)=>order[slot]=group);
  return [orderKey(order),order];
 }))).values()];
function winningCandidate(n,policy,order){
 if(n<4)return 0;
 return candidates(n,policy).findIndex(groups=>groups.every(k=>k>0)&&
  order.slice(1).every((group,slot)=>gcd(groups[order[slot]],groups[group])===1))+1;
}
export const fourSearchTables=fourSearchOrders.map(order=>({order,key:orderKey(order),
 policies:Object.fromEntries(['closest','stronger'].map(policy=>{
  const regular=Array.from({length:fourSearchPeriod},(_,phase)=>winningCandidate(fourSearchPeriod+phase,policy,order));
  const correction=regular.map((choice,n)=>n<fourSearchSmallLimit?winningCandidate(n,policy,order)-choice:0);
  return [policy,{regular,correction}];
 }))}));

const v=name=>`var(--_gp-f-${name})`;
const rootDeclarations=[],coefficientNames=[],coefficients=new Map;
const rootSet=(name,value)=>rootDeclarations.push(` --_gp-f-${name}:${value};`);
export const fourSearchRootScalars=['s-order',...fourSearchTables.map((_,i)=>`s-o${i}`)];
rootSet('s-order',`calc(${sum([0,1,2,3].map(i=>`${4**i} * var(--_gp-f-order${i})`))})`);
fourSearchTables.forEach(({key},i)=>rootSet(`s-o${i}`,eq(v('s-order'),key)));
function coefficient(kind,phase){
 const values=fourSearchTables.map(t=>['closest','stronger'].map(policy=>t.policies[policy][kind][phase]));
 if(values.flat().every(n=>n===0))return '0';
 const key=JSON.stringify(values);if(coefficients.has(key))return coefficients.get(key);
 const name=`h${coefficients.size}`,terms=values.flatMap(([a,b],i)=>{
  if(!a&&!b)return [];
  const expression=a===b?String(a):`((1 - var(--_gp-stronger)) * ${a} + var(--_gp-stronger) * ${b})`;
  return [`${v(`s-o${i}`)} * ${expression}`];
 });
 rootSet(name,`calc(${sum(terms)})`);coefficientNames.push(name);coefficients.set(key,v(name));return v(name);
}
const phaseTerms=(kind,size)=>sum(Array.from({length:size},(_,i)=>({i,value:coefficient(kind,i)}))
 .filter(p=>p.value!=='0').map(p=>`${v(`s-p${p.i}`)} * ${p.value}`));
const choice=`calc(${phaseTerms('regular',fourSearchPeriod)} + ${v('s-low')} * (${phaseTerms('correction',fourSearchSmallLimit)}))`;
export const fourSearchCoefficientScalars=coefficientNames;
export const fourSearchRootDeclarations=()=>rootDeclarations.join('\n');

// Cache on the selecting element, then explicitly inherit typed numbers on
// direct participants. Count/index/phase stay local; ordinary descendants
// receive registered zero defaults instead of inheriting the extra metadata.
export function compileFourSearch(set){
 for(const name of coefficientNames)set(name,'inherit');
 set('s-phase',`mod(var(--_gp-n),${fourSearchPeriod})`);
 for(let i=0;i<fourSearchPeriod;i++)set(`s-p${i}`,eq(v('s-phase'),i));
 set('s-low',`clamp(0,calc(${fourSearchSmallLimit} - var(--_gp-n)),1)`);
 set('choice',choice);
 for(let k=0;k<candidateSlots;k++)set(`take${k}`,eq(v('choice'),k+1));
 set('found',`clamp(0,${v('choice')},1)`);
}
