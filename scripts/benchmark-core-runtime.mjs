// Synchronous style/layout assessment. Timings are not paint or interaction metrics.
import {launchBrowser} from './lib/browser-launch.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {cpus,platform,arch,release} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {placements} from '../src/core/geometry.mjs';
import {layouts} from '../src/core/catalogue.mjs';
const option=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const engine=option('engine')??'chromium',rounds=Number(option('rounds')??3),iterations=Number(option('iterations')??20),count=Number(option('count')??13);
const compositionsList=(option('compositions')??'1,20').split(',').map(Number),context=option('context')??'local';
const tag=option('tag')??`${engine}-${context}-${count}`,cssPath=option('css')??'css/main.min.css';
assert.ok(['chromium','firefox','webkit'].includes(engine));assert.ok(['local','shared'].includes(context));
assert.ok(Number.isInteger(rounds)&&rounds>=1&&Number.isInteger(iterations)&&iterations>=2&&Number.isInteger(count)&&count>=1);
assert.ok(compositionsList.every(n=>Number.isInteger(n)&&n>0));assert.match(tag,/^[a-zA-Z0-9_-]+$/);
const measured=process.argv.includes('--measure-all'),padding=process.argv.includes('--padding');
const css=await readFile(cssPath,'utf8'),cssSha256=createHash('sha256').update(css).digest('hex');
let cases=[
 {id:'stack',alt:'peers-2',count}, {id:'peers-3',alt:'peers-4',count},
 {id:'two-3-2',alt:'two-2-3',count}, {id:'three-1-2-1',alt:'three-2-1-3',count},
 {id:'four-6-5-4-3',alt:'four-3-4-5-6',count},
 {id:'mosaic-8',alt:'peers-2',count:8,spacing:'thin'},
 {id:'mosaic-13',alt:'peers-2',count:13,spacing:'thin'},
 {id:'mixed',count,pattern:[{id:'stack',alt:'peers-2'},{id:'two-3-2',alt:'two-2-3'},{id:'three-1-2-1',alt:'three-2-1-3'},{id:'four-6-5-4-3',alt:'four-3-4-5-6'}]}
];
const selected=option('cases')?.split(',');
if(selected){
 for(const id of selected)if(!cases.some(c=>c.id===id)){
  const p=layouts.find(p=>p.id===id&&p.family==='mosaic');if(p)cases.push({id,alt:'peers-2',count:p.count,spacing:'thin'});
 }
 assert.ok(selected.every(id=>cases.some(c=>c.id===id)),'Unknown case');cases=cases.filter(c=>selected.includes(c.id));
}
const common='*{box-sizing:border-box}body{margin:0;font:16px/1.4 Arial,sans-serif}#workspace{width:1200px}.composition{margin:12px 0;min-inline-size:0}.gp_ruler--measure{container-type:inline-size}.composition>article{min-inline-size:0;overflow-wrap:anywhere;background:#eef2f3}.composition>article:not(.gp_pad){padding:8px}h2{font-size:18px;margin:0 0 8px}p{margin:0}';
function fixedCSS(c){
 return '.gp_ruler{display:grid;grid-template-columns:repeat(64,minmax(0,1fr))}.composition{display:grid;grid-template-columns:subgrid;grid-column:1/-1}.composition.gp_ruler{grid-template-columns:repeat(64,minmax(0,1fr))}'+
  (c.pattern??[c]).flatMap(p=>[p.id,p.alt]).map(id=>[c.count,c.count+1].map(n=>placements({id,count:n,spacing:c.spacing??'neat'}).map((p,i)=>`.composition.gp_layout--${id}[data-count="${n}"]>:nth-child(${i+1}){grid-column:${p.start+1}/span ${p.span};grid-row:${p.row}/span ${p.rowspan};margin-block-start:${p.gutterBits?`calc(${100/p.span}%)`:'0px'};${padding?`padding:calc(100% / ${p.span});`:''}}`).join('')).join('')).join('');
}
const browser=await launchBrowser(engine),results=[];
try{
 for(let round=0;round<rounds;round++)for(const compositions of compositionsList)for(const c of cases){
  let reference;
  for(const mode of round%2?['graphpaper','fixed']:['fixed','graphpaper']){
   const page=await browser.newPage({viewport:{width:1440,height:900}});
   const articles=Array.from({length:c.count},(_,i)=>`<article${padding?' class="gp_pad"':''}><h2>Record ${i+1}: a useful headline</h2><p>${'Content with a mixture of shorter and longer records. '.repeat(1+i%3)}</p></article>`).join('');
   const sections=Array.from({length:compositions},(_,i)=>`<section class="composition ${context==='local'?`gp_ruler ${measured?'gp_ruler--measure':''}`:''} gp_layout--${(c.pattern?.[i%c.pattern.length]??c).id} gp_spacing--${c.spacing??'neat'}" data-count="${c.count}">${articles}</section>`).join('');
   await page.setContent(`<style>${common}</style><div id="workspace">${context==='shared'?`<div class="gp_ruler ${measured?'gp_ruler--measure':''}">${sections}</div>`:sections}</div>`);
   const session=engine==='chromium'?await page.context().newCDPSession(page):null;
   if(session)await session.send('Performance.enable');
   const before=session?(await session.send('Performance.getMetrics')).metrics:[];
   const result=await page.evaluate(({sheet,c,iterations})=>{
    const workspace=document.querySelector('#workspace'),roots=[...document.querySelectorAll('.composition')],extra=roots.map(root=>root.firstElementChild.cloneNode(true));
    const flush=()=>roots.at(-1).lastElementChild.getBoundingClientRect().bottom;
    let start=performance.now();const style=document.createElement('style');style.textContent=sheet;document.head.append(style);flush();const initial=performance.now()-start;
    function geometry(){return roots.map(root=>{
     const box=root.getBoundingClientRect(),groups=new Map();
     const items=[...root.children].map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),key=s.gridColumnStart+'/'+s.gridColumnEnd;
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push({top:r.top,bottom:r.bottom});
      return[r.x-box.x,r.y-box.y,r.width,r.height,parseFloat(s.paddingLeft)||0,parseFloat(s.marginBlockStart)||0];
     });
     let overlaps=0;for(const group of groups.values()){group.sort((a,b)=>a.top-b.top);for(let i=1;i<group.length;i++)if(group[i].top<group[i-1].bottom-.5)overlaps++;}
     return{width:box.width,height:box.height,items,overlaps,realizedRows:overlaps?getComputedStyle(root).gridTemplateRows.split(' ').length:null};
    });}
    function resize(i){workspace.style.width=i%2?'1200px':'1180px';flush();}
    function select(i){roots.forEach((root,index)=>{const p=c.pattern?.[index%c.pattern.length]??c;root.classList.replace(`gp_layout--${i%2?p.alt:p.id}`,`gp_layout--${i%2?p.id:p.alt}`);});flush();}
    function source(i){roots.forEach((root,index)=>{if(i%2){if(extra[index].isConnected)extra[index].remove();}else if(!extra[index].isConnected)root.append(extra[index]);root.dataset.count=String(root.children.length);});flush();}
    const geometryStates={initial:geometry()};resize(0);geometryStates.resize=geometry();resize(1);select(0);geometryStates.select=geometry();select(1);source(0);geometryStates.source=geometry();source(1);
    const valid=Object.fromEntries(Object.entries(geometryStates).map(([phase,data])=>[phase,data.every(root=>root.overlaps===0)]));
    const timed=operation=>{for(let i=0;i<4;i++)operation(i);const times=[];for(let i=0;i<iterations;i++){start=performance.now();operation(i);times.push(performance.now()-start);}operation(1);return times;};
    const resizeTimes=valid.initial&&valid.resize?timed(resize):[];
    const selectTimes=valid.initial&&valid.select?timed(select):[];
    const sourceTimes=valid.initial&&valid.source?timed(source):[];
    const deltas=[];let previous=performance.now();for(let i=0;i<5000;i++){const now=performance.now();if(now>previous)deltas.push(now-previous);previous=now;}
    return{initial:valid.initial?initial:null,diagnosticInitial:valid.initial?null:initial,resize:resizeTimes,select:selectTimes,source:sourceTimes,geometryStates,valid,timerResolutionMs:deltas.length?Math.min(...deltas):null};
   },{sheet:mode==='graphpaper'?css:fixedCSS(c),c,iterations});
   const after=session?(await session.send('Performance.getMetrics')).metrics:[];
   const metric=name=>1000*((after.find(m=>m.name===name)?.value??0)-(before.find(m=>m.name===name)?.value??0));
   if(reference)for(const [phase,geometry] of Object.entries(result.geometryStates))geometry.forEach((root,index)=>{
    const expected=reference[phase][index];assert.equal(root.overlaps,expected.overlaps,`${c.id}/${phase}: same visible realizability`);
    for(const key of ['width','height'])assert.ok(Math.abs(root[key]-expected[key])<1.1,`${c.id}/${phase}/${index}: root ${key}`);
    root.items.forEach((item,i)=>item.forEach((value,k)=>assert.ok(Math.abs(value-expected.items[i][k])<1.1,`${c.id}/${phase}/${index}/${i}/${k}: ${value} vs ${expected.items[i][k]}`)));
   });
   reference=result.geometryStates;
   const validity=Object.fromEntries(Object.entries(result.geometryStates).map(([phase,roots])=>[phase,{valid:result.valid[phase],overlaps:roots.reduce((sum,r)=>sum+r.overlaps,0),realizedRows:roots.find(r=>r.overlaps)?.realizedRows??null}]));
   delete result.geometryStates;
   results.push({round,compositions,id:c.id,items:compositions*c.count,mode,styleTotalMs:session?metric('RecalcStyleDuration'):null,layoutTotalMs:session?metric('LayoutDuration'):null,...result,validity});
   await page.close();
  }
  console.error(`Completed ${engine} ${context} ${count} round ${round+1}/${rounds}: ${compositions} compositions, ${c.id}`);
 }
 const quantile=(values,p)=>{if(!values.length)return null;const a=[...values].sort((a,b)=>a-b);return a[Math.max(0,Math.ceil(a.length*p)-1)];};
 const summary=[];
 for(const compositions of compositionsList)for(const c of cases)for(const mode of ['fixed','graphpaper']){
  const rows=results.filter(r=>r.compositions===compositions&&r.id===c.id&&r.mode===mode);
  for(const row of rows)assert.deepEqual(row.validity,rows[0].validity,`${c.id}: realizability changed across rounds`);
  const timing=name=>({median:quantile(rows.flatMap(r=>r[name]),.5),p95:quantile(rows.flatMap(r=>r[name]),.95)});
  summary.push({compositions,id:c.id,items:compositions*c.count,mode,initialMs:quantile(rows.map(r=>r.initial).filter(n=>n!==null),.5),resizeMs:timing('resize'),selectionMs:timing('select'),sourceMs:timing('source'),validity:rows[0].validity,timerResolutionMs:quantile(rows.map(r=>r.timerResolutionMs).filter(n=>n!==null),.5)});
 }
 assert.equal(createHash('sha256').update(await readFile(cssPath)).digest('hex'),cssSha256,'Stylesheet changed during measurement');
 const report={engine,browser:browser.version(),context,measured,padding,count,cssBytes:Buffer.byteLength(css),cssPath,cssSha256,platform:platform(),osRelease:release(),arch:arch(),cpu:cpus()[0]?.model,rounds,iterations,compositions:compositionsList,method:'Inline stylesheet insertion plus forced synchronous layout; alternating precompiled/Graph Paper order. Compare initial, resized, alternate-layout and added-source geometry for every composition, detect same-region overlap, and omit invalid-operation timings. Fixed CSS knows both layouts and source totals; it does not provide automatic allocation, metadata, feature fallback or captured ruler-length semantics. Timings exclude network, paint, images, GPU, scrolling and real-device interaction; not an interaction budget. Chromium style/layout totals also include preflight and warmups.',summary,results};
 await mkdir('test-results/runtime',{recursive:true});await writeFile(`test-results/runtime/${tag}.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,results:undefined},null,2));
}finally{await browser.close();}
