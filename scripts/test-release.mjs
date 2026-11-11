import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {platform,release,arch} from 'node:os';
import assert from 'node:assert/strict';
import {launchBrowser} from './lib/browser-launch.mjs';
import {predefinedProfiles} from '../src/core/profiles.mjs';
const suite=process.argv.find(a=>a.startsWith('--suite='))?.slice(8)??'core';
const requested=process.argv.find(a=>a.startsWith('--engine='))?.slice(9);
const engines=requested?[requested]:['chromium','firefox','webkit'];
const overrides=process.argv.filter(a=>a.startsWith('--executable=')||a.startsWith('--driver='));
if(overrides.length)assert.ok(requested&&suite!=='package','Browser overrides require one explicit engine and a browser suite');
assert.ok(['core','utilities','tools','package'].includes(suite),'Use --suite=core|utilities|tools|package');
assert.ok(engines.every(e=>['chromium','firefox','webkit'].includes(e)));
const artifactNames=['main.css','main.min.css','main.layer.css','main.layer.min.css',...predefinedProfiles.flatMap(p=>Object.values(p.files).map(path=>path.slice(4))),'profiles/manifest.json'];
const artifacts=async()=>Object.fromEntries(await Promise.all(artifactNames.map(async name=>{const bytes=await readFile(`css/${name}`);return[name,{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}];})));
const initial=await artifacts(),started=new Date().toISOString();
await mkdir('test-results/release/logs',{recursive:true});
const report={suite,started,platform:platform(),osRelease:release(),architecture:arch(),artifacts:initial,engines:{},steps:[],passed:false};
const run=async(name,script,args=[])=>{
 const log=`test-results/release/logs/${suite}-${name}.log`,stream=createWriteStream(log);
 console.log(`START ${suite}/${name}`);
 const child=spawn(process.execPath,[script,...args],{stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 let code;
 try{code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});}
 finally{await new Promise(resolve=>stream.end(resolve));}
 report.steps.push({name,command:[process.execPath,script,...args],exitCode:code,log});
 if(code!==0)throw Error(`${name} failed; see ${log}`);
 console.log(`PASS ${suite}/${name}`);
};
try{
 if(suite==='package'){
  for(const script of ['build.mjs','check-docs.mjs','validate.mjs','test-distribution-package.mjs','test-inspector-package.mjs'])await run(script,`scripts/${script}`,script==='build.mjs'?['--check']:[]);
  await run('unit-tests','--test',(await readdir('tests')).filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name));
 }else{
  if(suite==='utilities')await run('vertical-fixtures','scripts/build-vertical-spacing-fixture.mjs');
  for(const engine of engines){
   const probe=await launchBrowser(engine);
   try{report.engines[engine]={version:probe.version(),overrides};}finally{await probe.close();}
   const steps=suite==='core'?['core','profiles']:suite==='utilities'?['padding','vertical-spacing','distribution']:['docs','configurator','inspector'];
   for(const step of steps)await run(`${engine}-${step}`,step==='profiles'?'scripts/test-selective-builds.mjs':`scripts/test-${step}-browsers.mjs`,[`--engine=${engine}`,...overrides,...(step==='configurator'?['--docs-only']:[]),...(step==='profiles'?['--predefined']:[])]);
  }
 }
 assert.deepEqual(await artifacts(),initial,'CSS artifacts changed during qualification');
 report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{
 report.finished=new Date().toISOString();
 const path=`test-results/release/${suite}-${requested??'all'}.json`;
 await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(`Report: ${path}`);
}
