# Graph Paper CSS

Graph Paper provides section-level composition tools for building site-level spatial continuity, using a canonical 64-bit ruler.

**Version 0.5.2** uses the explicit-layout API. Projects using the 0.4 class vocabulary should follow the [migration guide](docs/migration.md). Pin an exact release in production.

## Use Graph Paper

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/main.min.css">
<section class="gp_ruler gp_layout--stack
                gp_md--two-3-2 gp_lg--three-1-2-1
                gp_spacing--neat gp_vertical-spacing--1">
  <article class="gp_pad">First item</article>
  <article class="gp_pad">Second item</article>
  <article class="gp_pad">Third item</article>
</section>
```

The ruler establishes coordinates. Layouts select physical proportions and item arrangements. Viewport prefixes explicitly select changes: the example stacks initially, uses two regions from 48rem, and three from 64rem. Spacing, padding, allocation and traversal can change independently. No runtime JavaScript is required; your project owns typography, colors, components and image treatment.

Start with [Getting started](docs/getting-started.md), explore the [configurator](docs/configurator.html), and look up decisions in the [Class reference](docs/class-reference.md). The learning guides and site layouts use the new core. Previous API material is explicitly labeled as legacy; see [Migration](docs/migration.md). Maintainers can use the detailed [composition contracts](src/core/README.md).

The configurator can also build a standalone stylesheet for your responsive sequence and download readable or minified CSS. Copy the layout HTML beside the displayed markup.

## Builds

| Files | Purpose |
| --- | --- |
| `css/main.css`, `main.min.css` | Current 0.5 core |
| `css/main.layer.css`, `main.layer.min.css` | Same core in the `graph-paper` cascade layer |
| `css/profiles/repeating.css`, `repeating.min.css` | Standalone Stack and Peers 2–6 |
| `css/profiles/two-three.css`, `two-three.min.css` | Standalone Stack, Peers 2–6, Two and Three compositions |
| `css/legacy/0.4/main*.css` | Byte-preserved 0.4 reference, including layered forms |
| `css/legacy/0.4/bands*.css` | Response bands for the 0.4 reference only |
| `css/legacy/main.css`, `main.min.css` | Frozen 0.2.3 migration/regression baseline |

Choose one core stylesheet. Do not combine versions or add legacy bands to the new core. The old `grid_*`, `set_*`, `flow_*` and `gp_band--*` API is available only with its matching legacy build or a pinned older release. The new core has no compatibility aliases for those classes.

The smaller predefined builds first ship in 0.5.2. Each includes all viewport steps, gutter modes, and applicable controls; load one build instead of the full library. The configurator checks whether it covers your sequence and copies a pinned CDN tag. See [build capabilities and sizes](docs/browser-support.md#predefined-cdn-profiles). Custom downloads remain available for narrower selections.

The optional portable inspector still edits the **0.4 API only**. Its package entry is `graphpapercss/legacy/0.4/inspector`; it is not a 0.5 editor. The standalone configurator supports the current API. Neither tool is required to use the CSS.

## Develop

Use Node.js 20+ and pnpm 12.6.0, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm docs:check
pnpm test:package
pnpm size
pnpm dev
```

Open `http://127.0.0.1:4173/docs/configurator.html`. `pnpm build` reproducibly generates core distributions, the versioned reference, maintained regression fixtures and static documentation assets. `pnpm check` verifies generated files without writing and runs the unit suite.

- [Test guide](tests/README.md): structural, utility, package, configurator and runtime checks.
- [Release preparation](maintainers/release.md): distribution, documentation, browser qualification and metadata gates.
- [Composition contracts](src/core/README.md): allocation, exact counts, spacing, continuation/rebasing and fallback.
- [Released reference](docs/configurator-0.4.html): exploration of the previous API.
- [Release notes](CHANGELOG.md): published releases.

Current compilation lives in `src/core/`. The explicitly versioned implementation in `src/legacy/0.4/` supports regression, documentation migration and the legacy inspector. Edit maintained source rather than generated CSS or mirrored docs modules. Test reports and package archives are generated outside the public distribution.

## License

Graph Paper CSS is [MIT licensed](LICENSE).
