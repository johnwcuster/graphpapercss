import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {familyScalarGroups,exactValidationScalars} from '../../src/core/family-optimization.mjs';
import {placements} from '../../src/core/geometry.mjs';
import {privateNames} from './core-private-names.mjs';
export async function checkComposedIntegration({page,root,set,check,base,fixture,url}){
 const families={two:'two-3-2',three:'three-1-2-1',four:'four-6-5-4-3'};
 for(const profile of ['source','minified','cancellation-off','exact-bypass-off']){
  await page.goto(url);
  const link=page.locator('link[href*="css/"]');
  if(profile==='minified')await link.evaluate(n=>new Promise((resolve,reject)=>{n.onload=resolve;n.onerror=reject;n.href=n.href.replace('main.css','main.min.css');}));
  if(profile==='cancellation-off'||profile==='exact-bypass-off'){
   let css=await readFile(new URL('../../css/main.css',import.meta.url),'utf8');
   if(profile==='cancellation-off')for(const family of Object.keys(families))css=css.replaceAll(`@container style(--_gp-${family}:1)`,`@container style(--_gp-${family}:99)`);
   else css=css.replace('@container style(--_gp-exact-l:0)','@container style(--_gp-exact-l:-999)');
   await link.evaluate(n=>n.disabled=true);await page.addStyleTag({content:css});
  }
  // Exercise live zero/nonzero transitions without replacing the participants.
  // Missing/invalid requests must restore automatic allocation; later valid
  // inputs must reactivate validation in source, minified and fallback paths.
  for(const [id,count,arrangement,tuple] of [
   [families.two,7,'first-above-last-below',[1,4]],
   [families.three,12,'across',[5,3,4]],
   [families.four,12,'across',[1,3,5,3]],
  ]){
   const state={...base,id,count,arrangement};await set(state);
   const keys=tuple.length===2?['left','right']:tuple.length===3?['left','center','right']:['left','center-left','center-right','right'];
   for(const exact of [null,tuple,tuple.map(()=>0),tuple,tuple.map((n,i)=>i?n:-1),tuple.map((n,i)=>i?n:null),tuple]){
    await root.evaluate((n,{keys,exact})=>keys.forEach((key,i)=>{
     const name=`--gp-exact-count-${key}`;
     if(exact?.[i]===null||exact?.[i]===undefined)n.style.removeProperty(name);
     else n.style.setProperty(name,String(exact[i]));
    }),{keys,exact});
    await check({...state,exact});
    if((!exact||exact[0]===0||exact[0]===null)&&profile!=='exact-bypass-off'){
     const values=await root.locator(':scope>:first-child').evaluate((n,names)=>{
      const s=getComputedStyle(n);return names.map(name=>Number(s.getPropertyValue(name)));
     },exactValidationScalars.map(name=>profile==='minified'?privateNames[`--_gp-${name}`]:`--_gp-${name}`));
     assert.ok(values.every(value=>value===0),`${profile}/${id}: dormant validation cancelled`);
    }
   }
  }
  for(const [family,id] of Object.entries(families))for(const count of [1,2,3,6,13,29])for(const spacing of ['neat','thin']){
   const state={...base,id,count,spacing};await set(state);await check(state);
   if(count===13){
    const unused=Object.entries(familyScalarGroups).filter(([name])=>name!==family).flatMap(([,names])=>names);
    if(profile!=='cancellation-off'){
     const values=await root.locator(':scope > :first-child').evaluate((n,names)=>{const s=getComputedStyle(n);return names.map(name=>[name,Number(s.getPropertyValue(name))]);},unused.map(name=>profile==='minified'?privateNames[`--_gp-${name}`]:`--_gp-${name}`));
     for(const [name,value] of values)assert.equal(value,0,`${profile}/${family}: unused ${name}`);
    }else{
     const name=family==='four'?'t-q':'f-q';
     assert.ok(await root.locator(':scope > :first-child').evaluate((n,name)=>Number(getComputedStyle(n).getPropertyValue(`--_gp-${name}`))>0,name),'compatibility path still computes inactive family');
    }
   }
  }
  // The resolved public property, not the opt-in class spelling, selects work.
  const state={...base,id:'stack',count:13};await set(state);
  for(const id of Object.values(families)){await root.evaluate((n,id)=>n.style.setProperty('--gp-layout',`var(--gp-${id})`),id);await check({...state,id});}
  const outer={...base,id:'four-6-5-4-3',count:4};await set(outer);
  await root.evaluate((n,fixture)=>n.innerHTML=`<article class="gp_continue_tracks"><section id="cancel-continued" class="gp_layout--two-3-2 gp_spacing--thin">${fixture.slice(0,6).join('')}</section></article><article class="gp_continue_tracks"><section id="cancel-rebased" class="gp_rebase_64 gp_layout--three-1-2-1 gp_spacing--wide">${fixture.slice(0,12).join('')}</section></article><article>Third</article><article>Fourth</article>`,fixture);
  await check(outer);
  await check({...base,id:'two-3-2',count:6,spacing:'thin'},{target:page.locator('#cancel-continued'),tracks:placements(outer)[0].span});
  await check({...base,id:'three-1-2-1',count:12,spacing:'wide'},{target:page.locator('#cancel-rebased')});
 }
 await page.goto(url);
 const {checkParentCacheIntegration}=await import('./core-parent-cache-checks.mjs');
 await checkParentCacheIntegration({page,root,set,check,base,fixture,url});
}
