// Independent bounded enumeration oracle for two-/three-region allocation.
const gcd=(a,b)=>b?gcd(b,a%b):a;
const physical=groups=>groups.length===2?groups:[groups[1],groups[0],groups[2]];
const conflicts=groups=>{const counts=physical(groups);return counts.slice(1).filter((n,i)=>gcd(counts[i],n)>1);};
function validate(count,min){if(!Number.isSafeInteger(count)||count<min)throw Error(`Expected at least ${min} items`);}
export function twoAllocation(count,{intent='closest',fewer='start'}={}){
 validate(count,2);
 if(!['closest','stronger'].includes(intent)||!['start','end'].includes(fewer))throw Error('Invalid two-region choice');
 const valid=[];
 for(let a=Math.max(1,Math.ceil((count-4)/2));a<=Math.floor(count/2);a++){
  const groups=[a,count-a];if(conflicts(groups).length===0)valid.push(groups);
 }
 // Candidates are ordered from greater to lesser difference.
 const groups=intent==='closest'?valid.at(-1):valid[0];
 return groups?(fewer==='start'?[...groups]:groups.toReversed()):null;
}
export function threeAllocations(count){
 validate(count,3);
 const distinct=new Map();
 for(let a=Math.max(1,Math.ceil(count/3)-2);a<=Math.floor(count/3);a++)for(let b=a;b<=a+2;b++){
  const c=count-a-b;if(c<b||c-a>2)continue;
  for(const groups of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]){
   if(conflicts(groups).length)continue;
   const counts=physical(groups),id=counts.join('-');
   distinct.set(id,{id,groups,counts});
  }
 }
 // Deterministic display order: fewer in the first/center source group first,
 // then fewer on the left. This is a review default, not inferred importance.
 return [...distinct.values()].sort((a,b)=>a.groups[0]-b.groups[0]||a.groups[1]-b.groups[1]||a.groups[2]-b.groups[2]);
}
