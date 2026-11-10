// Bounded feasibility probe, not a replacement for release performance tests.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cpus,platform,arch} from 'node:os';
import {transform} from 'lightningcss';
import {launchBrowser} from './lib/browser-launch.mjs';
import {compileSelection,selectiveProfiles} from './lib/selective-core.mjs';
import {compactPrivateProperties} from './lib/compact-core.mjs';
import {enhancementCondition} from '../src/core/features.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.slice(9)??'chromium';
const full=await readFile(new URL('../css/main.min.css',import.meta.url),'utf8');
const browser=await launchBrowser(engine),results=[];
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const p95=a=>[...a].sort((a,b)=>a-b)[Math.ceil(a.length*.95)-1];
try{
 for(const profile of ['one-composition','small-site','without-four-mosaic','repeating','four-and-mosaic']){
  const {css,selection}=compileSelection(selectiveProfiles[profile]);
  const subset=transform({filename:'selection.css',code:Buffer.from(compactPrivateProperties(css).css),minify:true}).code.toString();
  const plans=selection.layouts.filter(id=>id!=='stack');
  for(const roots of [1,20]){
   const raw={full:[],selective:[]};
   for(let round=0;round<3;round++)for(const mode of round%2?['selective','full']:['full','selective']){
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    try{
     const source=mode==='full'?full:subset;
     await page.setContent('<style>html{font-size:16px}body{margin:0}p{font:16px/1.4 sans-serif;margin:0}*{box-sizing:border-box}</style><div id="workspace" style="width:1200px"></div>');
     if(!await page.evaluate(condition=>CSS.supports(condition),enhancementCondition))throw Error('Runtime probe requires the native-count enhancement path');
     const sample=await page.evaluate(({css,plans,roots})=>{
      const workspace=document.querySelector('#workspace');
      const make=(id,index)=>{
       const root=document.createElement('section');root.className=`gp_ruler gp_layout--${id} gp_spacing--neat`;
       const count=id.startsWith('mosaic-')?Number(id.slice(7)):13;
       root.innerHTML=Array.from({length:count},(_,i)=>`<article class="gp_pad"><p>Record ${index}-${i}. ${'Uneven but repeatable content. '.repeat(i%4+1)}</p></article>`).join('');
       return root;
      };
      for(let i=0;i<roots;i++)workspace.append(make(plans[i%plans.length],i));
      const flush=()=>{let checksum=0;for(const root of workspace.children)for(const node of root.children){const r=node.getBoundingClientRect();checksum+=r.x+r.y+r.width+r.height;if(!Number.isFinite(checksum))throw Error('Nonfinite geometry');}return checksum;};
      const start=performance.now(),style=document.createElement('style');style.textContent=css;document.head.append(style);flush();
      const initial=performance.now()-start;
      const width=[],source=[];
      for(let i=0;i<16;i++){
       let begin=performance.now();workspace.style.width=i%2?'1200px':'1180px';flush();const resize=performance.now()-begin;
       begin=performance.now();
       for(const root of workspace.children){if(i%2)root.lastElementChild.remove();else{const node=document.createElement('article');node.className='gp_pad';node.innerHTML='<p>Additional record with different text.</p>';root.append(node);}}
       flush();const mutation=performance.now()-begin;
       if(i>=4){width.push(resize);source.push(mutation);}
      }
      return {initial,width,source};
     },{css:source,plans,roots});
     raw[mode].push(sample);
    }finally{await page.close();}
   }
   const summary=Object.fromEntries(Object.entries(raw).map(([mode,rounds])=>[mode,{
    initial:median(rounds.map(r=>r.initial)),
    width:{median:median(rounds.flatMap(r=>r.width)),p95:p95(rounds.flatMap(r=>r.width))},
    source:{median:median(rounds.flatMap(r=>r.source)),p95:p95(rounds.flatMap(r=>r.source))},
   }]));
   results.push({profile,roots,plans,summary,raw,sha256:{full:createHash('sha256').update(full).digest('hex'),selective:createHash('sha256').update(subset).digest('hex')}});
   console.log(`${engine}/${profile}/${roots}:`,JSON.stringify(summary));
  }
 }
 const directory=new URL('../test-results/selective-builds/',import.meta.url);await mkdir(directory,{recursive:true});
 await writeFile(new URL(`${engine}-runtime.json`,directory),JSON.stringify({engine,version:browser.version(),environment:{platform:platform(),arch:arch(),cpu:cpus()[0]?.model},rounds:3,warmups:4,iterations:12,units:'milliseconds; synchronous style/layout; no network, paint or real-device FPS claim',results},null,2)+'\n');
}finally{await browser.close();}
