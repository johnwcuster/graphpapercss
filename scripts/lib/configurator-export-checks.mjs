import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {downloadableHTML} from '../../docs/sequence/export-model.mjs';
import {defaultState,normalizeState} from '../../docs/sequence/model.mjs';

export async function checkConfiguratorExports({page,browser,open,ready,origin,publicPath}){
 const {version}=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));
 const custom=async()=>{await page.locator('[name="delivery-method"][value="host"]').check();await page.locator('[name="host-coverage"][value="custom"]').check();};
 const build=async()=>{await custom();await page.locator('#build-css').click();await page.waitForFunction(()=>!document.querySelector('#download-css').disabled);};
 const download=async selector=>{
  const event=page.waitForEvent('download');await page.locator(selector).click();const file=await event;
  return {name:file.suggestedFilename(),text:await readFile(await file.path(),'utf8')};
 };
 const state=normalizeState({...defaultState(),count:12,width:1600,steps:[
  {id:'base',rem:0,layout:'stack',padding:1},
  {id:'a',rem:48,layout:'two-3-2',spacing:'ruled',verticalSpacing:1,config:{arrangement:'first-above',exact:{left:5,right:6}}},
  {id:'b',rem:64,layout:'three-1-2-1',spacing:'wide',padding:2,config:{exact:{left:5,center:3,right:4}}},
  {id:'c',rem:80,layout:'four-6-5-4-3',spacing:'neat',padding:0,verticalSpacing:2,config:{traversal:'widest-first',exact:{left:2,'center-left':3,'center-right':4,right:3}}},
  {id:'d',rem:96,layout:'mosaic-12',spacing:'thin',verticalSpacing:0},
 ]});
 await page.setViewportSize({width:1440,height:1000});await open(state);
 assert.equal(page.workers().length,0,'compiler is lazy');
 assert.equal(await page.locator('#download-css').isDisabled(),true);
 await custom();assert.match(await page.locator('#css-export-status').textContent(),/Build CSS to enable/);
 assert.match(await page.locator('#build-css').textContent(),/1\. Build CSS/);
 assert.equal(await page.locator('#download-html').count(),0);
 await build();assert.match(await page.locator('#css-export-status').textContent(),/Ready.*download CSS/);assert.equal(page.workers().length,1,'local compiler worker loaded');
 const fullCSS=await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/main.css`)).text()+'\n'+await (await page.request.get(`${origin}${publicPath}/assets/graph-paper/extensions/column-rules.css`)).text();
 for(const format of ['readable','minified']){
  await page.locator('#css-format').selectOption(format);
  const css=await download('#download-css'),html={text:downloadableHTML(state,format)};
  assert.equal(css.name,format==='readable'?'graph-paper-custom.css':'graph-paper-custom.min.css');
  assert.ok(html.text.includes(`href="./${css.name}"`));
  assert.ok(css.text.startsWith(`/* Graph Paper CSS ${version} — custom build.`));assert.match(css.text,/MIT license/);
  assert.ok(css.text.includes('--gp-three-1-2-1:'));assert.ok(!css.text.includes('--gp-two-1-9:'));
  assert.doesNotMatch(html.text,/<script|<style/);
  const exported=await browser.newPage({javaScriptEnabled:false}),reference=await browser.newPage({javaScriptEnabled:false});
  const content=source=>source.replace(/<!-- Item (\d+) -->/g,(_,n)=>`<p>Record ${n}. ${'Content with different lengths. '.repeat(Number(n)%3+1)}</p>`)
   .replace('</head>','<style>body{margin:0}p{margin:0;font:16px/1.4 sans-serif}article{min-height:20px}*{box-sizing:border-box}</style></head>');
  try{
   await exported.route('**/downloaded/graph-paper-composition.html',route=>route.fulfill({contentType:'text/html',body:content(html.text)}));
   await exported.route(`**/downloaded/${css.name}`,route=>route.fulfill({contentType:'text/css',body:css.text}));
   await exported.goto(`${origin}/downloaded/graph-paper-composition.html`);
   const ref=content(html.text).replace(`<link rel="stylesheet" href="./${css.name}">`,`<style>${fullCSS}</style>`);
   await reference.setContent(ref);
   for(const width of [375,767,768,1023,1024,1279,1280,1535,1536,1800]){
    for(const target of [exported,reference])await target.setViewportSize({width,height:900});
    const snapshot=target=>target.locator('section > article').evaluateAll(nodes=>nodes.map(n=>{
     const s=getComputedStyle(n),r=n.getBoundingClientRect();
     const pseudo=getComputedStyle(n,'::after');
     return {numbers:[r.x,r.y,r.width,r.height,parseFloat(s.paddingLeft)||0,parseFloat(s.marginBlockStart)||0,Number(s.getPropertyValue('--_gp-tracks'))],placement:[s.gridColumnStart,s.gridColumnEnd,s.gridRowStart,s.gridRowEnd],rule:pseudo.content};
    }));
    const actual=await snapshot(exported),expected=await snapshot(reference);
    assert.equal(actual.length,12);
    actual.forEach((a,i)=>{a.numbers.forEach((n,k)=>assert.ok(Math.abs(n-expected[i].numbers[k])<.1,`${format}/${width}/${i}/${k}`));assert.deepEqual(a.placement,expected[i].placement);assert.equal(a.rule,expected[i].rule);});
   }
  }finally{await exported.close();await reference.close();}
 }
 await page.locator('#css-export').scrollIntoViewIfNeeded();
 await page.screenshot({path:fileURLToPath(new URL(`../../test-results/configurator-next/${browser.browserType().name()}-css-export.png`,import.meta.url))});
 // Source changes and exact values are not a frozen-count specialization.
 await page.locator('#add-item').click();await ready();assert.equal(await page.locator('#download-css').isDisabled(),false);
 assert.equal((await page.locator('#markup').textContent()).match(/<article/g).length,13);
 // New requirements make downloads unavailable until rebuilt.
 await page.locator('#spacing').selectOption('full');await ready();
 assert.equal(await page.locator('#download-css').isDisabled(),true);assert.match(await page.locator('#css-export-status').textContent(),/Selections changed/);
 await build();assert.match((await download('#download-css')).text,/gp_spacing--full/);
 // Delay a real worker request, change the selection, then release the old job.
 await open();
 await custom();
 await page.evaluate(()=>{
  const native=Worker.prototype.postMessage;let release;
  Worker.prototype.postMessage=function(data){release=()=>native.call(this,data);};
  window.releaseExport=()=>{Worker.prototype.postMessage=native;release();};
 });
 await page.locator('#build-css').click();await page.locator('#spacing').selectOption('wide');await ready();
 await page.evaluate(()=>window.releaseExport());
 await page.waitForFunction(()=>document.querySelector('#custom-css').textContent!=='');
 assert.equal(await page.locator('#download-css').isDisabled(),true,'stale worker output cannot enable downloads');
 await build();assert.match((await download('#download-css')).text,/Gutters: wide/);
 // A restricted browser can still use the normal full-stylesheet workflow.
 const restricted=await browser.newPage();
 try{
  await restricted.addInitScript(()=>{window.Worker=class{constructor(){throw Error('Workers unavailable');}};});
  await restricted.goto(`${origin}${publicPath}/configurator.html`);
  await restricted.locator('[name="delivery-method"][value="host"]').check();
  await restricted.locator('#build-css').click();
  await restricted.waitForFunction(()=>document.querySelector('#css-export-status').textContent.includes('Could not build'));
  assert.equal(await restricted.locator('#build-css').isDisabled(),false);
  assert.equal(await restricted.locator('#download-css').isDisabled(),true);
  assert.ok(await restricted.locator('#core-stylesheet-link').getAttribute('href'));
 }finally{await restricted.close();}
 console.log('Selective downloads: actual worker, paired files, no-script geometry, stale-job rejection and unavailable-worker recovery PASS.');
}
