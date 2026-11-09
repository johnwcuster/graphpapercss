import assert from 'node:assert/strict';
import {layouts,hinges,spacingModes} from '../src/core/catalogue.mjs';
import {placements} from '../src/core/geometry.mjs';
assert.equal(new Set(layouts.map(p=>p.id)).size,layouts.length);
assert.ok(hinges.every(([width],i)=>width>0&&(!i||width>hinges[i-1][0])));
let configurations=0;
for(const layout of layouts)for(const spacing of Object.keys(spacingModes))for(const count of [0,1,2,3,6,13])for(const tracks of [1,14,64]){
 const positions=placements({id:layout.id,spacing,count,tracks});assert.equal(positions.length,count);
 for(const p of positions){
  assert.ok([p.start,p.span,p.row,p.rowspan].every(Number.isInteger));
  assert.ok(p.start>=0&&p.span>=1&&p.start+p.span<=tracks&&p.row>=1&&p.rowspan>=1,`${layout.id}/${spacing}/${count}/${tracks}`);
 }
 configurations++;
}
console.log(`${layouts.length} layouts, viewport hinges and ${configurations} geometry configurations are valid.`);
