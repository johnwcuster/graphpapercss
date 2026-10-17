import { readFile, writeFile } from 'node:fs/promises';
import { Marked } from 'marked';
import { markdownPages, siteNavigation, documentPage, htmlLink } from './docs-template.mjs';
import { recipes, layoutsFor, resolveColumns } from '../src/ruler/geometry.mjs';

function recipeCatalogue() {
  const header = '| Recipe | Wide-field region widths (bits) | Supported named sets and flows |\n| --- | --- | --- |';
  return header + '\n' + Object.values(recipes).map(recipe => {
    const sets = new Map();
    for (const layout of layoutsFor(recipe)) {
      if (!sets.has(layout.set)) sets.set(layout.set, []);
      sets.get(layout.set).push(layout.flow ? `\`${layout.flow}\`` : 'default');
    }
    const combinations = [...sets].map(([set, flows]) => `\`${set}\`: ${flows.join(', ')}`).join('<br>');
    const widths = resolveColumns(recipe, 'wide').map(column => column.end - column.start).join(' : ');
    return `| \`${recipe.id}\` | ${widths} | ${combinations} |`;
  }).join('\n');
}

// Markdown is the maintained source; committed static HTML needs no JS renderer.
const check = process.argv.includes('--check');
const readingClasses = 'gp_field gp_field--wide editorial-prose grid_03c--07 set_03 gp_band--01';
function readingSection(content) {
  return `<section class="${readingClasses}"><div>\n${content.trim()}\n</div></section>`;
}
function wideReference(content) {
  const start = content.indexOf('<div class="editorial-table"');
  const end = content.indexOf('</table></div>', start) + '</table></div>'.length;
  if (start < 0) return readingSection(content);
  return [content.slice(0, start).trim() && readingSection(content.slice(0, start)),
    `<section class="gp_field gp_field--wide editorial-prose editorial-wide-data" aria-label="Wide reference data"><div>${content.slice(start, end)}</div></section>`,
    content.slice(end).trim() && readingSection(content.slice(end))].filter(Boolean).join('\n');
}
async function output(name, content) {
  const path = new URL(`../docs/${name}.html`, import.meta.url);
  if (check) {
    if (await readFile(path, 'utf8').catch(() => '') !== content) throw new Error(`${name}.html is stale; run pnpm docs:build`);
  } else await writeFile(path, content);
}
for (const [source, id] of markdownPages) {
  const markdown = (await readFile(new URL(`../docs/${source}.md`, import.meta.url), 'utf8'))
    .replace('<!-- recipe-catalogue -->', recipeCatalogue());
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
  const first = body.indexOf('<h2 '), intro = first < 0 ? body : body.slice(0, first);
  const chunks = first < 0 ? [] : body.slice(first).split(/(?=<h2 )/).filter(Boolean);
  // One occupied set_03 position intentionally anchors reading in the central
  // region. Empty supporting positions are whitespace, not placeholder nodes.
  const sections = chunks.map(chunk => id === 'class-reference' && chunk.includes('id="recipe-catalogue"')
    ? wideReference(chunk) : readingSection(chunk)).join('\n');
  // A coordinate table is the body of this short reference, not introductory prose.
  const tableAt = first < 0 ? intro.indexOf('<div class="editorial-table"') : -1;
  await output(id, documentPage({ id, title,
    intro: tableAt < 0 ? intro : intro.slice(0, tableAt),
    sections: tableAt < 0 ? sections : wideReference(intro.slice(tableAt)),
    contents: contents.length ? contents : [{ id: 'coordinate-table', title: 'Coordinate table' }]
  }).replace('<div class="editorial-table"', '<div id="coordinate-table" class="editorial-table"'));
}
for (const id of ['index', 'configurator', 'configurator-help', 'migration', 'geometry-changes', 'legacy-reference']) {
  const path = new URL(`../docs/${id}.html`, import.meta.url);
  const html = await readFile(path, 'utf8');
  if (!html.includes('<!-- site-navigation:start -->')) throw new Error(`${id}.html needs a site navigation slot`);
  let next = html.replace(/<!-- site-navigation:start -->[\s\S]*?<!-- site-navigation:end -->/, siteNavigation(id))
    .replace(/href="([^"]+)"/g, (_, href) => `href="${htmlLink(href)}"`);
  if (!next.includes('href="./assets/graph-paper/bands.css"')) next = next.replace('href="./assets/graph-paper/main.css">', 'href="./assets/graph-paper/main.css"><link rel="stylesheet" href="./assets/graph-paper/bands.css">');
  await output(id, next);
}
console.log('Static documentation pages and shared Graph Paper navigation are up to date');
