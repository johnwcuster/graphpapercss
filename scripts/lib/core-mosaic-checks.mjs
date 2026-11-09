import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {layouts,hinges} from '../../src/core/catalogue.mjs';
import {renderedHorizontalSeams} from '../../tests/oracles/mosaic-seams.mjs';
import {privateNames} from './core-private-names.mjs';
export async function checkMosaicIntegration({page,root,set,check,base,fixture,url,browser,engine}){
 const maps=layouts.filter(p=>p.family==='mosaic');
 const state={...base,id:'mosaic-6',count:6,spacing:'thin',measured:true};
 await page.selectOption('#layout','mosaic-6');await page.selectOption('#count','6');await page.selectOption('#spacing','thin');await page.locator('#measure-ruler').check();await check(state);
 assert.equal(await root.locator(':scope > :first-child').evaluate((n,name)=>Number(getComputedStyle(n).getPropertyValue(name)),privateNames['--_gp-f-q']),0,'active mosaic skips ordinary allocation arithmetic');
 assert.ok((await root.getAttribute('class')).includes('gp_ruler--measure'));
 assert.match(await page.locator('#status').textContent(),/mapped mosaic/);assert.match(await page.locator('#markup').textContent(),/Exact map for 6/);
 for(const id of ['allocation','arrangement','fewer','traversal'])assert.equal(await page.locator(`#${id}`).isDisabled(),true);
 assert.equal(await page.locator('#exact-refinement').isVisible(),false);
 await page.locator('#measure-ruler').uncheck();await check({...state,measured:false});assert.match(await page.locator('#status').textContent(),/mapped mosaic/);
 await page.selectOption('#spacing','neat');await check({...state,spacing:'neat',measured:false});
 await page.selectOption('#spacing','wide');await check({...state,spacing:'wide',measured:false});assert.match(await page.locator('#status').textContent(),/choose neat or thin/);
 await page.selectOption('#spacing','thin');await page.locator('#measure-ruler').check();
 await page.selectOption('#count','7');await check({...state,count:7});assert.match(await page.locator('#status').textContent(),/requires exactly 6/);
 await page.selectOption('#layout','mosaic-13');await page.selectOption('#count','13');await check({...state,id:'mosaic-13',count:13});
 await page.selectOption('#count','14');await check({...state,id:'mosaic-13',count:14});
 // The allocation cancellation is optional for correctness; the map remains active without it.
 await set(state);
 const originalCSS=await readFile(new URL('../../css/main.css',import.meta.url),'utf8');
 const lastGate=originalCSS.lastIndexOf('@container style(--_gp-m-enabled:1)');
 const withoutCancellation=originalCSS.slice(0,lastGate)+originalCSS.slice(lastGate).replace('@container style(--_gp-m-enabled:1)','@container style(--_gp-m-enabled:99)');
 const baseLink=page.locator('link[href*="/css/main"]');await baseLink.evaluate(n=>n.disabled=true);
 const restoreBase=async()=>{
  await baseLink.evaluate(n=>n.disabled=false);
  // WebKit may reload a disabled external sheet asynchronously. Wait for the
  // sheet, rather than mistaking an unstyled document for geometry failure.
  await page.waitForFunction(()=>!!document.querySelector('link[href*="/css/main"]')?.sheet);
 };
 const slowPath=await page.addStyleTag({content:withoutCancellation});await check(state);
 assert.equal(await root.locator(':scope > :first-child').evaluate(n=>Number(getComputedStyle(n).getPropertyValue('--_gp-f-q'))),1);
 await slowPath.evaluate(n=>n.remove());await restoreBase();await check(state);
 await baseLink.evaluate(n=>n.disabled=true);
 const blockedDispatch=await page.addStyleTag({content:originalCSS.replaceAll(`style(--gp-layout:${maps.find(p=>p.id===state.id).code})`,'style(--gp-layout:-1)')});
 await check(state,{enhanced:false});await blockedDispatch.evaluate(n=>n.remove());await restoreBase();await check(state);
 // A descendant's unrelated query container must not reinterpret the captured bit.
 await root.locator(':scope > :first-child').evaluate(n=>n.insertAdjacentHTML('beforeend','<div style="container-type:inline-size;width:73px"><span id="captured-bit-probe" style="display:block;width:var(--gp-ruler-bit)">Bit</span></div>'));
 for(const width of [1180,1200]) {
  await root.evaluate((n,width)=>n.style.width=`${width}px`,width);await check(state);
  const bit=await root.evaluate(n=>n.getBoundingClientRect().width/64);
  assert.ok(Math.abs(await page.locator('#captured-bit-probe').evaluate(n=>n.getBoundingClientRect().width)-bit)<.1);
 }
 await root.evaluate(n=>{n.style.removeProperty('width');n.innerHTML='';});await set(state);
 // All maps retain their reviewed geometry without a rem/pixel width floor.
 for(const map of maps)for(const spacing of ['neat','thin'])for(const width of [360,800,1280]){
  await page.setViewportSize({width:Math.max(420,width+48),height:900});
  const s={...state,id:map.id,count:map.count,spacing};await set(s);await check(s);
  const boxes=await root.evaluate(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,items:[...n.children].map(n=>{const r=n.getBoundingClientRect();return {y:r.y,h:r.height};})};});
  assert.deepEqual(renderedHorizontalSeams(boxes.items,boxes.top,boxes.bottom),[],`${map.id}/${spacing}: physical seam`);
 }
 await page.setViewportSize({width:1440,height:900});
 // All six viewport hinges select and release a mosaic from ordinary layouts.
 for(const [rem,prefix] of hinges){
  await set({...state,id:'two-3-2'});
  await root.evaluate((n,prefix)=>n.classList.add(`gp_${prefix}--mosaic-6`),prefix);
  for(const width of [rem*16-1,rem*16,rem*16+1]){
   await page.setViewportSize({width,height:900});await check({...state,id:width<rem*16?'two-3-2':'mosaic-6'});
  }
 }
 await page.setViewportSize({width:1440,height:900});
 // CSS selection overrides use exactly the same metadata and gate as classes.
 await set(state);
 const ordinary=await page.addStyleTag({content:'.ordinary-author{--gp-layout:var(--gp-four-4-6-5-3)}'});await ordinary.evaluate(n=>document.head.prepend(n));
 await root.evaluate(n=>n.classList.add('ordinary-author'));await check({...state,id:'four-4-6-5-3'});
 await root.evaluate(n=>n.classList.remove('ordinary-author'));await check(state);await ordinary.evaluate(n=>n.remove());
 const alternate=await page.addStyleTag({content:'.mosaic-author{--gp-layout:var(--gp-mosaic-6)}'});await alternate.evaluate(n=>document.head.prepend(n));
 await set({...state,id:'stack'});await root.evaluate(n=>n.classList.add('mosaic-author'));await check(state);
 await root.evaluate(n=>n.classList.remove('mosaic-author'));await check({...state,id:'stack'});await alternate.evaluate(n=>n.remove());
 for(const map of maps)for(const tracks of [1,3,8,14,24,30,36,64])for(const spacing of ['neat','thin']){
  const s={...state,id:map.id,count:map.count,spacing};await set(s);
  await root.evaluate((n,tracks)=>{n.style.setProperty('--_gp-tracks',String(tracks));n.style.gridTemplateColumns=`repeat(${tracks},minmax(0,1fr))`;},tracks);
  await check(s,{tracks});
 }
 // Capture an ordinary parent's bit, continue it, and recalculate on rebase.
 const outer={...base,id:'two-1-1',count:2,spacing:'neat',measured:true};await set(outer);
 const items=fixture.slice(0,13).join('');
 await root.evaluate((n,items)=>n.innerHTML=`<article class="gp_continue_tracks"><div id="mosaic-continued" class="gp_layout--mosaic-13 gp_spacing--thin">${items}</div></article><article class="gp_continue_tracks"><div id="mosaic-rebased" class="gp_rebase_64 gp_ruler--measure gp_layout--mosaic-13 gp_spacing--thin">${items}</div></article>`,items);
 await check(outer);
 const assigned=await root.locator(':scope > *').first().evaluate(n=>Number(getComputedStyle(n).getPropertyValue('--_gp-tracks')));
 const inner={...state,id:'mosaic-13',count:13};
 await check(inner,{tracks:assigned,target:page.locator('#mosaic-continued')});await check(inner,{tracks:64,target:page.locator('#mosaic-rebased')});
 const bits=await page.locator('#mosaic-continued > :first-child,#mosaic-rebased > :first-child').evaluateAll(nodes=>nodes.map(n=>parseFloat(getComputedStyle(n).getPropertyValue('--gp-ruler-bit'))));assert.ok(bits[0]>bits[1]);
 assert.equal(await page.locator('#mosaic-continued').evaluate(n=>getComputedStyle(n).containerType),'normal');
 await page.locator('#mosaic-rebased').evaluate(n=>n.classList.remove('gp_ruler--measure'));
 await check({...inner,measured:false},{tracks:64,target:page.locator('#mosaic-rebased')});
 await page.locator('#mosaic-rebased').evaluate(n=>n.classList.add('gp_ruler--measure'));await check(inner,{target:page.locator('#mosaic-rebased')});
 // No root row declarations are introduced; host geometry can be overridden.
 await set(state);
 const authorGap=await page.addStyleTag({content:'#example{row-gap:7px}'});
 assert.equal(await root.evaluate(n=>getComputedStyle(n).rowGap),'7px');await authorGap.evaluate(n=>n.remove());
 await root.evaluate(n=>n.innerHTML=Array.from({length:6},(_,i)=>`<p>${i+1}</p>`).join(''));
 const nativeMargin=await root.locator(':scope > :first-child').evaluate(n=>getComputedStyle(n).marginBlockEnd);
 assert.equal(await root.locator(':scope > :first-child').evaluate(n=>getComputedStyle(n).marginBlockStart),'0px');
 await root.evaluate(n=>n.style.setProperty('--gp-layout','var(--gp-stack)'));
 assert.equal(await root.locator(':scope > :first-child').evaluate(n=>getComputedStyle(n).marginBlockStart),nativeMargin,'UA margin restored when mosaic style gate closes');
 await root.evaluate(n=>{n.innerHTML='';n.style.removeProperty('--gp-layout');});await set(state);
 const authorMargin=await page.addStyleTag({content:'#example>:nth-child(4){margin-block-start:7px}'});
 assert.equal(await root.locator(':scope > :nth-child(4)').evaluate(n=>getComputedStyle(n).marginBlockStart),'7px');
 await root.evaluate(n=>n.style.setProperty('--gp-layout','var(--gp-stack)'));assert.equal(await root.locator(':scope > :nth-child(4)').evaluate(n=>getComputedStyle(n).marginBlockStart),'7px');await authorMargin.evaluate(n=>n.remove());
 // Missing style-query support has a conservative stack branch of its own.
 await set(state);const link=page.locator('link[href*="/css/main"]');await link.evaluate(n=>n.disabled=true);
 const featureOff=await page.addStyleTag({content:(await readFile(new URL('../../css/main.css',import.meta.url),'utf8')).replaceAll('@container style(--_gp-m-enabled:1)','@container style(--_gp-m-enabled:99)')});
 await check(state,{enhanced:false});await featureOff.evaluate(n=>n.remove());await restoreBase();
 // Zero-height content can collapse all implicit rows; no explicit row template
 // or minimum row height remains after the next layout selection.
 for(const map of maps){
  await set({...state,id:map.id,count:map.count,spacing:'neat'});await root.evaluate(n=>[...n.children].forEach(n=>n.innerHTML=''));
  const empty=await page.addStyleTag({content:'#example>*{padding:0!important;border:0!important;margin:0!important;min-height:0!important}'});
  assert.ok(await root.evaluate(n=>n.getBoundingClientRect().height<.1),`${map.id}: empty rows collapse`);await empty.evaluate(n=>n.remove());await root.evaluate(n=>n.innerHTML='');
 }
 for(const map of maps){
  await set({...state,id:map.id,count:map.count});await check({...state,id:map.id,count:map.count});
  const links=root.locator('a');await links.first().scrollIntoViewIfNeeded();await links.first().focus();
  for(let i=0;i<await links.count();i++){if(i)await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');assert.equal(await links.nth(i).evaluate(n=>document.activeElement===n),true);}
 }
 const noJS=await browser.newPage({javaScriptEnabled:false});
 for(const map of maps)for(const spacing of ['neat','thin']){
  await noJS.setContent(`<base href="${url}"><link rel="stylesheet" href="/css/main.css"><style>img{max-width:100%;height:auto}</style><section id="mosaic-static" class="gp_ruler gp_layout--${map.id} gp_spacing--${spacing}">${fixture.slice(0,map.count).join('')}</section>`);
  await check({...state,id:map.id,count:map.count,spacing},{target:noJS.locator('#mosaic-static')});
 }
 await noJS.close();
 // End with a reviewable UI configuration rather than a synthetic test state.
 await page.selectOption('#layout','mosaic-13');await page.selectOption('#count','13');await page.selectOption('#spacing','thin');await page.locator('#measure-ruler').check();
 await check({...state,id:'mosaic-13',count:13});await page.screenshot({path:`/tmp/graphpaper-next-mosaic-${engine}.png`,fullPage:true});
}
