export function renderedHorizontalSeams(items,top,bottom,tolerance=.75){
  const edges=[...new Set(items.flatMap(r=>[r.y,r.y+r.h]))];
  return edges.filter(y=>y>top+tolerance&&y<bottom-tolerance&&!items.some(r=>r.y<y-tolerance&&r.y+r.h>y+tolerance));
}
