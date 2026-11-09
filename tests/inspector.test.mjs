import test from 'node:test';
import assert from 'node:assert/strict';
import { compositionClasses, readSelection, selectionClasses, changeSelection, sameClasses, replaceCompositionClasses } from '../tools/inspector/model.mjs';
import { mountInspector } from 'graphpapercss/legacy/0.4/inspector';
import { diagramItems } from '../tools/shared/composition.mjs';
import { describeDiagram } from '../tools/shared/accessibility.mjs';
import { recipes, layoutsFor } from '../src/legacy/0.4/ruler/geometry.mjs';
import { inspectorGraph } from '../scripts/lib/inspector-graph.mjs';

test('portable module graph excludes documentation UI and stays within an explicit optional-tool budget',async()=>{
  const graph=await inspectorGraph(process.cwd());
  assert.ok(graph.files.length<25);
  assert.ok(graph.raw<90000,`${graph.raw} raw bytes`);
  assert.ok(graph.gzip<26000,`${graph.gzip} gzip bytes`);
});

test('optional package entry imports without a browser or automatic mounting',()=>{
  assert.equal(typeof mountInspector,'function');
  assert.throws(()=>mountInspector({root:null}),/root must be/);
});
test('empty host compositions have empty diagrams and useful nonvisual descriptions',()=>{
  for(const state of ['stacked','compact','expanded']){
    assert.deepEqual(diagramItems('grid_03','none','default',0,'wide',state),[]);
    assert.match(describeDiagram({grid:'grid_03',set:'none',flow:'default',items:0,field:'wide'},state),/no source items/);
  }
});

test('portable inspector reads every manifest-backed composition without inventing classes',()=>{
  for(const grid of Object.keys(recipes))for(const layout of [null,...layoutsFor(recipes[grid])]){
    const selection={grid,set:layout?.set??'none',flow:layout?.flow??'default',field:'wide',band:''};
    assert.deepEqual(readSelection(['host-story','gp_field',...selectionClasses(selection)]),selection);
  }
});
test('portable inspector refuses ambiguous, unknown and unsupported host selections',()=>{
  for(const classes of [
    'grid_03 gp_field--wide grid_04','grid_03 gp_field--wide gp_field--thin',
    'grid_07 gp_field--wide','grid_03 gp_field--custom','grid_03 gp_field--wide gp_band--04',
    'grid_03 gp_field--wide flow_01','grid_06 gp_field--wide set_03',
    'grid_03 gp_field--wide set_03 set_04'
  ])assert.throws(()=>readSelection(classes.split(' ')),classes);
});
test('changes preserve compatible layout decisions and explicitly drop incompatible ones',()=>{
  const flow=layoutsFor(recipes['grid_03a--07']).find(l=>l.set==='set_06'&&l.flow).flow;
  const selection=readSelection(`grid_03a--07 gp_field--wide set_06 ${flow} gp_band--02`.split(' '));
  assert.equal(changeSelection(selection,'field','thin').flow,flow);
  const next=changeSelection(selection,'grid','grid_06');
  assert.equal(next.set,'set_06');assert.equal(next.flow,'default');assert.equal(next.band,'02');
  assert.equal(changeSelection(selection,'set','none').flow,'default');
  assert.throws(()=>changeSelection(selection,'flow','flow_99'));
});
test('class replacement and discard preserve unrelated live host changes',()=>{
  const values=new Set(['gp_field','gp_subgrid','story','grid_03','gp_field--wide','gp_rule--end']);
  const element={classList:{[Symbol.iterator]:()=>values.values(),remove:(...tokens)=>tokens.forEach(t=>values.delete(t)),add:(...tokens)=>tokens.forEach(t=>values.add(t))}};
  const before=compositionClasses(values),after=selectionClasses(changeSelection(readSelection(values),'grid','grid_02'));
  replaceCompositionClasses(element,after);values.add('host-updated');replaceCompositionClasses(element,before);
  assert.ok(sameClasses(compositionClasses(values),before));
  for(const token of ['story','gp_field','gp_subgrid','gp_rule--end','host-updated'])assert.ok(values.has(token));
  assert.equal(sameClasses(before,after),false);
});
