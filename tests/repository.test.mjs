import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';

test('core build and package dependencies are independent of the editorial demo',async()=>{
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(),['lightningcss','playwright']);
  for(const path of ['scripts/build.mjs','scripts/sync-docs-assets.mjs']){
    const source=await readFile(path,'utf8');
    assert.doesNotMatch(source,/graphpaper-demo|build-content-catalog|build-examples|node_modules\/(bootstrap|foundation|tailwind)/);
  }
  for(const path of ['docs/examples','docs/content','docs/assets/content','docs/assets/vendor','scripts/build-examples.mjs','scripts/run-docs-browsers.mjs'])await assert.rejects(access(path));
});

test('configurator stays local and uses only library documentation assets',async()=>{
  const html=await readFile('docs/configurator.html','utf8');
  assert.match(html,/src="\.\/configurator.js"/);
  assert.doesNotMatch(html,/assets\/css\/site.css|\.\/(examples|guidelines|compatibility)\//);
});

test('public documentation does not depend on private repositories or implementation history',async()=>{
  const paths=['README.md','CHANGELOG.md',...(await readdir('docs')).filter(path=>/\.(md|html)$/.test(path)).map(path=>`docs/${path}`)];
  for(const path of paths){
    const source=await readFile(path,'utf8');
    assert.doesNotMatch(source,/graphpaper-demo|separate private|Phase (?:[0-8])|20\/24|8\.5 spike|8\.6 stabilization/,path);
  }
  assert.match(await readFile('README.md','utf8'),/unreleased/);
  assert.match(await readFile('docs/responsive-bands.md','utf8'),/not in the published 0\.3\.0/);
});
