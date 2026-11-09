import test from 'node:test';
import assert from 'node:assert/strict';
import {layouts} from '../src/core/catalogue.mjs';
import {familyLayouts,relationships,relationship,orderChoices,widthOrder,proportionChoices,contrast,chooseNearby} from '../docs/sequence/catalogue-navigation.mjs';
import {renderCatalogue} from '../docs/sequence/catalogue-picker.mjs';
import {defaultConfig} from '../docs/sequence/model.mjs';
test('staged choices cover each regional catalogue entry exactly once without invented combinations',()=>{
 for(const family of ['two','three','four']){
  const reached=[];
  for(const relation of relationships(family))for(const order of orderChoices(family,relation)){
   const choices=proportionChoices(order);assert.ok(choices.every(p=>relationship(p)===relation&&widthOrder(p)===widthOrder(order)));
   for(let i=1;i<choices.length;i++)assert.ok(contrast(choices[i])>=contrast(choices[i-1]));
   reached.push(...choices.map(p=>p.id));
  }
  assert.equal(new Set(reached).size,reached.length);
  assert.deepEqual(reached.sort(),familyLayouts(family).map(p=>p.id).sort());
 }
});
test('mirroring preserves every available degree of two-region contrast',()=>{
 for(const p of familyLayouts('two').filter(p=>relationship(p)==='unequal')){
  const opposite=familyLayouts('two').filter(q=>widthOrder(q)!==widthOrder(p)&&relationship(q)==='unequal');
  const q=chooseNearby(p,opposite);assert.deepEqual(q.weights,[...p.weights].reverse());
 }
});
test('four-region width orders each expose all three contrast levels, with equal quarters separate',()=>{
 assert.deepEqual(relationships('four'),['equal','graduated']);
 assert.equal(orderChoices('four','graduated').length,8);
 for(const p of orderChoices('four','graduated'))assert.deepEqual(proportionChoices(p).map(contrast),[1.5,1.75,2]);
});
test('selected schematic uses supplied source count and exposes the precise responsive class',()=>{
 const markup=renderCatalogue({layout:'three-1-2-1',rem:48,spacing:'neat',config:defaultConfig()},2);
 assert.ok(markup.includes('gp_md--three-1-2-1'));
 const figure=markup.slice(markup.indexOf('<figure'));
 assert.equal((figure.match(/<rect /g)||[]).length,2,'underfilled preview shows actual fallback participants');
 assert.ok(!markup.includes('name="arrangement"'));
 for(const p of layouts){const html=renderCatalogue({layout:p.id,rem:0,spacing:'neat',config:defaultConfig()},6);assert.ok(html.includes(`gp_layout--${p.id}`));}
});

test('changing width relationship keeps the wider region on the same side when possible',()=>{
 for(const p of familyLayouts('three').filter(p=>relationship(p)==='graduated')){
  const widest=p.weights.indexOf(Math.max(...p.weights));
  const chosen=chooseNearby(p,familyLayouts('three').filter(q=>relationship(q)==='one-wider'));
  assert.equal(chosen.weights.indexOf(Math.max(...chosen.weights)),widest);
 }
});
test('full-width choices are illustrated once, immediately after two-column count',()=>{
 const html=renderCatalogue({layout:'two-3-2',rem:0,spacing:'neat',config:{...defaultConfig(),arrangement:'last-below'}},6);
 assert.ok(html.indexOf('Number of columns')<html.indexOf('Full-width items'));
 assert.ok(html.indexOf('Full-width items')<html.indexOf('Column widths'));
 assert.equal((html.match(/name="full-width-items"/g)||[]).length,4);
 assert.match(html,/value="last-below" data-focus="full-width-items-last-below" checked/);
 assert.ok(html.includes('First and last refer to source order.'));
 assert.equal((html.match(/class="full-width-highlight"/g)||[]).length,4);
 for(const layout of ['stack','peers-3','three-1-2-1','four-6-5-4-3','mosaic-6'])assert.ok(!renderCatalogue({layout,rem:0,spacing:'neat',config:defaultConfig()},6).includes('name="full-width-items"'));
});
