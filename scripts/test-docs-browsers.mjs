import {launchBrowser} from './lib/browser-launch.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {checkDocumentationSite} from '../tests/documentation-site.mjs';
const engine=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1]??'chromium';
assert.ok(['chromium','webkit','firefox'].includes(engine));
const docsOnly=process.argv.includes('--docs-only'),port=4219,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,GRAPHPAPER_PORT:String(port),GRAPHPAPER_ROOT:resolve(docsOnly?'docs':'.')},stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited ${code}`)));});
 await mkdir('test-results',{recursive:true});browser=await launchBrowser(engine);
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const result=await checkDocumentationSite(page,origin,engine,docsOnly?'':'/docs');
 await writeFile(`test-results/docs-${engine}.json`,JSON.stringify({...result,engine,docsOnly,browser:browser.version()},null,2)+'\n');
}finally{await browser?.close();server.kill();}
