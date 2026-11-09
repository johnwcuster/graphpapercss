import {threeAllocations} from './allocation.mjs';
export function score([left,center,right]){
 return [
  Number(left!==right),
  Number(center>Math.min(left,right)&&center<Math.max(left,right)),
  Math.max(left,center,right)-Math.min(left,center,right),
  Number(center>Math.min(left,right)),
  left,center,right
 ];
}
function compare(a,b){
 const x=score(a.counts),y=score(b.counts);
 for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]-y[i];
 return 0;
}
export function rankedAllocations(count){return threeAllocations(count).sort(compare);}
