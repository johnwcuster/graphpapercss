export const markdownPages = [
  ['index','index'], ['migration','migration'],
  ['configurator-help','configurator-help'],
  ['getting-started', 'getting-started'], ['authoring', 'authoring'],
  ['site-authoring', 'site-authoring'],
  ['inside-out-outside-in', 'inside-out-outside-in'],
  ['class-reference', 'class-reference'], ['responsive-design', 'responsive-design'],
  ['alignment', 'alignment'], ['edges-and-spacing', 'edges-and-spacing'], ['troubleshooting', 'troubleshooting'],
  ['contributing', 'contributing'], ['../CHANGELOG', 'releases'],
  ['architecture', 'architecture'], ['responsive-bands', 'responsive-bands'],
  ['browser-support', 'browser-support'], ['validation', 'validation'], ['geometry-changes', 'geometry-record']
];
export const sitePages = [
  ['index', 'Graph Paper CSS'], ['configurator', 'Configurator'], ['configurator-help', 'Configurator help'],
  ['configurator-0.4','0.4 configurator'], ['configurator-help-0.4','0.4 configurator help'],
  ['getting-started', 'Getting started'], ['authoring', 'Authoring compositions'],
  ['site-authoring', 'Composing a site'],
  ['inside-out-outside-in', 'Inside-out and outside-in'],
  ['class-reference', 'Class reference'], ['responsive-design', 'Responsive design'],
  ['alignment', 'Alignment and nesting'], ['edges-and-spacing', 'Edges and mixed spacing'], ['troubleshooting', 'Troubleshooting'],
  ['contributing', 'Contributing'], ['releases', 'Releases'],
  ['architecture', 'Architecture'], ['responsive-bands', 'Legacy 0.4 response bands'], ['migration', 'Migration'],
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
export const legacyShellPages = ['configurator-0.4','configurator-help-0.4','geometry-changes'];
export function siteNavigation(current) {
  const pad = legacyShellPages.includes(current) ? '' : ' class="gp_pad"';
  const geometry = legacyShellPages.includes(current) ? 'gp_field gp_field--wide grid_03 set_03' : 'gp_layout--stack gp_sm--two-1-2 gp_lg--three-1-2-1 gp_spacing--wide';
  const link = id => {
    const title = sitePages.find(([page]) => page === id)[1];
    const label = id === 'index' ? '<span class="site-wordmark">Graph Paper</span> <span class="site-wordmark-suffix">CSS</span>' : title;
    return `<a href="./${id}.html"${current === id ? ' aria-current="page"' : ''}>${label}</a>`;
  };
  const group = (title, ids, context = '') => `<div${pad}><p class="site-nav-heading">${title}</p><ul>${ids.map(id => `<li>${link(id)}</li>`).join('\n')}</ul>${context}</div>`;
  return `<!-- site-navigation:start -->
<nav class="${geometry} editorial-nav site-navigation" aria-label="Site navigation">
  <div class="site-identity${pad ? ' gp_pad' : ''}">${link('index')}<p>Editorial composition on a 64-bit ruler.</p><label class="site-ruler-control"><input class="site-ruler-toggle" type="checkbox">64-bit ruler</label><script type="module" src="./site-ruler.js"></script></div>
  ${group('Learn', ['getting-started', 'authoring', 'site-authoring', 'responsive-design', 'alignment', 'edges-and-spacing', 'configurator'], current === 'inside-out-outside-in' ? `<p class="site-nav-context">${link(current)}</p>` : '')}
  <div${pad}><p class="site-nav-heading">Reference</p><ul>${['class-reference', 'architecture', 'troubleshooting', 'browser-support', 'configurator-help'].map(id => `<li>${link(id)}</li>`).join('\n')}</ul><p class="site-nav-heading">Project</p><ul>${['migration', 'contributing', 'releases'].map(id => `<li>${link(id)}</li>`).join('\n')}</ul>${['geometry-changes', 'geometry-record', 'legacy-reference', 'validation', 'responsive-bands', 'configurator-0.4', 'configurator-help-0.4'].includes(current) ? `<p class="site-nav-context">${link(current)}</p>` : ''}</div>
</nav>
<!-- site-navigation:end -->`;
}
export function documentPage({ id, title, intro, content, contents }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Graph Paper CSS</title>
<link rel="stylesheet" href="./assets/graph-paper/main.css"><link rel="stylesheet" href="./docs.css"><link rel="stylesheet" href="./editorial.css"></head>
<body><a class="site-skip" href="#page-content">Skip to content</a><main class="gp_ruler editorial-sheet editorial-page documentation-page">
${siteNavigation(id)}
<div class="gp_layout--stack gp_lg--two-1-3 gp_spacing--wide editorial-field${id === 'class-reference' ? ' editorial-reference-layout' : ''}">
  <nav class="document-contents" aria-label="On this page"><h2 class="editorial-small-heading">On this page</h2><ul class="editorial-contents">${contents.map(({ id, title }) => `<li><a href="#${id}">${escape(title)}</a></li>`).join('\n')}</ul><p class="editorial-tool-link"><a href="./configurator.html">Explore in the configurator</a></p></nav>
<article id="page-content" tabindex="-1" class="editorial-document${id === 'class-reference' ? ' editorial-reference' : ''}" aria-labelledby="page-heading">
  <header><p class="editorial-eyebrow">Graph Paper CSS · Documentation</p><h1 id="page-heading">${escape(title)}</h1>${intro}</header>
${content}
</article>
</div>
</main></body></html>
`;
}
