# Validation

This repository validates library behavior and its canonical configurator.

## Local checks

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm docs:check
pnpm size
pnpm pack --dry-run
```

The deterministic build regenerates normalized layouts, accepted geometry
records, CSS distributions, and the configurator's local runtime mirrors.
Documentation checks verify local HTML and Markdown links, module imports,
and freshness of those runtime assets.

Node tests cover ruler closure, all supported recipe/set/flow placements,
source-order occupancy, discovery metadata, the frozen 0.2.3 baseline, exact
emission coverage, reproducible distribution, and band threshold arithmetic.
Emission tests cover all 1,039 supported named combinations. The generator
shares expanded and compact placement declarations while preserving selector
specificity and placement; browser tests check host cascade overrides.
Core and optional bands retain separate gzip ceilings of 12KB and 8KB.
Current exact sizes are reported by `pnpm size`.

## Browser structure

```sh
pnpm test:browsers
pnpm test:distribution
```

The runner tests Chromium, Firefox, and WebKit. The core matrix has 16,710
combinations per build: all recipes/fields, named flows, grid-only continuation,
source order, subgrid, nested canvases, overlays, rules, and explicit placement.
The optional band matrix checks 64,230 boundary cases plus 2,070 minified cases
per engine, including independent nested-canvas state and enlarged root text.
The configurator is checked against actual generated CSS, discovery controls,
item-count warnings, band readouts, and legacy comparison.

Results are written to ignored `test-results/browsers.json`. Structural correctness does not
constitute a comprehensive accessibility audit or a guarantee of design quality.

The migration audit remains 204 exact matches and twelve explicitly accepted
whole-bit adjustments. See [the coordinate record](geometry-changes.md).
