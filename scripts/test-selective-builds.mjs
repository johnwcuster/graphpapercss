import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {launchBrowser} from './lib/browser-launch.mjs';
import {compileSelection,selectiveProfiles} from './lib/selective-core.mjs';
import {layouts,hinges} from '../src/core/catalogue.mjs';
import {enhancementCondition} from '../src/core/features.mjs';
import {transform} from 'lightningcss';
import {compactPrivateProperties} from './lib/compact-core.mjs';
import {minifyGeneratedCSS} from '../src/core/compact.mjs';
import {predefinedProfiles} from '../src/core/profiles.mjs';

const engine=process.argv.find(arg=>arg.startsWith('--engine='))?.slice(9)??'chromium';
const predefined=process.argv.includes('--predefined');
const directory=new URL(predefined?'../test-results/profiles/':'../test-results/selective-builds/',import.meta.url);
await mkdir(directory,{recursive:true});
const canonical=await readFile(new URL('../css/main.css',import.meta.url),'utf8');
const canonicalMin=await readFile(new URL('../css/main.min.css',import.meta.url),'utf8');
const browser=await launchBrowser(engine);
const results=[];
try{
 const profiles=predefined?Object.fromEntries(predefinedProfiles.map(p=>[p.id,p.selection])):selectiveProfiles;
 for(const [profile,options] of Object.entries(profiles)){
  // The full selection is byte-identical, asserted in the unit suite.
  if(profile==='full')continue;
  const selected=compileSelection(options),selection=selected.selection;
  const css=predefined?await readFile(`css/profiles/${profile}.css`,'utf8'):selected.css;
  const min=predefined?await readFile(`css/profiles/${profile}.min.css`,'utf8'):transform({filename:'selection.css',code:Buffer.from(compactPrivateProperties(css).css),minify:true}).code.toString();
  const selectedPlans=layouts.filter(p=>selection.layouts.includes(p.id));
  const cases=[];
  const base={width:1440,count:7,spacing:selection.spacing[0],allocation:'closest',fewer:'left',traversal:'left-to-right',arrangement:'across'};
  for(const plan of selectedPlans)for(const spacing of selection.spacing)for(const count of [...new Set([0,1,plan.count??plan.columns??3,7,13,...(plan.count?[plan.count+1]:[])])])cases.push({...base,id:plan.id,spacing,count});
  for(const family of ['two','three','four','mosaic']){
   const plan=selectedPlans.find(p=>p.family===family);if(!plan)continue;
   for(const count of [2,5,6,8,9,11,12,19,41,65,66,67,129,130])for(const variant of [0,1])cases.push({...base,id:plan.id,count,allocation:variant?'stronger':'closest',fewer:variant?'right':'left',traversal:family==='two'?'right-to-left':family==='three'?'center-first':'widest-first'});
   for(const exact of family==='two'?[[1,4],[2,4],[0,5]]:family==='three'?[[2,1,3],[3,3,3],[5,3,4]]:family==='four'?[[2,3,4,3],[3,3,3,3],[1,3,5,3]]:[])cases.push({...base,id:plan.id,count:exact.reduce((a,b)=>a+b,0),exact});
   cases.push({...base,id:'stack',override:plan.id,count:plan.count??12});
   if(family==='two')for(const arrangement of ['first-above','last-below','first-above-last-below'])for(const count of [1,3,6,13])cases.push({...base,id:plan.id,count,arrangement});
  }
  const nested=selectedPlans.find(p=>p.family==='two')??selectedPlans.find(p=>p.family==='peers');
  if(nested)for(const mode of ['continue','rebase'])for(const width of [360,720,1440])cases.push({...base,id:nested.id,count:3,width,nested:{mode,id:selectedPlans.find(p=>p.family==='three')?.id??nested.id}});
  for(const [rem,prefix] of hinges.filter(([rem])=>selection.hinges.includes(rem)))for(const width of [rem*16-1,rem*16,rem*16+1]){
   cases.push({...base,id:'stack',width,responsive:{prefix,id:selectedPlans.at(-1).id}});
   const three=selectedPlans.find(p=>p.family==='three');
   if(three)cases.push({...base,id:three.id,width,count:12,responsive:{prefix,id:three.id,exact:[5,3,4],spacing:selection.spacing.at(-1)}});
  }

  const profileResults=[];
  const requested=process.argv.find(a=>a.startsWith('--format='))?.slice(9);
  for(const format of (requested?[requested]:predefined?['readable','minified','fallback','fallback-minified']:['readable','minified','fallback','browser-minified'])){
   if(!['readable','minified','fallback','fallback-minified','browser-minified'].includes(format))throw Error('Unknown parity format');
   const fallback=source=>{assert.ok(source.includes(enhancementCondition),'count-off condition must actually be replaced');return source.replaceAll(enhancementCondition,'(graphpaper-probe-disabled: 1)');};
   const sources=format==='minified'?[canonicalMin,min]:format==='browser-minified'?[canonicalMin,minifyGeneratedCSS(css)]:format==='fallback'?[fallback(canonical),fallback(css)]:format==='fallback-minified'?[fallback(canonicalMin),fallback(min)]:[canonical,css];
   const pages=[];
   try{
    for(const source of sources){
     const page=await browser.newPage({viewport:{width:1440,height:900}});
     await page.setContent(`<style>html{font-size:16px}body{margin:0}*{box-sizing:border-box}article{min-height:24px}p{margin:0;font:16px/1.4 sans-serif}a{color:inherit}</style><style>${source}</style><main id="root"></main>`);
     pages.push(page);
    }
    // Batch DOM updates inside the browser so the measurement is not dominated
    // by thousands of protocol round trips. Each update forces real layout.
    const snapshot=async(page,batch)=>page.evaluate(cases=>{
     const root=document.querySelector('#root');
     const item=i=>`<article class="gp_pad gp_rule--start gp_rule--end"><p><a href="#">Item ${i+1}</a> ${'Content of a different length. '.repeat(1+i%4)}</p></article>`;
     const records=[];
     for(const state of cases){
      root.className=`gp_ruler ${state.spacing==='ruled'?'gp_ruler--measure':''} gp_layout--${state.id} gp_spacing--${state.spacing} gp_allocation--${state.allocation} gp_fewer--${state.fewer} gp_traversal--${state.traversal} gp_arrangement--${state.arrangement} gp_vertical-spacing--1`;
      root.style.cssText='';
      if(state.override)root.style.setProperty('--gp-layout',`var(--gp-${state.override})`);
      if(state.responsive){
       const {prefix,id,exact,spacing}=state.responsive;
       root.classList.add(`gp_${prefix}--${id}`,`gp_${prefix}-vertical-spacing--2`);
       if(spacing)root.classList.add(`gp_${prefix}-spacing--${spacing}`);
       if(exact)exact.forEach((n,i)=>root.style.setProperty(`--gp-${prefix}-exact-count-${['left','center','right'][i]}`,n));
      }
      root.innerHTML=Array.from({length:state.count},(_,i)=>item(i)).join('');
      if(state.responsive)for(const item of root.children)item.classList.add(`gp_${state.responsive.prefix}-pad--2`);
      if(state.exact){const keys=state.exact.length===2?['left','right']:state.exact.length===3?['left','center','right']:['left','center-left','center-right','right'];state.exact.forEach((n,i)=>root.style.setProperty(`--gp-exact-count-${keys[i]}`,n));}
      if(state.nested&&root.firstElementChild){
       const wrapper=root.firstElementChild;wrapper.className='gp_continue_tracks';
       wrapper.innerHTML=`<section class="${state.nested.mode==='rebase'?'gp_rebase_64':''} gp_layout--${state.nested.id} gp_spacing--${state.spacing} gp_vertical-spacing--2">${Array.from({length:6},(_,i)=>item(i)).join('')}</section>`;
      }
      const nodes=[root,...root.querySelectorAll('article,section')];
      records.push(nodes.map(node=>{
       const s=getComputedStyle(node),r=node.getBoundingClientRect();
       const pseudo=p=>{const s=getComputedStyle(node,p);return s.content==='none'?['none']:[s.content,s.left,s.right,s.width,s.backgroundSize];};
       return {numbers:[r.x,r.y,r.width,r.height,parseFloat(s.marginBlockStart)||0,parseFloat(s.paddingLeft)||0,Number(s.getPropertyValue('--_gp-tracks'))],strings:[s.gridColumnStart,s.gridColumnEnd,s.gridRowStart,s.gridRowEnd],before:pseudo('::before'),after:pseudo('::after')};
      }));
     }
     return records;
    },batch);
    for(let i=0;i<cases.length;i+=40){
     const batch=cases.slice(i,i+40);
     // Responsive cases need the viewport itself, rather than a root width.
     const regular=batch.filter(s=>s.width===1440);
     if(regular.length){
      const expected=await snapshot(pages[0],regular),actual=await snapshot(pages[1],regular);
      compare(actual,expected,`${engine}/${profile}/${format}/${i}`);
     }
     for(const state of batch.filter(s=>s.width!==1440)){
      for(const page of pages)await page.setViewportSize({width:state.width,height:900});
      compare(await snapshot(pages[1],[state]),await snapshot(pages[0],[state]),`${engine}/${profile}/${format}/${JSON.stringify(state)}`);
      for(const page of pages)await page.setViewportSize({width:1440,height:900});
     }
    }
    profileResults.push({format,cases:cases.length,status:'pass'});
   }finally{for(const page of pages)await page.close();}
  }
  results.push({profile,checks:profileResults});
  console.log(`${engine}: ${profile}: ${cases.length} cases × ${profileResults.map(r=>r.format).join('/')} PASS`);
 }
 const suffix=process.argv.find(a=>a.startsWith('--format='))?.slice(9);
 await writeFile(new URL(`${engine}${suffix?'-'+suffix:''}.json`,directory),JSON.stringify({engine,version:browser.version(),results},null,2)+'\n');
}finally{await browser.close();}

function compare(actual,expected,label){
 assert.equal(actual.length,expected.length,label);
 for(let i=0;i<expected.length;i++){
  assert.equal(actual[i].length,expected[i].length,label);
  for(let j=0;j<expected[i].length;j++){
   const a=actual[i][j],e=expected[i][j];
   a.numbers.forEach((n,k)=>assert.ok(Number.isFinite(n)&&Math.abs(n-e.numbers[k])<.1,`${label}/${i}/${j}/${k}: ${n} != ${e.numbers[k]}`));
   assert.deepEqual(a.strings,e.strings,`${label}/${i}/${j}: grid placement`);
   assert.deepEqual(a.before,e.before,`${label}/${i}/${j}: start rule`);
   assert.deepEqual(a.after,e.after,`${label}/${i}/${j}: end rule`);
  }
 }
}
