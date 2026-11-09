import {launchBrowser} from './lib/browser-launch.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {layouts,spacingModes} from '../src/core/catalogue.mjs';
import {placements} from '../src/core/geometry.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
assert.ok(['chromium','webkit','firefox'].includes(engine));
const port=4217,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let browser,checks=0;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const cases=layouts.flatMap(p=>Object.keys(spacingModes).map(spacing=>({id:p.id,count:p.family==='mosaic'?p.count:p.family==='stack'?3:p.family==='peers'?8:13,spacing})));
 const host='*{box-sizing:border-box}body{margin:0}.ruler{width:1200px}article{min-width:0;min-height:10px}';
 for(const asset of ['main.css','main.min.css','main.layer.css','main.layer.min.css']){
  await page.setContent(`<style>${host}</style><link rel="stylesheet" href="${origin}/css/${asset}">${cases.map((c,i)=>`<div class="gp_ruler ruler"><section id="case-${i}" class="gp_layout--${c.id} gp_spacing--${c.spacing}">${Array.from({length:c.count},()=>'<article></article>').join('')}</section></div>`).join('')}`,{waitUntil:'load'});
  const actual=await page.locator('section').evaluateAll(nodes=>nodes.map(n=>[...n.children].map(item=>{const s=getComputedStyle(item);return{column:[s.gridColumnStart,s.gridColumnEnd],row:[s.gridRowStart,s.gridRowEnd]};})));
  for(let i=0;i<cases.length;i++){
   const expected=placements(cases[i]);assert.equal(actual[i].length,expected.length);checks++;
   expected.forEach((p,j)=>{
    assert.deepEqual(actual[i][j],{column:[String(p.start+1),`span ${p.span}`],row:[String(p.row),`span ${p.rowspan}`]},`${asset}/${cases[i].id}/${cases[i].spacing}/${j}`);checks++;
   });
  }
  // Ordinary unlayered author CSS wins even before a layered stylesheet. For
  // unlayered core, normal selector specificity provides the same override.
  await page.setContent(`<style>${host}.authored{--gp-layout:var(--gp-peers-2)}.item{padding:7px}</style><link rel="stylesheet" href="${origin}/css/${asset}"><div class="gp_ruler ruler"><section class="authored gp_layout--three-1-2-1 gp_spacing--neat"><article class="item gp_pad">One</article><article>Two</article></section></div>`,{waitUntil:'load'});
  assert.equal(await page.locator('.item').evaluate(n=>getComputedStyle(n).paddingLeft),'7px');checks++;
  const widths=await page.locator('article').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));
  assert.ok(Math.abs(widths[0]-widths[1])<.1,'author layout selection overrides the library');checks++;
  // Layout and control aliases remain mobile-up in every distribution form.
  await page.setContent(`<style>${host}</style><link rel="stylesheet" href="${origin}/css/${asset}"><div class="gp_ruler ruler"><section class="gp_layout--stack gp_md--peers-2 gp_spacing--neat">${'<article class="gp_pad gp_md-pad--2"></article>'.repeat(2)}</section></div>`,{waitUntil:'load'});
  for(const width of [767,768]){
   await page.setViewportSize({width,height:900});
   const [a,b]=await page.locator('article').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,padding:getComputedStyle(n).paddingLeft};}));
   assert.equal(width<768?a.x===b.x:a.y===b.y,true);assert.equal(a.padding,width<768?'18.75px':'37.5px');checks+=2;
  }
  await page.setViewportSize({width:1440,height:900});
  console.log(`${engine}: ${asset} catalogue, layer overrides and viewport aliases PASS`);
 }
 assert.deepEqual(errors,[]);await mkdir('test-results/distribution',{recursive:true});
 await writeFile(`test-results/distribution/${engine}.json`,JSON.stringify({engine,browser:browser.version(),checks,passed:true},null,2)+'\n');
 console.log(`${engine}: ${checks} distribution assertions PASS`);
}finally{await browser?.close();server.kill();}
