import assert from 'node:assert/strict';
import {placements} from '../../src/core/geometry.mjs';
export async function checkRowBudgetIntegration({page,root,set,check,base,url}){
 for(const asset of ['main.css','main.min.css','main.layer.css','main.layer.min.css']){
  console.log(`Row-budget boundaries: ${asset}`);
  await page.goto(url);
  await page.locator('link[href*="css/"]').evaluate((n,asset)=>new Promise((resolve,reject)=>{
   const href=new URL(`/css/${asset}`,n.href).href;
   if(n.href===href&&n.sheet)return resolve();
   n.onload=resolve;n.onerror=reject;n.href=href;
  }),asset);
  for(const [id,count,stacked,extra] of [
   ['two-3-2',199,false],['two-3-2',200,true],['two-3-2',199,false],
   ['two-3-2',201,true,{arrangement:'first-above',exact:[99,101]}],
   ['two-3-2',202,true,{arrangement:'first-above-last-below',exact:[99,101]}],
   ['three-1-2-1',65,false],['three-1-2-1',66,true],['three-1-2-1',67,false],
   ['three-1-2-1',66,true,{exact:[21,22,23]}],
   ['four-6-5-4-3',43,false],['four-6-5-4-3',43,true,{exact:[9,10,11,13]}],
   ['four-6-5-4-3',43,false],['four-6-5-4-3',129,true],['four-6-5-4-3',130,false],
  ])for(const spacing of ['neat','thin','ruled']){
   const traversal=id.startsWith('two-')?'right-to-left':id.startsWith('three-')?'center-first':'widest-first';
   const state={...base,id,count,spacing,traversal,...extra};await set(state);await check(state);
   const actual=await root.evaluate(root=>{
    const groups=new Map();
    for(const item of root.children){
     const r=item.getBoundingClientRect(),s=getComputedStyle(item),key=s.gridColumnStart+'/'+s.gridColumnEnd;
     if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
    }
    let overlaps=0;for(const boxes of groups.values()){
     boxes.sort((a,b)=>a.top-b.top);
     for(let i=1;i<boxes.length;i++)if(boxes[i].top<boxes[i-1].bottom-.5)overlaps++;
    }
    return{overlaps,regions:groups.size,rows:getComputedStyle(root).gridTemplateRows.split(' ').length};
   });
   assert.equal(actual.overlaps,0,`${asset}/${id}/${count}: visible overlap`);
   assert.equal(actual.regions===1,stacked,`${asset}/${id}/${count}: entire composition fallback`);
   assert.ok(actual.rows<=9998,`${asset}/${id}/${count}: realized row budget`);
  }
  const outer={...base,count:2};await set(outer);
  await root.evaluate(n=>{
   const items=count=>Array.from({length:count},(_,i)=>`<article>Nested record ${i+1}</article>`).join('');
   n.innerHTML=`<article class="gp_continue_tracks"><section id="budget-continued" class="gp_layout--three-1-2-1 gp_spacing--thin">${items(66)}</section></article><article class="gp_continue_tracks"><section id="budget-rebased" class="gp_rebase_64 gp_layout--four-6-5-4-3 gp_spacing--neat">${items(129)}</section></article>`;
  });
  await check(outer);
  await check({...base,id:'three-1-2-1',count:66,spacing:'thin'},{target:page.locator('#budget-continued'),tracks:placements(outer)[0].span});
  await check({...base,id:'four-6-5-4-3',count:129},{target:page.locator('#budget-rebased')});
 }
 await page.goto(url);
}
