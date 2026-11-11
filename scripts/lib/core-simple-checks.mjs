import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {placements} from '../../src/core/geometry.mjs';
import {privateNames} from './core-private-names.mjs';
export async function checkSimpleIntegration({page,root,set,check,base,fixture,url}) {
 for(const profile of ['source','minified','fast-query-off']) {
  await page.goto(url);
  const link=page.locator('link[href*="/css/main"]');
  if(profile==='minified')await link.evaluate(link=>new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=reject;link.href=link.href.replace('main.css','main.min.css');}));
  if(profile==='fast-query-off') {
   await link.evaluate(link=>link.disabled=true);
   await page.addStyleTag({content:(await readFile(new URL('../../css/main.css',import.meta.url),'utf8')).replace('@container style(--_gp-simple:1)','@container style(--_gp-simple:99)')});
  }
  for(const id of ['stack','peers-2','peers-3','peers-4','peers-5','peers-6'])for(const count of [0,1,2,3,6,13,29,65])for(const spacing of ['full','neat','thin','wide']) {
   const state={...base,id,count,spacing};await set(state);await check(state);
   if(count){
    const q=await root.locator(':scope > :first-child').evaluate((n,name)=>Number(getComputedStyle(n).getPropertyValue(name)),profile==='minified'?privateNames['--_gp-f-q']:'--_gp-f-q');
    assert.equal(q,profile==='fast-query-off'?Math.floor(count/4):0,`${profile}/${id}/${count}: unused four-region arithmetic`);
   }
  }
  const state={...base,id:'mosaic-8',count:13,measured:false};await set(state);
  // Opt-in spelling does not determine the family after a public CSS override.
  for(const id of ['stack','four-6-5-4-3','peers-5','three-1-2-1','stack']) {
   await root.evaluate((n,id)=>n.style.setProperty('--gp-layout',`var(--gp-${id})`),id);
   await check({...state,id});
  }
  const outer={...base,id:'two-3-2',count:2};await set(outer);
  await root.evaluate((n,fixture)=>n.innerHTML=`<article class="gp_continue_tracks"><div id="simple-continued" class="gp_layout--peers-3 gp_spacing--thin">${fixture.slice(0,6).join('')}</div></article><article class="gp_continue_tracks"><div id="simple-rebased" class="gp_rebase_64 gp_layout--stack gp_spacing--wide">${fixture.slice(0,6).join('')}</div></article>`,fixture);
  const spans=placements(outer);
  await check({...base,id:'peers-3',count:6,spacing:'thin'},{tracks:spans[0].span,target:page.locator('#simple-continued')});
  await check({...base,id:'stack',count:6,spacing:'wide'},{target:page.locator('#simple-rebased')});
  const simpleOuter={...base,id:'peers-2',count:2};await set(simpleOuter);
  await root.evaluate((n,fixture)=>n.innerHTML=`<article class="gp_continue_tracks"><div id="composed-continued" class="gp_layout--four-6-5-4-3 gp_spacing--thin">${fixture.slice(0,8).join('')}</div></article><article class="gp_continue_tracks"><div id="composed-rebased" class="gp_rebase_64 gp_layout--three-1-2-1 gp_spacing--wide">${fixture.slice(0,12).join('')}</div></article>`,fixture);
  const simpleSpans=placements(simpleOuter);
  await check({...base,id:'four-6-5-4-3',count:8,spacing:'thin'},{tracks:simpleSpans[0].span,target:page.locator('#composed-continued')});
  await check({...base,id:'three-1-2-1',count:12,spacing:'wide'},{target:page.locator('#composed-rebased')});
 }
 await page.goto(url);
}
