import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {placements} from '../../src/core/geometry.mjs';
import {fourSearchCoefficientScalars} from '../../src/core/four-search.mjs';
import {privateNames} from './core-private-names.mjs';

export async function checkParentCacheIntegration({page,root,set,check,base,url}){
 for(const profile of ['source','minified','queries-off']){
  await page.goto(url);
  const link=page.locator('link[href*="/css/main"]');
  if(profile==='minified')await link.evaluate(n=>new Promise((resolve,reject)=>{n.onload=resolve;n.onerror=reject;n.href=n.href.replace('main.css','main.min.css');}));
  if(profile==='queries-off'){
   const css=await readFile(new URL('../../css/main.css',import.meta.url),'utf8');
   await link.evaluate(n=>n.disabled=true);
   await page.addStyleTag({content:css.replaceAll('@container style(','@container style(--_gp-parent-probe:1) and style(')});
  }
  const name=n=>profile==='minified'?privateNames[n]:n;
  const outer={...base,id:'four-6-5-4-3',count:4,spacing:'wide'};
  const inner={...base,id:'four-3-6-5-4',count:13,spacing:'thin',allocation:'stronger',traversal:'widest-first'};
  await set(outer);
  const items=Array.from({length:13},(_,i)=>`<article>Inner source ${i+1}.</article>`).join('');
  await root.evaluate((n,items)=>n.innerHTML=`<article class="gp_continue_tracks"><section id="cache-continued" class="gp_layout--four-3-6-5-4 gp_spacing--thin gp_allocation--stronger gp_traversal--widest-first">${items}</section></article><article class="gp_continue_tracks"><section id="cache-rebased" class="gp_rebase_64 gp_layout--four-6-5-4-3 gp_spacing--neat">${items}</section></article><article>Third</article><article><p id="cache-leaf">Ordinary content.</p></article>`,items);
  const continued=page.locator('#cache-continued'),rebased=page.locator('#cache-rebased');
  for(const state of [outer,{...outer,id:'four-3-4-6-5',allocation:'stronger',traversal:'widest-first'},outer]){
   await root.evaluate((n,s)=>n.className=`gp_ruler gp_layout--${s.id} gp_spacing--wide gp_allocation--${s.allocation} gp_traversal--${s.traversal}`,state);
   await check(state);await check(inner,{target:continued,tracks:placements(state)[0].span});
   await check({...base,id:'four-6-5-4-3',count:13},{target:rebased});
  }
  const cacheName=name('--_gp-f-h0');
  await root.evaluate((n,key)=>n.style.setProperty(key,'777'),cacheName);
  assert.equal(await root.locator(':scope>:first-child').evaluate((n,key)=>Number(getComputedStyle(n).getPropertyValue(key)),cacheName),777,'direct participant receives computed parent cache');
  assert.equal(await page.locator('#cache-leaf').evaluate((n,key)=>Number(getComputedStyle(n).getPropertyValue(key)),cacheName),0,'ordinary content does not inherit cache');
  await root.evaluate((n,key)=>n.style.removeProperty(key),cacheName);
  const keys=fourSearchCoefficientScalars.map(n=>name(`--_gp-f-${n}`));
  const take=()=>continued.evaluate((n,keys)=>{const s=getComputedStyle(n);return keys.map(key=>s.getPropertyValue(key));},keys);
  const before=await take();
  await continued.evaluate(n=>n.insertAdjacentHTML('beforeend','<article>Inner source 14.</article>'));
  assert.deepEqual(await take(),before,'cache independent of changing source count');
  await check({...inner,count:14},{target:continued,tracks:placements(outer)[0].span});
  for(const exact of [[2,3,4,5],[0,3,4,5],[2,3,4,5]]){
   await continued.evaluate((n,tuple)=>['left','center-left','center-right','right'].forEach((key,i)=>n.style.setProperty(`--gp-exact-count-${key}`,String(tuple[i]))),exact);
   await check({...inner,count:14,exact},{target:continued,tracks:placements(outer)[0].span});
  }
  await root.evaluate(n=>n.className='gp_ruler gp_layout--four-6-5-4-3 gp_spacing--wide gp_md-allocation--stronger gp_lg-traversal--widest-first');
  for(const width of [767,768,1023,1024,1280]){
   await page.setViewportSize({width,height:900});
   const state={...outer,allocation:width>=768?'stronger':'closest',traversal:width>=1024?'widest-first':'left-to-right'};
   await check(state);await check({...inner,count:14,exact:[2,3,4,5]},{target:continued,tracks:placements(state)[0].span});
  }
  await page.setViewportSize({width:1440,height:900});
 }
 await page.goto(url);
}
