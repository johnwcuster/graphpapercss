# Release notes

## Unreleased — authoring defaults and response bands

- Contributor tooling uses pnpm 12.6.0 with a frozen lockfile.

- Experimental `gp_band--01` / `02` / `03` scale with provisional 12/16/20rem
  minimum slot widths, geometry-derived transition thresholds, optional
  `bands.css` / minified distribution, and live configurator controls.
  Unbanded defaults and the published 0.3.0 artifact are unchanged.

- Factored CSS generation shares expanded and compact placement declarations
  without changing specificity, geometry, or the authoring API.
- Exact named-placement emission coverage and browser cascade-precedence tests.

- Updated API and migration documentation, with a canonical configurator.
- Grid-only sequential macro placement, equal compact pairs, and stacked source
  order; isolated placement variables for nested named compositions.
- Composition descriptions, discovery filters, curated starting points, actual
  item counts, and non-blocking mismatch warnings in the sole configurator.

## 0.3.0 — public preview of the upcoming 1.0 architecture

- Canonical 64-bit ruler with canvas-relative responsive composition.
- Five fields: full 64, neat 60, thin 59, wide 58, ruled 56 bits.
- All 72 released grid IDs, normalized sets/flows, row relationships, known
  aliases, and logical source order preserved.
- Equal five/six-column recipes and a 5:3 two-column recipe.
- Twelve intentional whole-bit geometry adjustments from 0.2.3, explicitly
  recorded in [geometry changes](docs/geometry-changes.md).
- Semantic subgrid, nested-canvas rebase, and shared-ruler overlays.
- Integer rule centers with responsive ownership and boundary suppression.
- Host-controlled typography, component styling, and vertical spacing.
- Ordinary, minified, and layered core builds; alternative 0.2.3 compatibility.
- Deterministic generation and three-engine structural regression coverage.

Modern markup requires a canvas and field. See [migration](docs/migration.html).

## 0.2.3 — previous released version

The released stylesheet remains pinned at
<https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.2.3/css/main.css> and is
retained byte-for-byte at `css/legacy/main.css` for migration and regression
comparisons.
