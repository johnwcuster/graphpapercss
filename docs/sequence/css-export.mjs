import {exportKey,exportSelection,cssFilename} from './export-model.mjs';
import {setupDownloads} from './download-text.mjs';

// Loaded with the configurator; compiler modules load only in the worker after
// the author requests a build. No server, external CDN or runtime layout JS.
export function setupCSSExport({getState,announce}){
 const $=s=>document.querySelector(s),build=$('#build-css'),format=$('#css-format'),downloadCSS=$('#download-css'),status=$('#css-export-status');
 let worker,request=0,pending=null,artifact=null,currentKey='',lastFailure=false;
 const save=setupDownloads(announce);
 const bytes=text=>new TextEncoder().encode(text).length;
 const label=n=>`${(n/1000).toFixed(1)} KB`;
 function update(){
  const key=exportKey(getState()),fresh=artifact?.key===key;
  currentKey=key;
  const busy=pending?.key===key;
  build.disabled=busy;build.textContent=busy?'1. Building CSS…':fresh?'1. Rebuild CSS':'1. Build CSS';
  downloadCSS.disabled=!fresh;
  $('#css-export').setAttribute('aria-busy',String(busy));
  $('#css-export-preview').hidden=!fresh;
  if(busy)status.textContent='Building locally in your browser…';
  else if(fresh){
   const css=artifact[format.value];
   status.textContent=`Ready — download CSS with step 2. ${label(bytes(css))} ${format.value} CSS · ${artifact.selection.layouts.length} ${artifact.selection.layouts.length===1?'layout':'layouts'} · ${artifact.selection.hinges.length} viewport ${artifact.selection.hinges.length===1?'step':'steps'}.`;
   $('#css-file-name').textContent=cssFilename(format.value);
  }else if(lastFailure)status.textContent='Could not build custom CSS. Try again or choose Full library above.';
  else status.textContent=artifact?'Selections changed. Build CSS again before downloading.':'Build CSS to enable the download.';
 }
 function receive({data}){
  if(data?.request!==request||data.key!==pending?.key)return;
  pending=null;
  if(!data.ok){lastFailure=true;update();announce('Could not build custom CSS. Try again or choose Full library.');return;}
  artifact=data;lastFailure=false;
  const s=data.selection;
  $('#css-includes').textContent=`Layouts: ${s.layouts.join(', ')}. Viewport steps: ${s.hinges.length?s.hinges.map(n=>`${n}rem`).join(', '):'base only'}. Gutters: ${s.spacing.join(', ')}. Item padding ${s.padding?'included':'omitted'}; vertical spacing ${s.verticalSpacing?'included':'uses layout defaults'}.${s.columnRules?' Column-rules extension bundled.':''}`;
  $('#custom-css').textContent=data.readable;
  update();
  if(!$('#css-export').hidden)announce(data.key===currentKey?'Custom CSS is ready to download.':'CSS built for the previous selections. Build again for the current sequence.');
 }
 function fail(){
  worker?.terminate();worker=null;pending=null;lastFailure=true;
  update();announce('Could not build custom CSS. Try again or choose Full library.');
 }
 build.addEventListener('click',()=>{
  lastFailure=false;const options=exportSelection(getState()),key=JSON.stringify(options);
  pending={key};request++;
  update();
  try{
   if(!worker){worker=new Worker(new URL('./export-worker.mjs',import.meta.url),{type:'module'});worker.addEventListener('message',receive);worker.addEventListener('error',event=>{event.preventDefault();fail();});worker.addEventListener('messageerror',fail);}
   worker.postMessage({request,key,options});
  }catch{fail();}
 });
 format.addEventListener('change',update);
 downloadCSS.addEventListener('click',()=>{if(artifact?.key===exportKey(getState()))save(artifact[format.value],cssFilename(format.value),'text/css;charset=utf-8');});
 window.addEventListener('pagehide',()=>{worker?.terminate();worker=null;pending=null;});
 window.addEventListener('pageshow',update);
 update();return {update};
}
