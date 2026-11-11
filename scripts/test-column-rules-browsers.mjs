import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {launchBrowser} from './lib/browser-launch.mjs';
import {compileSelection} from '../src/core/selection.mjs';
import {generateColumnRulesCSS} from '../src/core/rule-compiler.mjs';
import {minifyGeneratedCSS} from '../src/core/compact.mjs';
import {enhancementCondition} from '../src/core/features.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.slice(9)??'chromium';
const browser=await launchBrowser(engine);
const baseline=execFileSync('git',['show','v0.5.2:css/main.css'],{encoding:'utf8'});
const extension=await readFile('css/extensions/column-rules.css','utf8');
const cases=[];
for(const id of ['stack','peers-2','peers-5','two-3-2','three-1-2-1','four-6-5-4-3','mosaic-6'])for(const spacing of ['neat','thin','wide','ruled'])for(const count of [1,3,6,12])cases.push({id,spacing,count});
for(const measured of [false,true])for(const width of [100,640,1536])for(const nesting of ['continue','rebase'])cases.push({id:'two-3-2',spacing:'ruled',count:3,measured,width,nesting});
cases.push({id:'stack',spacing:'ruled',count:6,responsive:true});
const markup=c=>{
 const items=n=>Array.from({length:n},(_,i)=>`<article class="gp_rule--start gp_rule--end" style="border:2px solid transparent;padding:5px"><p>${i+1}. ${'Text of different length. '.repeat(i%3+1)}</p></article>`).join('');
 const nested=c.nesting?`<section class="${c.nesting==='continue'?'gp_continue_tracks':'gp_rebase_64 gp_ruler--measure'} gp_layout--three-1-2-1 gp_spacing--ruled">${items(3)}</section>`:'';
 return `<main class="gp_ruler ${c.measured===false?'':'gp_ruler--measure'} gp_layout--${c.id} ${c.responsive?'gp_sm--two-3-2 gp_lg--three-1-2-1':''} gp_spacing--${c.spacing}" style="width:${c.width??1200}px;--gp-rule-color:rgb(90, 100, 110)">${items(c.count)}${nested}</main>`;
};
const host='html{font-size:16px}body{margin:0}*{box-sizing:border-box}p{margin:0;font:16px/1.4 sans-serif}';
const snapshot=page=>page.locator('article').evaluateAll(nodes=>nodes.map(n=>{
 const r=n.getBoundingClientRect(),s=getComputedStyle(n);
 const pseudo=which=>{const p=getComputedStyle(n,which);return [p.content,p.left,p.right,p.width,p.height,p.translate,p.backgroundImage,p.pointerEvents];};
 return {box:[r.x,r.y,r.width,r.height],columns:[s.gridColumnStart,s.gridColumnEnd],rules:[pseudo('::before'),pseudo('::after')]};
}));
let checks=0;
try{
 const reference=await browser.newPage(),actual=await browser.newPage();
 const files=['main.css','main.min.css','main.layer.css','main.layer.min.css','profiles/repeating.css','profiles/repeating.min.css','profiles/two-three.css','profiles/two-three.min.css','custom-readable','custom-minified'];
 for(const file of files){
  const custom=compileSelection({layouts:['stack','peers-2','two-3-2','three-1-2-1'],spacing:['ruled','neat','thin','wide']}).css+generateColumnRulesCSS();
  const core=file.startsWith('custom')?(file.endsWith('minified')?minifyGeneratedCSS(custom):custom):await readFile('css/'+file,'utf8');
  const ext=file.startsWith('custom')?'':await readFile(`css/extensions/column-rules${file.includes('.layer')?'.layer':''}${file.includes('.min')?'.min':''}.css`,'utf8');
  for(const c of cases){
   if(file.includes('repeating')&&(!['stack','peers-2','peers-5'].includes(c.id)||c.nesting||c.responsive))continue;
   if((file.includes('two-three')||file.startsWith('custom'))&&['four-6-5-4-3','mosaic-6',...(file.startsWith('custom')?['peers-5']:[])].includes(c.id))continue;
   for(const p of [reference,actual])await p.setViewportSize({width:c.width??1200,height:900});
   const html=markup(c);
   await reference.setContent(`<style>${host}</style><style>${baseline}</style>${html}`);
   await actual.setContent(`<style>${host}</style><style>${core}</style><style>${ext}</style>${html}`);
   const a=await snapshot(actual),b=await snapshot(reference);
   assert.equal(a.length,b.length);
   a.forEach((item,i)=>{assert.deepEqual(item.columns,b[i].columns,`${file}/${JSON.stringify(c)}/${i}`);assert.deepEqual(item.rules,b[i].rules,`${file}/${JSON.stringify(c)}/${i} rules`);item.box.forEach((v,j)=>assert.ok(Math.abs(v-b[i].box[j])<.1,`${file}/${i} geometry`));checks++;});
  }
 }
 // Core-only ownership classes introduce neither decoration nor positioning.
 const core=await readFile('css/main.min.css','utf8');
 await actual.setContent(`<style>${host}</style><style>${core}</style>${markup({id:'two-3-2',spacing:'ruled',count:3})}`);
 assert.ok((await actual.locator('article').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).position))).every(p=>p==='static'));
 assert.ok((await snapshot(actual)).every(n=>n.rules.every(r=>r[0]==='none')));
 // The owner's relative positioning anchors absolute children, but does not
 // enclose their z-index in a new stacking context. Measurement remains explicit.
 await actual.setContent(`<style>${host}</style><style>${core}</style><style>${extension}</style><main class="gp_ruler gp_ruler--measure gp_layout--peers-2 gp_spacing--ruled" style="width:1000px"><article id="owner" class="gp_rule--end" style="height:100px"><div id="overlay" style="position:absolute;left:100%;top:0;width:100px;height:100px;z-index:10;background:red"></div></article><article style="height:100px;background:blue"></article></main>`);
 assert.equal(await actual.locator('#owner').evaluate(n=>getComputedStyle(n).zIndex),'auto');
 const overlay=await actual.locator('#overlay').boundingBox();
 assert.equal(await actual.evaluate(({x,y})=>document.elementFromPoint(x+10,y+10)?.id,overlay),'overlay');
 // Ordinary host rules still override the zero-specificity owner positioning.
 await actual.addStyleTag({content:'#owner{position:sticky;top:0}'});
 assert.equal(await actual.locator('#owner').evaluate(n=>getComputedStyle(n).position),'sticky');
 await mkdir('test-results/column-rules',{recursive:true});
 const record={engine,version:browser.version(),checks,status:'pass',scope:'0.5.2 rule/geometry parity; standalone, layered, profiles and bundled custom builds; core neutrality; overlay escape; author positioning override'};
 await writeFile(`test-results/column-rules/${engine}.json`,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify(record));
}finally{await browser.close();}
