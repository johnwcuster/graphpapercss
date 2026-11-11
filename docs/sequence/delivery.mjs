import {deliveryProfile,profileCDNTag} from '../assets/graph-paper/src/core/profiles.mjs';
import {version,deliverySizes} from '../assets/graph-paper/build-info.mjs';
import {exportSelection} from './export-model.mjs';
import {smallestCompatibleProfile,fullOnlyReason} from './delivery-model.mjs';
import {setupDownloads} from './download-text.mjs';

const kb=bytes=>`${(bytes/1000).toFixed(1)} KB`;
export function setupDelivery({getState,announce}){
 const $=s=>document.querySelector(s),section=$('#delivery'),save=setupDownloads(announce);
 const text=(selector,value)=>{const node=$(selector);if(node.textContent!==value)node.textContent=value;};
 let method='cdn',cdnCoverage='full',hostCoverage='custom',profile=deliveryProfile('full'),busy=false;
 function update(){
  const selection=exportSelection(getState()),smallest=smallestCompatibleProfile(selection,deliverySizes),fullOnly=smallest.id==='full';
  if(fullOnly)cdnCoverage='full';
  const host=method==='host',custom=host&&hostCoverage==='custom';
  $('#cdn-coverage').hidden=host||fullOnly;
  $('#host-coverage').hidden=!host;
  section.querySelectorAll('[name="delivery-method"]').forEach(n=>n.checked=n.value===method);
  section.querySelectorAll('[name="cdn-coverage"]').forEach(n=>n.checked=n.value===cdnCoverage);
  section.querySelectorAll('[name="host-coverage"]').forEach(n=>n.checked=n.value===hostCoverage);
  profile=!host&&cdnCoverage==='smallest'?smallest:deliveryProfile('full');
  $('#predefined-result').hidden=custom;
  $('#css-export').hidden=!custom;
  $('#cdn-output').hidden=host;
  $('#profile-downloads').hidden=!host;
  $('#delivery-full-only').hidden=!fullOnly;
  text('#delivery-full-only',fullOnly?fullOnlyReason(selection):'');
  const sizes=deliverySizes[profile.id];
  text('#delivery-title',profile.label);
  text('#delivery-layout-count',`${profile.selection.layouts.length} layouts`);
  text('#delivery-compressed',`${kb(sizes.brotli)} Brotli · ${kb(sizes.gzip)} gzip`);
  text('#delivery-raw',`${kb(sizes.minified)} minified before compression`);
  text('#delivery-tag',profileCDNTag(profile.id,version));
  $('#inspect-delivery-css').href=`./assets/graph-paper/${profile.files.readable.slice(4)}`;
  const format=$('#profile-format').value,path=profile.files[format],name=path.split('/').at(-1);
  text('#profile-file-name',name);
  text('#profile-download-size',`${kb(sizes[format])} ${format} file`);
  $('#download-profile-css').disabled=busy;
 }
 section.addEventListener('change',event=>{
  const {name,value}=event.target;
  if(name==='delivery-method')method=value;
  else if(name==='cdn-coverage')cdnCoverage=value;
  else if(name==='host-coverage')hostCoverage=value;
  else if(event.target.id!=='profile-format')return;
  update();
 });
 $('#copy-delivery-tag').addEventListener('click',async()=>{
  const tag=profileCDNTag(profile.id,version);
  try{await navigator.clipboard.writeText(tag);announce(`${profile.label} stylesheet tag copied. Load one Graph Paper stylesheet.`);}
  catch{$('#delivery-tag-block').focus();announce('Clipboard unavailable. Select and copy the stylesheet tag.');}
 });
 $('#download-profile-css').addEventListener('click',async()=>{
  if(busy)return;
  const id=profile.id,format=$('#profile-format').value,path=profile.files[format],name=path.split('/').at(-1);
  busy=true;text('#profile-download-status','Preparing download…');update();
  try{
   const response=await fetch(new URL(`./assets/graph-paper/${path.slice(4)}`,location.href));
   if(!response.ok)throw Error('Stylesheet unavailable');
   const css=await response.text();
   if(method!=='host'||hostCoverage==='custom'||profile.id!==id||$('#profile-format').value!==format){text('#profile-download-status','Delivery choices changed. Download again for the current choice.');return;}
   save(css,name,'text/css;charset=utf-8');text('#profile-download-status',`${name} downloaded.`);
  }catch{text('#profile-download-status','Could not download CSS. Try again or inspect the stylesheet to save it.');announce('Could not download CSS. Try again or inspect the stylesheet.');}
  finally{busy=false;update();}
 });
 update();return {update};
}
