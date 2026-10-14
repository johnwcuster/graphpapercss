# Release notes

## 1.0.0-rc.0 — unpublished release candidate

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
retained byte-for-byte at `css/legacy/main.css`. Local release preparation does
not change its Git tag or publish a new version.
