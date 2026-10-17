export const markdownPages = [
  ['getting-started', 'getting-started'], ['authoring', 'authoring'],
  ['site-authoring', 'site-authoring'],
  ['inside-out-outside-in', 'inside-out-outside-in'],
  ['class-reference', 'class-reference'], ['responsive-design', 'responsive-design'],
  ['alignment', 'alignment'], ['troubleshooting', 'troubleshooting'],
  ['contributing', 'contributing'], ['../CHANGELOG', 'releases'],
  ['architecture', 'architecture'], ['responsive-bands', 'responsive-bands'],
  ['browser-support', 'browser-support'], ['validation', 'validation'], ['geometry-changes', 'geometry-record']
];
export const sitePages = [
  ['index', 'Graph Paper CSS'], ['configurator', 'Configurator'], ['configurator-help', 'Configurator help'],
  ['getting-started', 'Getting started'], ['authoring', 'Authoring compositions'],
  ['site-authoring', 'Composing a site'],
  ['inside-out-outside-in', 'Inside-out and outside-in'],
  ['class-reference', 'Class reference'], ['responsive-design', 'Responsive design'],
  ['alignment', 'Alignment and nesting'], ['troubleshooting', 'Troubleshooting'],
  ['contributing', 'Contributing'], ['releases', 'Releases'],
  ['architecture', 'Architecture'], ['responsive-bands', 'Responsive bands'], ['migration', 'Migration'],
  ['geometry-changes', 'Visual comparisons'], ['geometry-record', 'Coordinate record'],
  ['browser-support', 'Browser support and builds'], ['validation', 'Validation'], ['legacy-reference', '0.2.3 reference']
];
export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function htmlLink(href) {
  if (/^\.\.\/CHANGELOG\.md(?=$|[?#])/.test(href)) return href.replace('../CHANGELOG.md', 'releases.html');
  return href.replace(/(^|\/)([\w-]+)\.md(?=$|[?#])/, (match, prefix, name) => {
    const page = markdownPages.find(([source]) => source === name);
    return page ? `${prefix}${page[1]}.html` : match;
  });
}
export function siteNavigation(current) {
  const link = id => {
    const title = sitePages.find(([page]) => page === id)[1];
    const label = id === 'index' ? '<span class="site-wordmark">Graph Paper</span> <span class="site-wordmark-suffix">CSS</span>' : title;
    return `<a href="./${id}.html"${current === id ? ' aria-current="page"' : ''}>${label}</a>`;
  };
  const group = (title, ids, context = '') => `<div><p class="site-nav-heading">${title}</p><ul>${ids.map(id => `<li>${link(id)}</li>`).join('')}</ul>${context}</div>`;
  return `<!-- site-navigation:start -->
<nav class="gp_field gp_field--wide grid_03 set_03 editorial-nav site-navigation" aria-label="Site navigation">
  <div class="site-identity">${link('index')}<p>Editorial composition on a 64-bit ruler.</p><label class="site-ruler-control"><input class="site-ruler-toggle" type="checkbox">64-bit ruler</label><script type="module" src="./site-ruler.js"></script></div>
  ${group('Learn', ['getting-started', 'authoring', 'site-authoring', 'responsive-design', 'alignment', 'configurator'], current === 'inside-out-outside-in' ? `<p class="site-nav-context">${link(current)}</p>` : '')}
  <div><p class="site-nav-heading">Reference</p><ul>${['class-reference', 'architecture', 'troubleshooting', 'browser-support', 'configurator-help'].map(id => `<li>${link(id)}</li>`).join('')}</ul><p class="site-nav-heading">Project</p><ul>${['migration', 'contributing', 'releases'].map(id => `<li>${link(id)}</li>`).join('')}</ul>${['geometry-changes', 'geometry-record', 'legacy-reference', 'validation', 'responsive-bands'].includes(current) ? `<p class="site-nav-context">${link(current)}</p>` : ''}</div>
</nav>
<!-- site-navigation:end -->`;
}
export function documentPage({ id, title, intro, sections, contents }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Graph Paper CSS</title>
<link rel="stylesheet" href="./assets/graph-paper/main.css"><link rel="stylesheet" href="./assets/graph-paper/bands.css"><link rel="stylesheet" href="./docs.css"><link rel="stylesheet" href="./editorial.css"></head>
<body><a class="site-skip" href="#page-content">Skip to content</a><main class="editorial-page"><div class="gp_canvas editorial-sheet">
${siteNavigation(id)}
<section id="page-content" tabindex="-1" class="gp_field gp_field--wide grid_03c--07 set_03 gp_band--01 editorial-intro" aria-labelledby="page-heading">
  <header><p class="editorial-eyebrow">Graph Paper CSS · Documentation</p><h1 id="page-heading">${escape(title)}</h1>${intro}</header>
  <nav aria-label="On this page"><h2 class="editorial-small-heading">On this page</h2><ul class="editorial-contents">${contents.map(({ id, title }) => `<li><a href="#${id}">${escape(title)}</a></li>`).join('')}</ul><p class="editorial-tool-link"><a href="./configurator.html">Explore in the configurator</a></p></nav>
</section>
${sections}
</div></main></body></html>
`;
}
