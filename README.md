# Graph Paper CSS

A small, framework-agnostic CSS library for editorial spatial composition.
A 64-bit ruler connects the page: canvas, field, grid, set, and flow arrange
content; subgrid preserves alignment through semantic nesting.

The 1.0 release candidate is prepared locally but not published. The previous
released version is [0.2.3](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.2.3/css/main.css).
Pin exact releases for production rather than using `@latest`.

## Quick start

Copy `css/main.min.css` into your project:

```html
<link rel="stylesheet" href="/css/main.min.css">
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03a--01 set_06">
    <article>First story</article>
    <article>Second story</article>
    <article>Third story</article>
    <article>Fourth story</article>
    <article>Fifth story</article>
    <article>Sixth story</article>
  </section>
</div>
```

No JavaScript, npm dependency, framework, or consumer build step is required.
Your project owns typography, colors, components, and vertical spacing. Keep
logical source order even when a flow changes visual prominence.

Fields are full 64, neat 60, thin 59, wide 58, and ruled 56 bits. All 72 released
grid IDs are supported, with equal five/six columns and the 5:3 `grid_02a--07`
added in 1.0. Layouts expand at a canvas width of 60rem, become compact at 30rem,
and stack in source order below 30rem.

See [architecture](docs/architecture.md), [migration from 0.2.3](docs/migration.html),
[geometry changes](docs/geometry-changes.md), [browser support](docs/browser-support.md),
and [release notes](CHANGELOG.md).

## Builds

| Files | Purpose |
| --- | --- |
| `css/main.css`, `main.min.css` | Modern canvas-native core |
| `css/main.layer.css`, `main.layer.min.css` | Core inside `@layer graph-paper` |
| `css/compat.css`, `compat.min.css` | Alternative 0.2.3 standalone profile |
| `css/legacy/main.css`, `main.min.css` | Released 0.2.3 reference and generated minification |

Choose a modern build or the legacy profile per document. Compatibility keeps
0.2.3 globals and viewport behavior; it is not an additive modern-core shim.
The canonical historical source is `css/legacy/main.css`, verified against the
released CDN file. The compatibility files are generated from that one source.

## Development

Contributor tooling requires Node.js 20+. Dependencies are development-only.

```sh
npm ci
npm run build
npm run check
npm run size
npm run dev
```

Open <http://127.0.0.1:4173/docs/configurator.html>, the sole visual explorer.
It renders shipping CSS, filters flows, shows ruler/field/source-order guides,
persists URL selections, and produces markup. It also demonstrates subgrid,
nested canvases, shared-ruler overlays, and direct comparisons with 0.2.3.

```sh
npm run browsers:install
npm run test:browsers
npm run test:distribution
npm pack --dry-run
```

The browser suite checks current structure in Chromium, Firefox, and WebKit;
distribution checks also replay legacy regressions. See
[browser support](docs/browser-support.md) for the isolated Docker runner and
[validation](docs/validation.md) for recorded results. Build scripts do not
commit, publish, or create release tags. Git history records implementation
history; the source tree describes current 1.0 and its 0.2.3 migration baseline.
