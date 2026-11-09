import { plans,positions,defaultPlan } from './four-proportions.mjs';
export { plans,defaultPlan };
export const policies=['balanced','graduated'];
export const traversals=['left-to-right','widest-first'];
// Small fixed pool found by coverage search, then ordered by explicit preference.
// Each vector is added to floor(N/4); its sum equals N mod 4.
export const pools=[
  [[-1,0,1,0],[-1,0,0,1],[0,0,0,0],[-1,1,0,0],[-1,-1,-1,3],[-2,0,2,0]],
  [[-1,1,0,1],[-1,0,2,0],[0,0,0,1],[-1,0,0,2],[-1,0,1,1],[-1,2,0,0],[-2,0,1,2]],
  [[0,1,0,1],[0,1,1,0],[0,0,1,1],[-1,-1,1,3]],
  [[-1,0,1,3],[1,0,2,0],[0,1,2,0],[-1,1,1,2],[-1,1,2,1]]
];
export const candidateSlots=Math.max(...pools.map(p=>p.length));
export const gcd=(a,b)=>b?gcd(b,a%b):a;
export const lcm=values=>values.reduce((l,n)=>l*n/gcd(l,n),1);
const spread=a=>Math.max(...a)-Math.min(...a);
const energy=a=>a.reduce((s,k)=>s+k*k,0);
export function candidates(n,policy='balanced') {
  if(!Number.isSafeInteger(n)||n<4||!policies.includes(policy))throw Error('Invalid search input');
  const pool=[...pools[n%4]].sort((a,b)=>(policy==='balanced'?1:-1)*(spread(a)-spread(b))||energy(a)-energy(b)||a.join(',').localeCompare(b.join(',')));
  while(pool.length<candidateSlots)pool.push(pool.at(-1));
  return pool.map(a=>a.map(k=>Math.floor(n/4)+k));
}
export function physicalOrder(plan,traversal,coordinates=positions) {
  return coordinates(plan,{traversal}).sort((a,b)=>a.slot-b.slot).map(p=>p.source-1);
}
export function search(n,{policy='balanced',plan=defaultPlan,traversal='left-to-right',coordinates=positions,exact=null}={}) {
  const order=physicalOrder(plan,traversal,coordinates);
  const attempts=candidates(n,policy).map(groups=>{
    const physical=order.map(i=>groups[i]);
    const conflicts=physical.slice(1).map((b,i)=>gcd(physical[i],b)>1);
    return {groups,physical,conflicts,valid:Math.min(...groups)>0&&!conflicts.some(Boolean)};
  });
  const index=attempts.findIndex(a=>a.valid);
  const exactActive=exactCountsEligible(n,exact);
  const groups=exactActive?Array.from({length:4},(_,g)=>exact[order.indexOf(g)]):index<0?null:attempts[index].groups;
  return {index,found:index>=0||exactActive,attempts,groups,rows:groups?lcm(groups):null,exactActive};
}
// Exact inputs name physical regions, independently of source traversal.
export function exactCountsEligible(n,counts){
 return Number.isSafeInteger(n)&&n>=4&&Array.isArray(counts)&&counts.length===4&&
  counts.every(k=>Number.isSafeInteger(k)&&k>0)&&counts.reduce((s,k)=>s+k,0)===n&&
  Math.max(...counts)-Math.min(...counts)<=4&&counts.slice(1).every((k,i)=>gcd(counts[i],k)===1);
}
export function exactAllocations(n){
 const result=[];
 for(let a=1;a<=n-3;a++)for(let b=1;b<=n-a-2;b++)for(let c=1;c<=n-a-b-1;c++){
  const tuple=[a,b,c,n-a-b-c];if(exactCountsEligible(n,tuple))result.push(tuple);
 }
 return result;
}
