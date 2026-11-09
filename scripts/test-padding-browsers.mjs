import {launchBrowser} from './lib/browser-launch.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {hinges} from '../src/core/catalogue.mjs';
import {enhancementCondition} from '../src/core/compiler.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
if(!['chromium','firefox','webkit'].includes(engine))throw Error('Use --engine=chromium|firefox|webkit');
const origin='http://127.0.0.1:4208',root=fileURLToPath(new URL('../',import.meta.url));
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,GRAPHPAPER_PORT:'4208'},stdio:['ignore','pipe','pipe']});
let browser,checks=0;const ok=(v,message)=>{assert.ok(v,message);checks++;};
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 browser=await launchBrowser(engine);const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const host='*{box-sizing:border-box}body{margin:0;font:16px/1.4 Arial}.ruler{width:1200px}article{min-width:0}h2{margin:0;font-size:18px}p{margin:0}';
 const cases=[['stack',3],['peers-3',8],['two-3-2',13],['three-1-2-1',13],['four-6-5-4-3',13],['four-6-5-4-3',2],['mosaic-6',6],['mosaic-13',13]];
 const source=await readFile(new URL('../css/main.css',import.meta.url),'utf8');
 for(const [build,css] of [['source',source],['minified',await readFile(new URL('../css/main.min.css',import.meta.url),'utf8')],['fallback',source.replace(enhancementCondition,'not (display:grid)')]]){
  for(const spacing of ['full','neat','thin','wide','ruled']){
   const fixtures=cases.map(([id,count],i)=>`<section class="ruler gp_ruler " data-case="${id}"><div class="gp_layout--${id} gp_spacing--${spacing}">${Array.from({length:count},(_,n)=>`<article class="gp_pad" data-target><h2>Item ${n+1}</h2><p>Source content with a varying amount of text.</p></article>`).join('')}</div></section>`).join('');
   // An ordinary authored rule wins despite being loaded before core.
   await page.setContent(`<style>${host}.author-padding{padding:7px}</style><style>${css}</style>${fixtures}`);
   for(const width of [640,1200])for(const bits of [1,2]){
    await page.evaluate(({width,bits})=>{document.querySelectorAll('.ruler').forEach(n=>n.style.width=`${width}px`);document.querySelectorAll('[data-target]').forEach(n=>n.className=bits===1?'gp_pad':'gp_pad--2');},{width,bits});
    const items=await page.locator('[data-target]').evaluateAll(nodes=>nodes.map(n=>{const r=n.closest('.ruler'),s=getComputedStyle(n);return{padding:parseFloat(s.paddingLeft),expected:r.getBoundingClientRect().width/64,margin:parseFloat(s.marginTop)||0,bit:parseFloat(s.getPropertyValue('--gp-ruler-bit'))||0,measured:r.classList.contains('gp_ruler--measure')};}));
    for(const item of items){ok(Math.abs(item.padding-bits*item.expected)<.06,`${build}/${spacing}/${width}/${bits}: correct ruler bit`);if(!item.measured)ok(item.bit===0,'padding does not capture a root length');}
   }
   const before=await page.locator('[data-target]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return[r.x,r.width,getComputedStyle(n).marginTop];}));
   await page.locator('[data-target]').evaluateAll(nodes=>nodes.forEach(n=>n.className=''));
   assert.deepEqual(await page.locator('[data-target]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return[r.x,r.width,getComputedStyle(n).marginTop];})),before,`${build}/${spacing}: edges and library margins unchanged`);checks++;
   const first=page.locator('[data-target]').first();await first.evaluate(n=>n.className='gp_pad author-padding');ok(await first.evaluate(n=>getComputedStyle(n).paddingLeft)==='7px','ordinary author override wins');
  }
 }
 // Responsive utilities use viewport hinges, independent of a narrow ruler.
 const sequence=[2,0,1,2,0,1];
 const tokens=['gp_pad',...hinges.map(([,prefix],i)=>`gp_${prefix}-pad--${sequence[i]}`)].reverse();
 for(const [build,css] of [['source',source],['minified',await readFile(new URL('../css/main.min.css',import.meta.url),'utf8')]]){
  await page.setContent(`<style>${host}.ruler{width:320px}.author-padding{padding:7px}</style><style>${css}</style><div class="ruler gp_ruler"><section class="gp_layout--peers-2 gp_spacing--neat"><article id="responsive" class="${tokens.join(' ')}">Responsive padding</article><article>Neighbor</article></section></div>`);
  for(const [rem] of hinges)for(const delta of [-1,0,1]){
   const width=rem*16+delta;await page.setViewportSize({width,height:900});
   const index=hinges.findLastIndex(([r])=>r*16<=width),expected=index<0?1:sequence[index];
   ok(Math.abs(await page.locator('#responsive').evaluate(n=>parseFloat(getComputedStyle(n).paddingLeft))-5*expected)<.06,`${build}/${width}: viewport-specific padding reset/inheritance`);
   ok(await page.locator('.ruler').evaluate(n=>n.getBoundingClientRect().width)===320,'ruler width is independent of viewport');
  }
  await page.locator('#responsive').evaluate(n=>n.classList.add('author-padding'));
  ok(await page.locator('#responsive').evaluate(n=>getComputedStyle(n).paddingLeft)==='7px','author styles override responsive utilities');
 }
 await page.setViewportSize({width:1440,height:1000});
 // Real content specimens: overlays and nested continuation/rebase, without any
 // measured root. Source and minified builds must behave identically.
 for(const asset of ['main.css','main.min.css']){
  await page.goto(`${origin}/tests/fixtures/padding/`);
  await page.locator('link[href="../../../css/main.css"]').evaluate((n,asset)=>n.href=`../../../css/${asset}`,asset);
  await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.endsWith('/'+document.querySelector('link').href.split('/').at(-1))));
  await page.locator('img').first().evaluate(n=>n.decode());
  for(const viewport of [320,640,960,1440]){
   await page.setViewportSize({width:viewport,height:1000});
   for(const bits of [1,2]){
    await page.locator('#padding').check();await page.locator('#padding-size').selectOption(String(bits));
    const values=await page.locator('[data-padding]').evaluateAll(nodes=>nodes.map(n=>({pad:parseFloat(getComputedStyle(n).paddingLeft),bit:n.closest('[data-measure-root]').getBoundingClientRect().width/64})));
    for(const v of values)ok(Math.abs(v.pad-bits*v.bit)<.06,`${asset}/${viewport}: continued/rebased/content padding`);
    ok(await page.locator('.gp_ruler--measure').count()===0,'specimens use no measurement');
    ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no viewport overflow');
   }
   await page.locator('#padding').uncheck();for(const n of await page.locator('[data-padding]').all())ok(await n.evaluate(n=>getComputedStyle(n).paddingLeft)==='0px','padding off');
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('#padding').check();await page.locator('#padding-size').selectOption('1');
  const positions=await page.locator('#blocks > article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return[r.x,r.right];}));
  ok(Math.abs(positions[0][1]-positions[1][0])<.05&&Math.abs(positions[1][1]-positions[2][0])<.05,'Neat backgrounds keep touching');
  for(const selector of ['#continued-wrapper','#rebased-wrapper'])ok(await page.locator(selector).evaluate(n=>getComputedStyle(n).paddingLeft)==='0px','track wrappers stay unpadded');
  for(const overlay of await page.locator('.overlay').all()){
   const bounds=await overlay.evaluate(n=>{const a=n.getBoundingClientRect(),b=n.querySelector('img').getBoundingClientRect();return[a.x-b.x,a.y-b.y,a.width-b.width,a.height-b.height];});ok(bounds.every(v=>Math.abs(v)<.05),'overlay image remains full bleed');
  }
 }
 // Padding does not move column rules owned by the same participant.
 await page.setContent(`<style>${host}</style><style>${source}</style><div class="ruler gp_ruler gp_ruler--measure"><section class="gp_layout--three-1-2-1 gp_spacing--ruled">${Array.from({length:3},()=>'<article class="gp_rule--end gp_pad"><p>Ruled content</p></article>').join('')}</section></div>`);
 const rules=()=>page.locator('.gp_rule--end').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n,'::after');return[r.x,r.width,s.content,s.right,s.borderLeftWidth];}));
 const withPadding=await rules();ok(withPadding.some(r=>r[2]==='""'),'rule decoration is active');
 await page.locator('.gp_rule--end').evaluateAll(nodes=>nodes.forEach(n=>n.classList.remove('gp_pad')));
 assert.deepEqual(await rules(),withPadding,'padding preserves rule positions');checks++;
 // Exported CSS and HTML work with page scripting disabled.
 const staticPage=await browser.newPage({javaScriptEnabled:false,viewport:{width:960,height:900}});
 await staticPage.setContent(`<style>${host} .ruler{width:960px}</style><style>${source}</style><div class="ruler gp_ruler"><section class="gp_layout--peers-2 gp_spacing--neat"><article class="gp_pad gp_md-pad--2 gp_xl-pad--0">One</article><article class="gp_pad--2">Two</article></section></div>`);
 assert.deepEqual(await staticPage.locator('article').evaluateAll(nodes=>nodes.map(n=>parseFloat(getComputedStyle(n).paddingLeft))),[30,30]);checks++;
 await staticPage.setViewportSize({width:1280,height:900});ok(await staticPage.locator('article').first().evaluate(n=>getComputedStyle(n).paddingLeft)==='0px','responsive reset works without JavaScript');
 await staticPage.close();
 // Restore the specimen for the review screenshot.
 await page.goto(`${origin}/tests/fixtures/padding/`);await page.locator('img').first().evaluate(n=>n.decode());
 const out=new URL('../test-results/padding-core/',import.meta.url);await mkdir(out,{recursive:true});
 await page.screenshot({path:fileURLToPath(new URL(`${engine}.png`,out)),fullPage:true});
 assert.deepEqual(errors,[]);await writeFile(new URL(`${engine}.json`,out),JSON.stringify({engine,browser:browser.version(),checks,passed:true},null,2)+'\n');
 console.log(`${engine}: ${checks} padding checks passed: source/minified/fallback, fields, one/two bits, source counts, overlays, nesting, overrides and no measurement.`);
}finally{await browser?.close();server.kill();}
