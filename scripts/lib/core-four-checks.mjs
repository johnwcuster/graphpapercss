import assert from 'node:assert/strict';
import {hinges} from '../../src/core/catalogue.mjs';
import {privateNames} from './core-private-names.mjs';
// Additional integration cases use the existing harness's geometry oracle and
// browser lifecycle. No second placement engine, server, or test fixture.
export async function checkFourIntegration({page,root,set,check,base,fixture,url,browser,engine}){
 const state={...base,id:'four-4-6-5-3',count:12,traversal:'left-to-right',spacing:'neat'};
 await page.selectOption('#layout',state.id);await page.selectOption('#count','12');await page.selectOption('#spacing','neat');await page.selectOption('#allocation','closest');await page.selectOption('#traversal','left-to-right');
 assert.equal(await page.locator('#fewer').isDisabled(),true);assert.equal(await page.locator('#allocation').isDisabled(),false);assert.equal(await page.locator('#arrangement').isDisabled(),true);
 assert.equal(await page.locator('#exact-center').isVisible(),false);assert.equal(await page.locator('#exact-center-left').isVisible(),true);assert.equal(await page.locator('#exact-center-right').isVisible(),true);
 await page.selectOption('#exact-choice','2,3,4,3');await check({...state,exact:[2,3,4,3]});
 assert.match(await page.locator('#status').textContent(),/physical counts 2 \+ 3 \+ 4 \+ 3/);
 assert.match(await page.locator('#markup').textContent(),/--gp-exact-count-center-left: 3;/);
 assert.match(await page.locator('#markup').textContent(),/--gp-exact-count-center-right: 4;/);
 await page.selectOption('#traversal','widest-first');await check({...state,traversal:'widest-first',exact:[2,3,4,3]});
 await page.selectOption('#layout','four-3-4-6-5');await check({...state,id:'four-3-4-6-5',traversal:'widest-first',exact:[2,3,4,3]});
 await page.selectOption('#count','11');await check({...state,id:'four-3-4-6-5',count:11,traversal:'widest-first',exact:[2,3,4,3]});assert.match(await page.locator('#exact-status').textContent(),/Inactive: this request needs 12/);
 await page.selectOption('#count','12');await check({...state,id:'four-3-4-6-5',traversal:'widest-first',exact:[2,3,4,3]});assert.match(await page.locator('#exact-status').textContent(),/^Active/);
 // Independent drafts and property capture prevent cross-family interpretation.
 await page.selectOption('#layout','three-1-2-1');await page.selectOption('#exact-choice','5,3,4');await check({...base,id:'three-1-2-1',count:12,exact:[5,3,4],spacing:'neat'});
 await page.selectOption('#layout',state.id);await check({...state,exact:[2,3,4,3]});assert.equal(await root.evaluate(n=>n.style.getPropertyValue('--gp-exact-count-center')),'');
 await page.selectOption('#layout','two-3-2');await page.selectOption('#arrangement','first-above');await page.selectOption('#count','6');await page.selectOption('#exact-choice','1,4');
 await check({...base,arrangement:'first-above',exact:[1,4]});
 await page.selectOption('#layout',state.id);await page.selectOption('#count','12');await check({...state,exact:[2,3,4,3]});
 await page.selectOption('#traversal','widest-first');await page.selectOption('#layout','four-1-1-1-1');assert.equal(await page.locator('#traversal option[value="widest-first"]').evaluate(n=>n.disabled),true);assert.equal(await page.locator('#traversal').inputValue(),'left-to-right');
 await check({...state,id:'four-1-1-1-1',exact:[2,3,4,3]});
 await page.selectOption('#count','3');await check({...state,id:'four-1-1-1-1',count:3,exact:[2,3,4,3]});
 await page.locator('#clear-exact').click();await check({...state,id:'four-1-1-1-1',count:3});
 // Every viewport alias can independently select a four-region arrangement.
 for(const [rem,prefix] of hinges){
  await set({...state,id:'stack',traversal:'widest-first',exact:[2,3,4,3]});
  await root.evaluate((n,prefix)=>n.classList.add(`gp_${prefix}--four-4-6-5-3`),prefix);
  for(const width of [rem*16-1,rem*16,rem*16+1]){
   await page.setViewportSize({width,height:900});
   await check({...state,id:width<rem*16?'stack':state.id,traversal:'widest-first',exact:[2,3,4,3]});
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await set({...state,arrangement:'first-above-last-below',fewer:'right',exact:[2,3,4,3]});
 await check({...state,arrangement:'first-above-last-below',fewer:'right',exact:[2,3,4,3]});
 // CSS overrides follow the selected token, including nominal traversal and
 // the special wide weights, even when the underlying class is a two-region one.
 const cssState={...state,id:'four-9-8-7-6',spacing:'wide',traversal:'widest-first',exact:[2,3,4,3]};
 await set({...cssState,id:'two-3-2'});
 const override=await page.addStyleTag({content:'.four-author {--gp-layout:var(--gp-four-9-8-7-6)}'});await override.evaluate(n=>document.head.prepend(n));
 await root.evaluate(n=>n.classList.add('four-author'));await check(cssState);
 await root.evaluate(n=>n.classList.remove('four-author'));await check({...cssState,id:'two-3-2'});await override.evaluate(n=>n.remove());
 for(const tracks of [1,3,4,14,36])for(const spacing of ['full','neat','thin','wide']){
  const s={...state,spacing,traversal:'widest-first',exact:[2,3,4,3]};await set(s);
  await root.evaluate((n,tracks)=>{n.style.setProperty('--_gp-tracks',String(tracks));n.style.gridTemplateColumns=`repeat(${tracks},minmax(0,1fr))`;},tracks);
  await check(s,{tracks});
 }
 const large={...state,count:68,exact:[16,17,18,17],traversal:'widest-first'};await set(large);await check(large);
 // A failed candidate search stacks; a valid exact request can stand on its own.
 await set(state);
 const failed=await page.addStyleTag({content:'#example > * {'+['--_gp-f-choice',privateNames['--_gp-f-choice']].map(name=>`${name}:0!important;`).join('')+'}'});
 const stack=await root.evaluate(n=>[...n.children].map(n=>({span:getComputedStyle(n).getPropertyValue('--_gp-tracks'),row:getComputedStyle(n).gridRowStart})));
 assert.ok(stack.every((n,i)=>Number(n.span)===60&&Number(n.row)===i+1));
 await root.evaluate(n=>{n.style.setProperty('--gp-exact-count-left','2');n.style.setProperty('--gp-exact-count-center-left','3');n.style.setProperty('--gp-exact-count-center-right','4');n.style.setProperty('--gp-exact-count-right','3');});await check({...state,exact:[2,3,4,3]});await failed.evaluate(n=>n.remove());
 // Native nesting through the explicit continuation wrapper, with independently
 // selected inner controls and full-field metadata after an explicit rebase.
 const outer={...state,count:4,exact:[1,1,1,1],allocation:'stronger',traversal:'widest-first'};await set(outer);
 const items=Array.from({length:12},(_,i)=>`<article>Nested ${i+1}</article>`).join('');
 await root.evaluate((n,items)=>n.innerHTML=`<article class="gp_continue_tracks"><div id="four-continued" class="gp_layout--four-6-5-4-3 gp_spacing--thin">${items}</div></article><article class="gp_continue_tracks"><div id="four-rebased" class="gp_rebase_64 gp_layout--four-3-4-6-5 gp_spacing--wide gp_traversal--widest-first" style="--gp-exact-count-left:1;--gp-exact-count-center-left:3;--gp-exact-count-center-right:5;--gp-exact-count-right:3">${items}</div></article><article>Third</article><article>Fourth</article>`,items);
 await check(outer);
 const assigned=await root.locator(':scope > article').first().evaluate(n=>Number(getComputedStyle(n).getPropertyValue('--_gp-tracks')));
 await check({...state,id:'four-6-5-4-3',spacing:'thin'},{tracks:assigned,target:page.locator('#four-continued')});
 await check({...state,id:'four-3-4-6-5',spacing:'wide',traversal:'widest-first',exact:[1,3,5,3]},{tracks:64,target:page.locator('#four-rebased')});
 // Native Tab preserves the source sequence for both traversals.
 for(const traversal of ['left-to-right','widest-first']){
  const s={...state,traversal,exact:[2,3,4,3]};await set(s);await check(s);
  const links=root.locator('a');await links.first().scrollIntoViewIfNeeded();await links.first().focus();
  for(let i=0;i<await links.count();i++){if(i)await page.keyboard.press(engine==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');assert.equal(await links.nth(i).evaluate(n=>document.activeElement===n),true);}
 }
 // Hidden direct participants still count; native CSS changes membership only
 // when an element is actually removed from the direct source.
 await set({...state,exact:[2,3,4,3]});await root.locator(':scope > :nth-child(5)').evaluate(n=>n.hidden=true);
 assert.equal(await root.locator(':scope > :first-child').evaluate((n,name)=>Number(getComputedStyle(n).getPropertyValue(name)),privateNames['--_gp-n']),12);
 await root.locator(':scope > :nth-child(5)').evaluate(n=>n.hidden=false);await check({...state,exact:[2,3,4,3]});
 await page.screenshot({path:`/tmp/graphpaper-next-four-${engine}.png`,fullPage:true});
 const noJS=await browser.newPage({javaScriptEnabled:false});
 await noJS.setContent(`<base href="${url}"><link rel="stylesheet" href="/css/main.css"><section id="four-static" class="gp_ruler gp_layout--four-4-6-5-3 gp_spacing--neat gp_traversal--widest-first" style="--gp-exact-count-left:2;--gp-exact-count-center-left:3;--gp-exact-count-center-right:4;--gp-exact-count-right:3">${fixture.slice(0,12).join('')}</section>`);
 await check({...state,traversal:'widest-first',exact:[2,3,4,3]},{target:noJS.locator('#four-static')});await noJS.close();
}
