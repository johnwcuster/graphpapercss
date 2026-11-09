import {launchBrowser} from './lib/browser-launch.mjs';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {layouts,spacingModes} from '../src/core/catalogue.mjs';
import {placements} from '../src/core/geometry.mjs';
import {enhancementCondition} from '../src/core/features.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
const port=4223,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let browser,checks=0;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);const version=browser.version(),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const capabilities=await page.evaluate(condition=>({nativeCount:CSS.supports(condition),absoluteValue:CSS.supports('width','calc(1px * abs(-1))'),rounding:CSS.supports('width','round(nearest,1px,1px)'),subgrid:CSS.supports('grid-template-columns','subgrid')}),enhancementCondition);
 assert.equal(capabilities.nativeCount,false,'Use a real engine without native count arithmetic; do not inject a disabled stylesheet');
 assert.ok(capabilities.rounding&&capabilities.subgrid,'This baseline requires ordinary modern Grid/arithmetic');
 const fallback=capabilities.absoluteValue?'repeating-pairs':'source-order-stack';
 const expected=c=>placements({...c,...(!capabilities.absoluteValue?{id:'stack'}:{}),enhanced:false});
 const host='*{box-sizing:border-box}body{margin:0;font:16px/1 system-ui}.ruler{width:1200px}article{min-width:0;min-height:20px}';
 const cases=layouts.flatMap(p=>[0,1,2,3,6,13].flatMap(count=>Object.keys(spacingModes).map(spacing=>({id:p.id,count,spacing}))));
 const fingerprints={};
 for(const asset of ['main.css','main.min.css','main.layer.css','main.layer.min.css']){
  fingerprints[asset]=createHash('sha256').update(await readFile(`css/${asset}`)).digest('hex');
  await page.setContent(`<style>${host}</style><link rel="stylesheet" href="${origin}/css/${asset}">${cases.map((c,i)=>`<div class="gp_ruler ruler"><section data-case="${i}" class="gp_layout--${c.id} gp_spacing--${c.spacing}">${'<article></article>'.repeat(c.count)}</section></div>`).join('')}`,{waitUntil:'load'});
  const actual=await page.locator('[data-case]').evaluateAll(nodes=>nodes.map(n=>{const root=n.getBoundingClientRect();return[...n.children].map(item=>{const r=item.getBoundingClientRect(),s=getComputedStyle(item);return{x:r.x-root.x,width:r.width,y:r.y-root.y,height:r.height,tracks:Number(s.getPropertyValue('--_gp-tracks'))};});}));
  cases.forEach((c,i)=>expected(c).forEach((p,j)=>{
   const a=actual[i][j],label=`${asset}/${c.id}/${c.spacing}/${c.count}/${j}`;
   assert.ok(Math.abs(a.x-p.start*1200/64)<.1,`${label}: x`);assert.ok(Math.abs(a.width-p.span*1200/64)<.1,`${label}: width ${a.width} != ${p.span*1200/64}`);
   assert.equal(a.tracks,p.span,`${label}: assigned tracks`);assert.ok(Math.abs(a.y-(p.row-1)*20)<.1,`${label}: source-order row`);checks+=4;
  }));
  // Explicit endpoint arrangements retain source-first/last placement while
  // their supporting items use ordinary row-major fallback pairs.
  for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const count of [1,2,3,6,13]){
   const c={id:'two-3-2',count,spacing:'thin',arrangement,enhanced:false};
   await page.setContent(`<style>${host}</style><link rel="stylesheet" href="${origin}/css/${asset}"><div class="gp_ruler ruler"><section class="gp_layout--two-3-2 gp_spacing--thin gp_arrangement--${arrangement}">${'<article></article>'.repeat(count)}</section></div>`,{waitUntil:'load'});
   const items=await page.locator('article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,width:r.width,y:r.y-n.parentElement.getBoundingClientRect().y};}));
   expected(c).forEach((p,i)=>{assert.ok(Math.abs(items[i].x-p.start*1200/64)<.1);assert.ok(Math.abs(items[i].width-p.span*1200/64)<.1);assert.ok(Math.abs(items[i].y-(p.row-1)*20)<.1);checks+=3;});
  }
  // Padding still uses the appropriate bit on continued and rebased content.
  await page.setContent(`<style>${host}</style><link rel="stylesheet" href="${origin}/css/${asset}"><div class="gp_ruler ruler"><section class="gp_layout--two-3-2 gp_spacing--neat"><article class="gp_continue_tracks"><div class="gp_layout--peers-2 gp_spacing--full"><article class="gp_pad">One</article><article class="gp_pad">Two</article></div></article><article class="gp_continue_tracks"><div class="gp_rebase_64 gp_layout--peers-2 gp_spacing--full"><article class="gp_pad">Three</article><article class="gp_pad">Four</article></div></article></section></div>`,{waitUntil:'load'});
  const padding=await page.locator('.gp_pad').evaluateAll(nodes=>nodes.map(n=>parseFloat(getComputedStyle(n).paddingLeft)));
  padding.forEach((value,i)=>{assert.ok(Math.abs(value-(i<2?1200/64:1200*(capabilities.absoluteValue?30:60)/64/64))<.1,`${asset}: continuation/rebase padding`);checks++;});
  console.log(`${engine} ${version}: real older-engine ${asset} fallback PASS`);
 }
 assert.deepEqual(errors,[]);await mkdir('test-results/fallback',{recursive:true});
 await writeFile(`test-results/fallback/${engine}-${version}.json`,JSON.stringify({engine,browser:version,checks,passed:true,forcedFeatureOff:false,capabilities,fallback,artifacts:fingerprints},null,2)+'\n');
 console.log(`${engine} ${version}: ${checks} real older-browser fallback assertions PASS`);
}finally{await browser?.close();server.kill();}
