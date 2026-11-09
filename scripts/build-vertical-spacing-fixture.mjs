import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {transform} from 'lightningcss';
import assert from 'node:assert/strict';
import {compactPrivateProperties} from './lib/compact-core.mjs';
import {generateCSS,enhancementCondition} from '../src/core/compiler.mjs';
import {utilityCSS} from '../tests/fixtures/vertical-spacing/shared.mjs';
const core=await readFile(new URL('../css/main.css',import.meta.url),'utf8');assert.equal(core,generateCSS(),'Build active candidate first');
assert.equal(core.split('\n'+utilityCSS).length-1,1,'Exactly one integrated utility');
const baseline=core.replace('\n'+utilityCSS,'');
const out=new URL('../test-results/vertical-spacing/',import.meta.url);await mkdir(out,{recursive:true});
const sizes=[];
for(const [name,source] of Object.entries({baseline,experiment:core,fallback:core.replaceAll(enhancementCondition,'not (display:grid)')})){
 const min=transform({filename:'experiment.css',code:Buffer.from(compactPrivateProperties(source).css),minify:true}).code;
 for(const [ext,value] of [['css',source],['min.css',min]]){
  const p=new URL(`${name}.${ext}`,out);if(process.argv.includes('--check'))assert.equal(String(value),await readFile(p,'utf8'));else await writeFile(p,value);
 }
 sizes.push({name,source:Buffer.byteLength(source),minified:min.length,gzip:gzipSync(min).length,brotli:brotliCompressSync(min).length,registrations:(source.match(/@property /g)??[]).length,sha256:createHash('sha256').update(min).digest('hex')});
}
const delta=Object.fromEntries(['source','minified','gzip','brotli','registrations'].map(k=>[k,sizes[1][k]-sizes[0][k]]));
const result={status:'Integrated utility; baseline omits only vertical-spacing rules',sizes,delta};
if(!process.argv.includes('--check'))await writeFile(new URL('../test-results/vertical-spacing/sizes.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
