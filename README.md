# Graph Paper CSS

A framework-agnostic CSS library for editorial spatial composition on a 64-bit ruler.

The published preview is [0.3.0](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.3.0/css/main.min.css).
This checkout contains unreleased authoring improvements and experimental response bands.
The previous legacy baseline is 0.2.3. Examples in this repository describe the
development build unless noted otherwise. Pin exact releases in production.

## Use

Copy `css/main.min.css` into your project:

```html
<link rel="stylesheet" href="/css/main.min.css">
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03">
    <article>First item</article>
    <article>Second item</article>
    <article>Third item</article>
  </section>
</div>
```

Canvas establishes the ruler and responsive context; a field selects its usable
span. Grid/set/flow arrange direct children. Subgrid continues inherited tracks;
a nested canvas establishes independent coordinates. Your project owns typography,
colors, components, and vertical spacing. No runtime JavaScript is required.

[Architecture](docs/architecture.md) · [Configurator](docs/configurator.html) ·
[Response bands](docs/responsive-bands.md) · [Migration](docs/migration.html) ·
[Accepted geometry changes](docs/geometry-changes.md)

## Builds

| Files | Purpose |
| --- | --- |
| `css/main.css`, `main.min.css` | Modern core |
| `css/main.layer.css`, `main.layer.min.css` | Core in the graph-paper cascade layer |
| `css/bands.css`, `bands.min.css` | Optional experimental minimum-slot response bands |
| `css/compat.css`, `compat.min.css` | Alternative 0.2.3 standalone profile |
| `css/legacy/main.css`, `main.min.css` | Frozen 0.2.3 baseline and its minification |

Do not combine modern core and the legacy alternative on one document.
Load bands after modern core when using `gp_band--01`–`03`.

## Develop

Use Node.js 20+ and pnpm 12.6.0, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm docs:check
pnpm size
pnpm dev
```

Open http://127.0.0.1:4173/docs/ for basic documentation or
http://127.0.0.1:4173/docs/configurator.html for the canonical configurator.

```sh
pnpm browsers:install
pnpm test:browsers
pnpm test:distribution
pnpm pack --dry-run
```

See [browser support](docs/browser-support.md) and [validation](docs/validation.md).

## Contributing

Recipe and responsive inputs live in `src/manifest/`; ruler geometry and CSS
generation live in `src/ruler/`. Edit these sources rather than generated CSS,
then run the build and validation commands above. Structural changes should also
pass the Chromium, Firefox, and WebKit distribution matrix.

Graph Paper CSS is [MIT licensed](LICENSE).
