import {mosaicCoordinates,mosaicEligible} from './mosaic-geometry.mjs';
import {constructionRowBudget} from './row-budget.mjs';
export {mosaicCoordinates,mosaicEligible} from './mosaic-geometry.mjs';
import {fourPlacements} from './four-geometry.mjs';
export {fourCounts,fourExactCountsEligible,fourExactAllocations} from './four-geometry.mjs';
// Independent arithmetic reference for tests/tools; never assigns browser layout.
import {layouts,spacingModes,allocationPolicies,directionPolicies,traversalPolicies,arrangementPolicies} from './catalogue.mjs';
import {pairExactRequest,pairExactCountsEligible} from './pair-geometry.mjs';
export {pairExactCountsEligible} from './pair-geometry.mjs';
import {threePlacements} from './three-geometry.mjs';
export {threeRegionCounts,exactCountsEligible} from './three-geometry.mjs';
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function placements({id='stack',count=0,tracks=64,spacing='full',allocation='closest',fewer='left',traversal='left-to-right',arrangement='across',exact=null,enhanced=true,measured=true}={}){
 const plan=layouts.find(p=>p.id===id),mode=spacingModes[spacing];
 if(!plan||!mode||!Number.isSafeInteger(count)||count<0||!Number.isInteger(tracks)||tracks<1||!(allocation in allocationPolicies)||!(fewer in directionPolicies)||!(traversal in traversalPolicies)||!(arrangement in arrangementPolicies))throw Error('Invalid candidate geometry');
 const inset=Math.min(mode[0],tracks-1),tail=Math.min(mode[1],tracks-inset-1),usable=tracks-inset-tail;
 const stack=()=>Array.from({length:count},(_,i)=>({start:inset,span:usable,row:i+1,rowspan:1}));
 const bounded=items=>items.some(p=>p.row+p.rowspan-1>constructionRowBudget)?stack():items;
 if(plan.family==='mosaic')return mosaicEligible(plan,{count,tracks,spacing,enhanced,measured})?mosaicCoordinates(plan,{tracks,spacing}):stack();
 if(plan.family==='stack'||plan.family==='two'&&count<2||plan.family==='three'&&count<3||plan.family==='four'&&count<4)return stack();
 const columns=plan.family==='two'?2:plan.family==='three'?3:plan.family==='four'?4:plan.columns;
 if(usable<columns||['three','four'].includes(plan.family)&&!enhanced)return stack();
 if(plan.family==='four')return bounded(fourPlacements({count,tracks,spacing:mode,plan,allocation,traversal,exact}));
 if(plan.family==='three')return bounded(threePlacements({count,tracks,spacing:mode,weights:plan.weights,traversal,exact}));
 const gap=Math.min(mode[2],Math.max(0,Math.floor((usable-columns)/(columns-1)))),content=usable-(columns-1)*gap;
 if(plan.family==='two'&&arrangement!=='across'){
  const above=arrangement!=='last-below',below=arrangement!=='first-above',m=count-Number(above)-Number(below);
  if(m<2)return stack();
  const full=row=>({start:inset,span:usable,row,rowspan:1});
  let support,rows;
  if(!enhanced){
   const cuts=[0,Math.round(content/2),content];rows=Math.ceil(m/2);
   support=Array.from({length:m},(_,i)=>{const slot=i%2;return {start:inset+cuts[slot]+slot*gap,span:cuts[slot+1]-cuts[slot],row:1+Math.floor(i/2)+Number(above),rowspan:1};});
  }else{
   const [a,b]=pairExactCountsEligible(m,exact)?pairExactRequest(exact):allocationCounts(m,{allocation,fewer});
   rows=a*b/gcd(a,b);
   if(rows+Number(above)+Number(below)>constructionRowBudget)return stack();
   const cut=Math.min(Math.max(1,Math.round(content*plan.weights[0]/plan.weights.reduce((a,b)=>a+b))),content-1);
   const first=traversal==='right-to-left'?b:a;
   support=Array.from({length:m},(_,i)=>{const end=traversal==='right-to-left'?i<first:i>=first,k=end?b:a,local=i<first?i:i-first;return {start:inset+(end?cut+gap:0),span:end?content-cut:cut,row:1+local*rows/k+Number(above),rowspan:rows/k};});
  }
  return [...(above?[full(1)]:[]),...support,...(below?[full(rows+1+Number(above))]:[])];
 }
 if(plan.family==='peers'||!enhanced){
  const cuts=Array.from({length:columns+1},(_,i)=>Math.round(content*i/columns));
  return Array.from({length:count},(_,i)=>{const slot=i%columns;return {start:inset+cuts[slot]+slot*gap,span:cuts[slot+1]-cuts[slot],row:1+Math.floor(i/columns),rowspan:1};});
 }
 const [a,b]=allocationCounts(count,{allocation,fewer}),common=a*b/gcd(a,b);
 if(common>constructionRowBudget)return stack();
 const cut=Math.min(Math.max(1,Math.round(content*plan.weights[0]/plan.weights.reduce((a,b)=>a+b,0))),content-1);
 const first=traversal==='right-to-left'?b:a;
 return Array.from({length:count},(_,i)=>{const end=traversal==='right-to-left'?i<first:i>=first,k=end?b:a,local=i<first?i:i-first;return {start:inset+(end?cut+gap:0),span:end?content-cut:cut,row:1+local*common/k,rowspan:common/k};});
}

// Independent bounded candidate enumeration for tests/tools. The compiler uses
// parity/remainder expressions rather than this search or a count lookup table.
export function allocationCounts(count,{allocation='closest',fewer='left'}={}){
 if(!Number.isSafeInteger(count)||count<0||!(allocation in allocationPolicies)||!(fewer in directionPolicies))throw Error('Invalid allocation');
 if(count<2)return [count,0];
 const candidates=[];
 for(let a=Math.max(1,Math.ceil((count-4)/2));a<=Math.floor(count/2);a++)if(gcd(a,count-a)===1)candidates.push(a);
 const small=allocation==='closest'?candidates.at(-1):candidates[0];
 if(small===undefined)throw Error('No valid two-region allocation');
 return fewer==='left'?[small,count-small]:[count-small,small];
}
