import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { inspectorGraph } from './lib/inspector-graph.mjs';

// Nothing is installed or published. Keep generated archives outside the repo.
const destination=await mkdtemp(join(tmpdir(),'graphpaper-inspector-package-'));
execFileSync('pnpm',['pack','--pack-destination',destination],{stdio:'pipe'});
const current=JSON.parse(await readFile('package.json','utf8'));
const archive=join(destination,`${current.name}-${current.version}.tgz`);
execFileSync('tar',['-xzf',archive,'-C',destination]);
const root=join(destination,'package'),pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
assert.equal(pkg.exports['./legacy/0.4/inspector'],'./tools/inspector/index.js');
const source=await inspectorGraph(process.cwd()),packed=await inspectorGraph(root);
assert.deepEqual(packed,source,'package must include the complete, unchanged portable module graph');
const entry=await import(pathToFileURL(resolve(root,pkg.exports['./legacy/0.4/inspector'])).href);
assert.equal(typeof entry.mountInspector,'function');
console.log(`Packed inspector imports without a browser: ${packed.files.length} self-contained modules PASS. Archive: ${archive}`);
