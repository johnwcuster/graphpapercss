import test from 'node:test';
import assert from 'node:assert/strict';
import {smallestCompatibleProfile,fullOnlyReason} from '../docs/sequence/delivery-model.mjs';
import {deliverySizes} from '../docs/assets/graph-paper/build-info.mjs';
import {exportSelection,downloadableHTML} from '../docs/sequence/export-model.mjs';
import {defaultState,normalizeState} from '../docs/sequence/model.mjs';

test('delivery chooses the smallest complete build for all authored viewport layouts',()=>{
 for(const [layout,id] of [['stack','repeating'],['peers-6','repeating'],['two-7-5','two-three'],['three-3-4-3','two-three'],['four-6-8-9-7','full'],['mosaic-6','full']]){
  const state=normalizeState({...defaultState(),steps:[{rem:0,layout}]});
  assert.equal(smallestCompatibleProfile(exportSelection(state),deliverySizes).id,id,layout);
 }
 const state=normalizeState({...defaultState(),width:375,steps:['stack','peers-2','two-1-1','two-7-5','three-3-4-3','four-6-8-9-7','mosaic-6'].map((layout,i)=>({rem:[0,30,40,48,64,80,96][i],layout}))});
 const selection=exportSelection(state);
 assert.equal(smallestCompatibleProfile(selection,deliverySizes).id,'full');
 assert.match(fullOnlyReason(selection),/Four compositions and a mosaic/);
 assert.throws(()=>smallestCompatibleProfile({layouts:['unknown']},deliverySizes));
});
test('matching HTML supports each self-hosted filename and rejects paths or markup',()=>{
 for(const filename of ['main.css','main.min.css','repeating.css','repeating.min.css','two-three.css','two-three.min.css']){
  const html=downloadableHTML(defaultState(),'minified',filename);
  assert.ok(html.includes(`href="./${filename}"`));assert.doesNotMatch(html,/<script|<style/);
 }
 for(const filename of ['../main.css','https://example.com/main.css','x.css" onload="alert(1)'])assert.throws(()=>downloadableHTML(defaultState(),'readable',filename));
});
