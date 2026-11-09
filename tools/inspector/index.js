import { fields, recipes, layoutsFor, resolveColumns } from '../../src/legacy/0.4/ruler/geometry.mjs';
import { bands } from '../../src/legacy/0.4/manifest/bands.mjs';
import { recipeDescription } from '../../src/legacy/0.4/ruler/discovery.mjs';
import { diagramItems } from '../shared/composition.mjs';
import { describeDiagram } from '../shared/accessibility.mjs';
import { sourceStyle } from '../shared/source.mjs';
import { responseFor } from '../shared/response.mjs';
import { compositionClasses, selectionClasses, readSelection, changeSelection, replaceCompositionClasses, sameClasses, discoverFields } from './model.mjs';
import { styles } from './style.mjs';

// Share a session even if the same tool is loaded through two delivery URLs.
const activeKey = Symbol.for('graphpapercss.inspector');
// Optional browser tool; importing this module alone has no DOM side effects.
export function mountInspector({ root = globalThis.document, bandsAvailable = false } = {}) {
  if (!root || ![1,9].includes(root.nodeType) || !root.querySelectorAll) throw new TypeError('root must be a Document or an on-page Element.');
  const doc = root.ownerDocument ?? root, win = doc.defaultView;
  if (!win || !root.isConnected) throw new TypeError('root must belong to a connected browser document.');
  if (doc[activeKey]) { const current = doc[activeKey]; current.show(); return current; }
  const host = doc.createElement('div'), shadow = host.attachShadow({ mode:'open' });
  host.setAttribute('data-gp-inspector','');
  const style = doc.createElement('style'); style.textContent = styles; shadow.append(style);
  const el = (tag, text, parent, attrs = {}) => {
    const node = doc.createElement(tag); if (text) node.textContent = text;
    for (const [name,value] of Object.entries(attrs)) node.setAttribute(name,value);
    parent?.append(node); return node;
  };
  const overlay = el('div','',shadow,{class:'overlay','aria-hidden':'true'});
  const panel = el('section','',shadow,{class:'panel','aria-label':'Graph Paper on-page inspector'});
  el('h2','Graph Paper · On-page inspector',panel);
  el('p','Session edits only. The page reflows beside this panel; hide or close it to restore the full workspace.',panel,{class:'note'});
  const actions = el('div','',panel,{class:'actions'});
  const button = (label, fn, parent=actions) => { const node=el('button',label,parent,{type:'button'}); node.addEventListener('click',fn); return node; };
  button('Hide',()=>{ setPicking(false);panel.hidden=true; workspace.remove();launcher.hidden=false; launcher.focus(); overlay.hidden=true; });
  button('Dock left / right',()=>{ panel.dataset.side=panel.dataset.side==='left'?'right':'left';launcher.dataset.side=panel.dataset.side;fitWorkspace(); });
  button('Discard & close',()=>{ const {conflicts}=api.destroy(); if(conflicts.length) win.alert('Some compositions changed outside the inspector and were left untouched.'); });
  button('Close · keep edits',()=>api.destroy({discard:false}));
  const launcher=button('Show Graph Paper inspector',()=>api.show(),shadow); launcher.className='launcher'; launcher.hidden=true;
  function select(label, name) { const wrap=el('label',label,panel); return el('select','',wrap,{'data-control':name}); }
  const targetControl=select('Composition on this page','target');
  const pick=button('Pick composition on page',()=>setPicking(!picking),panel);pick.setAttribute('aria-pressed','false');
  const pickHelp=el('p','Click a composition to select it. Escape cancels. Links inside compositions will not open while picking.',panel,{class:'note',hidden:''});
  const controls=el('div','',panel), selects={};
  for(const [key,label] of Object.entries({grid:'Recipe · macro regions and proportions',set:'Set · number of positions',flow:'Flow between positions',field:'Gutters',band:'Responsive band'})) {
    const wrap=el('label',label,controls); selects[key]=el('select','',wrap,{'data-control':key});
    selects[key].addEventListener('change',()=>edit(key,selects[key].value));
  }
  const status=el('p','',panel,{role:'status','aria-live':'polite'});
  const issue=el('p','',panel,{class:'warning'});
  const checks=el('div','',panel,{class:'checks'}), flags={ruler:false,layout:true,source:true,band:false,thresholds:false};
  for(const [key,label] of Object.entries({ruler:'64-bit ruler',layout:'Region / item edges',source:'Source order',band:'Band minimum',thresholds:'30 / 60rem markers'})) {
    const wrap=el('label','',checks), input=el('input','',wrap,{type:'checkbox','data-overlay':key});input.checked=flags[key];wrap.append(` ${label}`);input.addEventListener('change',()=>{flags[key]=input.checked;schedule();});
  }
  el('h3','Responsive arrangements',panel);
  const sequence=el('div','',panel,{class:'sequence'});
  el('p','Schematics show the same source items at each state, not a forced page preview. Resize the window or the host container to test the real content.',panel,{class:'note'});
  const code=el('textarea','',panel,{'aria-label':'Graph Paper classes to copy',readonly:''});
  button('Copy classes',()=>copy(code),panel);
  const details=el('details','',panel);el('summary','Session changes',details);
  const report=el('textarea','',details,{'aria-label':'Session change record',readonly:''});
  button('Copy change record',()=>copy(report),details);
  el('p','Copy edits into your source to keep them. Reloading clears session edits. Rule markers on items are not added or removed by this tool.',panel,{class:'note'});
  (doc.body ?? doc.documentElement).append(host);
  // Reserve real layout space, without wrappers, source styles or fake canvas widths.
  // A separate, removable stylesheet leaves the host's own declarations intact.
  const workspace=doc.createElement('style');
  workspace.setAttribute('data-gp-inspector-workspace','');
  function fitWorkspace(){
    workspace.remove();
    if(panel.hidden)return;
    const css=win.getComputedStyle(doc.documentElement);
    const side=panel.dataset.side==='left'?'left':'right';
    workspace.textContent=`:root { box-sizing:border-box!important; padding-${side}:calc(${css.getPropertyValue(`padding-${side}`)} + 384px)!important; }
      @media(max-width:799px) { :root { padding-${side}:${css.getPropertyValue(`padding-${side}`)}!important; padding-bottom:calc(${css.paddingBottom} + min(45dvh, 400px) + 24px)!important; } }`;
    doc.head.append(workspace);
  }
  let target,targets=[],selection,frame,closed=false,picking=false,hoverField=null,previousFocus=doc.activeElement;
  const sessions=new Map(), abort=new win.AbortController();
  const measuredSizes=new WeakMap();
  const resize=new win.ResizeObserver(entries=>{for(const entry of entries)measuredSizes.set(entry.target,entry.contentRect.width);schedule();});
  const mutation=new win.MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||record.target===target||record.target.matches?.('.gp_field,.gp_canvas'))){scan();sync();}
  });
  mutation.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  win.addEventListener('resize',()=>{fitWorkspace();schedule();},{signal:abort.signal});
  doc.addEventListener('scroll',schedule,{capture:true,passive:true,signal:abort.signal});
  function fieldAt(event){
    if(event.composedPath().includes(host))return null;
    let candidate=event.composedPath().find(node=>node.nodeType===1)?.closest('.gp_field');
    while(candidate&&!targets.includes(candidate))candidate=candidate.parentElement?.closest('.gp_field');
    return candidate;
  }
  function setPicking(value){
    picking=value;hoverField=null;pick.setAttribute('aria-pressed',String(value));
    pick.textContent=value?'Cancel picking':'Pick composition on page';pickHelp.hidden=!value;schedule();
  }
  doc.addEventListener('pointermove',event=>{if(!picking)return;const field=fieldAt(event);if(field!==hoverField){hoverField=field;schedule();}},{capture:true,passive:true,signal:abort.signal});
  doc.addEventListener('click',event=>{
    if(!picking)return;const field=fieldAt(event);if(!field)return;
    event.preventDefault();event.stopImmediatePropagation();setPicking(false);api.select(field);
  },{capture:true,signal:abort.signal});
  doc.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&picking){event.preventDefault();event.stopImmediatePropagation();setPicking(false);pick.focus();return;}
    if(event.altKey&&event.shiftKey&&event.code==='KeyG'){event.preventDefault(); if(panel.hidden)api.show(); else actions.querySelector('button').click();}
    const nativeForm=/^(?:INPUT|SELECT|TEXTAREA)$/.test(event.composedPath()[0]?.tagName);
    if(event.key==='Escape'&&!event.defaultPrevented&&!nativeForm&&shadow.contains(shadow.activeElement)){event.preventDefault();actions.querySelector('button').click();}
  },{signal:abort.signal});
  targetControl.addEventListener('change',()=>{target=targets[Number(targetControl.value)];sync();target?.scrollIntoView({block:'center',behavior:'instant'});});
  function label(field,index){const heading=field.querySelector('h1,h2,h3,h4')??field.parentElement.querySelector('h1,h2,h3,h4');return `${index+1}. ${field.id?`#${field.id} · `:''}${heading?.textContent.trim().slice(0,70)||'Untitled composition'}`;}
  function scan(){
    const previous=target;
    targets=discoverFields(root);
    targetControl.replaceChildren();targets.forEach((field,index)=>el('option',label(field,index),targetControl,{value:String(index)}));
    target=targets.includes(previous)?previous:targets[0];targetControl.value=String(targets.indexOf(target));
  }
  function options(control,values,value){control.replaceChildren();for(const [id,label] of values)el('option',label,control,{value:id});control.value=value;}
  function sync(){
    if(closed)return;
    resize.disconnect(); if(!target){controls.hidden=true;status.textContent='No recipe fields found. Add a gp_field with a grid_* recipe, then refresh.';selection=null;schedule();return;}
    try{
      if(!target.parentElement.classList.contains('gp_canvas'))throw new Error('Read-only: this field inherits a partial ruler through wrappers. Edit its source directly; this first inspector supports recipe fields directly inside a canvas.');
      if(!win.getComputedStyle(target.parentElement).containerName.split(' ').includes('gp-canvas'))throw new Error('Load the modern Graph Paper stylesheet before inspecting this page.');
      selection=readSelection(target.classList);controls.hidden=false;
      const layouts=layoutsFor(recipes[selection.grid]);
      options(selects.grid,Object.keys(recipes).map(id=>[id,`${id} · ${recipeDescription(id).title}`]),selection.grid);
      options(selects.set,[['none','Default · source-order occupancy'],...[...new Set(layouts.map(l=>l.set))].map(set=>[set,`${set} · ${Number(set.slice(4))} positions`])],selection.set);
      options(selects.flow,[['default','Default · no flow class'],...layouts.filter(l=>l.set===selection.set&&l.flow).map(l=>[l.flow,l.flow])],selection.flow);
      options(selects.field,Object.entries(fields).map(([key,f])=>[key,`${key} · ${f.end-f.start} bits`]),selection.field);
      options(selects.band,[['','Default · 30 / 60rem'],...Object.entries(bands).map(([key,min])=>[key,`${key} · ${min}rem minimum`])],selection.band);
      selects.band.disabled=!bandsAvailable;
      issue.textContent=!bandsAvailable?'Bands are read-only: this page has not declared bands.css available.':'';
      if(selection.field==='ruled')issue.textContent+=' Rule lines require the existing gp_rule--start / gp_rule--end item markers.';
      const session=sessions.get(target);
      if(session&&!sameClasses(compositionClasses(target.classList),session.after))issue.textContent='The page changed these classes outside the inspector. Discard and reopen before editing this composition again.';
      resize.observe(target.parentElement);resize.observe(target);for(const item of target.children)resize.observe(item);
    }catch(error){selection=null;controls.hidden=true;issue.textContent=error.message;status.textContent='Composition cannot be edited safely.';}
    schedule();
  }
  function edit(key,value){
    try{
      const current=compositionClasses(target.classList),session=sessions.get(target);
      if(session&&!sameClasses(current,session.after))throw new Error('The page changed these classes outside the inspector. Discard and reopen before editing this composition again.');
      const next=changeSelection(readSelection(target.classList),key,value);
      const after=selectionClasses(next);
      sessions.set(target,{before:session?.before??current,after,label:label(target,targets.indexOf(target))});
      replaceCompositionClasses(target,after);sync();
    }catch(error){issue.textContent=error.message;}
  }
  function schedule(){if(closed)return;win.cancelAnimationFrame(frame);frame=win.requestAnimationFrame(draw);}
  function box(className,x,y,width,height,text=''){
    const node=el('div',text,overlay,{class:className});Object.assign(node.style,{left:`${x}px`,top:`${y}px`,width:`${Math.max(0,width)}px`,height:`${Math.max(0,height)}px`});return node;
  }
  function draw(){
    overlay.replaceChildren();report.value=JSON.stringify(api.changes(),null,2);
    if(picking&&hoverField?.isConnected){const r=hoverField.getBoundingClientRect();box('box pick-preview',r.left,r.top,r.width,r.height);box('badge',r.left,r.top,160,24,'Click to select composition');}
    if(!selection||!target?.isConnected){code.value='';sequence.replaceChildren();return;}
    const canvas=target.parentElement,rect=canvas.getBoundingClientRect(),fieldRect=target.getBoundingClientRect();
    // CSS container queries measure the content box, not transformed/bordered bounds.
    const css=win.getComputedStyle(canvas);
    const width=measuredSizes.get(canvas)??rect.width-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth)-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
    const rem=parseFloat(win.getComputedStyle(doc.documentElement).fontSize),count=target.children.length;
    const response=responseFor({...selection,width,items:count},rem);
    status.textContent=`${count} source items · canvas ${Math.round(width*100)/100}px · ${response.state}. Compact ≥ ${response.thresholds.compact*rem}px; expanded ≥ ${response.thresholds.expanded*rem}px.`;
    if(response.layout&&response.layout.items!==count)status.textContent+=` Set defines ${response.layout.items} positions; ${count>response.layout.items?'additional items use full-width fallback':'some positions are empty'}.`;
    code.value=['gp_field',...selectionClasses(selection)].join(' ');
    sequence.replaceChildren();
    for(const state of ['stacked','compact','expanded']){
      const figure=el('figure','',sequence);el('figcaption',state===response.state?`${state} · now`:state,figure);
      const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 56');svg.setAttribute('role','img');svg.setAttribute('aria-label',describeDiagram({...selection,items:count},state));
      for(const item of diagramItems(selection.grid,selection.set,selection.flow,count,selection.field,state)){
        const shape=doc.createElementNS(svg.namespaceURI,'rect');for(const [key,value] of Object.entries({x:item.x+1,y:item.y+1,width:Math.max(0,item.width-2),height:Math.max(0,item.height-2),fill:'#d2e7df',stroke:'#135968','stroke-width':.5}))shape.setAttribute(key,value);svg.append(shape);
        const text=doc.createElementNS(svg.namespaceURI,'text');text.setAttribute('x',item.x+item.width/2);text.setAttribute('y',item.y+item.height/2+2);text.setAttribute('text-anchor','middle');text.setAttribute('font-size','7');text.textContent=item.item;svg.append(text);
      }figure.append(svg);
    }
    if(panel.hidden)return;
    const left=rect.left+parseFloat(css.borderLeftWidth)+parseFloat(css.paddingLeft), top=fieldRect.top,bit=width/64;
    if(flags.ruler)box('box ruler',left,top,width,fieldRect.height);
    if(flags.layout){
      if(response.state==='expanded')for(const region of resolveColumns(recipes[selection.grid],selection.field))box('box macro',left+region.start*bit,top,(region.end-region.start)*bit,fieldRect.height);
      for(const item of target.children){const r=item.getBoundingClientRect();box('box item',r.left,r.top,r.width,r.height);}
    }
    [...target.children].forEach((item,index)=>{
      const r=item.getBoundingClientRect();
      if(flags.source){const badge=box('badge',r.left+2,r.top+2,24,22,String(index+1)),color=sourceStyle(index+1);badge.style.backgroundColor=color.color;badge.style.color=color.ink;}
      if(flags.band&&response.thresholds.minimum)box('box pressure',r.left,r.top+28,response.thresholds.minimum*rem,8);
    });
    if(flags.thresholds)for(const [at,label] of [[30,'30rem'],[60,'60rem']]){box('box threshold',left+at*rem,top,1,fieldRect.height);box('badge',left+at*rem,top,54,22,label);}
  }
  async function copy(node){try{await win.navigator.clipboard.writeText(node.value);status.textContent='Copied.';}catch{node.focus();node.select();status.textContent='Select and copy the text manually; clipboard access is unavailable.';}}
  const api={
    show(){panel.hidden=false;launcher.hidden=true;overlay.hidden=false;fitWorkspace();schedule();targetControl.focus();},
    refresh(){scan();sync();},
    select(field){scan();if(!targets.includes(field))throw new Error('Select a discovered recipe field.');setPicking(false);target=field;targetControl.value=String(targets.indexOf(field));sync();api.show();},
    changes(){return [...sessions].map(([field,session])=>({...session,connected:field.isConnected,conflict:!sameClasses(compositionClasses(field.classList),session.after)})).filter(s=>!sameClasses(s.before,s.after));},
    destroy({discard=true}={}){
      if(closed)return{conflicts:[]};
      const conflicts=[];
      if(discard)for(const [field,session]of sessions){if(sameClasses(compositionClasses(field.classList),session.after))replaceCompositionClasses(field,session.before);else conflicts.push(session.label);}
      closed=true;win.cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();abort.abort();workspace.remove();host.remove();delete doc[activeKey];
      if(previousFocus?.isConnected)previousFocus.focus();return{conflicts};
    }
  };
  Object.defineProperty(doc,activeKey,{value:api,configurable:true});scan();sync();api.show();return api;
}
