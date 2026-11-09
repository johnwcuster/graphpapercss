// Independent whole-bit oracle for the reviewed exact-count rectangles.
export function mosaicCoordinates(plan,{tracks=64,spacing='neat'}={}){
 if(!['neat','thin'].includes(spacing))throw Error('Unsupported mosaic spacing');
 const left=2,right=spacing==='thin'?3:2;
 const inset=Math.min(left,tracks-1),tail=Math.min(right,tracks-inset-1),usable=tracks-inset-tail;
 return plan.rects.map(([a,b,y,end])=>{
  const start=inset+Math.round(a*usable/plan.basis)+(spacing==='thin'&&a>0?1:0);
  return {start,span:inset+Math.round(b*usable/plan.basis)-start,row:y+1,rowspan:end-y,gutterBits:spacing==='thin'&&y>0?1:0};
 });
}
export function mosaicEligible(plan,{count,tracks=64,spacing='neat',enhanced=true}={}){
 return enhanced&&count===plan.count&&['neat','thin'].includes(spacing)&&mosaicCoordinates(plan,{tracks,spacing}).every(p=>p.span>=1);
}
