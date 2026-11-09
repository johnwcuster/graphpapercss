import {launchBrowser} from './lib/browser-launch.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {cases,fixture,hostCSS} from '../tests/fixtures/vertical-spacing/shared.mjs';
import {placements} from '../src/core/geometry.mjs';
import {hinges} from '../src/core/catalogue.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
assert.ok(['chromium','firefox','webkit'].includes(engine));
const port=4259,origin=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let browser,checks=0;const near=(a,b,label,tolerance=.12)=>{assert.ok(Math.abs(a-b)<tolerance,`${label}: ${a} != ${b}`);checks++;};
const equal=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const samples=[];
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);const page=await browser.newPage({viewport:{width:1400,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 if(!process.argv.includes('--preview-only')) {
 for(const profile of ['css','min.css']){
  const css=await readFile(new URL(`../test-results/vertical-spacing/experiment.${profile}`,import.meta.url),'utf8');
  for(const width of [640,1200])for(const spacing of ['neat','thin','ruled'])for(const context of ['standalone','continued','rebased']){
   const variants=cases.flatMap(c=>[false,true].flatMap(padding=>[null,0,1,2].map(amount=>({c,padding,amount,key:`${c.key}-${padding}-${amount}`}))));
   await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${variants.map(v=>fixture(v.c,{width,spacing,context,padding:v.padding,amount:v.amount,key:v.key})).join('')}`);
   const actual=await page.locator('[data-map]').evaluateAll(maps=>maps.map(map=>{const r=map.getBoundingClientRect(),s=getComputedStyle(map);return{x:r.x,y:r.y,w:r.width,h:r.height,gap:s.rowGap,rows:s.gridTemplateRows.split(' ').map(parseFloat),items:[...map.children].map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return{x:r.x,y:r.y,w:r.width,h:r.height,margin:parseFloat(s.marginBlockStart),padding:parseFloat(s.paddingTop),col:s.gridColumnStart,row:s.gridRowStart,span:s.gridRowEnd,tracks:Number(s.getPropertyValue('--_gp-tracks'))};})};}));
   for(let i=0;i<variants.length;i++){
    const {c,padding,amount,key}=variants[i],a=actual[i],tracks=context==='continued'?30:64,bit=a.w/tracks,expected=placements({...c,spacing,tracks});
    equal(a.items.length,c.count,key);equal(parseFloat(a.gap)||0,0,`${key}: no native row gap`);equal(a.rows.length,Math.max(...expected.map(p=>p.row+p.rowspan-1)),`${key}: row count`);
    for(let j=0;j<c.count;j++){
     const p=expected[j],n=a.items[j],margin=p.row>1?(amount??p.gutterBits??0)*bit:0;
     near(n.margin,margin,`${key}/${j}: selected amount only at lower starts`);near(n.padding,padding?bit:0,`${key}/${j}: independent padding`);
     equal([Number(n.col),Number(n.row),n.span,n.tracks],[p.start+1,p.row,`span ${p.rowspan}`,p.span],`${key}/${j}: placement unchanged`);
     near(n.x,a.x+p.start*bit,`${key}/${j}: x`);near(n.w,p.span*bit,`${key}/${j}: width`);
     near(n.y,a.y+a.rows.slice(0,p.row-1).reduce((x,y)=>x+y,0)+margin,`${key}/${j}: row edge plus margin`,.75);
     near(n.h+margin,a.rows.slice(p.row-1,p.row+p.rowspan-1).reduce((x,y)=>x+y,0),`${key}/${j}: fills assigned area`,.75);
    }
    // Shared physical boundaries still separate by precisely one bit; no gaps
    // are inserted inside an item's overlapping construction-row span.
    for(let j=0;j<c.count;j++)for(let k=0;k<c.count;k++){
     const p=expected[j],q=expected[k];if(p.row+p.rowspan!==q.row||Math.min(p.start+p.span,q.start+q.span)<=Math.max(p.start,q.start))continue;
     near(a.items[k].y-a.items[j].y-a.items[j].h,(amount??q.gutterBits??0)*bit,`${key}: adjacent content separation`);
    }
    if(amount){const baseline=actual[i-(amount+1)];equal(a.rows.length,baseline.rows.length,`${key}: no new construction rows`);if(profile==='css'&&width===1200&&spacing==='neat'&&context==='standalone'&&padding)samples.push({case:c.key,amount,bit,unspacedHeight:baseline.h,spacedHeight:a.h,heightDelta:a.h-baseline.h,constructionRows:a.rows.length});}
   }
  }
  // Sparse, mobile-up aliases, explicit zero reset and a later new layout.
  const responsive={...cases[0]},classes='gp_vertical-spacing--1 gp_sm-vertical-spacing--0 gp_md-vertical-spacing--2 gp_lg-vertical-spacing--0 gp_xl-vertical-spacing--2 gp_2xl-vertical-spacing--0';
  for(const width of [479,480,639,640,767,768,1023,1024,1279,1280,1535,1536]){
   await page.setViewportSize({width,height:950});await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${fixture(responsive,{width,classes})}`);
   const index=hinges.filter(([rem])=>width>=rem*16).at(-1)?.[1],bits=['sm','lg','2xl'].includes(index)?0:['md','xl'].includes(index)?2:1;
   near(await page.locator('[data-map] > :nth-child(2)').evaluate(n=>parseFloat(getComputedStyle(n).marginBlockStart)),bits*width/64,`responsive ${width}`);
  }
  // Direct selectors do not leak through a wrapper into a nested layout.
  await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${fixture(cases[0],{amount:1})}`);
  await page.locator('[data-map] > article').first().evaluate(n=>n.innerHTML='<div class="gp_rebase_64 gp_layout--peers-2 gp_spacing--neat"><p>Nested one</p><p>Nested two</p><p>Nested three</p></div>');
  equal(await page.locator('[data-map] > article:first-child p').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).marginBlockStart))),[0,0,0],'no nested margin inheritance');
  // Author margins win, and removing the utility restores author/UA defaults.
  await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${fixture(cases[0],{amount:1})}`);
  const second=page.locator('[data-map] > :nth-child(2)');await second.evaluate(n=>n.style.marginBlockStart='9px');near(await second.evaluate(n=>parseFloat(getComputedStyle(n).marginBlockStart)),9,'author margin wins');
  await second.evaluate(n=>{n.removeAttribute('style');n.style.removeProperty('margin-block-start');});
  await page.locator('[data-map]').evaluate(n=>n.classList.remove('gp_vertical-spacing--1'));near(await second.evaluate(n=>parseFloat(getComputedStyle(n).marginBlockStart)),0,'host margin restored');
  // Underfilled sources stack but remain eligible for deliberate separation.
  for(const c of [cases[2],cases[3],cases[4]]){
   await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${fixture({...c,count:1},{amount:1})}`);near(await page.locator('[data-map] > article').evaluate(n=>parseFloat(getComputedStyle(n).marginBlockStart)),0,'underfilled first stays flush');
  }
 }
 // Unsupported counting arithmetic preserves host spacing; do not guess rows.
 const fallback=await readFile(new URL('../test-results/vertical-spacing/fallback.css',import.meta.url),'utf8');
 await page.setContent(`<style>${hostCSS}</style><style>${fallback}</style>${fixture(cases[1],{amount:1})}`);
 equal(await page.locator('[data-map] > article').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).marginBlockStart))),Array(8).fill(0),'unsupported arithmetic adds no margins');
 }
 // Follow layout transitions as well as independent spacing overrides.
 for(const profile of ['css','min.css']){
  const css=await readFile(new URL(`../test-results/vertical-spacing/experiment.${profile}`,import.meta.url),'utf8');
  for(const width of [480,639,640,1023,1024,1280]){
   await page.setViewportSize({width,height:950});await page.setContent(`<style>${hostCSS}</style><style>${css}</style>${fixture(cases[0],{width,spacing:'thin',classes:'gp_vertical-spacing--1 gp_sm--peers-3 gp_lg--two-3-2'})}`);
   const id=width>=1024?'two-3-2':width>=640?'peers-3':'stack',expected=placements({id,count:6,spacing:'thin'});
   const values=await page.locator('[data-map] > article').evaluateAll(ns=>ns.map(n=>({row:Number(getComputedStyle(n).gridRowStart),margin:parseFloat(getComputedStyle(n).marginBlockStart)})));
   values.forEach((v,i)=>{equal(v.row,expected[i].row,'current viewport layout');near(v.margin,expected[i].row>1?width/64:0,'margin follows new layout row');});
  }
  await page.setContent(`<style>${hostCSS}</style><style>${css}</style><div class="gp_ruler" style="width:1200px"><section data-map class="gp_layout--stack gp_spacing--neat gp_vertical-spacing--1"><p>First paragraph</p><p>Second paragraph</p></section></div>`);
  near(await page.locator('[data-map] p').nth(1).evaluate(n=>parseFloat(getComputedStyle(n).marginBlockStart)),18.75,'UA margin replaced while active');
  await page.locator('[data-map]').evaluate(n=>n.classList.remove('gp_vertical-spacing--1'));
  equal(await page.locator('[data-map] p').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).marginBlockStart))),[16,16],'UA margins restored after removal');
 }
 // Public review page: real content, all arrangements, keyboard and no errors.
 await page.setViewportSize({width:1360,height:950});await page.goto(`${origin}/tests/fixtures/vertical-spacing/`);
 for(const c of cases){await page.locator('#case').selectOption(c.key);for(const id of ['baseline','percent'])await page.frameLocator(`#${id}`).locator('[data-map] > article').nth(c.count-1).waitFor();}
 await page.locator('#case').selectOption('three');await page.locator('#context').selectOption('continued');await page.locator('#field').selectOption('thin');
 const frame=page.frameLocator('#percent');await frame.locator('[data-map]').waitFor();equal(await frame.locator('.gp_ruler--measure').count(),0,'preview has no measured root');
 await frame.locator('[data-map] a').first().focus();equal(await frame.locator('[data-map] a').first().evaluate(n=>document.activeElement===n),true,'native source-order focus retained');
 await page.locator('#context').selectOption('standalone');await page.locator('#field').selectOption('neat');
 for(const id of ['baseline','percent']){const f=page.frameLocator(`#${id}`);await f.locator('[data-map].gp_spacing--neat').waitFor();await f.locator('img').first().evaluate(n=>n.decode());const r=await f.locator('[data-map]').evaluate(n=>({width:n.getBoundingClientRect().width,margin:parseFloat(getComputedStyle(n.children[1]).marginBlockStart)}));near(r.margin,id==='baseline'?0:r.width/64,`${id}: real content gutter`);}
 // Exercise the visible amount selector, including an explicit zero reset.
 for(const amount of [2,0,1]){
  await page.locator('#amount').selectOption(String(amount));
  const f=page.frameLocator('#percent');await f.locator(`[data-map].gp_vertical-spacing--${amount}`).waitFor();
  const r=await f.locator('[data-map]').evaluate(n=>({width:n.getBoundingClientRect().width,margin:parseFloat(getComputedStyle(n.children[1]).marginBlockStart)}));near(r.margin,amount*r.width/64,`real content amount ${amount}`);
 }
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:new URL(`../test-results/vertical-spacing/${engine}.png`,import.meta.url).pathname,fullPage:true});equal(errors,[],'no page errors');
 const result={engine,browser:browser.version(),checks,passed:true,profiles:process.argv.includes('--preview-only')?['real-content preview']:['source','minified','arithmetic-off','real-content preview'],samples};await writeFile(new URL(`../test-results/vertical-spacing/${process.argv.includes('--preview-only')?'preview':'results'}-${engine}.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser?.close();server.kill();}
