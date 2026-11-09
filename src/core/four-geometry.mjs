// Independent Euclidean oracle. Shared pool data is the accepted catalogue,
// not CSS validity flags, subset-GCD arithmetic, or placement descriptors.
import {pools} from './four-allocation.mjs';
const gcd=(a,b)=>b?gcd(b,a%b):a;
const lcm=values=>values.reduce((a,b)=>a*b/gcd(a,b),1);
export function fourExactCountsEligible(n,counts){
 return Number.isSafeInteger(n)&&n>=4&&Array.isArray(counts)&&counts.length===4&&counts.every(k=>Number.isSafeInteger(k)&&k>0)&&counts.reduce((a,b)=>a+b,0)===n&&Math.max(...counts)-Math.min(...counts)<=4&&counts.slice(1).every((k,i)=>gcd(counts[i],k)===1);
}
export function fourExactAllocations(n){
 const tuples=[];
 for(let a=Math.max(1,Math.ceil(n/4)-4);a<=Math.floor(n/4)+4;a++)for(let b=Math.max(1,a-4);b<=a+4;b++)for(let c=Math.max(1,a-4);c<=a+4;c++){
  const tuple=[a,b,c,n-a-b-c];if(fourExactCountsEligible(n,tuple))tuples.push(tuple);
 }
 return tuples.sort((a,b)=>{for(let i=0;i<4;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;});
}
export function fourCounts(n,{weights,allocation='closest',traversal='left-to-right',exact=null}){
 const ranked=weights.map((w,slot)=>({w,slot}));
 if(traversal==='widest-first')ranked.sort((a,b)=>b.w-a.w||a.slot-b.slot);
 const slots=ranked.map(p=>p.slot),physical=Array(4);
 if(n<4)return null;
 if(fourExactCountsEligible(n,exact)){
  const groups=slots.map(slot=>exact[slot]);return {groups,physical:[...exact],slots,rows:lcm(groups),exact:true};
 }
 const spread=a=>Math.max(...a)-Math.min(...a),energy=a=>a.reduce((s,k)=>s+k*k,0);
 const ordered=[...pools[n%4]].sort((a,b)=>(allocation==='closest'?1:-1)*(spread(a)-spread(b))||energy(a)-energy(b)||a.join(',').localeCompare(b.join(',')));
 for(const offsets of ordered){
  const groups=offsets.map(k=>Math.floor(n/4)+k);
  if(groups.some(k=>k<1))continue;
  slots.forEach((slot,g)=>physical[slot]=groups[g]);
  if(physical.slice(1).some((k,i)=>gcd(physical[i],k)!==1))continue;
  return {groups,physical:[...physical],slots,rows:lcm(groups),exact:false};
 }
 return null;
}
export function fourPlacements({count,tracks,spacing,plan,allocation,traversal,exact}){
 const inset=Math.min(spacing[0],tracks-1),tail=Math.min(spacing[1],tracks-inset-1),usable=tracks-inset-tail;
 const allocationResult=fourCounts(count,{weights:plan.weights,allocation,traversal,exact});
 if(!allocationResult)return Array.from({length:count},(_,i)=>({start:inset,span:usable,row:i+1,rowspan:1}));
 const {groups,slots,rows}=allocationResult,gap=Math.min(spacing[2],Math.floor((usable-4)/3)),content=usable-3*gap;
 const weights=spacing[2]===2&&plan.wideWeights?plan.wideWeights:plan.weights,total=weights.reduce((a,b)=>a+b,0),cuts=[0];let cumulative=0;
 for(let i=1;i<4;i++){cumulative+=weights[i-1];cuts.push(Math.min(content-(4-i),Math.max(cuts[i-1]+1,Math.round(content*cumulative/total))));}cuts.push(content);
 return groups.flatMap((n,g)=>Array.from({length:n},(_,i)=>({start:inset+cuts[slots[g]]+slots[g]*gap,span:cuts[slots[g]+1]-cuts[slots[g]],row:1+i*rows/n,rowspan:rows/n})));
}
