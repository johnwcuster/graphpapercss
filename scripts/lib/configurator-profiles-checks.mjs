import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {defaultState,normalizeState,candidateMarkup} from '../../docs/sequence/model.mjs';

export async function checkConfiguratorProfiles({page,browser,open,origin,publicPath,choose}){
 const {version}=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));
 const method=value=>page.locator(`[name="delivery-method"][value="${value}"]`).check();
 const cdn=value=>page.locator(`[name="cdn-coverage"][value="${value}"]`).check();
 const host=value=>page.locator(`[name="host-coverage"][value="${value}"]`).check();
 const download=async selector=>{const event=page.waitForEvent('download');await page.locator(selector).click();const file=await event;return{name:file.suggestedFilename(),text:await readFile(await file.path(),'utf8')};};
 await open();
 const initial=await page.locator('#markup').textContent();
 assert.equal(page.workers().length,0,'delivery advice needs no compiler worker');
 assert.equal(await page.locator('#column-rules-requirement').isVisible(),false);
 assert.match(await page.locator('#cdn-coverage').textContent(),/Smallest predefined build/);
 assert.equal(await page.locator('[name="host-coverage"]').count(),2);
 assert.equal(await page.locator('[name="delivery-method"][value="cdn"]').isChecked(),true);
 assert.equal(await page.locator('#delivery-title').textContent(),'Full library');
 const sizes=JSON.parse(await readFile(new URL('../../css/size.json',import.meta.url),'utf8'));
 assert.equal(await page.locator('#delivery-compressed').textContent(),`${(sizes.brotli/1000).toFixed(1)} KB Brotli · ${(sizes.gzip/1000).toFixed(1)} KB gzip`);
 assert.ok((await page.locator('#delivery-raw').textContent()).includes(`${(sizes.minified/1000).toFixed(1)} KB`));
 assert.equal(await page.locator('#delivery-coverage-note').textContent(),'Smaller builds cover this sequence; the full library supports every layout.');
 await cdn('smallest');assert.equal(await page.locator('#delivery-title').textContent(),'Repeating');
 assert.equal(await page.locator('#cdn-output pre').count(),1,'one actionable CDN code block');
 await method('host');assert.equal(await page.locator('#css-export').isVisible(),true);
 await host('full');await method('cdn');assert.equal(await page.locator('#markup').textContent(),initial,'delivery does not edit the composition');
 assert.equal(page.workers().length,0);
 const manufactured=normalizeState({...defaultState(),width:375,steps:['stack','peers-2','two-1-1','two-7-5','three-3-4-3','four-6-8-9-7','mosaic-6'].map((layout,i)=>({rem:[0,30,40,48,64,80,96][i],layout}))});
 await open(manufactured);
 assert.equal(await page.locator('#cdn-coverage').isVisible(),false,'full-only CDN choices are consolidated');
 assert.match(await page.locator('#delivery-full-only').textContent(),/Four compositions and a mosaic/);
 assert.ok((await page.locator('#delivery-tag').textContent()).includes(`/graphpapercss@${version}/css/main.min.css`));
 await page.locator('#delivery').scrollIntoViewIfNeeded();
 await page.screenshot({path:fileURLToPath(new URL(`../../test-results/configurator-next/${browser.browserType().name()}-delivery-cdn.png`,import.meta.url))});
 await method('host');assert.equal(await page.locator('#host-smallest-option').count(),0);await host('full');
 assert.equal(await page.locator('#cdn-output').isVisible(),false);
 await page.locator('#delivery').scrollIntoViewIfNeeded();
 await page.screenshot({path:fileURLToPath(new URL(`../../test-results/configurator-next/${browser.browserType().name()}-delivery.png`,import.meta.url))});
 await open({...defaultState(),steps:[{id:'base',rem:0,layout:'three-1-2-1'}]});
 await cdn('smallest');assert.equal(await page.locator('#delivery-title').textContent(),'Two/Three compositions');
 const state=normalizeState({...defaultState(),count:8,width:1280,steps:[{id:'base',rem:0,layout:'peers-2',padding:1},{id:'a',rem:48,layout:'peers-6',spacing:'ruled',verticalSpacing:2},{id:'b',rem:96,layout:'stack',padding:0,verticalSpacing:0}]});
 await open(state);await cdn('smallest');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedProfile=text;}}}));
 await page.locator('#copy-delivery-tag').click();const tag=await page.evaluate(()=>window.copiedProfile);
 assert.ok(tag.includes(`@${version}/css/profiles/repeating.min.css`));assert.ok(!tag.includes('@latest'));
 const cdnURL=tag.match(/href="([^"]+)"/)[1];
 const profileCSS=await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/profiles/repeating.min.css`)).text();
 const fullCSS=await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/main.min.css`)).text();
 const local=await page.locator('#inspect-delivery-css').getAttribute('href');assert.equal((await page.request.get(new URL(local,page.url()).href)).status(),200);
 const exported=await browser.newPage({javaScriptEnabled:false}),reference=await browser.newPage({javaScriptEnabled:false});
 try{
  let requests=0;await exported.route(cdnURL,route=>{requests++;return route.fulfill({contentType:'text/css',body:profileCSS});});
  const markup=candidateMarkup(state).replace(/<!-- Item (\d+) -->/g,(_,n)=>`<p>Record ${n}. Content.</p>`);
  const styles='<meta name="viewport" content="width=device-width"><style>body{margin:0}p{margin:0;font:16px/1.4 sans-serif}*{box-sizing:border-box}</style>';
  await exported.setContent(styles+tag+markup,{waitUntil:'load'});assert.equal(requests,1);
  await reference.setContent(styles+`<style>${fullCSS}</style>`+markup);
  for(const width of [375,767,768,1535,1536]){
   for(const target of [exported,reference])await target.setViewportSize({width,height:900});
   const geometry=target=>target.locator('article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return[r.x,r.y,r.width,r.height,parseFloat(s.paddingLeft)||0,parseFloat(s.marginBlockStart)||0,Number(s.getPropertyValue('--_gp-tracks'))];}));
   const actual=await geometry(exported),expected=await geometry(reference);actual.forEach((a,i)=>a.forEach((n,k)=>assert.ok(Math.abs(n-expected[i][k])<.1,`${width}/${i}/${k}`)));
  }
 }finally{await exported.close();await reference.close();}
 await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Clipboard denied');};});
 await page.locator('#copy-delivery-tag').click();assert.equal(await page.locator('#delivery-tag-block').evaluate(n=>n===document.activeElement),true);
 // Self-hosted full files use their real names in both formats.
 await method('host');await host('full');
 assert.equal(await page.locator('#delivery-coverage-note').isVisible(),true);
  for(const format of ['minified','readable']){
   await page.locator('#profile-format').selectOption(format);
   const css=await download('#download-profile-css');
   const name=`main${format==='minified'?'.min':''}.css`;
   assert.equal(css.name,name);assert.equal(await page.locator('#download-profile-html').count(),0);
   const path=name;
   assert.equal(css.text,await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/${path}`)).text());
  }
 assert.equal(await page.locator('#markup').textContent(),candidateMarkup(state));
 assert.equal(page.workers().length,0,'complete downloads need no compiler');
 // A failed local fetch is recoverable; a stale fetch cannot save the wrong format.
 await host('full');await page.locator('#profile-format').selectOption('minified');
 const asset=`${origin}${publicPath}/assets/graph-paper/main.min.css`;
 const unavailable=route=>route.fulfill({status:503,body:'Unavailable'});
 await page.route(asset,unavailable);await page.locator('#download-profile-css').click();
 await page.waitForFunction(()=>document.querySelector('#profile-download-status').textContent.includes('Could not download'));
 assert.equal(await page.locator('#download-profile-css').isDisabled(),false);await page.unroute(asset,unavailable);
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const delayed=async route=>{await gate;await route.fulfill({contentType:'text/css',body:fullCSS});};
 const unexpected=[],capture=download=>unexpected.push(download.suggestedFilename());
 await page.route(asset,delayed);page.on('download',capture);
 try{
  await page.locator('#download-profile-css').click();
  await page.locator('#profile-format').selectOption('readable');release();
  await page.waitForFunction(()=>document.querySelector('#profile-download-status').textContent.includes('Delivery choices changed'));
  assert.deepEqual(unexpected,[],'a changed delivery choice cancels the old download');
 }finally{release();await page.unroute(asset,delayed);page.off('download',capture);}
 assert.equal((await download('#download-profile-css')).name,'main.css');
 await host('full');
 await choose('four-6-5-4-3');
 assert.equal(await page.locator('#host-smallest-option').count(),0);
 assert.equal(await page.locator('[name="host-coverage"][value="full"]').isChecked(),true);
 assert.equal(await page.locator('#delivery-title').textContent(),'Full library');
 // Ruled sequences need two matching-version CDN links and an optional
 // self-hosted extension download; source markup remains unchanged.
 await open({...defaultState(),spacing:'ruled',steps:[{id:'base',rem:0,layout:'peers-2'}]});
 assert.match(await page.locator('#delivery-tag').textContent(),new RegExp(`@${version.replaceAll('.','\\.')}/css/extensions/column-rules\\.min\\.css`));
 assert.equal((await page.locator('#delivery-tag').textContent()).match(/<link/g).length,2);
 assert.equal(await page.locator('#column-rules-requirement-title').textContent(),'Column-rules extension required');
 assert.match(await page.locator('#column-rules-requirement-text').textContent(),/both stylesheet links/);
 await method('host');await host('full');
 assert.equal(await page.locator('#column-rules-download').isVisible(),true);
 assert.match(await page.locator('#column-rules-requirement-text').textContent(),/Download both/);
 for(const format of ['readable','minified']){
  await page.locator('#profile-format').selectOption(format);
  const ext=await download('#download-column-rules'),name=`column-rules${format==='minified'?'.min':''}.css`;
  assert.equal(ext.name,name);
  assert.equal(ext.text,await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/extensions/${name}`)).text());
 }
 await host('custom');
 assert.equal(await page.locator('#column-rules-requirement-title').textContent(),'Column-rules extension bundled');
 assert.match(await page.locator('#column-rules-requirement-text').textContent(),/one CSS file/);
 await page.locator('#spacing').selectOption('neat');
 await page.waitForFunction(()=>document.querySelector('#column-rules-requirement').hidden);
 console.log('Delivery: contextual CDN/self-host choices, compression/cache guidance, full-only consolidation, real file downloads, no-script parity and clipboard recovery PASS.');
}
