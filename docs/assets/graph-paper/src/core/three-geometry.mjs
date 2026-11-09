// Independent candidate enumeration for tests/tools. CSS uses closed arithmetic.
const gcd=(a,b)=>b?gcd(b,a%b):a;
const score=([l,c,r])=>[Number(l!==r),Number(c>Math.min(l,r)&&c<Math.max(l,r)),Math.max(l,c,r)-Math.min(l,c,r),Number(c>Math.min(l,r)),l,c,r];
export function exactCountsEligible(count,exact){
 return Number.isSafeInteger(count)&&count>=3&&Array.isArray(exact)&&exact.length===3&&exact.every(n=>Number.isSafeInteger(n)&&n>0)&&exact.reduce((a,b)=>a+b,0)===count&&Math.max(...exact)-Math.min(...exact)<=2&&gcd(exact[0],exact[1])===1&&gcd(exact[1],exact[2])===1;
}
export function threeRegionCounts(count,{exact=null}={}){
 if(!Number.isSafeInteger(count)||count<3)throw Error('Expected at least three participants');
 if(exactCountsEligible(count,exact))return [...exact];
 const candidates=new Map();
 for(let a=Math.max(1,Math.ceil(count/3)-2);a<=Math.floor(count/3);a++)for(let b=a;b<=a+2;b++){
  const c=count-a-b;if(c<b||c-a>2)continue;
  for(const counts of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]){
   if(gcd(counts[0],counts[1])!==1||gcd(counts[1],counts[2])!==1)continue;
   candidates.set(counts.join('-'),counts);
  }
 }
 return [...candidates.values()].sort((a,b)=>{
  const x=score(a),y=score(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;
 })[0];
}
export function threePlacements({count,tracks,spacing,weights,traversal,exact=null}){
 const [l,c,r]=threeRegionCounts(count,{exact}),counts=[l,c,r],mode=spacing;
 const inset=Math.min(mode[0],tracks-1),tail=Math.min(mode[1],tracks-inset-1),usable=tracks-inset-tail;
 const gap=Math.min(mode[2],Math.max(0,Math.floor((usable-3)/2))),content=usable-2*gap,total=weights.reduce((a,b)=>a+b);
 const first=Math.max(1,Math.min(content-2,Math.round(content*weights[0]/total)));
 const second=Math.max(first+1,Math.min(content-1,Math.round(content*(weights[0]+weights[1])/total)));
 const cuts=[0,first,second,content],rows=counts.reduce((a,b)=>a*b/gcd(a,b),1);
 const slots=traversal==='center-first'?[1,0,2]:traversal==='right-to-left'&&count===3?[2,1,0]:[0,1,2];
 return slots.flatMap(slot=>Array.from({length:counts[slot]},(_,i)=>({start:inset+cuts[slot]+slot*gap,span:cuts[slot+1]-cuts[slot],row:1+i*rows/counts[slot],rowspan:rows/counts[slot]})));
}
