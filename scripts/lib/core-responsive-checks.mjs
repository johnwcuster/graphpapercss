import assert from 'node:assert/strict';
import {hinges,controlPolicies,spacingModes} from '../../src/core/catalogue.mjs';
import {placements} from '../../src/core/geometry.mjs';
export async function checkResponsiveIntegration({page,root,set,check,base,fixture,url}) {
 for(const file of ['main.css','main.min.css']) {
  await page.goto(url);
  await page.locator('link[href*="css/"]').evaluate((link,file)=>{link.href=link.href.replace(/main(?:\.min)?\.css/,file);},file);
  await page.waitForFunction(file=>[...document.styleSheets].some(sheet=>sheet.href?.endsWith(`/css/${file}`)),file);
  for(const [rem,prefix] of hinges)for(const [family,options] of Object.entries(controlPolicies))for(const target of Object.keys(options)) {
   const id=target==='widest-first'?'four-6-5-4-3':target==='center-first'?'three-1-2-1':'two-3-2';
   const initial=Object.keys(options).find(value=>value!==target);
   const before={...base,id,count:13,[family]:initial},after={...before,[family]:target};
   await set(before);
   await root.evaluate((node,token)=>{node.className=`${token} ${node.className}`;},`gp_${prefix}-${family}--${target}`);
   for(const width of [rem*16-1,rem*16,rem*16+1]) {
    await page.setViewportSize({width,height:900});await check(width<rem*16?before:after);
   }
  }
  // Spacing updates the complete field, wide rounding, and mosaic gutter state.
  for(const [rem,prefix] of hinges)for(const spacing of Object.keys(spacingModes))for(const id of ['two-3-2','three-1-2-1','four-9-8-7-6','mosaic-8']) {
   const before={...base,id,count:id==='mosaic-8'?8:6,spacing:spacing==='neat'?'wide':'neat'},after={...before,spacing};
   await set(before);
   await root.evaluate((node,token)=>{node.className=`${token} ${node.className}`;},`gp_${prefix}-spacing--${spacing}`);
   for(const width of [rem*16-1,rem*16,rem*16+1]) {
    await page.setViewportSize({width,height:900});await check(width<rem*16?before:after);
   }
  }
  // Every exact-count input, in two-, three-, and four-region contexts; all hinges.
  for(const [rem,prefix] of hinges)for(const spec of [
   {id:'two-3-2',count:6,arrangement:'first-above',keys:['left','right'],from:[1,4],to:[2,3]},
   {id:'three-1-2-1',count:12,keys:['left','center','right'],from:[5,3,4],to:[4,3,5]},
   {id:'four-6-5-4-3',count:12,keys:['left','center-left','center-right','right'],from:[2,3,4,3],to:[3,2,3,4]}
  ]) {
   const state={...base,...spec,exact:spec.from};await set(state);
   await root.evaluate((node,{prefix,spec})=>spec.keys.forEach((key,i)=>node.style.setProperty(`--gp-${prefix}-exact-count-${key}`,String(spec.to[i]))),{prefix,spec});
   for(const width of [rem*16-1,rem*16,rem*16+1]) {
    await page.setViewportSize({width,height:900});await check({...state,exact:width<rem*16?spec.from:spec.to});
   }
  }
  const state={...base,id:'three-1-2-1',count:12,exact:[5,3,4]};await set(state);
  await root.evaluate(node=>{
   for(const [i,key] of ['left','center','right'].entries()) {
    node.style.setProperty(`--gp-xs-exact-count-${key}`,String([4,3,5][i]));
    node.style.setProperty(`--gp-lg-exact-count-${key}`,'0');
    node.style.setProperty(`--gp-xl-exact-count-${key}`,String([3,5,4][i]));
   }
  });
  // Empty sm/md inputs carry xs forward; explicit zero at lg restores automatic.
  for(const [width,exact] of [[479,[5,3,4]],[480,[4,3,5]],[768,[4,3,5]],[1023,[4,3,5]],[1024,null],[1279,null],[1280,[3,5,4]],[1600,[3,5,4]]]) {
   await page.setViewportSize({width,height:900});await check({...state,exact});
  }
  await root.evaluate(node=>node.style.setProperty('--gp-xl-exact-count-left','not-a-count'));
  await check({...state,exact:null});
  // Unsetting a breakpoint input restores the earlier value, not an arbitrary 0.
  await root.evaluate(node=>['left','center','right'].forEach(key=>{node.style.removeProperty(`--gp-xl-exact-count-${key}`);node.style.removeProperty(`--gp-lg-exact-count-${key}`);}));
  await check({...state,exact:[4,3,5]});
  const nested={...base,id:'two-3-2',count:2};await set(nested);
  await root.evaluate((node,fixture)=>{
   node.style.cssText='--gp-md-exact-count-left:1;--gp-md-exact-count-center:2;--gp-md-exact-count-right:3';
   node.innerHTML=`<article class="gp_continue_tracks"><div id="responsive-continued" class="gp_layout--three-1-2-1 gp_spacing--neat">${fixture.slice(0,6).join('')}</div></article><article class="gp_continue_tracks"><div id="responsive-rebased" class="gp_rebase_64 gp_layout--three-1-2-1 gp_spacing--neat">${fixture.slice(0,6).join('')}</div></article>`;
  },fixture);
  const outer=placements(nested);
  await check({...base,id:'three-1-2-1',count:6},{tracks:outer[0].span,target:page.locator('#responsive-continued')});
  await check({...base,id:'three-1-2-1',count:6},{target:page.locator('#responsive-rebased')});
  assert.equal(await page.locator('#responsive-continued').evaluate(node=>getComputedStyle(node).getPropertyValue('--gp-md-exact-count-left').trim()),'');
  await page.locator('#responsive-continued').evaluate(node=>node.style.cssText='--gp-md-exact-count-left:1;--gp-md-exact-count-center:2;--gp-md-exact-count-right:3');
  await check({...base,id:'three-1-2-1',count:6,exact:[1,2,3]},{tracks:outer[0].span,target:page.locator('#responsive-continued')});
  await check({...base,id:'three-1-2-1',count:6},{target:page.locator('#responsive-rebased')});
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(url);
}
