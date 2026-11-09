import {cases,fixture,records,hostCSS} from './shared.mjs';
import {sourceItems} from '../../../docs/sequence/content.mjs';
const p=new URLSearchParams(location.search),c=cases.find(c=>c.key===p.get('case'))??cases[3],padding=p.get('padding')!=='false',kind=p.get('content')??'library';
const style=document.createElement('style');style.textContent=hostCSS;document.head.insertBefore(style,document.getElementById('core'));
let content=kind==='library'?sourceItems.slice(0,c.count).map(s=>s.replace('class="library-entry','class="record'+(padding?' gp_pad':'')+' library-entry').replaceAll('<h3>','<h2>').replaceAll('</h3>','</h2>')).join('').replaceAll('src="./assets/','src="../../../docs/sequence/assets/').replaceAll('href="../','href="../../../docs/'):records(c.count,{padding,density:kind});
document.body.classList.toggle('bounds',p.get('bounds')==='true');
document.body.innerHTML=fixture(c,{width:Number(p.get('width'))||1200,spacing:p.get('field')??'neat',context:p.get('context')??'standalone',amount:p.get('amount')==='none'?null:([0,1,2].includes(Number(p.get('amount')))?Number(p.get('amount')):1),padding,content});
let lastHeight=0,pending=false;
function report(){pending=false;const height=Math.ceil(document.body.getBoundingClientRect().height);if(height!==lastHeight){lastHeight=height;parent.postMessage({type:'vertical-spacing-size',height},location.origin);}}
new ResizeObserver(()=>{if(!pending){pending=true;requestAnimationFrame(report);}}).observe(document.body);window.addEventListener('load',report);requestAnimationFrame(report);
