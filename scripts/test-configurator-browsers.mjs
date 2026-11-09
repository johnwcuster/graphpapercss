import {catalogueKind,relationship,widthOrder,proportionChoices} from '../docs/sequence/catalogue-navigation.mjs';
import {launchBrowser} from './lib/browser-launch.mjs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { arrangements, defaultState, candidateMarkup, sourceMarkup, needsRulerMeasurement, needsColumnRules, placementsFor, activeStep, exactTuple } from '../docs/sequence/model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),port=4196,origin=`http://127.0.0.1:${port}`;
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Unknown engine');
const docsOnly=process.argv.includes('--docs-only'), publicPath=docsOnly?'':'/docs';
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,GRAPHPAPER_PORT:String(port),...(docsOnly?{GRAPHPAPER_ROOT:fileURLToPath(new URL('../docs/',import.meta.url))}:{})},stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const frame=page.frameLocator('#preview');
 const ready=()=>page.waitForFunction(()=>document.querySelector('#preview')?.dataset.ready==='true');
 const open=async (state,{spacing=true}={})=>{await page.goto(`${origin}${publicPath}/configurator.html${state?`?state=${encodeURIComponent(JSON.stringify(state))}`:''}`);await ready();if(spacing)await page.locator('#spacing-controls').evaluate(n=>n.open=true);};
 const width=async n=>{await page.locator('#width-number').fill(String(n));await page.locator('#width-number').press('Tab');await ready();assert.equal(await frame.locator('body').evaluate(()=>innerWidth),n);};
 const choose=async id=>{
  const p=arrangements.find(p=>p.id===id),kind=catalogueKind(p);
  if(await page.locator('#family').inputValue()!==kind){await page.locator('#family').selectOption(kind);await ready();}
  if(kind==='regions'){
   const count=page.locator(`input[name="region-count"][value="${p.family}"]`);if(!await count.isChecked()){await count.check();await ready();}
   const relation=page.locator(`input[name="width-relationship"][value="${relationship(p)}"]`);if(!await relation.isChecked()){await relation.check();await ready();}
   if(relationship(p)!=='equal'){
    const order=page.locator(`input[name="width-order"][value="${widthOrder(p)}"]`);if(!await order.isChecked()){await order.check();await ready();}
    const choices=proportionChoices(p),index=choices.findIndex(q=>q.id===id);
    if(choices.length>1){await page.locator('#proportion').evaluate((n,index)=>{n.value=String(index);n.dispatchEvent(new Event('change',{bubbles:true}));},index);await ready();}
   }
  }else if(kind!=='stack'){await page.locator(`input[name="simple-layout"][value="${id}"]`).check();await ready();}
  assert.match(await page.locator('.selected-layout code').textContent(),new RegExp(`--${id}$`));
 };
 await open(undefined,{spacing:false});assert.equal(await page.locator('[data-step]').count(),1);
 assert.equal(await page.locator('#spacing-controls').evaluate(n=>n.open),false,'spacing starts collapsed');
 assert.match(await page.locator('#spacing-summary').textContent(),/Neat.*vertical default.*padding none/);
 assert.equal(await page.locator('#spacing').isVisible(),false);
 const positions=await page.locator('#layout-editor').evaluate(n=>[n.querySelector('#family'),n.querySelector('#refinements'),n.querySelector('#spacing-controls')].map(e=>[...n.querySelectorAll('*')].indexOf(e)));
 assert.ok(positions[0]<positions[1]&&positions[1]<positions[2],'layout and placement precede spacing');
 await page.locator('#spacing-controls > summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#spacing').isVisible(),true);

 assert.equal(await frame.locator('.library-entry').count(),6);
 assert.equal(await frame.locator('link[href="../assets/graph-paper/main.css"]').count(),1);
 assert.equal(await page.locator('#ruler-scale').isVisible(),false);
 await page.locator('.preview-controls .overlay-menu summary').click();await page.locator('#ruler').check();await ready();
 assert.equal(await page.locator('#ruler-scale').isVisible(),true);assert.equal(await frame.locator('body').evaluate(n=>n.classList.contains('show-ruler')),true);
 await page.locator('#ruler').uncheck();await ready();assert.equal(await page.locator('#ruler-scale').isVisible(),false);await page.locator('.preview-controls .overlay-menu summary').click();
 const initial=await page.locator('#markup').textContent();
 await page.locator('#add-transition-menu summary').click();await page.locator('[data-add-rem="48"]').click();await ready();
 assert.equal(await page.locator('#markup').textContent(),initial,'new transition inherits without exporting a class');
 await choose('two-3-2');
 await page.locator('#config-allocation').selectOption('stronger');await ready();
 assert.match(await page.locator('#markup').textContent(),/gp_md-allocation--stronger/);
 await page.locator('#add-transition-menu summary').click();await page.locator('[data-add-rem="80"]').click();await ready();
 assert.match(await page.locator('.selected-layout code').textContent(),/--two-3-2$/);
 await choose('three-2-3-7');
 assert.match(await page.locator('#markup').textContent(),/gp_xl-allocation--closest/,'new family resets inherited refinements');
 await width(767);assert.match(await page.locator('#timeline [data-preview][aria-pressed="true"] strong').textContent(),/Stack/);
 await width(768);assert.match(await page.locator('#timeline [data-preview][aria-pressed="true"] strong').textContent(),/Two/);
 await width(1280);assert.match(await page.locator('#timeline [data-preview][aria-pressed="true"] strong').textContent(),/Three/);
 // Export needs no configurator JavaScript. Compare real computed placements at boundaries.
 const state=defaultState();state.steps.push({id:'t1',rem:48,layout:'two-3-2',config:{allocation:'stronger'}},{id:'t2',rem:80,layout:'three-2-3-7'});
 const exportStylesheet=await page.locator('#core-stylesheet-link').evaluate(n=>n.href);
 assert.equal(exportStylesheet,`${origin}${publicPath}/assets/graph-paper/main.css`);
 const exported=await browser.newPage({javaScriptEnabled:false});
 for(const n of [767,768,1279,1280,1600]){
  await width(n);await exported.setViewportSize({width:n,height:900});
  await exported.setContent(`<link rel="stylesheet" href="${exportStylesheet}"><link rel="stylesheet" href="${origin}${publicPath}/sequence/preview.css">${candidateMarkup(state).replace(/(<section[^>]*>)[\s\S]*?(<\/section>)/,(_,start,end)=>start+sourceMarkup(state.count,needsColumnRules(state))+end)}`,{waitUntil:'load'});
  const positions=()=>nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {x:r.x,w:r.width,row:s.gridRowStart,end:s.gridRowEnd};});
  const live=await frame.locator('#composition > article').evaluateAll(positions()),copy=await exported.locator('section > article').evaluateAll(positions());
  assert.deepEqual(live,copy,`export matches live preview at ${n}px`);
 }
 // Exact refinements reset across family transitions, including into an unmeasured mosaic.
 const sequence={...defaultState(),count:6,spacing:'thin',measure:true,steps:[
  {id:'base',rem:0,layout:'two-3-2',config:{arrangement:'first-above',exact:{left:2,right:3}}},
  {id:'t1',rem:48,layout:'three-2-3-7',config:{exact:{left:2,center:1,right:3}}},
  {id:'t2',rem:80,layout:'four-6-5-4-3'},
  {id:'t3',rem:96,layout:'mosaic-6'}
 ]};
 await open(sequence);
 for(const n of [767,768,1279,1280,1535,1536]){
  await width(n);const step=activeStep(sequence,n);
  const expected=placementsFor(step.layout,6,{spacing:'thin',measured:true,...step.config});
  assert.equal(await frame.locator('main.gp_ruler--measure').count(),Number(needsRulerMeasurement(sequence)));
  const actual=await frame.locator('#composition > article').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node);return {start:Number(s.gridColumnStart),row:Number(s.gridRowStart),span:Number(s.getPropertyValue('--_gp-tracks'))};}));
  expected.forEach((p,i)=>{assert.equal(actual[i].start,p.start+1,`responsive ${n}/${i} start`);assert.equal(actual[i].span,p.span);assert.equal(actual[i].row,p.row);});
 }
 // Source increment can be operated with a native keyboard button.
 await page.locator('#add-item').focus();await page.keyboard.press('Enter');await ready();assert.equal(await frame.locator('article.library-entry').count(),7);
 // Shared catalogue geometry, exact requests, mosaic gates, and overflow.
 const cases=[
  ['peers-4',9,'wide',false,{}],['two-3-2',6,'thin',false,{arrangement:'first-above',exact:{left:2,right:3}}],
  ['three-2-3-7',12,'neat',false,{exact:{left:5,center:3,right:4}}],
  ['three-2-3-7',11,'neat',false,{exact:{left:5,center:3,right:4}}],
  ['four-6-5-4-3',9,'wide',false,{allocation:'stronger',traversal:'widest-first'}],
  ['mosaic-8',8,'thin',false,{}],['mosaic-8',8,'thin',true,{}],['mosaic-8',8,'neat',false,{}],['mosaic-8',9,'neat',false,{}],['mosaic-13',14,'thin',true,{}]
 ];
 for(const [id,count,spacing,measure,config] of cases){
  const s={...defaultState(),width:1600,count,spacing,measure,steps:[{id:'base',rem:0,layout:id,config}]};await open(s);
  const expected=placementsFor(id,count,{spacing,measured:needsRulerMeasurement(s),...config,exact:exactTuple(id,{exact:config.exact??{}})});
  assert.equal(await frame.locator('main.gp_ruler--measure').count(),Number(needsRulerMeasurement(s)));
  const actual=await frame.locator('#composition > article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.x,w:r.width,row:Number(s.gridRowStart),rowspan:Number(s.gridRowEnd.replace('span ',''))};}));
  expected.forEach((p,i)=>{assert.ok(Math.abs(actual[i].x-p.start*25)<1,`${engine}/${id}/${count}/${measure}/${i} start`);assert.ok(Math.abs(actual[i].w-p.span*25)<1,`${id}/${i} span`);assert.equal(actual[i].row,p.row);assert.equal(actual[i].rowspan,p.rowspan);});
 }
 // Thin mosaics need no measurement, including at a future viewport transition.
 const autoMeasure={...defaultState(),width:375,steps:[{id:'base',rem:0,layout:'stack'},{id:'later',rem:80,layout:'mosaic-6',spacing:'thin'}]};
 await open(autoMeasure);assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_ruler--measure/);
 await width(1280);await page.locator('#spacing').selectOption('neat');await ready();assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 await page.locator('#spacing').selectOption('thin');await ready();assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 await choose('three-2-3-7');assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 // Invalid count selections stay selectable and explain fallback.
 await open({...defaultState(),count:14,width:1600});await choose('mosaic-6');assert.match(await page.locator('#selection-warning').textContent(),/Needs 6 items exactly/);
 // Restored URLs retain exact requests; obsolete measurement flags are ignored.
 const restored={...defaultState(),count:12,width:1600,measure:true,steps:[{id:'base',rem:0,layout:'three-2-3-7',config:{exact:{left:5,center:3,right:4}}}]};
 await open(restored);await page.reload();await ready();assert.equal(await page.locator('#measure').count(),0);assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 await page.locator('#exact-controls summary').click();assert.equal(await page.locator('input[name="exact-choice"][value="5-3-4"]').isChecked(),true);assert.match(await page.locator('#exact-status').textContent(),/Exact counts applied/);
 await page.locator('input[name="exact-choice"][value="3-5-4"]').check();await ready();assert.match(await page.locator('#exact-status').textContent(),/Exact counts applied: 3 \+ 5 \+ 4/);
 assert.match(await page.locator('#markup').textContent(),/--gp-exact-count-left: 3/);assert.doesNotMatch(await page.locator('#markup').textContent(),/<style|library-entry|Start with a 64-bit ruler/);assert.equal(await page.locator('#stylesheet-export').count(),0);assert.equal(await frame.locator('style').count(),0);
 await page.locator('#remove-item').click();await ready();assert.equal(await page.locator('.retained-request').isVisible(),true);assert.match(await page.locator('#exact-status').textContent(),/Automatic allocation applies/);
 await page.locator('input[name="exact-choice"][value="automatic"]').check();await ready();assert.equal(await page.locator('.retained-request').count(),0);assert.match(await page.locator('#exact-status').textContent(),/Automatic allocation/);
 await page.locator('#add-item').click();await ready();
 // Remove transition with explicit confirmation; no source mutation.
 await page.locator('#add-transition-menu summary').click();await page.locator('[data-add-rem="64"]').click();await ready();
 page.once('dialog',d=>d.accept());await page.locator('#remove-transition').click();await ready();assert.equal(await frame.locator('article.library-entry').count(),12);
 // Timeline threshold controls synchronize the sidebar without changing source or snapshots.
 const spaced={...defaultState(),width:1280,steps:[{id:'base',rem:0,layout:'stack'},{id:'t1',rem:48,layout:'two-3-2'},{id:'t2',rem:80,layout:'three-2-3-7'}]};
 await open(spaced);
 const timelineSelect=page.locator('[data-timeline-threshold]').first();
 assert.equal(await page.locator('#timeline [data-timeline-threshold]').count(),2);
 assert.equal(await timelineSelect.locator('option[value="80"]').evaluate(node=>node.disabled),true,await timelineSelect.evaluate(node=>node.outerHTML));
 assert.equal(await page.locator('#timeline button select').count(),0,'controls are siblings, not nested interactive elements');
 const actionButton=page.locator('#timeline-actions-t2'), actionPanel=page.locator('#timeline-menu-t2');
 assert.equal(await page.locator('#timeline-actions-base').count(),0,'base has no removable transition');
 const beforeActions=await frame.locator('body').evaluate(()=>innerWidth);
 await actionButton.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('#timeline-actions-t2').getAttribute('aria-expanded')==='true');
 assert.equal(await actionPanel.isVisible(),true);assert.equal(await frame.locator('body').evaluate(()=>innerWidth),beforeActions,'opening actions does not select the preview');
 const panelBox=await actionPanel.boundingBox();assert.ok(panelBox.x>=0&&panelBox.x+panelBox.width<=1440);
 await mkdir(new URL('../test-results/configurator-next/',import.meta.url),{recursive:true});
 await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-timeline-actions.png`,import.meta.url))});
 await timelineSelect.focus();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('#timeline-actions-t2').getAttribute('aria-expanded')==='false');
 assert.equal(await actionButton.evaluate(n=>document.activeElement===n),true);
 await actionButton.click();await page.locator('#preview-heading').click();
 await page.waitForFunction(()=>document.querySelector('#timeline-actions-t2').getAttribute('aria-expanded')==='false');
 await actionButton.click();await timelineSelect.focus();await timelineSelect.selectOption('64');await ready();
 assert.equal(await page.locator('#threshold').inputValue(),'64');assert.equal(await page.locator('#timeline-actions-t2').evaluate(node=>document.activeElement===node),true);
 assert.match(await page.locator('#markup').textContent(),/gp_lg--two-3-2/);assert.equal(await frame.locator('article').count(),6);
 await page.locator('#spacing').selectOption('thin');await ready();
 assert.match(await page.locator('#markup').textContent(),/gp_lg-spacing--thin/);
 await width(1023);assert.equal(await page.locator('#spacing').inputValue(),'neat');
 await width(1024);assert.equal(await page.locator('#spacing').inputValue(),'thin');
 await width(1280);assert.equal(await page.locator('#spacing').inputValue(),'inherit');
 await page.locator('#spacing').selectOption('wide');await ready();assert.match(await page.locator('#markup').textContent(),/gp_xl-spacing--wide/);
 assert.equal(await frame.locator('#composition > article').first().evaluate(n=>getComputedStyle(n).gridColumnStart),'4');
 await page.locator('#spacing').selectOption('inherit');await ready();assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_xl-spacing/);
 // Removing a transition acts on its own snapshot, even when another viewport is active.
 const beforeRemove=await page.locator('#markup').textContent();
 await page.locator('#timeline-actions-t2').click();page.once('dialog',d=>d.dismiss());
 await page.locator('[data-remove-transition="t2"]').click();assert.equal(await page.locator('#markup').textContent(),beforeRemove);
 if(!await page.locator('#timeline-menu-t2').isVisible())await page.locator('#timeline-actions-t2').click();
 page.once('dialog',d=>d.accept());await page.locator('[data-remove-transition="t2"]').click();await ready();
 assert.equal(await page.locator('#timeline-actions-t2').count(),0);assert.match(await page.locator('#markup').textContent(),/gp_xl--three-2-3-7/);assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_lg--two-3-2/);assert.equal(await frame.locator('article').count(),6);
 assert.equal(await page.locator('[data-preview="t3"]').evaluate(n=>document.activeElement===n),true);
 await width(1600);
 // Laptop and phone workspace fit preserves the simulated viewport.
 for(const w of [1000,390]){
  await page.setViewportSize({width:w,height:900});await page.waitForFunction(()=>{const r=document.querySelector('#preview-scroll'),f=document.querySelector('#preview');return f.getBoundingClientRect().width<=r.clientWidth+1;});
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1600);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:1440,height:1000});
 // Browser page zoom reduces the available CSS viewport in both dimensions.
 // Check those geometries, short wide windows and normal narrow/mobile flow.
 assert.equal(await page.locator('.rail').evaluate(n=>getComputedStyle(n).position),'sticky');
 assert.equal(await page.locator('#composition-panel').evaluate(n=>getComputedStyle(n).position),'sticky');
 const focusedVisible=async()=>assert.ok(await page.evaluate(()=>{
  const n=document.activeElement,r=n.getBoundingClientRect();
  return n!==document.body&&r.height>0&&r.top>=0&&r.bottom<=innerHeight+1;
 }),'focused control remains visible in the available height');
 for(const [w,h] of [[720,450],[960,540],[1440,400],[390,844],[320,256]]){
  await page.setViewportSize({width:w,height:h});
  assert.equal(await page.locator('.rail').evaluate(n=>getComputedStyle(n).position),'static');
  assert.equal(await page.locator('#composition-panel').evaluate(n=>getComputedStyle(n).position),'static');
  assert.equal(await page.locator('#composition-panel').evaluate(n=>getComputedStyle(n).overflowY),'visible');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollPaddingTop),'16px');
  await page.locator('#copy-markup').focus();await focusedVisible();
  assert.ok(await page.locator('.rail').evaluate(n=>n.getBoundingClientRect().bottom<=0),'header scrolls clear of the preview and markup');
  await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await focusedVisible();
  await page.locator('#panel-close').click();await focusedVisible();
  assert.equal(await page.locator('#panel-toggle').evaluate(n=>n===document.activeElement),true);
  await page.locator('#panel-toggle').click();await focusedVisible();
  assert.equal(await page.locator('#composition-heading').evaluate(n=>n===document.activeElement),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1600,'workspace reflow preserves the selected preview width');
  if(w===720||w===960){
   await page.locator('#preview-heading').scrollIntoViewIfNeeded();
   await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-zoom-${w}x${h}.png`,import.meta.url))});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 const ruled=defaultState();ruled.width=1024;ruled.steps[0].layout='three-1-2-1';ruled.steps[0].spacing='ruled';
 await open(ruled);assert.equal(await frame.locator('main.gp_ruler--measure').count(),1);
 assert.equal(await frame.locator('#composition > .gp_rule--end').count(),6);assert.equal(await page.locator('#rule-help').isVisible(),true);
 assert.equal(await frame.locator('#composition > article').first().evaluate(n=>getComputedStyle(n,'::after').content),'""');
 assert.match(await page.locator('#markup').textContent(),/class="gp_rule--end"/);
 await page.locator('#spacing').selectOption('wide');await ready();assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 assert.equal(await frame.locator('#composition > .gp_rule--end').count(),0);assert.equal(await page.locator('#rule-help').isVisible(),false);
 await page.locator('#spacing').selectOption('ruled');await ready();await choose('mosaic-6');
 assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);assert.match(await page.locator('#preview-warning').textContent(),/Mosaics use Neat or Thin/);
 // Padding is independently inherited at each viewport; no optional CSS panel.
 const padded={...defaultState(),width:736,steps:[{id:'base',rem:0,layout:'stack'},{id:'two',rem:40,layout:'peers-2'}]};
 await open(padded);
 const padding=()=>frame.locator('#composition > article').first().evaluate(n=>parseFloat(getComputedStyle(n).paddingTop));
 const margin=()=>frame.locator('#composition > article').nth(2).evaluate(n=>parseFloat(getComputedStyle(n).marginTop));
 const near=(a,b)=>assert.ok(Math.abs(a-b)<.06,`${a} ≈ ${b}`);
 assert.equal(await padding(),0);assert.equal(await margin(),0);
 assert.equal(await page.locator('#item-spacing-markup').count(),0);assert.equal(await page.locator('#item-spacing').count(),0);
 assert.equal(await page.locator('#item-padding').inputValue(),'inherit');
 const boxes=await frame.locator('#composition > article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
 near(boxes[0].right,boxes[1].x);near(boxes[0].bottom,boxes[2].y);
 await page.locator('[data-preview="base"]').click();await ready();
 await page.locator('#item-padding').selectOption('1');await ready();
 assert.match(await page.locator('#markup').textContent(),/class="gp_pad"/);
 await width(736);assert.equal(await page.locator('#item-padding').inputValue(),'inherit');near(await padding(),736/64);
 await page.locator('#item-padding').selectOption('2');await ready();near(await padding(),2*736/64);
 assert.match(await page.locator('#markup').textContent(),/gp_pad gp_sm-pad--2/);
 await page.locator('#item-padding').selectOption('0');await ready();assert.equal(await padding(),0);
 assert.match(await page.locator('#markup').textContent(),/gp_sm-pad--0/);
 await page.locator('#item-padding').selectOption('inherit');await ready();near(await padding(),736/64);
 assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_sm-pad--/);
 await page.locator('#item-padding').selectOption('2');await ready();
 await page.locator('#spacing').selectOption('thin');await ready();await choose('three-1-2-1');
 near(await padding(),2*736/64);assert.equal(await page.locator('#spacing').inputValue(),'thin');
 assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 await page.locator('#add-transition-menu summary').click();await page.locator('[data-add-rem="80"]').click();await ready();
 assert.equal(await page.locator('#item-padding').inputValue(),'inherit');near(await padding(),2*1281/64);
 await page.locator('#item-padding').selectOption('0');await ready();assert.equal(await padding(),0);
 await page.waitForFunction(()=>JSON.parse(new URL(location.href).searchParams.get('state')).steps.some(s=>s.rem===80&&s.padding===0));
 await page.reload();await ready();assert.equal(await page.locator('#item-padding').inputValue(),'0');
 await width(1279);near(await padding(),2*1279/64);await width(1280);assert.equal(await padding(),0);
 page.once('dialog',d=>d.accept());await page.locator('#remove-transition').click();await ready();near(await padding(),2*1280/64);
 assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_xl-pad--0/);
 // Older global-padding links still open with the same treatment at every width.
 await open({width:736,itemSpacing:true,paddingBits:2,steps:[{rem:0,layout:'peers-2'}]});
 assert.equal(await page.locator('#item-padding').inputValue(),'2');near(await padding(),2*736/64);
 assert.doesNotMatch(await page.locator('#markup').textContent(),/gp_ruler--measure|<style/);
 await open({...defaultState(),width:1024,spacing:'thin',steps:[{id:'base',rem:0,layout:'mosaic-6',padding:0}]});
 const mosaicMargins=await frame.locator('#composition > article').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).marginTop));
 assert.ok(mosaicMargins.some(m=>parseFloat(m)>0));
 await page.locator('#item-padding').selectOption('1');await ready();
 assert.deepEqual(await frame.locator('#composition > article').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).marginTop)),mosaicMargins);
 await page.locator('#item-padding').selectOption('0');await ready();assert.equal(await padding(),0);assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 // Vertical spacing belongs to the composition and overrides mosaic defaults.
 assert.equal(await page.locator('#vertical-spacing').inputValue(),'default');
 for(const bits of [0,2,1]){
  await page.locator('#vertical-spacing').selectOption(String(bits));await ready();
  const actual=await frame.locator('#composition > article').evaluateAll(ns=>ns.map(n=>({row:Number(getComputedStyle(n).gridRowStart),margin:parseFloat(getComputedStyle(n).marginBlockStart)})));
  for(const n of actual)near(n.margin,n.row>1?bits*1024/64:0);
  assert.match(await page.locator('#markup').textContent(),new RegExp(`gp_vertical-spacing--${bits}`));
 }
 await page.locator('#vertical-spacing').selectOption('default');await ready();
 assert.deepEqual(await frame.locator('#composition > article').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).marginTop)),mosaicMargins);
 await page.locator('#vertical-spacing').selectOption('1');await ready();
 await page.locator('#add-transition-menu summary').click();await page.locator('[data-add-rem="48"]').click();await ready();
 assert.equal(await page.locator('#vertical-spacing').inputValue(),'inherit');
 await page.locator('#vertical-spacing').selectOption('2');await ready();
 assert.match(await page.locator('#markup').textContent(),/gp_vertical-spacing--1 gp_md-vertical-spacing--2/);
 await page.waitForFunction(()=>JSON.parse(new URL(location.href).searchParams.get('state')).steps.some(s=>s.rem===48&&s.verticalSpacing===2));
 await page.reload();await ready();assert.equal(await page.locator('#vertical-spacing').inputValue(),'2');await page.locator('#spacing-controls').evaluate(n=>n.open=true);
 await width(767);near(await frame.locator('#composition > article').evaluateAll(ns=>parseFloat(getComputedStyle(ns.find(n=>Number(getComputedStyle(n).gridRowStart)>1)).marginBlockStart)),767/64);
 await width(768);near(await frame.locator('#composition > article').evaluateAll(ns=>parseFloat(getComputedStyle(ns.find(n=>Number(getComputedStyle(n).gridRowStart)>1)).marginBlockStart)),2*768/64);
 await page.locator('#vertical-spacing').selectOption('0');await ready();
 assert.match(await page.locator('#spacing-summary').textContent(),/vertical zero/);assert.match(await page.locator('#markup').textContent(),/gp_md-vertical-spacing--0/);assert.equal(await frame.locator('main.gp_ruler--measure').count(),0);
 // Every existing selection remains reachable through the staged picker.
 await open({...defaultState(),width:1200});
 for(const p of arrangements){await choose(p.id);assert.match(await page.locator('#markup').textContent(),new RegExp(`gp_layout--${p.id}(?: |")`));}
 console.log(`${engine}: all ${arrangements.length} catalogue entries reached through staged controls.`);
 await choose('two-3-2');assert.equal(await page.locator('#config-arrangement').count(),0,'spanning dropdown replaced rather than duplicated');
 for(const value of ['across','first-above','last-below','first-above-last-below']){
  await page.locator(`input[name="full-width-items"][value="${value}"]`).check();await ready();
  const expected=placementsFor('two-3-2',6,{arrangement:value});
  const actual=await frame.locator('#composition > article').evaluateAll(ns=>ns.map(n=>{const s=getComputedStyle(n);return [Number(s.gridColumnStart),Number(s.gridRowStart),s.gridRowEnd];}));
  assert.deepEqual(actual,expected.map(p=>[p.start+1,p.row,`span ${p.rowspan}`]),`${value}: native placement`);
  if(value!=='across')assert.match(await page.locator('#markup').textContent(),new RegExp(`gp_arrangement--${value}`));
 }
 await page.locator('input[name="full-width-items"][value="first-above-last-below"]').focus();
 await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-full-width-items.png`,import.meta.url))});
 await choose('two-1-2');assert.equal(await page.locator('input[name="full-width-items"][value="first-above-last-below"]').isChecked(),true,'width edits retain full-width items');
 await page.waitForFunction(()=>JSON.parse(new URL(location.href).searchParams.get('state')).steps.some(s=>s.config?.arrangement==='first-above-last-below'));
 await page.reload();await ready();assert.equal(await page.locator('input[name="full-width-items"][value="first-above-last-below"]').isChecked(),true);
 await page.locator('#remove-item').click();await ready();await page.locator('#remove-item').click();await ready();await page.locator('#remove-item').click();await ready();
 assert.match(await page.locator('#selection-warning').textContent(),/at least two supporting items/);
 assert.equal(await page.locator('input[name="full-width-items"][value="first-above-last-below"]').isChecked(),true,'underfilled selection stays selectable');
 await open({...defaultState(),width:1200});await choose('three-1-2-1');assert.equal(await page.locator('input[name="full-width-items"]').count(),0);
 await choose('two-3-2');await page.locator('#config-allocation').selectOption('stronger');await ready();
 await page.locator('#vertical-spacing').selectOption('2');await ready();
 await page.locator('#proportion').focus();await page.locator('#proportion').press('End');await ready();
 assert.equal(await page.locator('.proportion-value').textContent(),(await page.locator('.selected-layout strong').textContent()),'ratio stays beside the proportion input');
 assert.equal(await page.locator('#proportion').evaluate(n=>document.activeElement===n),true,'range focus survives rendering');
 assert.equal(await page.locator('#config-allocation').inputValue(),'stronger');
 assert.equal(await page.locator('#vertical-spacing').inputValue(),'2');
 await page.locator('input[name="width-order"][value="0-1"]').check();await ready();
 assert.match(await page.locator('.selected-layout strong').textContent(),/1 : 5/,'mirror keeps degree of contrast');
 assert.equal(await page.locator('#config-allocation').inputValue(),'stronger');
 assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1200,'catalogue edits keep preview width');
 const savedLayout=(await page.locator('.selected-layout code').textContent()).split('--').at(-1);
 await page.waitForFunction(id=>JSON.parse(new URL(location.href).searchParams.get('state')).steps.some(s=>s.layout===id),savedLayout);
 await page.reload();await ready();assert.equal(await page.locator('input[name="width-order"][value="0-1"]').isChecked(),true,'saved layout reconstructs staged controls');
 assert.equal(await page.locator('#proportion').inputValue(),'7');
 // Public shell: nonmodal panel focus, shortcut restoration, native menu dismissal.
 await open({...defaultState(),width:1600});
 await page.locator('#panel-close').click();
 assert.equal(await page.locator('#composition-panel').isVisible(),false);
 assert.equal(await page.locator('#panel-toggle').evaluate(n=>n===document.activeElement),true);
 assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1600);
 await page.locator('#panel-toggle').click();
 assert.equal(await page.locator('#composition-heading').evaluate(n=>n===document.activeElement),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#composition-panel').isVisible(),false);
 await page.locator('#workbench-hide').click();
 assert.equal(await page.locator('.rail').isVisible(),false);assert.equal(await page.locator('#workbench-show').isVisible(),true);
 await page.keyboard.press('Alt+Shift+KeyG');
 assert.equal(await page.locator('.rail').isVisible(),true);assert.equal(await page.locator('#composition-panel').isVisible(),false,'restore previous panel choice');
 await page.locator('#panel-toggle').click();
 await page.locator('#spacing').focus();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#composition-panel').isVisible(),true,'native controls keep Escape');
 await page.keyboard.press('Alt+Shift+KeyG');await page.locator('#workbench-show').click();
 assert.equal(await page.locator('#composition-panel').isVisible(),true);
 await page.locator('.overlay-menu summary').first().click();await page.locator('#ruler').focus();await page.keyboard.press('Escape');
 assert.equal(await page.locator('.overlay-menu').first().evaluate(n=>n.open),false);
 assert.equal(await frame.locator('body').evaluate(()=>innerWidth),1600);
 await frame.locator('a').first().focus();await page.keyboard.press('Alt+Shift+KeyG');
 await page.waitForFunction(()=>document.querySelector('.rail').hidden);
 await page.locator('#workbench-show').click();
 // Every request resolves inside the static docs application.
 const failed=[];const failResponse=response=>{if(response.url().startsWith(origin)&&response.status()>=400)failed.push(response.url());};
 page.on('response',failResponse);
 await open();await page.locator('#preview').evaluate(node=>node.contentDocument.querySelector('img').decode());
 await page.goto(`${origin}${publicPath}/configurator-help.html`);assert.equal(await page.locator('h1').textContent(),'Configurator help');
 const legacyQuery='?grid=grid_03c&set=set_06&flow=flow_01&width=1024';
 await page.goto(`${origin}${publicPath}/configurator.html${legacyQuery}`);
 await page.waitForURL(`**/configurator-0.4.html${legacyQuery}`);
 await page.waitForFunction(()=>document.querySelectorAll('#composition > article').length===6);
 assert.match(await page.locator('#markup').textContent(),/grid_03c/);
 assert.deepEqual(failed,[],'no failed public assets or legacy references');page.off('response',failResponse);
 await open({...defaultState(),width:1280,steps:[{id:'base',rem:0,layout:'stack'},{id:'wide',rem:48,layout:'three-2-3-7'}]});
 await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-public.png`,import.meta.url))});
 await choose('four-4-5-6-3');await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-catalogue-four.png`,import.meta.url))});
 await page.setViewportSize({width:390,height:844});await page.locator('#panel-close').click();
 await page.screenshot({path:fileURLToPath(new URL(`../test-results/configurator-next/${engine}-mobile.png`,import.meta.url))});
 const out=new URL('../test-results/configurator-next/',import.meta.url);await mkdir(out,{recursive:true});
 await page.screenshot({path:fileURLToPath(new URL(`${engine}.png`,out))});
 assert.deepEqual(errors,[]);
 console.log(`${engine}: shared catalogue, transition inheritance, boundary/export parity, exact counts, mosaic gates, overflow, URL restore, removal, display scaling, keyboard focus, legacy routing, static docs deployment, and optional ruler-based item padding passed${docsOnly?' (docs-only root)':''}.`);
}finally{await browser?.close();server.kill();}
