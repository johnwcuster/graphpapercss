import assert from 'node:assert/strict';
import {sitePages,legacyShellPages} from '../scripts/docs-template.mjs';
import {layouts,hinges} from '../src/core/catalogue.mjs';
import {placements} from '../src/core/geometry.mjs';
import {recipes,fields,layoutsFor,expandedPlacements,compactPlacements,sequentialPlacements} from '../src/legacy/0.4/ruler/geometry.mjs';

export async function checkDocumentationSite(page,origin,engine,publicPath='/docs'){
 const errors=[],onError=e=>errors.push(`${page.url()}: ${e.message}`),onResponse=r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);};
 page.on('pageerror',onError);page.on('response',onResponse);
 let views=0,snippets=0;
 try{
  for(const [id] of sitePages){
   await page.goto(`${origin}${publicPath}/${id}.html`);
   if(id==='configurator'){
    await page.waitForFunction(()=>document.querySelector('#preview').dataset.ready==='true');
    await page.click('#workbench-hide');
   }
   if(id==='configurator-0.4'){
    await page.waitForFunction(()=>document.querySelectorAll('#composition > article').length===6);
    // The legacy page's floating controls can be hidden independently of content.
    const hide=page.locator('#workbench-hide');if(await hide.count())await hide.click();
   }
   if(id==='geometry-changes')await page.waitForFunction(()=>document.querySelectorAll('#reviews > section').length===12);
   if(id==='legacy-reference'){
    const frame=page.frameLocator('#legacy-preview');await frame.locator('#reference article').first().waitFor();
    assert.equal(await frame.locator('#reference article').count(),3);
    assert.equal(await frame.locator('link[href*="/main.css"]').count(),0,'original 0.2.3 rendering is isolated');
   }
   const nav=page.getByRole('navigation',{name:'Site navigation',exact:true}),legacy=legacyShellPages.includes(id);
   assert.equal(await nav.count(),1,id);
   assert.equal(await nav.locator('[aria-current="page"]').getAttribute('href'),`./${id}.html`);
   assert.equal(await page.locator('h1').count(),1,id);
   assert.equal(await page.locator('a[href*=".md"]').count(),0,id);
   const ruler=page.getByRole('checkbox',{name:'64-bit ruler',exact:true});assert.equal(await ruler.count(),1,id);
   for(const width of ['index','getting-started','site-authoring','responsive-design','class-reference','configurator'].includes(id)?[320,640,1024,1440,2560]:[320,640,1440]){
    await page.setViewportSize({width,height:1000});views++;
    const sheet=await page.locator('.editorial-sheet').first().boundingBox();
    assert.ok(Math.abs(sheet.x)<1&&Math.abs(sheet.width-width)<1,`${id}/${width}: page-wide ruler`);
    if(!legacy){
     for(const reading of await page.locator('.editorial-document').all()){
      const actual=await reading.evaluate(n=>{
       const p=document.createElement('span');p.style.cssText=`position:absolute;display:block;inline-size:${n.classList.contains('editorial-reference')?128:76}ch;`;
       n.append(p);const cap=p.getBoundingClientRect().width;p.remove();
       const r=n.getBoundingClientRect();return{x:r.x,width:r.width,cap,reference:n.classList.contains('editorial-reference'),display:getComputedStyle(n).display};
      });
      const bit=sheet.width/64,region=placements({id:width>=1024?'two-1-3':'stack',count:2,spacing:'wide'})[1];
      const span=actual.reference?region.span:Math.min(region.span,Math.max(2,2*Math.floor(actual.cap/bit/2)));
      assert.equal(actual.display,'block',`${id}/${width}: normal document flow`);
      assert.ok(Math.abs(actual.width-span*bit)<1,`${id}/${width}: reading cap snaps to ${span} bits (${actual.width} vs ${span*bit})`);
      for(const edge of [actual.x,actual.x+actual.width])assert.ok(Math.abs(edge/bit-Math.round(edge/bit))<.1,`${id}/${width}: both text-block edges on ruler lines`);
      assert.ok(Math.abs(actual.x+actual.width/2-(region.start+region.span/2)*bit)<1,`${id}/${width}: centered within the reading region`);
      assert.equal(await reading.locator(':scope > .gp_layout--stack').count(),0,'headings do not create nested compositions');
      const toc=page.getByRole('navigation',{name:'On this page',exact:true}),box=await toc.boundingBox();
      const position=await toc.evaluate(n=>getComputedStyle(n).position);
      assert.equal(position,width>=1024?'sticky':'static',`${id}/${width}: appropriate contents positioning`);
      if(width>=1024)assert.ok(box.x+box.width<=actual.x+1,'contents is left of article');
      else{
       assert.ok(box.y+box.height<=(await reading.boundingBox()).y+1,'stacked contents precedes article');
       assert.ok(Math.abs(box.x-actual.x)<1&&Math.abs(box.width-actual.width)<1,'stacked contents shares the article reading edge');
      }
     }
     for(const reading of await page.locator('.editorial-prose > div,.editorial-intro > header,.editorial-intro > nav').all()){
      const box=await reading.boundingBox(),limit=await reading.evaluate(n=>parseFloat(getComputedStyle(n).maxInlineSize));
      assert.ok(Math.abs(box.width-Math.min(58*width/64,limit))<1,`${id}/${width}: reading measure within the wide field`);
      assert.ok(Math.abs(box.x+box.width/2-width/2)<1,`${id}/${width}: centered reading edge`);
     }
     const state={id:width>=1024?'three-1-2-1':width>=640?'two-1-2':'stack',count:3,spacing:'wide'};
     const expected=placements(state);
     for(let i=0;i<3;i++){
      const box=await nav.locator(':scope > *').nth(i).boundingBox(),p=expected[i];
      assert.ok(Math.abs(box.x-p.start*width/64)<1,`${id}/${width}: navigation edge ${i}`);
      assert.ok(Math.abs(box.width-p.span*width/64)<1,`${id}/${width}: navigation span ${i}`);
     }
    }else{
     const recipe=recipes.grid_03,layout=layoutsFor(recipe).find(p=>p.set==='set_03'&&!p.flow),state=width<480?'stacked':width<960?'compact':'expanded';
     const expected=state==='stacked'?sequentialPlacements(recipe,'wide',3,state):state==='compact'?compactPlacements('wide',layout):expandedPlacements(recipe,'wide',layout);
     for(let i=0;i<3;i++){
      const box=await nav.locator(':scope > *').nth(i).boundingBox(),p=expected.find(p=>p.item===i+1);
      assert.ok(Math.abs(box.x-(fields.wide.start+p.lines[0]-1)*width/64)<1,`${id}: explicit legacy navigation`);
     }
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${width}: no page overflow`);
    for(const link of await nav.locator('a').all())assert.ok((await link.boundingBox()).height>=24,`${id}: navigation target size`);
    if(['index','class-reference'].includes(id)){
     const sheetNode=page.locator('.editorial-sheet').first(),before=await sheetNode.boundingBox();await ruler.check();
     const overlay=await sheetNode.evaluate(n=>{const s=getComputedStyle(n,'::after');return{content:s.content,height:parseFloat(s.height),width:parseFloat(s.width),size:s.backgroundSize,pointer:s.pointerEvents};});
     assert.equal(overlay.content,'""');assert.ok(Math.abs(overlay.height-before.height)<1&&Math.abs(overlay.width-before.width)<1);
     assert.equal(overlay.size,'1.5625% 100%');assert.equal(overlay.pointer,'none');
     const after=await sheetNode.boundingBox();
     // Long sticky pages can serialize fractional dimensions with tiny drift.
     assert.ok(Math.abs(after.height-before.height)<1/64&&Math.abs(after.width-before.width)<1/64,'ruler overlay preserves layout within one subpixel unit');
     await ruler.focus();await page.keyboard.press('Space');assert.equal(await ruler.isChecked(),false);
    }
    if(['site-authoring','class-reference'].includes(id)&&width===1440){
     await page.locator('.editorial-document > h2').first().evaluate(n=>n.scrollIntoView({block:'start'}));
     const toc=page.getByRole('navigation',{name:'On this page',exact:true}),box=await toc.boundingBox();
     assert.ok(box.y>=15&&box.y+box.height<=1001,'contents sidebar sticks within viewport');
    }
    if(engine==='chromium'&&['index','class-reference','alignment','site-authoring','responsive-design'].includes(id)&&[320,1440,2560].includes(width))await page.screenshot({path:`test-results/docs-${id}-${width}.png`});
   }
   if(['site-authoring','class-reference'].includes(id)){
    await page.setViewportSize({width:1440,height:400});
    const toc=page.getByRole('navigation',{name:'On this page',exact:true});
    assert.equal(await toc.evaluate(n=>getComputedStyle(n).position),'static','short windows retain normal scrolling');
    await toc.locator('a').last().focus();
    const focused=await toc.locator('a').last().boundingBox();assert.ok(focused.y>=0&&focused.y+focused.height<=401,'contents focus stays visible');
    await page.setViewportSize({width:1440,height:1000});
   }
  }
  await page.goto(`${origin}${publicPath}/authoring.html`);await page.getByRole('checkbox',{name:'64-bit ruler',exact:true}).check();
  await page.goto(`${origin}${publicPath}/class-reference.html`);assert.equal(await page.getByRole('checkbox',{name:'64-bit ruler',exact:true}).isChecked(),true);
  await page.getByRole('checkbox',{name:'64-bit ruler',exact:true}).uncheck();await page.reload();assert.equal(await page.getByRole('checkbox',{name:'64-bit ruler',exact:true}).isChecked(),false);
  // Execute the actual published code blocks against the stylesheet recommended
  // to authors. Resolve public classes independently of the CSS implementation.
  for(const id of ['getting-started','authoring','alignment','responsive-design','edges-and-spacing','site-authoring','migration']){
   await page.goto(`${origin}${publicPath}/${id}.html`);
   const examples=(await page.locator('pre code.language-html').allTextContents()).filter(html=>/class="[^"]*gp_ruler/.test(html));
   for(const markup of examples){
    snippets++;
    await page.setContent(`<link rel="stylesheet" href="${origin}${publicPath}/assets/graph-paper/main.css"><style>*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui}img{max-width:100%;height:auto}figure{margin:0}article,aside,figure,p{min-height:12px}</style>${markup}`,{waitUntil:'load'});
    for(const width of [320,639,640,767,768,1023,1024,1280]){
     await page.setViewportSize({width,height:1000});
     const data=await page.locator('[class*="gp_layout--"]').evaluateAll(nodes=>nodes.map(n=>({classes:[...n.classList],tracks:Number(getComputedStyle(n).getPropertyValue('--_gp-tracks')),children:[...n.children].map(item=>{const s=getComputedStyle(item);return[s.gridColumnStart,s.gridColumnEnd,s.gridRowStart,s.gridRowEnd];})})));
     for(const d of data){
      let selected='stack',spacing='full',allocation='closest',fewer='left',traversal='left-to-right',arrangement='across';
      for(const [min,prefix] of [[0,null],...hinges]){
       if(width<min*16)continue;
       const stem=prefix?`gp_${prefix}`:'gp';
       for(const name of d.classes){
        const layoutPrefix=prefix?`${stem}--`:'gp_layout--';
        if(name.startsWith(layoutPrefix)&&layouts.some(p=>p.id===name.slice(layoutPrefix.length)))selected=name.slice(layoutPrefix.length);
        for(const family of ['spacing','allocation','fewer','traversal','arrangement']){
         const control=prefix?`${stem}-${family}--`:`gp_${family}--`;
         if(!name.startsWith(control))continue;const value=name.slice(control.length);
         if(family==='spacing')spacing=value;else if(family==='allocation')allocation=value;else if(family==='fewer')fewer=value;else if(family==='traversal')traversal=value;else arrangement=value;
        }
       }
      }
      const expected=placements({id:selected,count:d.children.length,spacing,allocation,fewer,traversal,arrangement,tracks:d.tracks});
      expected.forEach((p,i)=>assert.deepEqual(d.children[i],[String(p.start+1),`span ${p.span}`,String(p.row),`span ${p.rowspan}`],`${id} copied example/${width}/${selected}/${i}`));
     }
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id} copied example/${width}: no overflow`);
    }
   }
  }
  assert.deepEqual(errors,[]);
 }finally{page.off('pageerror',onError);page.off('response',onResponse);}
 await page.setViewportSize({width:1280,height:900});
 console.log(`${engine}: ${sitePages.length} pages, ${views} width checks, ${snippets} executed code blocks, navigation geometry, ruler persistence and legacy isolation PASS`);
 return{pages:sitePages.length,views,snippets,passed:true};
}
