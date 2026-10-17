import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { sitePages, siteNavigation, markdownPages } from '../scripts/docs-template.mjs';
import { recipes, layoutsFor, resolveColumns } from '../src/ruler/geometry.mjs';

test('core build and package dependencies are independent of the editorial demo',async()=>{
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(),['lightningcss','marked','playwright']);
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

test('editorial documentation uses Graph Paper without coupling the control shell or preview',async()=>{
  const configurator=await readFile('docs/configurator.html','utf8');
  const help=await readFile('docs/configurator-help.html','utf8');
  for(const html of [configurator,help]){
    assert.match(html,/assets\/graph-paper\/main.css/);
    assert.match(html,/editorial.css/);
    assert.match(html,/gp_canvas editorial-sheet/);
    assert.match(html,/gp_field gp_field--wide/);
  }
  assert.match(configurator,/gp_field gp_field--wide grid_02a--07 set_03 editorial-composition/);
  assert.match(configurator,/id="preview" class="gp_canvas"/);
  assert.match(help,/gp_field gp_field--wide grid_03c--07 set_03 gp_band--01 editorial-intro/);
  assert.doesNotMatch(await readFile('docs/editorial.css','utf8'),/grid-template|grid-column|grid-row|--gp-/);
});

test('public documentation does not depend on private repositories or implementation history',async()=>{
  const paths=['README.md','CHANGELOG.md',...(await readdir('docs')).filter(path=>/\.(md|html)$/.test(path)).map(path=>`docs/${path}`)];
  for(const path of paths){
    const source=await readFile(path,'utf8');
    assert.doesNotMatch(source,/graphpaper-demo|separate private|Phase (?:[0-8])|20\/24|8\.5 spike|8\.6 stabilization/,path);
  }
  assert.match(await readFile('README.md','utf8'),/Version 0\.4\.1/);
  assert.match(await readFile('docs/responsive-bands.md','utf8'),/Available since 0\.4\.0/);
});

test('every public documentation page has the same static Graph Paper navigation and HTML links',async()=>{
  for(const [id] of sitePages){
    const html=await readFile(`docs/${id}.html`,'utf8');
    assert.ok(html.includes(siteNavigation(id)),id);
    assert.match(html,/gp_canvas editorial-sheet/,id);
    assert.match(html,/editorial.css/,id);
    assert.doesNotMatch(html,/href="[^"]*\.md(?:[?#]|")/,id);
    const navigation=html.match(/<!-- site-navigation:start -->[\s\S]*?<!-- site-navigation:end -->/)[0];
    assert.equal((navigation.match(/aria-current="page"/g)||[]).length,1,id);
  }
});

test('Markdown documentation is statically rendered with content and code preserved',async()=>{
  for(const [source,id] of markdownPages){
    const markdown=await readFile(`docs/${source}.md`,'utf8');
    const html=await readFile(`docs/${id}.html`,'utf8');
    assert.ok(html.includes(markdown.match(/^# (.+)$/m)[1]));
    assert.match(html,/gp_field gp_field--wide editorial-prose/);
    assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]),['./site-ruler.js']);
  }
  assert.match(await readFile('docs/architecture.html','utf8'),/scope="col"/);
  assert.match(await readFile('docs/responsive-bands.html','utf8'),/&lt;div class=&quot;gp_canvas&quot;&gt;/);
  const legacy=await readFile('docs/legacy-reference.html','utf8');
  assert.doesNotMatch(legacy,/href="[^\"]*legacy.css"/);
  assert.match(legacy,/fixtures\/legacy-renderer.html/);
  assert.match(await readFile('docs/fixtures/legacy-renderer.html','utf8'),/assets\/graph-paper\/legacy.css/);
});

test('documentation exposes distinct learning, lookup, and maintenance paths',async()=>{
  const nav=siteNavigation('index');
  for(const label of ['Learn','Reference','Project']) assert.ok(nav.includes(`>${label}</p>`));
  for(const id of ['getting-started','authoring','site-authoring','class-reference','responsive-design','alignment','troubleshooting','contributing','releases']) {
    assert.ok(nav.includes(`./${id}.html`),id);
  }
  for(const id of ['geometry-changes','geometry-record','legacy-reference','validation']) {
    assert.ok(!nav.includes(`./${id}.html`),`${id} belongs under its parent guide`);
  }
  const architecture=await readFile('docs/architecture.md','utf8');
  assert.doesNotMatch(architecture,/Show options|Hide options|Undo control|dock selectors|Source section/);
  const authoring=await readFile('docs/authoring.md','utf8');
  assert.match(authoring,/## Implementation checklist/);
  assert.match(authoring,/There is no `set_02`/);
  assert.match(authoring,/no independently selectable compact recipe/);
  const reference=await readFile('docs/class-reference.md','utf8');
  assert.match(reference,/layoutsFor\(recipe\)/);
  assert.match(reference,/direct element children/);
  assert.match(reference,/--gp-rule-color/);
  const releases=await readFile('docs/releases.html','utf8');
  assert.match(releases,/0\.4\.1 — documentation and configurator/);
  assert.doesNotMatch(releases,/href="docs\//);
});

test('site authoring keeps ordinary tables on the reading track and explicitly widens catalogues',async()=>{
  const responsive=await readFile('docs/responsive-design.html','utf8');
  assert.doesNotMatch(responsive,/editorial-wide-data/);
  assert.match(responsive,/editorial-prose grid_03c--07 set_03 gp_band--01/);
  const reference=await readFile('docs/class-reference.html','utf8');
  assert.equal((reference.match(/editorial-wide-data/g)||[]).length,1);
  const guide=await readFile('docs/site-authoring.md','utf8');
  assert.match(guide,/## Widen for a task, not a tag/);
  assert.match(guide,/## Draw the boundary deliberately/);
  assert.match(guide,/empty positions/);
});

test('documentation distinguishes released CSS from tooling and intentional empty positions',async()=>{
  for(const path of ['README.md','docs/getting-started.md','docs/architecture.md','docs/index.html','docs/migration.html','docs/geometry-changes.html']){
    const source=await readFile(path,'utf8');
    assert.match(source,/0\.4\.0/,path);
    assert.doesNotMatch(source,/development build|development toward|upcoming 1\.0 release/,path);
  }
  const authoring=await readFile('docs/authoring.md','utf8');
  assert.match(authoring,/useful starting point, not a requirement/);
  assert.match(authoring,/mismatch warrants review, not automatic correction/);
  assert.match(authoring,/site-authoring\.md#establish-a-recurring-reading-position/);
  for(const path of ['docs/responsive-design.md','docs/responsive-bands.md']){
    const source=await readFile(path,'utf8');
    assert.match(source,/slot is a defined item position/);
    assert.doesNotMatch(source,/macro column/);
  }
  const release=(await readFile('CHANGELOG.md','utf8')).split('## 0.4.0')[0];
  for(const heading of ['Documentation','Configurator','Accessibility','Validation']) assert.ok(release.includes(`### ${heading}`));
  assert.doesNotMatch(release,/Undo|Reserve space/);
});

test('0.4.1 release metadata is consistent and local reference material is excluded',async()=>{
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  assert.equal(pkg.version,'0.4.1');
  assert.match(await readFile('CHANGELOG.md','utf8'),/^## 0\.4\.1 — documentation and configurator$/m);
  for(const path of ['README.md','docs/getting-started.md','docs/architecture.md','docs/index.html','docs/migration.html','docs/configurator.html']){
    const source=await readFile(path,'utf8');
    assert.ok(source.includes(pkg.version),path);
    assert.doesNotMatch(source,/unreleased/i,path);
  }
  assert.match(await readFile('.gitignore','utf8'),/^\/other\/$/m);
  assert.ok(!pkg.files.some(path=>/^other(?:\/|$)/.test(path)));
});

test('static recipe catalogue lists exactly the manifest-backed combinations and geometry',async()=>{
  const html=await readFile('docs/class-reference.html','utf8');
  const rows=[...html.matchAll(/<tr>\s*<td><code>(grid_\d[^<]*)<\/code><\/td>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)];
  assert.deepEqual(rows.map(row=>row[1]).sort(),Object.keys(recipes).sort());
  for(const [,id,widths,choices] of rows){
    const recipe=recipes[id];
    assert.equal(widths,resolveColumns(recipe,'wide').map(column=>column.end-column.start).join(' : '));
    const actual=choices.split('<br>').flatMap(group=>{
      const set=group.match(/<code>(set_[^<]+)<\/code>/)[1];
      const flows=[...group.matchAll(/<code>(flow_[^<]+)<\/code>/g)].map(match=>match[1]);
      if(group.includes('default')) flows.push('default');
      return flows.map(flow=>`${set}/${flow}`);
    });
    assert.deepEqual(actual.sort(),layoutsFor(recipe).map(layout=>`${layout.set}/${layout.flow??'default'}`).sort(),id);
  }
});
