import {launchBrowser} from './lib/browser-launch.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {layouts,hinges,spacingModes} from '../src/core/catalogue.mjs';
import {placements,exactCountsEligible,pairExactCountsEligible,fourExactCountsEligible,fourExactAllocations} from '../src/core/geometry.mjs';
import {rankedAllocations} from '../tests/oracles/three-allocation.mjs';
import {enhancementCondition} from '../src/core/compiler.mjs';
import {privateNames} from './lib/core-private-names.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Use chromium, firefox or webkit');
const port={chromium:4280,webkit:4281,firefox:4282}[engine];
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let browser,checks=0;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const url=`http://127.0.0.1:${port}/tests/fixtures/library/`;
 await page.goto(url);
 const root=page.locator('#example');
 const fixture=await page.locator('#records').evaluate(n=>[...n.content.children].map(n=>n.outerHTML));
 async function set(state){
  await root.evaluate((root,{state,fixture})=>{
   const {id,count,spacing,allocation,fewer,traversal='left-to-right',exact=null,arrangement='across'}=state;
   root.className=`gp_ruler ${state.measured===true?'gp_ruler--measure':''} gp_layout--${id} gp_spacing--${spacing} gp_allocation--${allocation} gp_fewer--${fewer} gp_traversal--${traversal} gp_arrangement--${arrangement}`;
   root.removeAttribute('style');
   if(exact)exact.forEach((value,i)=>{if(value!==null&&value!==undefined)root.style.setProperty(`--gp-exact-count-${(exact.length===4?['left','center-left','center-right','right']:exact.length===2?['left','right']:['left','center','right'])[i]}`,String(value));});
   if(root.children.length!==count)root.innerHTML=count<=fixture.length?fixture.slice(0,count).join(''):Array.from({length:count},(_,i)=>`<article>Participant ${i+1}</article>`).join('');
  },{state,fixture});
 }
 async function check(state,{enhanced=true,tracks=64,target=root}={}){
  const actual=await target.evaluate((root,privateNames)=>{
   const r=root.getBoundingClientRect(),s=getComputedStyle(root);
   const exactActive=root.firstElementChild?['t','p','f'].reduce((total,f)=>{
    const style=getComputedStyle(root.firstElementChild),name=`--_gp-${f}-exact-valid`;
    return total+Number(style.getPropertyValue(name)||style.getPropertyValue(privateNames[name]));
   },0):0;
   return {exactActive,x:r.x,y:r.y,w:r.width,h:r.height,rows:s.gridTemplateRows.split(' ').map(parseFloat),gap:parseFloat(s.rowGap)||0,items:[...root.children].map(n=>{
    const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {exactActive,x:r.x,y:r.y,w:r.width,h:r.height,tracks:Number(s.getPropertyValue('--_gp-tracks')),margin:parseFloat(s.marginBlockStart)||0,bit:parseFloat(s.getPropertyValue('--gp-ruler-bit'))||0,start:s.gridColumnStart,row:s.gridRowStart,rowspan:s.gridRowEnd};
   })};
  },privateNames);
  const expected=placements({...state,enhanced,tracks}),label=`${engine}/${state.id}/${state.count}/${state.spacing}/${state.allocation}/${state.fewer}/${state.traversal}/${enhanced}/${tracks}`;
  assert.equal(actual.items.length,expected.length,label);
  const mode=spacingModes[state.spacing],usedStart=Math.min(mode[0],tracks-1),usedEnd=Math.min(mode[1],tracks-usedStart-1);
  assert.equal(actual.exactActive,Number(!!(enhanced&&(state.id.startsWith('four-')&&tracks-usedStart-usedEnd>=4&&fourExactCountsEligible(state.count,state.exact)||state.id.startsWith('three-')&&tracks-usedStart-usedEnd>=3&&exactCountsEligible(state.count,state.exact)||state.id.startsWith('two-')&&state.arrangement&&state.arrangement!=='across'&&tracks-usedStart-usedEnd>=2&&pairExactCountsEligible(state.count-(state.arrangement==='first-above-last-below'?2:1),state.exact)))),`${label}: exact eligibility`);
  for(const [i,p] of expected.entries()){
   const a=actual.items[i];
   assert.ok(Math.abs(a.x-actual.x-p.start*actual.w/tracks)<1,`${label}: item ${i+1} x ${a.x-actual.x} != ${p.start*actual.w/tracks}`);
   assert.ok(Math.abs(a.w-p.span*actual.w/tracks)<1,`${label}: item ${i+1} span ${a.w} != ${p.span*actual.w/tracks}`);
   if(state.id.startsWith('mosaic-'))assert.ok(Math.abs(a.margin-(p.gutterBits??0)*actual.w/tracks)<.1,`${label}: mosaic margin`);
   assert.equal(a.tracks,p.span,`${label}: metadata`);
   if(enhanced){assert.equal(a.row,String(p.row),`${label}: row`);assert.equal(a.rowspan,`span ${p.rowspan}`,`${label}: rowspan`);}
   const y=actual.y+actual.rows.slice(0,p.row-1).reduce((a,b)=>a+b,0)+(p.row-1)*actual.gap+(p.gutterBits??0)*actual.w/tracks;
   // Serialized track sizes round independently to layout units; summing many
   // tiny content-sized rows can drift from the actual row-line coordinate.
   assert.ok(Math.abs(a.y-y)<1+p.row/64,`${label}: item ${i+1} y ${a.y} != ${y}; ${actual.rows.length} tracks; root y ${actual.y}`);
   assert.ok(a.y+a.h<=actual.y+actual.h+1,`${label}: bounds`);
  }
  checks++;
 }
 const base={id:'two-3-2',count:6,spacing:'neat',allocation:'closest',fewer:'left',traversal:'left-to-right'};
 await set(base);await check(base);console.log(`${engine}: initial two-region composition passed.`);
 // Shared three-region engine: accepted ranking, both asymmetric and symmetric
 // counts, and unsupported right-first requests normalize to left-to-right.
 for(const count of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,19,41])for(const traversal of ['left-to-right','center-first','right-to-left']){
  const state={...base,id:'three-1-2-1',count,traversal};await set(state);await check(state);
 }
 console.log(`${engine}: initial automatic three-region allocations passed.`);
 for(const count of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,19,41])for(const allocation of ['closest','stronger'])for(const traversal of ['left-to-right','widest-first','right-to-left','center-first']){
  const state={...base,id:'four-4-6-5-3',count,allocation,traversal};await set(state);await check(state);
 }
 for(const exact of [[2,3,4,3],[1,3,5,3],[2,2,3,5],[3,3,3,3],[1,1,1,9],[0,3,4,5],[1.5,2.5,3,5],[1e20,1,1,1],[2,3,null,3]]){
  const state={...base,id:'four-4-6-5-3',count:12,traversal:'widest-first',exact};await set(state);await check(state);
 }
 for(const count of [11,12,13,12]){const state={...base,id:'four-4-6-5-3',count,traversal:'widest-first',exact:[2,3,4,3]};await set(state);await check(state);}
 console.log(`${engine}: initial four-region automatic/exact placements passed.`);

 for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const count of [0,1,2,3,4,5,6,7,8,13])for(const traversal of ['left-to-right','right-to-left']){
  const state={...base,arrangement,count,traversal};await set(state);await check(state);
 }
 for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const exact of [[1,4],[2,3],[2,4],[3,3],[1,7],[0,5],[1.5,3.5],[1e20,4],[1,1,4]]){
  const state={...base,arrangement,exact};await set(state);await check(state);
 }
 for(const arrangement of ['first-above','last-below','first-above-last-below']){
  const state={...base,arrangement,count:42,traversal:'right-to-left',exact:[19,22]};await set(state);await check(state);
  for(const tracks of [1,2])for(const spacing of ['full','neat']){
   const narrow={...base,arrangement,spacing,exact:[1,4]};await set(narrow);
   await root.evaluate((n,tracks)=>{n.style.setProperty('--_gp-tracks',String(tracks));n.style.gridTemplateColumns=`repeat(${tracks},minmax(0,1fr))`;},tracks);
   await check(narrow,{tracks});
  }
 }
 for(const arrangement of ['first-above','last-below','first-above-last-below']){
  for(const count of [6,8])for(const traversal of ['left-to-right','right-to-left']){
   const state={...base,arrangement,count,traversal,allocation:'stronger',fewer:'right'};await set(state);await check(state);
  }
  // Match the requested total so each rejection exercises validity, not just
  // count mismatch: shared factor 2/3, equal odd groups, or excessive spread.
  for(const [count,exact] of [[7,[2,4]],[10,[3,6]],[7,[3,3]],[11,[5,5]],[9,[1,7]]]){
   const state={...base,arrangement,count,exact};await set(state);await check(state);
  }
 }
 for(const id of ['mosaic-6','mosaic-13'])for(const spacing of ['neat','thin'])for(const measured of [false,true]){
  const state={...base,id,count:Number(id.slice(7)),spacing,measured};await set(state);await check(state);
 }
 console.log(`${engine}: initial measured/unmeasured mosaic placements passed.`);
 const exactBase={...base,id:'three-1-2-1',count:12,traversal:'center-first',exact:[5,3,4]};
 await set(exactBase);await check(exactBase);
 for(const count of [11,12,13,12]){
  await root.evaluate((root,{count,fixture})=>root.innerHTML=fixture.slice(0,count).join(''),{count,fixture});
  await check({...exactBase,count});
 }
 for(const exact of [[5,3,null],[5,3,0],[5,3,-1],[5,3,4.5],[2,4,6],[1,5,6],[1e20,3,4],['garbage',3,4]]){
  await set({...exactBase,exact});await check({...exactBase,exact});
 }
 await set(exactBase);await root.evaluate(n=>n.style.setProperty('--gp-exact-count-left','calc(2 + 3)'));await check(exactBase);
 await set({...exactBase,count:41,exact:[13,15,13]});await check({...exactBase,count:41,exact:[13,15,13]});
 // Ordinary author CSS can supply/refine/remove the same properties.
 await set({...exactBase,exact:null});
 const exactStyle=await page.addStyleTag({content:'.exact-author {--gp-exact-count-left:5;--gp-exact-count-center:3;--gp-exact-count-right:4;}'});
 await exactStyle.evaluate(n=>document.head.prepend(n));await root.evaluate(n=>n.classList.add('exact-author'));await check(exactBase);
 await root.evaluate(n=>n.classList.remove('exact-author'));await check({...exactBase,exact:null});await exactStyle.evaluate(n=>n.remove());
 for(const profile of process.argv.includes('--quick')?[]:['source','minified','fallback']){
  const link=page.locator('link[href*="/css/main"]');
  if(profile==='minified')await link.evaluate(n=>new Promise((resolve,reject)=>{n.onload=resolve;n.onerror=reject;n.href='/css/main.min.css';}));
  let disabled;
  if(profile==='fallback'){
   await link.evaluate(n=>n.disabled=true);
   disabled=await page.addStyleTag({content:(await readFile(new URL('../css/main.css',import.meta.url),'utf8')).replace(enhancementCondition,'not (display:grid)')});
  }
  for(const plan of layouts)for(const count of profile==='fallback'?[1,3,13]:[0,1,2,3,6,13])for(const spacing of Object.keys(spacingModes)){
   const policies=['two','four'].includes(plan.family)&&profile!=='fallback'?['closest','stronger']:['closest'];
   for(const allocation of policies)for(const fewer of plan.family==='two'&&profile!=='fallback'?['left','right']:['left']){
    for(const traversal of plan.family==='two'?['left-to-right','right-to-left']:plan.family==='three'?['left-to-right','center-first','right-to-left']:plan.family==='four'?['left-to-right','widest-first']:['left-to-right']){
     const state={id:plan.id,count,spacing,allocation,fewer,traversal};await set(state);await check(state,{enhanced:profile!=='fallback'});
    }
   }
  }
  for(let count=3;count<=13;count++)for(const choice of rankedAllocations(count))for(const spacing of Object.keys(spacingModes))for(const traversal of ['left-to-right','center-first','right-to-left']){
   const state={...base,id:'three-1-2-1',count,spacing,traversal,exact:choice.counts};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  for(const plan of layouts.filter(p=>p.family==='three'))for(const spacing of Object.keys(spacingModes)){
   const state={...base,id:plan.id,count:12,spacing,traversal:'center-first',exact:[5,3,4]};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  for(const plan of layouts.filter(p=>p.family==='two'))for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const count of [3,6,13])for(const spacing of Object.keys(spacingModes))for(const traversal of ['left-to-right','right-to-left']){
   const state={...base,id:plan.id,arrangement,count,spacing,traversal};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const spacing of Object.keys(spacingModes))for(const traversal of ['left-to-right','right-to-left']){
   const state={...base,arrangement,spacing,traversal,exact:[1,4]};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }

  for(let count=4;count<=13;count++)for(const exact of fourExactAllocations(count))for(const traversal of ['left-to-right','widest-first']){
   const state={...base,id:'four-4-6-5-3',count,traversal,exact};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  for(const plan of layouts.filter(p=>p.family==='four'))for(const spacing of Object.keys(spacingModes))for(const traversal of ['left-to-right','widest-first']){
   const state={...base,id:plan.id,count:12,spacing,traversal,exact:[1,3,5,3]};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  for(const map of layouts.filter(p=>p.family==='mosaic'))for(const spacing of Object.keys(spacingModes))for(const count of [map.count-1,map.count,map.count+1]){
   const state={...base,id:map.id,count,spacing};await set(state);await check(state,{enhanced:profile!=='fallback'});
  }
  if(disabled){await disabled.evaluate(n=>n.remove());await link.evaluate(n=>n.disabled=false);}
  console.log(`${engine}: ${profile} catalogue matrix passed.`);
 }
 // Real integration controls select the compiled three-region classes and
 // expose resolved counts; two-region-only controls remain separate.
 await page.locator('link[href*="/css/main"]').evaluate(n=>new Promise((resolve,reject)=>{
  if(n.href.endsWith('main.min.css'))return resolve();
  n.onload=resolve;n.onerror=reject;n.href='/css/main.min.css';
 }));
 await page.selectOption('#layout','three-1-2-1');await page.selectOption('#count','11');await page.selectOption('#spacing','thin');await page.selectOption('#traversal','center-first');
 await check({...base,id:'three-1-2-1',count:11,spacing:'thin',traversal:'center-first'});
 assert.match(await page.locator('#status').textContent(),/physical counts 4 \+ 3 \+ 4/);
 assert.ok(!(await root.getAttribute('class')).includes('gp_allocation--'));assert.ok(!(await root.getAttribute('class')).includes('gp_fewer--'));
 assert.equal(await page.locator('#allocation').isDisabled(),true);assert.equal(await page.locator('#fewer').isDisabled(),true);assert.equal(await page.locator('#traversal').isDisabled(),false);
 await page.selectOption('#count','3');await page.selectOption('#traversal','right-to-left');await check({...base,id:'three-1-2-1',count:3,spacing:'thin',traversal:'right-to-left'});
 await page.selectOption('#count','4');assert.equal(await page.locator('#traversal').inputValue(),'left-to-right');await check({...base,id:'three-1-2-1',count:4,spacing:'thin'});
 await page.selectOption('#count','12');await page.selectOption('#traversal','center-first');await page.selectOption('#exact-choice','5,3,4');
 await check({...exactBase,spacing:'thin'});assert.match(await page.locator('#exact-status').textContent(),/^Active/);
 assert.match(await page.locator('#markup').textContent(),/With 12 direct items: 5 left, 3 center, 4 right/);assert.match(await page.locator('#markup').textContent(),/--gp-exact-count-left: 5;/);
 await page.screenshot({path:`/tmp/graphpaper-next-exact-${engine}.png`,fullPage:true});
 await page.selectOption('#count','13');await check({...exactBase,count:13,spacing:'thin'});
 assert.match(await page.locator('#exact-status').textContent(),/Inactive: this request needs 12/);assert.match(await page.locator('#markup').textContent(),/Other counts use automatic allocation/);
 await page.selectOption('#count','12');await page.selectOption('#traversal','left-to-right');await check({...exactBase,spacing:'thin',traversal:'left-to-right'});
 await page.click('#clear-exact');await check({...exactBase,spacing:'thin',traversal:'left-to-right',exact:null});assert.equal(await root.evaluate(n=>n.style.getPropertyValue('--gp-exact-count-left')),'');
 await page.selectOption('#layout','two-3-2');await page.selectOption('#arrangement','first-above');await page.selectOption('#count','6');await page.selectOption('#spacing','neat');await page.selectOption('#traversal','left-to-right');
 await check({...base,arrangement:'first-above'});assert.equal(await page.locator('#exact-center').isVisible(),false);assert.match(await page.locator('#status').textContent(),/supporting counts 2 \+ 3/);
 await page.selectOption('#exact-choice','1,4');await check({...base,arrangement:'first-above',exact:[1,4]});
 assert.match(await page.locator('#markup').textContent(),/5 supporting items/);assert.ok(!(await page.locator('#markup').textContent()).includes('--gp-exact-count-center'));
 await page.selectOption('#arrangement','last-below');await check({...base,arrangement:'last-below',exact:[1,4]});assert.match(await page.locator('#markup').textContent(),/last item spans below/);
 await page.screenshot({path:`/tmp/graphpaper-next-spanning-${engine}.png`,fullPage:true});
 await page.selectOption('#count','7');await check({...base,arrangement:'last-below',count:7,exact:[1,4]});assert.match(await page.locator('#exact-status').textContent(),/needs 6 direct items/);
 await page.selectOption('#arrangement','across');await check({...base,count:7});assert.equal(await page.locator('#exact-refinement').isVisible(),false);
 await page.selectOption('#arrangement','first-above-last-below');await page.selectOption('#count','7');
 await check({...base,arrangement:'first-above-last-below',count:7,exact:[1,4]});
 assert.match(await page.locator('#markup').textContent(),/first item spans above and last item spans below/);
 assert.match(await page.locator('#exact-help').textContent(),/N−2/);
 assert.equal(await page.locator('#exact-choice').inputValue(),'1,4');
 await page.selectOption('#arrangement','last-below');await page.selectOption('#count','6');await check({...base,arrangement:'last-below',exact:[1,4]});
 await page.click('#clear-exact');await page.selectOption('#arrangement','across');
 // Native counts above fixture size, all approved allocation intentions.
 for(const count of [19,41,128,129])for(const allocation of ['closest','stronger'])for(const traversal of ['left-to-right','right-to-left']){
  const state={...base,count,allocation,traversal};await set(state);await check(state);
 }
 // Same selection through a public custom property; invalid values stack.
 for(const id of ['two-1-5','three-1-2-1','peers-3','stack']){
  const state={...base,id};await set({...state,id:'stack'});
  await root.evaluate((n,id)=>n.style.setProperty('--gp-layout',`var(--gp-${id})`),id);await check(state);
 }
 for(const allocation of ['closest','stronger'])for(const fewer of ['left','right'])for(const traversal of ['left-to-right','right-to-left']){
  const state={...base,count:7,allocation,fewer,traversal};await set({...state,allocation:'closest',fewer:'left',traversal:'left-to-right'});
  await root.evaluate((n,s)=>{n.style.setProperty('--gp-allocation',`var(--gp-${s.allocation})`);n.style.setProperty('--gp-fewer',`var(--gp-fewer-${s.fewer})`);n.style.setProperty('--gp-traversal',`var(--gp-${s.traversal})`);},state);
  await check(state);
 }
 await set(base);await root.evaluate(n=>n.style.setProperty('--gp-layout','999'));await check({...base,id:'stack'});
 for(const traversal of ['left-to-right','center-first','right-to-left']){
  const state={...base,id:'three-1-2-1',count:traversal==='right-to-left'?3:12,traversal};await set({...state,traversal:'left-to-right'});
  await root.evaluate((n,traversal)=>{n.style.setProperty('--gp-traversal',`var(--gp-${traversal})`);n.style.setProperty('--gp-allocation','var(--gp-stronger)');n.style.setProperty('--gp-fewer','var(--gp-fewer-right)');},traversal);
  await check(state);
 }
 await set(base);
 await set(exactBase);
 const exactLinks=root.locator('a');await exactLinks.first().scrollIntoViewIfNeeded();await exactLinks.first().focus();
 for(let i=0;i<await exactLinks.count();i++){if(i)await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');assert.equal(await exactLinks.nth(i).evaluate(n=>document.activeElement===n),true);}
 // Properties are ignored by non-three selections and reapply on restoration.
 await root.evaluate(n=>n.style.setProperty('--gp-layout','var(--gp-two-3-2)'));await check({...base,count:12,exact:[5,3,4],traversal:'center-first'});
 await root.evaluate(n=>n.style.removeProperty('--gp-layout'));await check(exactBase);
 await set(base);
 // Arrangement CSS selectors, mode restoration, and source-order traversal.
 for(const arrangement of ['first-above','last-below','first-above-last-below']){
  const state={...base,arrangement,count:6,traversal:'right-to-left',exact:[1,4]};await set({...state,arrangement:'across'});
  await root.evaluate((n,arrangement)=>n.style.setProperty('--gp-arrangement',`var(--gp-${arrangement})`),arrangement);await check(state);
  await root.evaluate(n=>n.style.removeProperty('--gp-arrangement'));await check({...state,arrangement:'across'});
  await set(state);
  const links=root.locator('a');await links.first().scrollIntoViewIfNeeded();await links.first().focus();
  for(let i=0;i<await links.count();i++){if(i)await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');assert.equal(await links.nth(i).evaluate(n=>document.activeElement===n),true);}
 }
 // Independent arrangement defaults on continued and rebased nested layouts.
 const spanningOuter={...base,arrangement:'first-above',count:2};await set(spanningOuter);
 await root.evaluate(n=>n.innerHTML=`<article class="gp_continue_tracks"><div id="pair-auto" class="gp_layout--two-3-2 gp_spacing--full">${Array.from({length:6},(_,i)=>`<article>Auto ${i+1}</article>`).join('')}</div></article><article class="gp_continue_tracks"><div id="pair-own" class="gp_rebase_64 gp_layout--two-3-2 gp_spacing--full gp_arrangement--last-below" style="--gp-exact-count-left:1;--gp-exact-count-right:4">${Array.from({length:6},(_,i)=>`<article>Own ${i+1}</article>`).join('')}</div></article>`);
 await check(spanningOuter);
 await check({...base,count:6,spacing:'full'},{tracks:60,target:page.locator('#pair-auto')});
 await check({...base,arrangement:'last-below',count:6,spacing:'full',exact:[1,4]},{tracks:64,target:page.locator('#pair-own')});
 await root.locator(':scope > :first-child').evaluate(n=>n.style.cssText='grid-column:1 / span 1;--_gp-tracks:1');
 await check({...base,count:6,spacing:'full'},{tracks:1,target:page.locator('#pair-auto')});
 await set({...base,count:0});await set(base);
 // Explicit viewport transitions inherit until a later selection replaces them.
 const sequence=['peers-2','three-1-2-1','peers-3','two-3-2','three-2-1-3','stack'];
 await set({...base,id:'stack'});
 await root.evaluate((n,{hinges,sequence})=>n.className+=' '+hinges.map(([,prefix],i)=>`gp_${prefix}--${sequence[i]}`).join(' '),{hinges,sequence});
 for(const [i,[rem]] of hinges.entries())for(const width of [rem*16-1,rem*16,rem*16+1]){
  await page.setViewportSize({width,height:900});await check({...base,id:width<rem*16?(i?sequence[i-1]:'stack'):sequence[i]});
 }
 await page.setViewportSize({width:1440,height:900});await set(base);
 // An ordinary selector loaded before the library overrides zero-specificity aliases.
 const custom=await page.addStyleTag({content:'.author-choice { --gp-layout:var(--gp-peers-2); }'});
 await custom.evaluate(n=>document.head.prepend(n));await root.evaluate(n=>n.classList.add('author-choice'));await check({...base,id:'peers-2'});
 await root.evaluate(n=>n.classList.remove('author-choice'));await check(base);await custom.evaluate(n=>n.remove());
 const nested={...base,allocation:'stronger',fewer:'right',traversal:'right-to-left'};await set(nested);
 // Bridge wrapper preserves parent placement while nested layouts select independently.
 await root.evaluate(n=>n.innerHTML=`<div class="gp_continue_tracks"><div id="continued" class="gp_layout--two-3-2 gp_spacing--full"><article>A</article><article>B</article></div></div><div class="gp_continue_tracks"><div id="rebased" class="gp_rebase_64 gp_layout--two-3-2 gp_spacing--full"><article>C</article><article>D</article></div></div>`);
 await check({...nested,count:2});
 const outer=placements({...nested,count:2});
 await check({...base,count:2,spacing:'full',allocation:'closest'},{tracks:outer[0].span,target:page.locator('#continued')});
 await check({...base,count:2,spacing:'full',allocation:'closest'},{tracks:64,target:page.locator('#rebased')});
 // Three-region nesting under nondefault outer controls and an assigned ruler.
 await root.evaluate(n=>{n.style.setProperty('--gp-exact-count-left','3');n.style.setProperty('--gp-exact-count-center','1');n.style.setProperty('--gp-exact-count-right','2');});
 await root.evaluate(n=>n.innerHTML=`<div class="gp_continue_tracks"><div id="three-continued" class="gp_layout--three-1-2-1 gp_spacing--thin gp_traversal--center-first">${Array.from({length:6},(_,i)=>`<article>Nested ${i+1}</article>`).join('')}</div></div><div class="gp_continue_tracks"><div id="three-rebased" class="gp_rebase_64 gp_layout--three-1-2-1 gp_spacing--wide">${Array.from({length:7},(_,i)=>`<article>Nested ${i+1}</article>`).join('')}</div></div>`);
 await check({...nested,count:2});
 await check({...base,id:'three-1-2-1',count:6,spacing:'thin',traversal:'center-first'},{tracks:outer[0].span,target:page.locator('#three-continued')});
 await check({...base,id:'three-1-2-1',count:7,spacing:'wide'},{tracks:64,target:page.locator('#three-rebased')});
 await page.locator('#three-continued').evaluate(n=>{n.style.setProperty('--gp-exact-count-left','3');n.style.setProperty('--gp-exact-count-center','1');n.style.setProperty('--gp-exact-count-right','2');});
 await check({...base,id:'three-1-2-1',count:6,spacing:'thin',traversal:'center-first',exact:[3,1,2]},{tracks:outer[0].span,target:page.locator('#three-continued')});
 await page.locator('#three-rebased').evaluate(n=>{n.style.setProperty('--gp-exact-count-left','3');n.style.setProperty('--gp-exact-count-center','1');n.style.setProperty('--gp-exact-count-right','3');});
 await check({...base,id:'three-1-2-1',count:7,spacing:'wide',exact:[3,1,3]},{tracks:64,target:page.locator('#three-rebased')});
 await root.locator(':scope > :first-child').evaluate(n=>n.style.cssText='grid-column:1 / span 2; --_gp-tracks:2');
 await check({...base,id:'three-1-2-1',count:6,spacing:'thin',traversal:'center-first',exact:[3,1,2]},{tracks:2,target:page.locator('#three-continued')});
 // Restore the two-region nested fixture for its existing narrow-ruler checks.
 await root.evaluate(n=>n.innerHTML=`<div class="gp_continue_tracks"><div id="continued" class="gp_layout--two-3-2 gp_spacing--full"><article>A</article><article>B</article></div></div><div class="gp_continue_tracks"><div id="rebased" class="gp_rebase_64 gp_layout--two-3-2 gp_spacing--full"><article>C</article><article>D</article></div></div>`);
 // A small inherited ruler stacks rather than manufacturing zero-width positions.
 await page.locator('#continued').evaluate(n=>{n.className='gp_layout--peers-6 gp_spacing--wide';});
 await check({...base,id:'peers-6',count:2,spacing:'wide',allocation:'closest'},{tracks:outer[0].span,target:page.locator('#continued')});
 await root.locator(':scope > :first-child').evaluate(n=>n.style.cssText='grid-column:1 / span 1; --_gp-tracks:1');
 await check({...base,id:'peers-6',count:2,spacing:'wide',allocation:'closest'},{tracks:1,target:page.locator('#continued')});
 await set({...base,count:0});await set(base);
 await set({...base,traversal:'right-to-left'});await check({...base,traversal:'right-to-left'});
 // Hidden direct elements count; comments and whitespace do not add elements.
 await root.evaluate(n=>{n.children[2].style.display='none';n.prepend(document.createComment('not a participant'),document.createTextNode('\n  '));});
 const counted=await root.locator(':scope > article').first().evaluate((n,name)=>Number(getComputedStyle(n).getPropertyValue(name)),privateNames['--_gp-n']);
 assert.equal(counted,6);
 await root.locator(':scope > article').nth(2).evaluate(n=>n.style.removeProperty('display'));
 // Source and native focus order are unchanged.
 const links=root.locator('a');await links.first().scrollIntoViewIfNeeded();await links.first().focus();
 for(let i=0;i<await links.count();i++){
  if(i)await page.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');
  assert.equal(await links.nth(i).evaluate(n=>document.activeElement===n),true);
 }
 await page.selectOption('#arrangement','across');await page.selectOption('#layout','three-1-2-1');await page.selectOption('#count','11');await page.selectOption('#spacing','neat');await page.selectOption('#traversal','center-first');await check({...base,id:'three-1-2-1',count:11,traversal:'center-first'});
 const threeLinks=root.locator('a');await threeLinks.first().scrollIntoViewIfNeeded();await threeLinks.first().focus();
 for(let i=0;i<await threeLinks.count();i++){if(i)await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');assert.equal(await threeLinks.nth(i).evaluate(n=>document.activeElement===n),true);}
 await page.screenshot({path:`/tmp/graphpaper-next-${engine}.png`,fullPage:true});
 const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:1440,height:900}});await noJS.goto(url);
 assert.equal(await noJS.locator('#example > article').count(),6);
 assert.equal(await noJS.locator('#example > article').first().evaluate(n=>getComputedStyle(n).gridColumnStart),'3');
 await noJS.setContent(`<base href="http://127.0.0.1:${port}/"><link rel="stylesheet" href="/css/main.css"><style>img{max-width:100%;height:auto}</style><section id="exact-nojs" class="gp_ruler gp_layout--three-1-2-1 gp_spacing--neat gp_traversal--center-first" style="--gp-exact-count-left:5;--gp-exact-count-center:3;--gp-exact-count-right:4">${fixture.slice(0,12).join('')}</section>`);
 await check(exactBase,{target:noJS.locator('#exact-nojs')});
 await noJS.setContent(`<base href="http://127.0.0.1:${port}/"><link rel="stylesheet" href="/css/main.css"><style>img{max-width:100%;height:auto}</style><section id="span-nojs" class="gp_ruler gp_layout--two-3-2 gp_spacing--neat gp_arrangement--last-below gp_traversal--right-to-left" style="--gp-exact-count-left:1;--gp-exact-count-right:4">${fixture.slice(0,6).join('')}</section>`);
 await check({...base,arrangement:'last-below',traversal:'right-to-left',exact:[1,4]},{target:noJS.locator('#span-nojs')});
 await noJS.close();
 const {checkFourIntegration}=await import('./lib/core-four-checks.mjs');
 await checkFourIntegration({page,root,set,check,base,fixture,url,browser,engine});
 const {checkMosaicIntegration}=await import('./lib/core-mosaic-checks.mjs');
 await checkMosaicIntegration({page,root,set,check,base,fixture,url,browser,engine});
 const {checkResponsiveIntegration}=await import('./lib/core-responsive-checks.mjs');
 await checkResponsiveIntegration({page,root,set,check,base,fixture,url});
 const {checkSimpleIntegration}=await import('./lib/core-simple-checks.mjs');
 const {checkComposedIntegration}=await import('./lib/core-composed-checks.mjs');
 const {checkRowBudgetIntegration}=await import('./lib/core-row-budget-checks.mjs');
 await checkRowBudgetIntegration({page,root,set,check,base,url});
 await checkComposedIntegration({page,root,set,check,base,fixture,url});
 await checkSimpleIntegration({page,root,set,check,base,fixture,url});
 assert.deepEqual(errors,[]);
 await writeFile(`/tmp/graphpaper-next-${engine}.json`,JSON.stringify({engine,checks,quick:process.argv.includes('--quick'),status:'pass'},null,2));
 console.log(`${engine}: ${checks} geometry checks; ${process.argv.includes('--quick')?'quick integration checks (exhaustive profiles skipped)':'source/minified/fallback catalogue matrices'}; selection/viewport parity, nesting, native focus order, and no-JavaScript rendering passed.`);
}finally{await browser?.close();server.kill();}
