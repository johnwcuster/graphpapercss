import {exactCountsEligible} from '../../../src/core/three-geometry.mjs';
import {pairExactCountsEligible} from '../../../src/core/pair-geometry.mjs';
import {fourExactCountsEligible} from '../../../src/core/four-geometry.mjs';
const controls=Object.fromEntries(['layout','arrangement','count','spacing','allocation','fewer','traversal','width'].map(id=>[id,document.getElementById(id)]));
const names=['left','center','center-left','center-right','right'];
const fields=Object.fromEntries(names.map(n=>[n,document.getElementById(`exact-${n}`)]));
const choicesByScope=Object.fromEntries([['three','exact-choices'],['pair','pair-exact-choices'],['four','four-exact-choices']].map(([scope,id])=>[scope,JSON.parse(document.getElementById(id).textContent)]));
const root=document.querySelector('#example');
const privateNames=JSON.parse(document.querySelector('#private-property-names').textContent);
// Diagnostic page only: inspect either readable or compact delivery CSS.
const privateValue=(style,name)=>style.getPropertyValue(name)||style.getPropertyValue(privateNames[name]);
const measure=document.querySelector('#measure-ruler');
const records=[...document.querySelector('#records').content.children].map(n=>n.outerHTML);
const drafts={three:{},pair:{},four:{}};let scope=null,activeNames=[];
function update(){
 const two=controls.layout.value.startsWith('two-'),three=controls.layout.value.startsWith('three-'),four=controls.layout.value.startsWith('four-'),mosaic=controls.layout.value.startsWith('mosaic-');
 controls.arrangement.disabled=!two;
 document.querySelector('#measure-control').hidden=!mosaic;
 const equalFour=controls.layout.value==='four-1-1-1-1';
 for(const option of controls.traversal.options){
  option.disabled=mosaic?option.value!=='left-to-right':option.value==='center-first'?!three:option.value==='right-to-left'?four||three&&Number(controls.count.value)!==3:option.value==='widest-first'?!four||equalFour:false;
 }
 if(controls.traversal.selectedOptions[0].disabled)controls.traversal.value='left-to-right';
 const s=Object.fromEntries(Object.entries(controls).map(([key,n])=>[key,n.value]));
 const ruled=s.spacing==='ruled'&&!mosaic&&s.layout!=='stack';
 const both=s.arrangement==='first-above-last-below',excluded=both?2:1,pair=two&&s.arrangement!=='across';
 const nextScope=four?'four':three?'three':pair?'pair':null;
 if(scope!==nextScope){
  if(scope)drafts[scope]=Object.fromEntries(names.map(n=>[n,fields[n].value]));
  for(const n of names)fields[n].value=nextScope?drafts[nextScope][n]??'':'';
  scope=nextScope;
 }
 activeNames=four?['left','center-left','center-right','right']:three?['left','center','right']:pair?['left','right']:[];
 const classes=['gp_ruler',`gp_layout--${s.layout}`,`gp_spacing--${s.spacing}`];
 if(mosaic&&measure.checked||ruled)classes.push('gp_ruler--measure');
 if(two||four)classes.push(`gp_allocation--${s.allocation}`);
 if(two)classes.push(`gp_fewer--${s.fewer}`);
 if(pair)classes.push(`gp_arrangement--${s.arrangement}`);
 if(two||three||four)classes.push(`gp_traversal--${s.traversal}`);
 root.className=classes.join(' ');
 const requested=activeNames.some(n=>fields[n].value!==''),exact=activeNames.map(n=>fields[n].value===''?null:Number(fields[n].value));
 const total=exact.reduce((sum,n)=>sum+(n??0),0),direct=total+(pair?excluded:0);
 const validTuple=four?fourExactCountsEligible(total,exact):pair?pairExactCountsEligible(total,exact):exactCountsEligible(total,exact);
 for(const n of names){root.style.removeProperty(`--gp-exact-count-${n}`);if(activeNames.includes(n)&&fields[n].value!=='')root.style.setProperty(`--gp-exact-count-${n}`,fields[n].value);}
 document.querySelector('#exact-refinement').hidden=!scope;
 for(const n of ['center','center-left','center-right'])document.getElementById(`exact-${n}-control`).hidden=!activeNames.includes(n);
 document.querySelector('#exact-legend').textContent=pair?'Exact supporting-pair allocation (optional)':four?'Exact four-region physical allocation (optional)':'Exact three-region allocation (optional)';
 document.querySelector('#exact-help').textContent=pair?`The spanning ${both?'items are':'item is'} excluded. Left and right counts must total the remaining N−${excluded} items; the center input is unused.`:four?'Counts name physical regions from left to right, independently of traversal. Positive integers must total the direct-item count, have spread at most four, and have coprime neighbors. Ineligible requests retain automatic allocation.':'Select a valid allocation or enter physical item counts. A valid request applies only when its total matches the direct-item count.';
 const choice=document.querySelector('#exact-choice'),choices=scope?choicesByScope[scope].find(p=>p.count===Number(s.count)-(pair&&both?1:0))?.choices??[]:[];
 choice.replaceChildren(new Option('Choose an allocation…',''),...choices.map(p=>new Option(p.join(' + '),p.join(','))));
 choice.disabled=Number(s.count)<(four?4:pair?excluded+2:3);
 choice.value=[...choice.options].some(n=>n.value===exact.join(','))?exact.join(','):'';
 if(root.children.length!==Number(s.count))root.innerHTML=records.slice(0,Number(s.count)).join('');
 for(const item of root.children)item.classList.toggle('gp_rule--end',ruled);
 document.querySelector('.candidate-frame').style.setProperty('--preview-width',`${s.width}px`);
 controls.allocation.disabled=!two&&!four;controls.fewer.disabled=!two;controls.traversal.disabled=!two&&!three&&!four;
 let allocationNote='',exactActive=false,layoutActive=false;
 if(mosaic){
  const owner=getComputedStyle(root),expected=Number(privateValue(owner,'--_gp-m-count'));
  const active=root.firstElementChild&&Number(privateValue(getComputedStyle(root.firstElementChild),'--_gp-m-active'))===1;
  const reason=Number(s.count)!==expected?`requires exactly ${expected} items`:!['neat','thin'].includes(s.spacing)?'choose neat or thin spacing':'insufficient tracks or required CSS features unavailable';
  allocationNote=active?` · mapped mosaic${s.spacing==='thin'?' · percentage gutter, no measurement required':''}`:` · source-order stack: ${reason}`;
 }
 if(scope&&root.firstElementChild){
  const style=getComputedStyle(root.firstElementChild),number=n=>Number(privateValue(style,`--_gp-${n}`));
  layoutActive=four?number('f-active')===1:pair?number('two-active')+number('p-span-native')>0:number('t-active')===1;
  exactActive=number(four?'f-exact-valid':pair?'p-exact-valid':'t-exact-valid')===1;
  const counts=four?[0,1,2,3].map(i=>number(`f-${['a','b','c','d'][number(`f-order${i}`)]}`)):pair?['a','b'].map(number):['t-l','t-c','t-r-count'].map(number);
  allocationNote=layoutActive?` · ${pair?'supporting':'physical'} counts ${counts.join(' + ')}`:' · source-order stack safeguard';
 }
 document.querySelector('#exact-status').textContent=!requested?'Automatic allocation.':exactActive?`Active: exact ${exact.join(' + ')} ${pair?'supporting ':''}allocation for ${pair?`${total} supporting items (${s.count} direct items)`:`${s.count} direct items`}.`:!validTuple?`Inactive: enter ${four?'four':pair?'two':'three'} positive integers, ${pair?'difference at most four':four?'spread at most four':'spread at most two'}, with no shared internal boundaries between neighbors. Automatic allocation applies.`:direct!==Number(s.count)?`Inactive: this request needs ${direct} direct items${pair?` (${total} supporting items)`:''}. The current ${s.count} items use ${layoutActive?'automatic allocation':'the source-order stack safeguard'}.`:'Inactive: the current layout uses the source-order stack safeguard.';
 const prefix=scope?`${exactActive?'Exact':'Automatic'} ${pair?'supporting':four?'four-region':'three-region'} allocation · `:'';
 const arrangementNote=pair?`${both?'First above + last below':s.arrangement==='first-above'?'First item above':'Last item below'} · `:'';
 document.querySelector('#status').textContent=prefix+arrangementNote+`${s.count} source items · ${s.layout} · ${Math.round(root.getBoundingClientRect().width)}px actual width${allocationNote}`;
 let comment=mosaic?`<!-- Exact map for ${s.layout.slice(7)} direct items. Neat/thin only;\n     thin gutters use assigned-track percentages; measurement is optional.\n     Count mismatch or ineligible geometry stacks in source order. -->\n`:'';
 if(scope&&requested)comment=validTuple?pair?`<!-- With ${direct} direct items: ${both?'first item spans above and last item spans below':s.arrangement==='first-above'?'first item spans above':'last item spans below'};\n     ${exact[0]} left and ${exact[1]} right among ${total} supporting items.\n     Other counts use automatic supporting allocation. -->\n`:`<!-- With ${total} direct items: ${activeNames.map((n,i)=>`${exact[i]} ${n}`).join(', ')}.\n     Other counts use automatic allocation.${four?' Physical counts stay fixed; traversal assigns source runs.':''} -->\n`:'<!-- Incomplete or invalid exact allocation; automatic allocation applies. -->\n';
 else if(pair)comment=`<!-- ${both?'First source item spans above and last source item spans below':s.arrangement==='first-above'?'First source item spans above':'Last source item spans below'}.\n     Remaining items use two-region allocation. -->\n`;
 const style=scope&&requested?`\n  style="\n${activeNames.flatMap(n=>fields[n].value===''?[]:[`    --gp-exact-count-${n}: ${fields[n].value};`]).join('\n')}\n  "`:'';
 document.querySelector('#markup').textContent=`${comment}<section class="${root.className}"${style}>\n${ruled?Array.from({length:Number(s.count)},(_,i)=>`  <article class="gp_rule--end"><!-- Item ${i+1} --></article>`).join('\n'):`  <!-- ${s.count} direct source items -->`}\n</section>`;
}
document.querySelector('form').addEventListener('submit',e=>e.preventDefault());
document.querySelector('form').addEventListener('change',update);
Object.values(fields).forEach(n=>n.addEventListener('input',update));
document.querySelector('#exact-choice').addEventListener('change',e=>{if(!e.target.value)return;e.target.value.split(',').forEach((v,i)=>fields[activeNames[i]].value=v);update();});
document.querySelector('#clear-exact').addEventListener('click',()=>{for(const n of activeNames)fields[n].value='';update();});
update();
