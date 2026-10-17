# Contributing

This page is for maintainers and coding agents changing the library or documentation. Using Graph Paper in another project does not require its generator or browser-test toolchain; start with [Getting started](getting-started.md) instead.

## Set up the repository

Use Node.js 20+ and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:4173/docs/`. No demo repository or private service is required to maintain core or its configurator.

## Find the source of truth

| Area | Maintained source | Generated output |
| --- | --- | --- |
| Recipes and normalized layouts | `src/manifest/` | Distribution selectors and inspection data |
| Ruler geometry and CSS generation | `src/ruler/` | `css/` builds and geometry records |
| Reference and learning pages | Markdown in `docs/` | Matching static HTML pages |
| Releases | Root `CHANGELOG.md` | Releases HTML page |
| Shared site navigation and page framing | `scripts/docs-template.mjs` | Navigation on every public page |
| Configurator and handwritten site pages | HTML, JS, and documentation CSS in `docs/` | Shared navigation and local core mirrors updated by builds |

Do not fix generated CSS by hand. Do not edit generated HTML instead of its Markdown source. `scripts/docs-template.mjs` lists generated page mappings; `scripts/build-docs.mjs` renders them. The geometry record is generated from its audit rather than authored as ordinary prose.

The class reference's recipe-catalogue marker expands from the geometry/layout manifests during the documentation build. Do not hand-maintain a separate compatibility table.

Site styling uses eight color roles in `docs/docs.css`, shared by `editorial.css` and `workbench.css`. Type roles remain direct stylesheet rules, not another token scale. Source-series and diagnostic colors have independent meanings. Keep branding out of the distributed library CSS; changes to reading typography also need measure, alignment, and reflow checks.

The frozen 0.2.3 stylesheet is the only historical regression baseline. The isolated renderer is a test/reference fixture, not a second active architecture.

## Validate the change

```sh
pnpm build
pnpm check
pnpm docs:check
pnpm size
```

Documentation changes should preserve static reading, local links and anchors, accessible navigation, and narrow-width reflow. Structural CSS changes also require the Chromium, Firefox, and WebKit matrices:

```sh
pnpm browsers:install
pnpm test:browsers
pnpm test:distribution
pnpm pack --dry-run
```

The [validation reference](validation.md) explains coverage, Docker execution, and limits. The [architecture](architecture.md) explains the model. Keep author-facing documentation separate from test-runner and configurator implementation details.
