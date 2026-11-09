import {layouts} from '../assets/graph-paper/src/core/catalogue.mjs';
export const regionalFamilies=['two','three','four'];
export const catalogueKind=p=>regionalFamilies.includes(p.family)?'regions':p.family;
export function relationship(p){
 if(!p.weights)return null;
 const distinct=[...new Set(p.weights)];
 if(distinct.length===1)return 'equal';
 if(p.weights.length===2)return 'unequal';
 if(distinct.length===2)return p.weights.filter(w=>w===Math.max(...p.weights)).length===1?'one-wider':'two-wider';
 return 'graduated';
}
export const relationshipLabels={equal:'Equal widths',unequal:'Unequal widths','one-wider':'One wider column','two-wider':'Two equally wider columns',graduated:'Different widths'};
export const widthOrder=p=>p.weights? p.weights.map(w=>[...new Set(p.weights)].sort((a,b)=>a-b).indexOf(w)).join('-'):'';
export const contrast=p=>p.weights?Math.max(...p.weights)/Math.min(...p.weights):1;
export const familyLayouts=family=>layouts.filter(p=>p.family===family);
export const relationships=family=>Object.keys(relationshipLabels).filter(r=>familyLayouts(family).some(p=>relationship(p)===r));
export const orderChoices=(family,relation)=>[...new Map(familyLayouts(family).filter(p=>relationship(p)===relation).map(p=>[widthOrder(p),p])).values()];
export const proportionChoices=p=>familyLayouts(p.family).filter(q=>relationship(q)===relationship(p)&&widthOrder(q)===widthOrder(p)).sort((a,b)=>contrast(a)-contrast(b)||a.id.localeCompare(b.id));
// Within a changed ordering keep the nearest available degree of contrast.
// No generated combination exists unless it is an entry in the real catalogue.
export function chooseNearby(current,candidates){
 if(!candidates.length)return null;
 if(candidates.some(p=>p.id===current.id))return candidates.find(p=>p.id===current.id);
 const shapeDistance=q=>q.weights&&current.weights&&q.weights.length===current.weights.length?q.weights.reduce((sum,w,i)=>sum+(w/q.weights.reduce((a,b)=>a+b,0)-current.weights[i]/current.weights.reduce((a,b)=>a+b,0))**2,0):0;
 return [...candidates].sort((a,b)=>{
  const difference=Math.abs(Math.log(contrast(a)/contrast(current)))-Math.abs(Math.log(contrast(b)/contrast(current)));
  if(Math.abs(difference)>1e-12)return difference;
  const shape=shapeDistance(a)-shapeDistance(b);
  return Math.abs(shape)>1e-12?shape:widthOrder(b).localeCompare(widthOrder(a))||a.code-b.code;
 })[0];
}
export const equalLayout=family=>familyLayouts(family).find(p=>relationship(p)==='equal')??familyLayouts(family)[0];
export function orderDescription(p){
 const ranks=widthOrder(p).split('-').map(Number),max=Math.max(...ranks);
 const names=max===1?['narrower','wider']:max===2?['narrow','medium','wide']:['narrowest','narrower','wider','widest'];
 return ranks.map(r=>names[r]).join(', ');
}
export function silhouette(weights){
 const total=weights.reduce((a,b)=>a+b,0),available=120-3*(weights.length-1);let x=0;
 return `<svg viewBox="0 0 120 24" aria-hidden="true" focusable="false">${weights.map(w=>{const width=w/total*available,rect=`<rect x="${x}" y="2" width="${width}" height="20" rx="1"/>`;x+=width+3;return rect;}).join('')}</svg>`;
}
