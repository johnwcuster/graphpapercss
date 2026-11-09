import {allPaddingClasses} from '../assets/graph-paper/src/core/padding.mjs';
import { normalizeState, rulerClasses, sequenceClasses, candidateInlineStyle, sourceMarkup, needsColumnRules, itemSpacingClasses } from './model.mjs';
const composition=document.querySelector('#composition'),ruler=document.querySelector('main');
let state,revision=-1,lastReport='';
function report(){
 if(!state)return;
 const step=state.steps.filter(s=>!s.rem||matchMedia(`(min-width: ${s.rem}rem)`).matches).at(-1);
 const payload={type:'gp-sequence-preview',revision,width:innerWidth,height:Math.ceil(document.body.getBoundingClientRect().height),active:step.id,absoluteValue:CSS.supports('width','calc(1px * abs(-1))'),enhanced:CSS.supports('(width:calc(1px * sibling-count())) and (width:calc(1px * sibling-index())) and (width:calc(1px * mod(3,2)))')};
 const signature=JSON.stringify(payload);if(signature!==lastReport){lastReport=signature;parent.postMessage(payload,location.origin);}
}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='gp-sequence-update')return;
 state=normalizeState(event.data.state);revision=event.data.revision;
 state.steps.forEach((s,i)=>{s.id=event.data.state.steps[i].id;});
 ruler.className=rulerClasses(state).join(' ');
 composition.className=['composition','example-composition',...sequenceClasses(state)].join(' ');
 composition.style.cssText=candidateInlineStyle(state);
 if(composition.children.length!==state.count)composition.innerHTML=sourceMarkup(state.count);
 for(const item of composition.children){
  item.classList.toggle('gp_rule--end',needsColumnRules(state));
  item.classList.remove(...allPaddingClasses);
  item.classList.add(...itemSpacingClasses(state));
 }
 document.body.classList.toggle('show-ruler',state.ruler);
 document.body.classList.toggle('hide-source',!state.source);
 document.body.classList.toggle('show-boundaries',state.inspector);
 requestAnimationFrame(report);
});
new ResizeObserver(report).observe(document.body);
window.addEventListener('resize',()=>requestAnimationFrame(report));
parent.postMessage({type:'gp-sequence-ready'},location.origin);

// Keyboard events do not bubble out of an iframe. Forward only the shell shortcut.
window.addEventListener('keydown',event=>{
 if(event.altKey&&event.shiftKey&&event.code==='KeyG'&&!event.repeat){
  event.preventDefault();parent.postMessage({type:'gp-workbench-toggle'},location.origin);
 }
});
