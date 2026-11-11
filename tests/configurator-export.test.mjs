import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,addTransition,editSelection,editPadding,editVerticalSpacing,editSpacing} from '../docs/sequence/model.mjs';
import {exportSelection,exportKey,downloadableHTML} from '../docs/sequence/export-model.mjs';
import {compileSelection} from '../src/core/selection.mjs';
import {minifyGeneratedCSS} from '../src/core/compact.mjs';

test('custom CSS requirements omit inherited no-op transitions and unrelated utilities',()=>{
 const state=defaultState(),key=exportKey(state);
 assert.deepEqual(exportSelection(state),{layouts:['stack'],hinges:[],spacing:['neat'],padding:false,verticalSpacing:false});
 addTransition(state,48);assert.equal(exportKey(state),key);
 state.width=1600;state.count=12;state.ruler=true;assert.equal(exportKey(state),key);
 state.selected=state.steps[1].id;editSelection(state,{layout:'three-1-2-1',config:{exact:{left:5,center:3,right:4}}});
 assert.deepEqual(exportSelection(state).hinges,[48]);
 const selected=exportKey(state);state.steps[1].config.exact={left:4,center:5,right:3};assert.equal(exportKey(state),selected);
});
test('spacing-only, padding-only and exact-only transitions retain their required hinges',()=>{
 const state=defaultState();editSelection(state,{layout:'three-1-2-1'});
 for(const [rem,edit,value] of [[30,editPadding,1],[40,editSpacing,'wide'],[48,editVerticalSpacing,2]]){const step=addTransition(state,rem);state.selected=step.id;edit(state,value);}
 const exact=addTransition(state,80);state.selected=exact.id;editSelection(state,{config:{exact:{left:5,center:3,right:4}}});
 assert.deepEqual(exportSelection(state),{layouts:['stack','three-1-2-1'],hinges:[30,40,48,80],spacing:['neat','wide'],padding:true,verticalSpacing:true});
 const {css}=compileSelection(exportSelection(state));assert.ok(css.includes('--gp-xl-exact-count-left'));assert.ok(css.includes('.gp_xs-pad--1'));
});
test('downloaded HTML links to the selected CSS format and needs no layout scripts',()=>{
 const state=defaultState();
 for(const [format,name] of [['readable','graph-paper-custom.css'],['minified','graph-paper-custom.min.css']]){
  const html=downloadableHTML(state,format);assert.ok(html.includes(`href="./${name}"`));assert.match(html,/name="viewport"/);assert.doesNotMatch(html,/<script|<style|library-entry/);assert.equal((html.match(/<article/g)??[]).length,6);
 }
});
test('browser minification preserves arithmetic whitespace and public vocabulary',()=>{
 const {css}=compileSelection({layouts:['two-3-2','three-1-2-1'],hinges:[48,64],spacing:['neat']});
 const min=minifyGeneratedCSS(css);assert.ok(min.length<css.length);assert.ok(min.includes('--gp-two-3-2:'));assert.ok(min.includes('--_gp-tracks'));assert.ok(!min.includes('--_gp-two-start'));
 assert.match(min,/ \+ /);assert.match(min,/ - /);assert.ok(!min.includes('\n'));assert.throws(()=>minifyGeneratedCSS(min),/namespace collision/);
 assert.ok(minifyGeneratedCSS('/* a comment with an unmatched quote: " */ .a::before { content: "a: b; c"; }').includes('content:"a: b; c"'));
 assert.ok(minifyGeneratedCSS(':where(.outer) :where(.inner) { color: red; }').includes(':where(.outer) :where(.inner)'));
});

test('rule extension follows actual owner requirements, not an unused ruled field',()=>{
 const state=defaultState();editSpacing(state,'ruled');
 assert.equal(exportSelection(state).columnRules,undefined);
 editSelection(state,{layout:'peers-2'});
 const selection=exportSelection(state);assert.equal(selection.columnRules,true);
 assert.match(compileSelection(selection).css,/position:relative/);
 assert.doesNotMatch(compileSelection({...selection,columnRules:false}).css,/position:relative/);
 assert.throws(()=>compileSelection({...selection,columnRules:'yes'}),/boolean/);
});
