import {mkdtemp,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {inspectorGraph} from './lib/inspector-graph.mjs';
import {predefinedProfiles} from '../src/core/profiles.mjs';

// Test the actual publish archive, without installing or publishing anything.
const destination=await mkdtemp(join(tmpdir(),'graphpaper-distribution-'));
execFileSync('pnpm',['pack','--pack-destination',destination],{stdio:'pipe'});
const pkg=JSON.parse(await readFile('package.json','utf8'));
const archive=join(destination,`${pkg.name}-${pkg.version}.tgz`);
execFileSync('tar',['-xzf',archive,'-C',destination]);
const root=join(destination,'package');
const packed=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
assert.equal(packed.style,'css/main.css');assert.equal(packed.exports['.'],'./css/main.css');
for(const [name,target] of Object.entries(packed.exports)){
 await access(join(root,target));
 assert.deepEqual(await readFile(join(root,target)),await readFile(target),`${name}: packed bytes`);
}
for(const name of ['css/next','css/compat.css','css/bands.css','src/core','src/legacy/0.4/manifest/compatibility.mjs','src/legacy/0.4/ruler/emit.mjs','tests','maintainers','design']){
 await assert.rejects(access(join(root,name)),`${name} is development-only or retired`);
}
// Docs remain deployable as a static directory, including the modern preview
// and the explicitly versioned reference used by the documentation shell.
for(const name of ['docs/configurator.html','docs/assets/graph-paper/main.css','docs/assets/graph-paper/src/core/catalogue.mjs','docs/assets/graph-paper/legacy/0.4/main.css'])await access(join(root,name));
for(const profile of predefinedProfiles)for(const path of Object.values(profile.files)){
 assert.deepEqual(await readFile(join(root,`docs/assets/graph-paper/${path.slice(4)}`)),await readFile(join(root,path)),`${profile.id}: standalone docs mirror`);
}
for(const name of ['column-rules.css','column-rules.min.css','column-rules.layer.css','column-rules.layer.min.css'])assert.deepEqual(await readFile(join(root,'css/extensions',name)),await readFile(join(root,'docs/assets/graph-paper/extensions',name)));
// Both the ordinary UI and the lazy compiler worker must resolve from a docs-
// only deployment of the actual archive, without Node builtins or parent source.
const pending=['docs/sequence/css-export.mjs','docs/sequence/export-worker.mjs','docs/sequence/delivery.mjs'],seen=new Set();
while(pending.length){
 const name=pending.pop();if(seen.has(name))continue;seen.add(name);
 assert.ok(name.startsWith('docs/'),'worker/UI dependency stays in static docs');
 const source=await readFile(join(root,name),'utf8');
 assert.equal(source,await readFile(name,'utf8'),`${name}: packed worker/UI bytes`);
 for(const match of source.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)){
  assert.ok(match[1].startsWith('.'),`${name}: browser dependency ${match[1]}`);
  pending.push(relative(root,resolve(dirname(join(root,name)),match[1])));
 }
}
assert.deepEqual(await inspectorGraph(root),await inspectorGraph(process.cwd()),'legacy inspector graph is complete');
console.log(`Package exports, core/legacy bytes, static docs assets, development exclusions and legacy inspector graph PASS. Archive: ${archive}`);
