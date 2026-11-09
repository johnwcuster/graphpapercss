import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { layouts } from '../src/core/catalogue.mjs';
import { arrangements, thresholds, defaultState, normalizeState, needsRulerMeasurement, needsColumnRules, countMessage, rulerClasses, placementsFor, activeStep, sequenceClasses, candidateInlineStyle, candidateMarkup, exactOptions, sourceMarkup, resolvedSteps, addTransition, selectStep, moveTransition, editSpacing, editPadding, editVerticalSpacing, editSelection, itemSpacingClasses, exactStatus, retiredSelections } from '../docs/sequence/model.mjs';

test('fresh editor is stacked, with no invented transitions',()=>{
 const state=defaultState();assert.equal(state.steps.length,1);assert.equal(state.width,375);
 assert.deepEqual(sequenceClasses(state),['gp_layout--stack','gp_spacing--neat']);
});
test('all supported transitions inherit without changing export',()=>{
 const state=defaultState(),before=candidateMarkup(state);
 for(const {rem} of thresholds){const step=addTransition(state,rem);selectStep(state,step.id);assert.equal(activeStep(state).id,step.id);assert.equal(candidateMarkup(state),before);}
 assert.equal(addTransition(state,48),null);assert.equal(addTransition(state,60),null);
});
test('layout and refinement snapshots inherit together until the next explicit selection',()=>{
 const state=defaultState();editSelection(state,{layout:'two-3-2',config:{allocation:'stronger'}});
 const middle=addTransition(state,48),last=addTransition(state,80);selectStep(state,last.id);editSelection(state,{layout:'two-2-3'});
 state.selected='base';editSelection(state,{config:{fewer:'right'}});
 const steps=resolvedSteps(state);assert.equal(steps[1].config.fewer,'right');assert.equal(steps[2].config.fewer,'left');
 state.selected=middle.id;editSelection(state,{layout:'three-2-3-7'});
 assert.equal(resolvedSteps(state)[1].config.allocation,'closest','different family clears controls');
 assert.equal(resolvedSteps(state)[2].config.allocation,'stronger','later explicit selection unchanged');
 middle.layout=null;middle.config=null;assert.equal(resolvedSteps(state)[1].layout,'two-3-2');
});
test('HTML exports responsive resets without author CSS',()=>{
 const state=defaultState();editSelection(state,{layout:'two-3-2',config:{arrangement:'first-above',exact:{left:2,right:3}}});
 const step=addTransition(state,64);selectStep(state,step.id);editSelection(state,{layout:'three-2-3-7'});
 const html=candidateMarkup(state);assert.match(html,/--gp-lg-exact-count-left: 0;/);assert.match(html,/gp_lg-arrangement--across/);assert.doesNotMatch(html,/<style|@media|--_|grid-column|grid-row/);
 assert.deepEqual(sequenceClasses(state),['gp_layout--two-3-2','gp_lg--three-2-3-7','gp_arrangement--first-above','gp_lg-arrangement--across','gp_spacing--neat']);
 assert.equal(activeStep(state,1023).layout,'two-3-2');assert.equal(activeStep(state,1024).layout,'three-2-3-7');
 assert.equal(activeStep(state,2047,32).layout,'two-3-2');
});
test('every compiled layout appears exactly once; thumbnails have bounded whole-bit geometry',()=>{
 assert.deepEqual(arrangements.map(p=>p.id),layouts.map(p=>p.id));assert.equal(arrangements.length,102);
 for(const p of arrangements)for(const count of [1,p.sample,14]){
  const positions=placementsFor(p.id,count);assert.equal(positions.length,count);
  for(const pos of positions){assert.ok([pos.start,pos.span,pos.row,pos.rowspan].every(Number.isInteger));assert.ok(pos.start>=0&&pos.span>0&&pos.start+pos.span<=64);}
 }
});
test('exact requests are retained and clearly accepted or rejected',()=>{
 const state=defaultState();state.count=12;editSelection(state,{layout:'three-2-3-7',config:{exact:{left:5,center:3,right:4}}});
 assert.match(exactStatus('three-2-3-7',12,state.steps[0].config),/Exact counts applied/);
 state.count=11;assert.match(exactStatus('three-2-3-7',11,state.steps[0].config),/Automatic allocation applies/);
 assert.match(candidateInlineStyle(state),/--gp-exact-count-left: 5/);
});
test('normalization bounds source and accepts only known markup-safe values',()=>{
 const state=normalizeState({count:14,width:3200,spacing:'</style>',steps:[{rem:0,layout:'<script>',config:{traversal:'bad',exact:{left:'evil'}}},{rem:48,layout:'two-3-2'},{rem:48,layout:'stack'},{rem:60,layout:'stack'}]});
 assert.equal(state.count,14);assert.equal(state.spacing,'neat');assert.equal(state.steps[0].layout,'stack');assert.equal(state.steps.length,2);assert.doesNotMatch(candidateMarkup(state),/evil|<script>/);
 assert.equal(normalizeState({count:99}).count,6);assert.deepEqual(normalizeState(defaultState()),defaultState());
 assert.deepEqual(retiredSelections({steps:[{layout:'pairs'}]}),['pairs']);
});
test('HTML contains configuration and placeholders, with no content or style tags',()=>{
 const state=defaultState();state.count=14;state.spacing='thin';state.steps[0].layout='mosaic-13';const html=candidateMarkup(state);
 assert.doesNotMatch(html,/gp_ruler--measure/);assert.doesNotMatch(html,/<style|Start with a 64-bit ruler|library-entry/);assert.equal((html.match(/<article>/g)||[]).length,14);
 assert.match(sourceMarkup(14),/data-record="ruler"/);assert.match(sourceMarkup(14),/Overflow diagnostic/);
});
test('named refinements use classes; exact counts use independently named breakpoint properties',()=>{
 const state=defaultState();editSelection(state,{layout:'three-2-3-7',config:{exact:{left:2,center:1,right:3},traversal:'center-first'}});
 assert.match(candidateMarkup(state),/gp_traversal--center-first/);assert.match(candidateInlineStyle(state),/--gp-exact-count-center: 1;/);
 const step=addTransition(state,64);selectStep(state,step.id);editSelection(state,{config:{exact:{left:1,center:3,right:2},traversal:'left-to-right'}});
 const inline=candidateInlineStyle(state),html=candidateMarkup(state);
 assert.doesNotMatch(inline,/traversal/);assert.match(inline,/--gp-exact-count-left: 2/);assert.match(inline,/--gp-lg-exact-count-left: 1/);assert.match(html,/gp_lg-traversal--left-to-right/);assert.doesNotMatch(html,/@media|<style/);
});
test('allocation choices enumerate exactly the accepted physical tuples',()=>{
 for(const [id,family,min] of [['two-3-2','two',2],['three-2-3-7','three',3],['four-6-5-4-3','four',4]])for(let count=1;count<=14;count++){
  const config={...defaultState().steps[0].config,arrangement:family==='two'?'first-above':'across'};
  const choices=exactOptions(id,count,config),n=count-(family==='two'?1:0);
  const expected=[];
  const visit=tuple=>{if(tuple.length===min){if(tuple.reduce((a,b)=>a+b,0)===n && exactStatus(id,count,{...config,exact:Object.fromEntries((family==='two'?['left','right']:family==='three'?['left','center','right']:['left','center-left','center-right','right']).map((k,i)=>[k,tuple[i]]))}).startsWith('Exact counts applied'))expected.push(tuple.join('-'));return;}for(let i=1;i<=Math.max(0,n);i++)visit([...tuple,i]);};
  visit([]);assert.deepEqual(choices.map(o=>o.tuple.join('-')),expected);
 }
});
test('preview loads shared CSS and authors only public-property overrides',async()=>{
 const page=await readFile(new URL('../docs/configurator.html',import.meta.url),'utf8');
 assert.match(page,/<a id="core-stylesheet-link" href="\.\/assets\/graph-paper\/main.css">/);
 const html=await readFile(new URL('../docs/sequence/preview.html',import.meta.url),'utf8'),js=await readFile(new URL('../docs/sequence/preview.mjs',import.meta.url),'utf8'),css=await readFile(new URL('../docs/sequence/preview.css',import.meta.url),'utf8');
 assert.match(html,/graph-paper\/main.css/);assert.doesNotMatch(html+js,/css-architecture\/selection.css|grid-column|grid-row|placementsFor/);assert.doesNotMatch(css,/grid-template-columns|grid-column:|grid-row:/);
});

test('spacing carries independently of layout snapshots and exports mobile-up aliases',()=>{
 const state=defaultState();const a=addTransition(state,48),b=addTransition(state,80);
 selectStep(state,a.id);editSpacing(state,'thin');
 selectStep(state,b.id);editSelection(state,{layout:'three-2-3-7'});
 assert.deepEqual(resolvedSteps(state).map(s=>s.spacing),['neat','thin','thin']);
 state.selected='base';editSpacing(state,'wide');
 assert.deepEqual(resolvedSteps(state).map(s=>s.spacing),['wide','thin','thin']);
 state.selected=b.id;editSpacing(state,'neat');
 assert.match(candidateMarkup(state),/gp_spacing--wide gp_md-spacing--thin gp_xl-spacing--neat/);
 editSpacing(state,null);assert.equal(resolvedSteps(state).at(-1).spacing,'thin');
 assert.equal(editSpacing(state,'bad'),false);
 const restored=normalizeState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(resolvedSteps(restored).map(s=>s.spacing),['wide','thin','thin']);
 const legacy=normalizeState({spacing:'wide',steps:[{rem:0,layout:'stack'},{rem:48,layout:'two-3-2'}]});
 assert.deepEqual(resolvedSteps(legacy).map(s=>s.spacing),['wide','wide']);
});
test('moving a transition preserves its selections, reorders safely, and rejects collisions',()=>{
 const state=defaultState(),a=addTransition(state,48),b=addTransition(state,80);
 selectStep(state,a.id);editSpacing(state,'thin');editSelection(state,{layout:'two-3-2'});
 assert.equal(moveTransition(state,a.id,96),true);assert.deepEqual(state.steps.map(s=>s.rem),[0,80,96]);
 assert.equal(state.selected,a.id);assert.equal(activeStep(state).id,a.id);
 assert.equal(a.spacing,'thin');assert.equal(a.layout,'two-3-2');
 assert.equal(moveTransition(state,a.id,80),false);assert.equal(moveTransition(state,'base',30),false);assert.equal(moveTransition(state,b.id,60),false);
 assert.match(candidateMarkup(state),/gp_2xl--two-3-2/);assert.match(candidateMarkup(state),/gp_2xl-spacing--thin/);
});

test('mosaic-only sequences need no capture while future rules retain their root dependency',()=>{
 const state=defaultState();const later=addTransition(state,80);selectStep(state,later.id);
 editSelection(state,{layout:'mosaic-6'});editSpacing(state,'thin');state.width=375;
 assert.deepEqual(rulerClasses(state),['gp_ruler']);assert.doesNotMatch(candidateMarkup(state),/gp_ruler--measure/);
 for(const measure of [true,false])assert.equal(needsRulerMeasurement(normalizeState({...state,measure})),false,'legacy measurement toggle is ignored');
 const ruled=addTransition(state,96);selectStep(state,ruled.id);editSelection(state,{layout:'three-1-2-1'});editSpacing(state,'ruled');
 assert.equal(needsRulerMeasurement(state),true,'later rules retain capture even while a mosaic is previewed');
 state.steps=state.steps.filter(s=>s.id!==ruled.id);assert.equal(needsRulerMeasurement(state),false);
});

test('Ruled sequences derive measurement and explicit end ownership without author CSS',()=>{
 const state=defaultState();
 editSpacing(state,'ruled');assert.equal(needsColumnRules(state),false,'a Stack has no column rule');
 const later=addTransition(state,48);selectStep(state,later.id);editSelection(state,{layout:'three-1-2-1'});
 assert.equal(needsRulerMeasurement(state),true);assert.equal(needsColumnRules(state),true);
 assert.match(candidateMarkup(state),/gp_ruler gp_ruler--measure/);
 assert.equal((candidateMarkup(state).match(/class="gp_rule--end"/g)||[]).length,state.count);
 assert.equal((sourceMarkup(state.count,true).match(/gp_rule--end/g)||[]).length,state.count);
 editSelection(state,{layout:'mosaic-6'});
 assert.equal(needsColumnRules(state),false);assert.equal(needsRulerMeasurement(state),false);
 assert.match(countMessage('mosaic-6',6,{spacing:'ruled'}),/Neat or Thin/);
});


test('legacy padding links migrate into the base transition without activating measurement',()=>{
 const initial=defaultState();assert.equal(initial.steps[0].padding,0);assert.equal(needsRulerMeasurement(initial),false);
 for(const bits of [1,2]){
  const legacy=normalizeState({itemSpacing:true,paddingBits:bits,steps:[{rem:0,layout:'stack'},{rem:48,layout:null}]});
  assert.deepEqual(resolvedSteps(legacy).map(s=>s.padding),[bits,bits]);
  assert.equal(needsRulerMeasurement(legacy),false);
  assert.match(candidateMarkup(legacy),new RegExp(`<article class="${bits===1?'gp_pad':'gp_pad--2'}">`));
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(legacy))),legacy);
 }
 assert.equal(normalizeState({itemSpacing:true}).steps[0].padding,1);
 assert.equal(normalizeState({itemSpacing:'true'}).steps[0].padding,0);
 const safe=normalizeState({steps:[{rem:0,layout:'stack',padding:'2'},{rem:48,layout:null,padding:99}]});
 assert.deepEqual(resolvedSteps(safe).map(s=>s.padding),[0,0]);
 assert.doesNotMatch(candidateMarkup(safe),/gp_pad|gp_ruler--measure|<style/);
});

test('padding carries independently and emits only changes including explicit zero resets',()=>{
 const state=defaultState();editPadding(state,1);const before=candidateMarkup(state);
 const md=addTransition(state,48);selectStep(state,md.id);
 assert.equal(candidateMarkup(state),before,'inherited transition adds no padding classes');
 editSelection(state,{layout:'three-1-2-1'});editSpacing(state,'thin');
 assert.equal(activeStep(state).padding,1,'layout/gutter choices retain padding');
 editPadding(state,2);const xl=addTransition(state,80);selectStep(state,xl.id);
 assert.deepEqual(resolvedSteps(state).map(s=>s.padding),[1,2,2]);
 editPadding(state,0);assert.deepEqual(itemSpacingClasses(state),['gp_pad','gp_md-pad--2','gp_xl-pad--0']);
 assert.match(candidateMarkup(state),/class="gp_pad gp_md-pad--2 gp_xl-pad--0"/);
 assert.equal(needsRulerMeasurement(state),false);
 editPadding(state,null);assert.deepEqual(itemSpacingClasses(state),['gp_pad','gp_md-pad--2']);
 assert.equal(editPadding(state,3),false);assert.equal(editPadding(state,'2'),false);
 moveTransition(state,md.id,64);assert.deepEqual(itemSpacingClasses(state),['gp_pad','gp_lg-pad--2']);
 state.steps=state.steps.filter(s=>s.id!==md.id);assert.deepEqual(itemSpacingClasses(state),['gp_pad']);
 assert.equal(resolvedSteps(state).at(-1).padding,1,'removing transition restores previous padding');
});

test('vertical spacing defaults preserve library behavior and carry independently at authored viewports',()=>{
 const state=defaultState();assert.equal(resolvedSteps(state)[0].verticalSpacing,null);
 assert.doesNotMatch(candidateMarkup(state),/vertical-spacing/);
 state.spacing='thin';state.steps[0].layout='mosaic-6';assert.doesNotMatch(candidateMarkup(state),/vertical-spacing|gp_ruler--measure/);
 assert.equal(editVerticalSpacing(state,0),true);assert.ok(sequenceClasses(state).includes('gp_vertical-spacing--0'));
 editVerticalSpacing(state,null);const md=addTransition(state,48);state.selected=md.id;editVerticalSpacing(state,2);
 const xl=addTransition(state,80);state.selected=xl.id;
 assert.deepEqual(resolvedSteps(state).map(s=>s.verticalSpacing),[null,2,2]);
 assert.ok(sequenceClasses(state).includes('gp_md-vertical-spacing--2'));
 editSpacing(state,'neat');editPadding(state,1);editSelection(state,{layout:'three-1-2-1'});
 assert.equal(resolvedSteps(state).at(-1).verticalSpacing,2);
 editVerticalSpacing(state,0);assert.ok(sequenceClasses(state).includes('gp_xl-vertical-spacing--0'));
 editVerticalSpacing(state,null);assert.ok(!sequenceClasses(state).some(c=>c==='gp_xl-vertical-spacing--0'));
 const restored=normalizeState(JSON.parse(JSON.stringify(state)));assert.deepEqual(resolvedSteps(restored).map(s=>s.verticalSpacing),[null,2,2]);
 assert.deepEqual(resolvedSteps(normalizeState({steps:[{rem:0,layout:'stack',verticalSpacing:'2'},{rem:48,layout:null,verticalSpacing:99}]})).map(s=>s.verticalSpacing),[null,null]);
 assert.equal(editVerticalSpacing(state,3),false);assert.equal(needsRulerMeasurement(state),false);
 assert.doesNotMatch(candidateMarkup(state),/<style/);
});
