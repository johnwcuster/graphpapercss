import { readFile, writeFile } from 'node:fs/promises';
import { Marked } from 'marked';
import { markdownPages, siteNavigation, documentPage, htmlLink } from './docs-template.mjs';
import {layouts} from '../src/core/catalogue.mjs';
import {deliveryProfiles,profileCDNTag} from '../src/core/profiles.mjs';

const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const profileReport=JSON.parse(await readFile(new URL('../css/profiles/manifest.json',import.meta.url),'utf8'));
const fullReport=JSON.parse(await readFile(new URL('../css/size.json',import.meta.url),'utf8'));
function profileTable(){
 const kb=n=>`${(n/1000).toFixed(1)} KB`;
 return '| Build | Layouts | Minified | Gzip | Local files | Pinned CDN |\n| --- | --- | ---: | ---: | --- | --- |\n'+deliveryProfiles.map(p=>{
  const sizes=p.id==='full'?fullReport:{minified:profileReport.profiles[p.id].files.minified.bytes,gzip:profileReport.profiles[p.id].files.minified.gzip};
  const cdn=profileCDNTag(p.id,version).match(/href="([^"]+)"/)[1];
  return `| ${p.id==='full'?'Full library':`\`${p.id}\``} | ${p.description} | ${kb(sizes.minified)} | ${kb(sizes.gzip)} | [Readable](assets/graph-paper/${p.files.readable.slice(4)}) · [Minified](assets/graph-paper/${p.files.minified.slice(4)}) | [${version} CSS](${cdn}) |`;
 }).join('\n');
}

function layoutCatalogue() {
  const header='| Layout ID | Physical proportions / positions | Occupancy and traversal |\n| --- | --- | --- |';
  return header+'\n'+layouts.map(p=>{
    const shape=p.weights?.join(' : ')??(p.family==='peers'?`${p.columns} equal positions`:p.family==='mosaic'?`${p.count} interlocking items`:'Single column');
    const contract=p.family==='stack'?'Any count; source order':p.family==='peers'?'Repeating; row-major':p.family==='two'?'Automatic pair; either direction; optional spanning endpoints':p.family==='three'?'Automatic/exact triple; left-to-right or center-first; reverse at 3 items':p.family==='four'?'Automatic/exact four; left-to-right'+(p.weights.every(n=>n===p.weights[0])?'':' or widest-first'):`Exactly ${p.count}; fixed map; Neat/Thin`;
    return `| \`${p.id}\` | ${shape} | ${contract} |`;
  }).join('\n');
}

// Markdown is the maintained source; committed static HTML needs no JS renderer.
const check = process.argv.includes('--check');
async function output(name, content) {
  const path = new URL(`../docs/${name}.html`, import.meta.url);
  if (check) {
    if (await readFile(path, 'utf8').catch(() => '') !== content) throw new Error(`${name}.html is stale; run pnpm docs:build`);
  } else await writeFile(path, content);
}
for (const [source, id] of markdownPages) {
  const markdown = (await readFile(new URL(`../docs/${source}.md`, import.meta.url), 'utf8'))
    .replace('<!-- layout-catalogue -->', layoutCatalogue())
    .replace('<!-- delivery-profiles -->',profileTable());
  const headings = new Map(), contents = [];
  const parser = new Marked({ renderer: {
    heading({ tokens, depth, text }) {
      const base = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
      const count = headings.get(base) ?? 0; headings.set(base, count + 1);
      const anchor = base + (count ? `-${count}` : '');
      if (depth === 2) contents.push({ id: anchor, title: text.replace(/`/g, '') });
      return `<h${depth} id="${anchor}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    }
  }});
  const html = parser.parse(markdown).replace(/href="([^"]+)"/g, (_, href) => `href="${htmlLink(source === '../CHANGELOG' ? href.replace(/^docs\//, '') : href)}"`)
    .replace(/<table>/g, '<div class="editorial-table" tabindex="0" role="region" aria-label="Reference table"><table>')
    .replace(/<\/table>/g, '</table></div>').replace(/<th(?=[ >])/g, '<th scope="col"');
  const title = markdown.match(/^# (.+)$/m)[1];
  const body = html.replace(/^<h1[^>]*>.*?<\/h1>\n/, '');
  const first = body.indexOf('<h2 ');
  const tableAt = first < 0 ? body.indexOf('<div class="editorial-table"') : -1;
  const split = first < 0 ? (tableAt < 0 ? body.length : tableAt) : first;
  // One normal-flow article; headings do not need separate grid participants.
  await output(id, documentPage({ id, title,
    intro: body.slice(0, split),
    content: body.slice(split),
    contents: contents.length ? contents : [{ id: 'coordinate-table', title: 'Coordinate table' }]
  }).replace('<div class="editorial-table"', '<div id="coordinate-table" class="editorial-table"'));
}
for (const id of ['configurator', 'configurator-0.4', 'configurator-help-0.4', 'geometry-changes', 'legacy-reference']) {
  const path = new URL(`../docs/${id}.html`, import.meta.url);
  const html = await readFile(path, 'utf8');
  if (!html.includes('<!-- site-navigation:start -->')) throw new Error(`${id}.html needs a site navigation slot`);
  let next = html.replace(/<!-- site-navigation:start -->[\s\S]*?<!-- site-navigation:end -->/, siteNavigation(id))
    .replace(/href="([^"]+)"/g, (_, href) => `href="${htmlLink(href)}"`);
  await output(id, next);
}
console.log('Static documentation pages and shared Graph Paper navigation are up to date');
