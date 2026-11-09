import {paddingCSS,paddingClasses} from '../../../src/core/padding.mjs';
const targets=[...document.querySelectorAll('[data-padding]')];
const padding=document.querySelector('#padding'),size=document.querySelector('#padding-size'),width=document.querySelector('#width');
document.querySelector('#utility-code').textContent=paddingCSS;
function report(){
 document.querySelectorAll('[data-readout]').forEach(node=>{
  const root=document.getElementById(node.dataset.readout),w=root.getBoundingClientRect().width;
  const leaf=root.querySelector('[data-padding]');
  const text=`${node.dataset.readout}: ${w.toFixed(2)}px ruler / 64 = ${(w/64).toFixed(2)}px bit · actual padding ${getComputedStyle(leaf).paddingLeft}`;
  if(node.textContent!==text)node.textContent=text;
 });
}
function update(){
 const bits=Number(size.value);
 targets.forEach(node=>{node.classList.remove(...Object.values(paddingClasses));if(padding.checked)node.classList.add(paddingClasses[bits]);});
 document.querySelector('#workspace').style.setProperty('--fixture-width',`${width.value}px`);
 document.querySelector('#requested-width').textContent=`${width.value}px`;
 document.querySelector('#status').textContent=padding.checked?`${bits} ${bits===1?'bit':'bits'} of padding from assigned tracks. No ruler measurement or layout gaps.`:'Item padding is off. Layout gutters and track alignment are retained.';
 report();
}
for(const node of [padding,size,width])node.addEventListener('input',update);
let reportPending=false;
new ResizeObserver(()=>{if(reportPending)return;reportPending=true;requestAnimationFrame(()=>{reportPending=false;report();});}).observe(document.querySelector('#workspace'));
update();
