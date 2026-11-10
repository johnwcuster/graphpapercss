import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {sitePages,siteNavigation,markdownPages,legacyShellPages} from '../scripts/docs-template.mjs';
import {layouts} from '../src/core/catalogue.mjs';
import {placements} from '../src/core/geometry.mjs';

const source=path=>readFile(path,'utf8');

test('mixed-spacing guidance uses reviewed current geometry and qualifies inset equivalence',async()=>{
 const guide=await source('docs/edges-and-spacing.md');
 const intervals=spacing=>placements({id:'three-1-1-1',count:3,spacing}).map(p=>[p.start,p.start+p.span]);
 assert.deepEqual(intervals('neat'),[[2,22],[22,42],[42,62]]);
 assert.deepEqual(intervals('wide'),[[3,21],[23,41],[43,61]]);
 assert.notDeepEqual(placements({id:'two-5-3',count:2,spacing:'neat'}).map(p=>[p.start+1,p.start+p.span-1]),placements({id:'two-5-3',count:2,spacing:'wide'}).map(p=>[p.start,p.start+p.span]));
 for(const phrase of ['Surface edge','Region edge','Content edge','not a universal conversion','remain host-controlled','gp_pad'])assert.ok(guide.includes(phrase),phrase);
 assert.ok(markdownPages.some(([name])=>name==='edges-and-spacing'));
});

test('core build and package remain independent of the editorial demo',async()=>{
 const pkg=JSON.parse(await source('package.json'));
 assert.deepEqual(Object.keys(pkg.devDependencies).sort(),['lightningcss','marked','playwright']);
 for(const path of ['scripts/build.mjs','scripts/sync-docs-assets.mjs'])assert.doesNotMatch(await source(path),/graphpaper-demo|build-content-catalog|build-examples/);
 for(const path of ['docs/examples','docs/content','docs/assets/content','docs/assets/vendor'])await assert.rejects(access(path));
});

test('current documentation and preview load current core without legacy CSS',async()=>{
 for(const [id] of sitePages.filter(([id])=>!legacyShellPages.includes(id))){
  const html=await source(`docs/${id}.html`);
  assert.match(html,/<link rel="stylesheet" href="\.\/assets\/graph-paper\/main.css"/);
  assert.doesNotMatch(html,/<link[^>]+(?:legacy\/0.4|bands.css)/,id);
  assert.match(html,/gp_ruler editorial-sheet/,id);
 }
 const html=await source('docs/configurator.html');
 assert.match(html,/src="\.\/sequence\/preview.html"/);
 assert.match(html,/<a id="core-stylesheet-link" href="\.\/assets\/graph-paper\/main.css"/);
 assert.doesNotMatch(await source('docs/editorial.css'),/grid-template|grid-column|grid-row|--gp-/,'host CSS supplies type and treatment, not replacement grid geometry');
});

test('documentation is independent of private repositories and prototype history',async()=>{
 const paths=['README.md','CHANGELOG.md',...(await readdir('docs')).filter(name=>/\.(md|html)$/.test(name)).map(name=>`docs/${name}`)];
 for(const path of paths)assert.doesNotMatch(await source(path),/graphpaper-demo|separate private|Phase (?:[0-8])|20\/24|8\.5 spike|8\.6 stabilization/,path);
});

test('every registered page has shared navigation, one current link and HTML destinations',async()=>{
 for(const [id] of sitePages){
  const html=await source(`docs/${id}.html`);
  assert.ok(html.includes(siteNavigation(id)),id);
  const nav=html.match(/<!-- site-navigation:start -->[\s\S]*?<!-- site-navigation:end -->/)[0];
  assert.equal((nav.match(/aria-current="page"/g)||[]).length,1,id);
  assert.doesNotMatch(html,/href="[^"]*\.md(?:[?#]|")/,id);
  assert.match(html,/editorial.css/,id);
 }
});

test('maintained Markdown renders headings and semantic tables without a runtime renderer',async()=>{
 for(const [name,id] of markdownPages){
  const md=await source(`docs/${name}.md`),html=await source(`docs/${id}.html`);
  assert.ok(html.includes(md.match(/^# (.+)$/m)[1]),id);
  assert.match(html,/gp_layout--stack gp_lg--two-1-3 gp_spacing--wide editorial-field/);
  assert.equal((html.match(/<article id="page-content"/g)||[]).length,1,id);
  assert.doesNotMatch(html,/editorial-prose|editorial-wide-data/,id);
  assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]),['./site-ruler.js']);
 }
 assert.match(await source('docs/class-reference.html'),/scope="col"/);
 const legacy=await source('docs/legacy-reference.html');assert.match(legacy,/fixtures\/legacy-renderer.html/);
 assert.doesNotMatch(legacy,/<link[^>]+legacy.css/);
});

test('navigation retains learning, reference and project paths with historical context separated',()=>{
 const nav=siteNavigation('index');
 for(const name of ['Learn','Reference','Project'])assert.ok(nav.includes(`>${name}</p>`));
 for(const id of ['getting-started','authoring','site-authoring','class-reference','responsive-design','alignment','troubleshooting','contributing','releases'])assert.ok(nav.includes(`./${id}.html`));
 for(const id of ['geometry-changes','geometry-record','legacy-reference','responsive-bands','configurator-0.4'])assert.ok(!nav.includes(`./${id}.html`));
 assert.ok(siteNavigation('configurator-0.4').includes('aria-current="page">0.4 configurator'));
});

test('documents keep a single text-flow article and a wider reference lane where needed',async()=>{
 for(const id of ['responsive-design','site-authoring']){
  const html=await source(`docs/${id}.html`);
  assert.doesNotMatch(html,/editorial-wide-data/);
  assert.match(html,/class="editorial-document"/);
  assert.doesNotMatch(html,/<section[^>]+gp_layout/);
 }
 assert.equal(((await source('docs/class-reference.html')).match(/class="editorial-document editorial-reference"/g)||[]).length,1);
});

test('current guides specify explicit transitions, direct counts and wrapper ownership',async()=>{
 assert.match(await source('docs/authoring.md'),/## Implementation checklist/);
 assert.match(await source('docs/responsive-design.md'),/Carry forward each decision independently/);
 assert.match(await source('docs/alignment.md'),/gp_continue_tracks/);
 assert.match(await source('docs/alignment.md'),/gp_rebase_64/);
 assert.match(await source('docs/class-reference.md'),/direct element child/);
 assert.match(await source('docs/class-reference.md'),/--gp-rule-color/);
 assert.match(await source('docs/site-authoring.md'),/underfilled composition stacks/);
 assert.match(await source('docs/migration.md'),/not a drop-in class rename/);
 assert.match(await source('docs/browser-support.md'),/Firefox 157/);
});

test('release metadata and installation links agree on the current version',async()=>{
 const pkg=JSON.parse(await source('package.json'));assert.equal(pkg.version,'0.5.1');
 for(const path of ['README.md','docs/getting-started.md','docs/index.md','docs/migration.md','docs/configurator-help.md']){
  const text=await source(path);assert.ok(text.includes('0.5'),path);assert.ok(text.includes(pkg.version),path);
 }
 const changelog=await source('CHANGELOG.md');assert.ok(changelog.startsWith(`# Release notes\n\n## ${pkg.version} —`));
 for(const path of ['README.md','docs/getting-started.md'])assert.ok((await source(path)).includes(`graphpapercss@${pkg.version}/css/main.min.css`));
 assert.ok((await source('docs/configurator.html')).includes(`class="version-label">${pkg.version}</span>`));
 assert.ok((await source('docs/sequence/app.mjs')).includes(`matching ${pkg.version} stylesheet`));
 assert.match(await source('.gitignore'),/^\/other\/$/m);
});

test('generated catalogue lists exactly the current public layout IDs and physical proportions',async()=>{
 const html=await source('docs/class-reference.html');
 const rows=[...html.matchAll(/<tr>\s*<td><code>((?:stack|peers|two|three|four|mosaic)[^<]*)<\/code><\/td>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)];
 assert.deepEqual(rows.map(r=>r[1]),layouts.map(p=>p.id));
 for(const p of layouts.filter(p=>p.weights))assert.equal(rows.find(r=>r[1]===p.id)[2],p.weights.join(' : '));
 assert.doesNotMatch(html,/<td><code>grid_/);
});
