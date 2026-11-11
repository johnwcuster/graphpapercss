import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {distributionArtifacts} from '../src/core/distribution.mjs';
import {generateCSS} from '../src/core/compiler.mjs';

test('canonical distribution is deterministic, complete and separate from legacy',async()=>{
 const artifacts=distributionArtifacts();
 assert.deepEqual(artifacts,distributionArtifacts());
 for(const [name,expected] of Object.entries(artifacts))assert.equal(await readFile(name,'utf8'),expected,name);
 assert.equal(artifacts['css/main.css'],generateCSS());
 assert.equal(artifacts['css/main.layer.css'],`@layer graph-paper {\n${generateCSS()}}\n`);
 assert.ok(artifacts['css/main.layer.min.css'].startsWith('@layer graph-paper{'));
 const report=JSON.parse(artifacts['css/size.json']);assert.equal(report.layouts,102);
 assert.equal(report.minified,Buffer.byteLength(artifacts['css/main.min.css']));
 assert.ok(!Object.keys(artifacts).some(name=>name.includes('legacy')||name.includes('bands')||name.includes('compat')));
});

test('versioned 0.4 stylesheets retain released bytes after promotion',async()=>{
 const reference=JSON.parse(await readFile('tests/fixtures/released-0.4.json','utf8'));
 for(const [name,sha256] of Object.entries(reference.sha256)){
  assert.equal(createHash('sha256').update(await readFile(`css/legacy/0.4/${name}`)).digest('hex'),sha256,name);
 }
});

test('structural qualification names the exact current CSS artifacts',async()=>{
 const record=JSON.parse(await readFile('maintainers/qualification-0.6.json','utf8'));
 for(const [name,expected] of Object.entries(record.artifacts)){
  const bytes=await readFile('css/'+name);
  assert.equal(bytes.length,expected.bytes,name);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,`${name}: rerun qualification after changing artifacts`);
 }
 assert.deepEqual(record.engines.map(r=>r.engine),['chromium','firefox','webkit']);
 for(const engine of record.engines){assert.equal(engine.core.status,'pass');assert.equal(engine.core.quick,false);assert.equal(engine.columnRules.status,'pass');}
 assert.equal(record.olderBrowsers.status,'not rerun');
});
