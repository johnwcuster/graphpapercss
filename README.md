# Graph Paper CSS

A framework-agnostic CSS library for editorial spatial composition on a 64-bit ruler.

Version 0.4.1 updates the documentation and configurator. Its CSS builds and
authoring API are unchanged from the [0.4.0 preview](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.0/css/main.min.css),
including grid-only authoring defaults and experimental response bands.
Examples intentionally remain pinned to 0.4.0 CSS and also work with 0.4.1.
The architecture remains a preview of 1.0; the previous legacy baseline is 0.2.3.
Pin exact releases in production.

## Use

Use the pinned 0.4.0 CSS below, or serve `css/main.min.css` from the 0.4.1 checkout:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.0/css/main.min.css">
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

## Documentation

- Start: [Getting started](docs/getting-started.md) and [visual configurator](docs/configurator.html).
- Learn: [Authoring compositions](docs/authoring.md), [responsive design](docs/responsive-design.md), and [alignment/nesting](docs/alignment.md).
- Compose a whole page: [Composing a site](docs/site-authoring.md), including reading tracks, measures, secondary content, and purposeful wider sections.
- Look up: [Class reference](docs/class-reference.md), [troubleshooting](docs/troubleshooting.md), and [browser support/builds](docs/browser-support.md).
- Understand: [Architecture](docs/architecture.md).
- Upgrade: [Migration from 0.2.3](docs/migration.html).
- Maintain: [Contributing](docs/contributing.md), [validation](docs/validation.md), and [release notes](CHANGELOG.md).

Coding agents can start with the [implementation checklist](docs/authoring.md#implementation-checklist)
and use the same class reference as human authors. The static docs describe the
contract without requiring interaction with the configurator. Serve `docs/` for
the HTML site; Markdown links here are maintained, repository-readable sources.

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
Its floating workbench offers docking, independent visual aids, and copyable
markup. Use Alt+Shift+G outside form fields to hide or restore the controls.
The workbench is optional documentation tooling, not part of core CSS or a
published on-page inspector script.

Reference pages are published as static HTML. Maintain their Markdown sources in
`docs/` and run `pnpm docs:build` (also included in `pnpm build`). Geometry records
remain generated from the library audit. Shared site navigation is maintained in
`scripts/docs-template.mjs`; `pnpm docs:check` verifies generated pages, navigation,
local links, and anchors. The Markdown parser is a build-only dependency; reading
the documentation requires no client-side Markdown renderer.

```sh
pnpm browsers:install
pnpm test:browsers
pnpm test:distribution
pnpm pack --dry-run
```

See [Contributing](docs/contributing.md) and [validation](docs/validation.md).

## Contributing

Recipe and responsive inputs live in `src/manifest/`; ruler geometry and CSS
generation live in `src/ruler/`. Edit these sources rather than generated CSS,
then run the build and validation commands above. Structural changes should also
pass the Chromium, Firefox, and WebKit distribution matrix.

Graph Paper CSS is [MIT licensed](LICENSE).
