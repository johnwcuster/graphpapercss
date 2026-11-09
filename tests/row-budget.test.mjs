import test from 'node:test';
import assert from 'node:assert/strict';
import {placements} from '../src/core/geometry.mjs';

test('construction-row budget stacks the whole allocation and restores safe neighbors',()=>{
 for(const [id,count,stacked,extra] of [
  ['two-3-2',199,false],['two-3-2',200,true],
  ['two-3-2',201,true,{arrangement:'first-above',exact:[99,101]}],
  ['two-3-2',202,true,{arrangement:'first-above-last-below',exact:[99,101]}],
  ['three-1-2-1',65,false],['three-1-2-1',66,true],['three-1-2-1',67,false],
  ['four-6-5-4-3',43,false],['four-6-5-4-3',43,true,{exact:[9,10,11,13]}],
  ['four-6-5-4-3',129,true],['four-6-5-4-3',130,false],
 ])for(const spacing of ['full','neat','thin','wide','ruled']){
  const state={id,count,spacing,...extra},items=placements(state),stack=placements({...state,id:'stack'});
  if(stacked)assert.deepEqual(items,stack,JSON.stringify(state));
  else{assert.notDeepEqual(items,stack);assert.ok(items.every(p=>p.row+p.rowspan-1<=9998));}
 }
});
