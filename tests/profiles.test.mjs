import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {predefinedProfiles,deliveryProfiles,deliveryProfile,profileCoverage,profileCDNTag} from '../src/core/profiles.mjs';
import {layouts,hinges,spacingModes} from '../src/core/catalogue.mjs';
import {compileSelection} from '../src/core/selection.mjs';

test('profile manifest retains complete families and all hinges, fields and utilities',()=>{
 assert.deepEqual(predefinedProfiles.map(p=>p.id),['repeating','two-three']);
 const expected={repeating:['stack','peers'],'two-three':['stack','peers','two','three'],full:['stack','peers','two','three','four','mosaic']};
 for(const p of deliveryProfiles){
  assert.deepEqual(p.selection.layouts,layouts.filter(plan=>expected[p.id].includes(plan.family)).map(p=>p.id));
  assert.deepEqual(p.selection.hinges,hinges.map(([rem])=>rem));assert.deepEqual(p.selection.spacing,Object.keys(spacingModes));
  assert.equal(p.selection.padding,true);assert.equal(p.selection.verticalSpacing,true);
 }
 assert.equal(deliveryProfile('repeating').selection.layouts.length,6);assert.equal(deliveryProfile('two-three').selection.layouts.length,69);
});
test('profile advice covers whole sequences and identifies missing capabilities without guessing',()=>{
 const selection={layouts:['stack','peers-6'],hinges:[96],spacing:['ruled'],padding:true,verticalSpacing:true};
 assert.equal(profileCoverage('repeating',selection).compatible,true);
 selection.layouts.push('three-1-2-1');assert.deepEqual(profileCoverage('repeating',selection).missing.layouts,['three-1-2-1']);
 assert.equal(profileCoverage('two-three',selection).compatible,true);
 selection.layouts.push('four-6-5-4-3','mosaic-13');assert.deepEqual(profileCoverage('two-three',selection).missing.layouts,['four-6-5-4-3','mosaic-13']);
 assert.equal(profileCoverage('full',selection).compatible,true);
 assert.equal(profileCoverage('full',{layouts:['unknown']}).compatible,false);
 assert.equal(profileCoverage('full',{hinges:[42]}).compatible,false);
 assert.throws(()=>deliveryProfile('unknown'));
 assert.throws(()=>profileCDNTag('full','latest'));
 assert.ok(profileCDNTag('two-three','0.5.2').includes('@0.5.2/css/profiles/two-three.min.css'));
});
test('profile artifacts match selection, delivery manifest, hashes and compressed sizes',async()=>{
 const manifest=JSON.parse(await readFile('css/profiles/manifest.json','utf8'));
 assert.equal(manifest.schemaVersion,1);assert.deepEqual(Object.keys(manifest.profiles),['repeating','two-three']);
 for(const profile of predefinedProfiles){
  const record=manifest.profiles[profile.id];assert.deepEqual(record.selection,profile.selection);
  assert.equal(await readFile(profile.files.readable,'utf8'),compileSelection(profile.selection).css);
  for(const format of ['readable','minified']){
   const source=await readFile(profile.files[format]);const expected=record.files[format];
   assert.equal(expected.path,profile.files[format]);assert.equal(source.length,expected.bytes);assert.equal(gzipSync(source).length,expected.gzip);assert.equal(brotliCompressSync(source).length,expected.brotli);assert.equal(createHash('sha256').update(source).digest('hex'),expected.sha256);
  }
 }
});

test('profile qualification binds all delivery hashes to current generated artifacts',async()=>{
 const record=JSON.parse(await readFile('maintainers/profiles.json','utf8'));
 const manifest=JSON.parse(await readFile('css/profiles/manifest.json','utf8'));
 assert.deepEqual(record.manifest,manifest);
 assert.deepEqual(record.engines.map(e=>e.engine),['chromium','firefox','webkit']);
 for(const engine of record.engines){assert.ok(engine.comparisons>0);assert.ok(engine.profiles.every(p=>p.checks.length===4&&p.checks.every(c=>c.status==='pass')));}
 for(const [name,expected] of Object.entries(record.fullArtifacts))assert.equal(createHash('sha256').update(await readFile('css/'+name)).digest('hex'),expected.sha256);
});
