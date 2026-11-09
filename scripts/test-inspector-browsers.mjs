import {launchBrowser} from './lib/browser-launch.mjs';
import { chromium, firefox, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Independent host and module origins: actual CORS imports, not intercepted responses.
const servers=[];
const origin='http://127.0.0.1:4187',tools='http://127.0.0.1:4188',report=[];
try{
  for(const port of [4187,4188]){
    const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port)},stdio:['ignore','pipe','pipe']});servers.push(server);
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Inspector server exited: ${code}`)));});
  }
  for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
    const selected=process.argv.find(arg=>arg.startsWith('--engine='))?.split('=')[1];if(selected&&selected!==name)continue;
    const browser=await launchBrowser(name);
    try{
      const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      // A standalone authoring import must work even without documentation files.
      await page.route(`${tools}/docs/**`,route=>route.abort());
      await page.goto(`${origin}/tests/inspector.html?tools=${tools}`);await page.waitForFunction(()=>window.inspectorReady);
      const baseline=await page.evaluate(()=>{
        window.sourceNodes=[...document.querySelectorAll('main *')];window.sourceHTML=document.querySelector('main').innerHTML;
        return {width:document.querySelector('.gp_canvas').getBoundingClientRect().width,html:window.sourceHTML};
      });
      await page.click('#launch');const ui=page.locator('[data-gp-inspector]');
      const editingWidth=await page.locator('.gp_canvas').first().evaluate(node=>node.getBoundingClientRect().width);
      assert.equal(editingWidth,baseline.width-384,'opening reserves actual page width');
      const workspaceGeometry=()=>page.evaluate(()=>{
        const canvas=document.querySelector('.gp_canvas').getBoundingClientRect(),panel=document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('.panel').getBoundingClientRect();
        return {left:canvas.left,right:canvas.right,panelLeft:panel.left,panelRight:panel.right};
      });
      let geometry=await workspaceGeometry();assert.ok(geometry.right<=geometry.panelLeft,'right sidebar does not cover content');
      await ui.getByRole('button',{name:'Dock left / right',exact:true}).click();
      geometry=await workspaceGeometry();assert.ok(geometry.left>=geometry.panelRight,'left sidebar does not cover content');
      await ui.getByRole('button',{name:'Hide',exact:true}).click();
      assert.equal(await page.locator('.gp_canvas').first().evaluate(node=>node.getBoundingClientRect().width),baseline.width,'hide restores page width');
      await ui.getByRole('button',{name:'Show Graph Paper inspector',exact:true}).click();
      await ui.getByRole('button',{name:'Dock left / right',exact:true}).click();
      await ui.locator('[data-control=target]').selectOption('1');
      await ui.getByRole('button',{name:'Pick composition on page',exact:true}).click();
      await page.locator('#reading a').hover();await ui.locator('.pick-preview').waitFor();
      await page.locator('#reading a').click();
      assert.equal(await ui.locator('[data-control=target]').inputValue(),'0');
      assert.equal(await page.evaluate(()=>location.hash),'','picking an item link must not navigate');
      await ui.getByRole('button',{name:'Pick composition on page',exact:true}).click();await page.keyboard.press('Escape');
      assert.equal(await ui.getByRole('button',{name:'Pick composition on page',exact:true}).getAttribute('aria-pressed'),'false');
      await ui.locator('[data-control=grid]').focus();await page.keyboard.press('Escape');
      assert.equal(await ui.locator('.panel').isVisible(),true,'native form controls retain Escape handling');
      // Both delivery URLs must find one session, not create competing panels.
      await page.unroute(`${tools}/docs/**`);
      assert.equal(await page.evaluate(async tools=>{const {mountInspector}=await import(`${tools}/docs/inspector/index.js`);return mountInspector()===window.inspector;},tools),true);
      assert.equal(await page.locator('[data-gp-inspector]').count(),1);
      await ui.locator('[data-control=grid]').selectOption('grid_02a--07');
      assert.equal(await page.locator('#reading').evaluate(node=>node.classList.contains('grid_02a--07')),true);
      assert.equal(await page.evaluate(()=>{const nodes=[...document.querySelectorAll('main *')];return nodes.length===window.sourceNodes.length&&nodes.every((node,index)=>node===window.sourceNodes[index]);}),true);
      assert.equal(await page.locator('#reading').getAttribute('data-original'),'retained');
      assert.equal(await page.locator('.gp_canvas').first().evaluate(node=>node.getBoundingClientRect().width),editingWidth);
      assert.notEqual(await ui.locator('select').first().evaluate(node=>getComputedStyle(node).color),'rgb(255, 0, 255)');
      for(const [width,state]of [[959.5,'compact'],[960.5,'expanded']]){
        await page.locator('#reading').evaluate((node,width)=>{node.parentElement.style.width=`${width}px`;},width);
        await page.waitForFunction(({width,state})=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.includes(`canvas ${width}px · ${state}`),{width,state});
      }
      await page.locator('#reading').evaluate(node=>{node.parentElement.style.width='';});
      await page.waitForFunction(width=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.includes(`canvas ${width}px`),editingWidth);
      await ui.locator('[data-overlay=ruler]').check();await ui.locator('.ruler').waitFor();
      const beforeScroll=await ui.locator('.ruler').evaluate(node=>node.getBoundingClientRect().top);
      await page.evaluate(()=>scrollBy(0,120));await page.waitForFunction(old=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('.ruler').getBoundingClientRect().top<old-100,beforeScroll);
      await ui.locator('[data-control=band]').selectOption('03');await page.waitForFunction(()=>document.querySelector('#reading').classList.contains('gp_band--03'));
      assert.ok((await ui.locator('[role=status]').textContent()).includes(`canvas ${editingWidth}px`));
      await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.includes('canvas 390px'));
      assert.match(await ui.locator('[role=status]').textContent(),/stacked/);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.ok(await ui.locator('.panel').evaluate(node=>node.getBoundingClientRect().top>400),'narrow screens use a bottom panel instead of squeezing the page');
      await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      assert.ok(await page.evaluate(()=>document.querySelector('#below').getBoundingClientRect().bottom<=document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('.panel').getBoundingClientRect().top),'reserved bottom space lets the end of content scroll above the panel');
      await ui.locator('[data-control=target]').selectOption('1');await page.waitForFunction(()=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.includes('7 source items'));
      await ui.locator('[data-control=target]').selectOption('2');assert.match(await ui.locator('.warning').textContent(),/Read-only/);assert.equal(await ui.locator('[data-control=grid]').isVisible(),false);
      await ui.locator('[data-control=target]').selectOption('3');assert.equal(await ui.locator('[data-control=grid]').isVisible(),true);
      const nestedWidth=await page.locator('#nested').evaluate(node=>Math.round(node.parentElement.getBoundingClientRect().width*100)/100);
      await page.waitForFunction(width=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.includes(`canvas ${width}px`),nestedWidth);
      await page.keyboard.press('Alt+Shift+KeyG');assert.equal(await ui.locator('.panel').isVisible(),false);
      await page.keyboard.press('Alt+Shift+KeyG');assert.equal(await ui.locator('.panel').isVisible(),true);
      await ui.getByRole('button',{name:'Discard & close',exact:true}).click();
      assert.equal(await page.locator('[data-gp-inspector]').count(),0);
      assert.equal(await page.locator('[data-gp-inspector-workspace]').count(),0,'closing releases workspace styles');
      // Class-token order is immaterial; compare content/identity and managed token sets.
      assert.equal(await page.evaluate(()=>window.sourceNodes.every(node=>node.isConnected)),true);
      assert.equal(await page.locator('#reading').evaluate(node=>node.classList.contains('grid_02a--03')&&!node.classList.contains('gp_band--03')),true);
      await page.click('#launch');await ui.locator('[data-control=grid]').selectOption('grid_03');
      await page.evaluate(()=>document.querySelector('#reading').classList.add('host-live-update'));
      await ui.getByRole('button',{name:'Discard & close',exact:true}).click();assert.equal(await page.locator('#reading').evaluate(node=>node.classList.contains('host-live-update')),true);
      await page.click('#launch');await ui.locator('[data-control=grid]').selectOption('grid_04');
      await page.evaluate(()=>{const field=document.querySelector('#reading');field.classList.replace('grid_04','grid_06');});
      const conflict=await page.evaluate(()=>window.inspector.destroy());assert.equal(conflict.conflicts.length,1);assert.equal(await page.locator('#reading').evaluate(node=>node.classList.contains('grid_06')),true);
      assert.deepEqual(errors,[]);
      await page.evaluate(()=>window.inspector.destroy());
      // Existing root sizing and responsive padding remain authored, not overwritten.
      await page.setViewportSize({width:1440,height:1000});
      await page.evaluate(()=>{
        document.documentElement.setAttribute('style','padding: 7px 19px 11px 23px; width:100%; box-sizing:border-box;');
        const css=document.createElement('style');css.id='host-responsive-padding';css.textContent='@media(max-width:1000px){html{padding-left:31px!important}}';document.head.append(css);
      });
      const authoredStyle=await page.locator('html').getAttribute('style');
      const paddedWidth=await page.locator('.gp_canvas').first().evaluate(node=>node.getBoundingClientRect().width);
      await page.click('#launch');
      assert.equal(await page.locator('.gp_canvas').first().evaluate(node=>node.getBoundingClientRect().width),paddedWidth-384);
      await page.setViewportSize({width:900,height:1000});
      assert.equal(await page.locator('html').evaluate(node=>getComputedStyle(node).paddingLeft),'31px');
      await ui.getByRole('button',{name:'Dock left / right',exact:true}).click();
      assert.equal(await page.locator('html').evaluate(node=>getComputedStyle(node).paddingLeft),'415px');
      await page.evaluate(()=>window.inspector.destroy({discard:false}));
      assert.equal(await page.locator('html').getAttribute('style'),authoredStyle);
      assert.equal(await page.locator('html').evaluate(node=>getComputedStyle(node).paddingLeft),'31px');
      await page.evaluate(()=>{document.documentElement.removeAttribute('style');document.getElementById('host-responsive-padding').remove();});
      // Discovery includes an Element root itself and updates for host additions.
      await page.evaluate(async tools=>{const {mountInspector}=await import(`${tools}/tools/inspector/index.js`);window.inspector=mountInspector({root:document.getElementById('reading')});},tools);
      assert.equal(await ui.locator('[data-control=target] option').count(),1);
      assert.equal(await ui.locator('[data-control=band]').isDisabled(),true);
      await page.evaluate(()=>window.inspector.destroy());
      await page.click('#launch');
      await page.evaluate(()=>{
        const canvas=document.createElement('section');canvas.className='gp_canvas';canvas.id='empty-canvas';
        const field=document.createElement('div');field.className='gp_field gp_field--wide grid_03';field.id='empty-composition';canvas.append(field);document.querySelector('main').append(canvas);
      });
      await page.waitForFunction(()=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[data-control=target]').options.length===5);
      await page.evaluate(()=>window.inspector.select(document.getElementById('empty-composition')));
      await page.waitForFunction(()=>document.querySelector('[data-gp-inspector]').shadowRoot.querySelector('[role=status]').textContent.startsWith('0 source items'));
      assert.equal(await ui.locator('.sequence rect').count(),0);
      await page.evaluate(()=>{window.inspector.destroy();document.getElementById('empty-canvas').remove();});
      // The retained /docs entry also works as the only module entry on a page.
      await page.goto(`${origin}/tests/inspector.html?tools=${tools}&entry=/docs/inspector/index.js`);await page.waitForFunction(()=>window.inspectorReady);
      await mkdir('test-results/inspector',{recursive:true});
      await page.setViewportSize({width:1440,height:1000});await page.click('#launch');await page.screenshot({path:`test-results/inspector/${name}.png`});
      assert.deepEqual(errors,[]);
      report.push({browser:name,version:browser.version(),passed:true,crossOrigin:true});console.log(`${name}: cross-origin portable inspector, live content, session safety and responsive checks PASS`);
    }finally{await browser.close();}
  }
  await mkdir('test-results/inspector',{recursive:true});await writeFile('test-results/inspector/browsers.json',JSON.stringify(report,null,2)+'\n');
}finally{for(const server of servers)server.kill('SIGTERM');}
