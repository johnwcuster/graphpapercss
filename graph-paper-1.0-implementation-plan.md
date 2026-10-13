# Graph Paper CSS 1.0 — Implementation Plan

**Repository:** `johnwcuster/graphpapercss`  
**Primary audience:** Codex / coding agent working directly in the repository  
**Goal:** Evolve Graph Paper into a maintainable 1.0 while preserving the original idea: a tiny, framework-agnostic CSS library for editorial spatial composition.

---

## Implementation status — September 22, 2026

The geometry prototype has completed Phases 0–8. Phase 9 is the next active
milestone. The legacy distribution remains untouched while the 1.0 work lives
in the generated `css/next.css` prototype.

At the time of this update, the implementation work is present in the working
tree but has not been committed.

### Phase summary

| Phase | Status | Result |
| --- | --- | --- |
| 0 — Baseline and inventory | Complete | Frozen legacy CSS, machine-readable inventory, legacy gallery/configurator, and browser-captured layout measurements are in place. |
| 1 — Geometry proof | Complete | The 64-bit ruler and real 20-/24-track lattices reproduce representative legacy geometry. |
| 2 — Manifest and generator | Complete | All 72 concrete grid recipes are manifest-driven and emitted deterministically. |
| 3 — Sets and flows | Complete | 416 captured legacy configurations were normalized into 90 layout recipes covering 161 family/set/flow combinations. |
| 4 — Responsive states | Complete, with debug helpers deferred | Expanded, compact, and stacked layouts respond to canvas size; standalone markup retains a viewport-based compatibility path. Explicit `gp_state--*` force-state classes remain optional future work. |
| 5 — Configurator MVP | Functionally complete | The configurator uses production CSS, filters compatible flows, previews widths and source order, persists URL state, and emits markup. Flow choices are visual; the primary grid control remains a textual selector, with visual grid browsing provided by the separate catalog. |
| 6 — Canvas rhythm | Complete | Wide, thin, and neat canvas rhythms, ruler/lattice/macro guides, shared-canvas examples, and explicit nested-canvas rebasing are implemented. |
| 7 — Subgrid | Complete | `gp_subgrid`, semantic editorial examples, and 20-/24-track browser checks are implemented. |
| 8 — Rules and micro-alignment | Complete | Explicit gutter-centered rule markers and a deliberately small set of evidenced escape hatches replace the legacy border matrix. |
| 9 — Distribution | Not started | Production paths, minified/layered builds, legacy extras, migration notes, and release packaging remain. |
| 10 — Typography experiment | Not started; optional | Fluid type and typographic-rhythm experiments remain isolated from the 1.0 release path. |

### Current measured coverage

- 72 concrete legacy grid recipes represented in `src/manifest/grids.mjs`.
- 416 frozen expanded-state browser captures used as normalization input.
- 90 normalized layout recipes.
- 161 supported grid-family/set/flow combinations.
- 1,018 expanded layout/grid combinations checked in the browser.
- 161 compact family/layout combinations checked in the browser.
- 161 standalone compatibility combinations checked in the browser.
- 60 focused browser geometry assertions, including rhythm, nesting,
  subgrid, rules, advanced placement, and optical correction.
- 7 Node test groups covering arithmetic, manifests, legacy coverage,
  deterministic generation, selector scope, and the gzip budget.
- Generated prototype size: 243,942 bytes raw / 10,878 bytes gzip.
- Enforced prototype ceiling: less than 12 KB gzip.
- Frozen legacy size: 39,291 bytes raw / 4,795 bytes gzip.

The prototype is currently 6.21× the legacy raw size and 2.27× its gzip size.
The readable generated file deliberately contains both the canvas-native core
and a standalone legacy-compatibility path. Minification and distribution
splitting have not yet been performed.

### Implemented repository shape

The working implementation uses fewer source files than the speculative target
structure where combining responsibilities remains clearer:

```text
css/
├── main.css                         # unchanged legacy production file
└── next.css                         # generated 1.0 prototype

src/
├── emit/prototype.mjs
├── geometry/{ruler,rhythms}.mjs
├── manifest/{compact,compatibility,grids,layouts,responsive,sets}.mjs
└── validate.mjs

scripts/
├── build-layouts.mjs
├── build.mjs
├── inventory.mjs
├── serve.mjs
├── size-report.mjs
└── validate.mjs

docs/
├── configurator.{html,js}
├── grids.{html,js}
├── canvas.{html,js}
├── subgrid.html
├── treatments.html
├── docs.css
└── legacy-*.md

tests/
├── browser-geometry.{html,js}
├── capture-legacy-layouts.{html,js}
├── geometry.test.mjs
├── legacy-configurator.*
├── legacy-gallery.*
├── legacy-preview.*
└── fixtures/
```

### Implementation decisions made so far

#### Keep the migration parallel and reversible

`css/main.css` remains the production/legacy stylesheet. The new build writes
only to `css/next.css`. The frozen source in
`tests/fixtures/legacy-main.css` is the behavioral reference, and validation
ties generated manifests to its recorded hash and geometry.

This avoids turning prototype work into an accidental distribution change and
allows old and new behavior to be compared at identical selections.

#### Use real lattice tracks rather than legacy width tables

Every grid is emitted as a 20- or 24-track CSS Grid. Macro-column boundaries
are represented as line numbers derived from manifest spans. This removed the
hand-maintained `--w-N-20` / `--w-N-24` tables from the new source while
preserving the intentional legacy geometry.

The three rhythm regimes close mathematically on one 64-bit measure:

| Rhythm | Start/end padding | Gap | 20-track width | 24-track width |
| --- | --- | --- | --- | --- | --- |
| Wide | 3 / 3 bits | 2 bits | 1 bit | 0.5 bit |
| Thin | 2 / 3 bits | 1 bit | 2 bits | 1.5 bits |
| Neat | 2 / 2 bits | 0 | 3 bits | 2.5 bits |

The documentation overlays intentionally show two related coordinate systems:
the brown ruler marks whole bits, while blue lattice starts may fall at
half-bit positions on a 24-track grid. Closure on 64 bits does not imply that
every internal lattice line coincides with a whole-bit ruler line.

#### Make the canvas the responsive coordinate system

`gp_canvas` establishes a named inline-size container and rebases `--gp-bit`
and `--gp-cell` to `cqi` units when supported. Container queries select:

- stacked below 30rem,
- compact from 30rem through 59.999rem,
- expanded at 60rem and above.

The threshold values live in `src/manifest/responsive.mjs` and are build-time
inputs. A standalone media-query path supports existing markup that has not
adopted `gp_canvas`. Its selectors explicitly exclude descendants of a canvas
so viewport and container behavior cannot both apply to the same grid.

Each nested `gp_canvas` starts a new size-query coordinate system and resets to
the wide rhythm. Thin or neat must be requested again on the nested canvas.
This makes rebasing visible and intentional.

#### Preserve source order while normalizing legacy flow behavior

The browser-captured legacy cascade, rather than selector intent inferred by
inspection, is the source for expanded placement behavior. Normalization groups
identical placement results and records family-specific behavior only where it
is genuinely different.

Known three-item aliases remain explicit compatibility choices—for example,
some `grid_02` flows produce the same placement because three items and two
columns have a limited number of arrangements. The configurator labels these
aliases instead of pretending that each legacy ID is visually unique.

Responsive placement changes only CSS Grid coordinates. DOM order is never
changed, and stacked mode returns to normal source-order block flow.

#### Prefer generated custom properties over repeated placement selectors

Layout selectors assign per-item placement variables, and a small set of
consumer rules applies those variables to direct children. Identical expanded
placements are grouped during emission. This retains declarative manifests and
readable generated CSS while substantially reducing repeated selector bodies.

No generated core selector uses legacy class-substring matching, and the new
CSS contains no `!important` declarations.

#### Put rhythm on canvases, not individual grid recipes

Wide is the default and requires only `gp_canvas`. Thin and neat use
`gp_rhythm--thin` and `gp_rhythm--neat` on the canvas. Grid recipes consume
the resulting padding and gap variables without knowing which rhythm produced
them.

Guidance adopted for documentation:

> Use one page canvas and one rhythm by default. Add a nested canvas only when
> a region genuinely needs independent coordinates and responsive behavior.

#### Use subgrid for continuity, nested canvas for independence

`gp_subgrid` is intentionally only:

```css
.gp_subgrid {
  display: grid;
  grid-template-columns: subgrid;
}
```

It lets a semantic wrapper's descendants continue on the tracks occupied by
that wrapper. It does not establish a new ruler, rhythm, or responsive state.
Examples cover both a 12-track span within a 20-track parent and a 10-track
span within a 24-track parent.

#### Replace automatic border inference with explicit gutter rules

The legacy stylesheet attempted to infer rule placement with a large
grid/set/flow/`nth-child()` matrix and repaired collisions with `!important`.
The 1.0 treatment makes ownership explicit:

- `gp_treatment--rule` calculates half of the active `--gp-gap`;
- `gp_rule--start` places a marker half a gap before an item;
- `gp_rule--end` places a marker half a gap after an item;
- the marker is an absolutely positioned pseudo-element and does not change
  the item's padding, width, or grid placement;
- `--gp-rule-width` and `--gp-rule-color` remain author-overridable.

The intended visual result is a vertical line centered in the gutter between
columns. With wide rhythm the marker is one bit from either item; with thin it
is half a bit from either item; with neat it sits on the zero-gap boundary.
Authors explicitly identify the item edge that owns a rule instead of relying
on a new combinatorial selector matrix.

#### Keep escape hatches intentionally incomplete

Only demonstrated needs were added:

- `gp_inset--bit` adds one bit of inline content inset;
- `gp_place` consumes `--gp-column-start`, `--gp-column-end`,
  `--gp-row-start`, and `--gp-row-end` for a rare recipe opt-out;
- `gp_optical` consumes font-relative `--gp-optical-x` and
  `--gp-optical-y` translations without changing layout geometry.

`gp_place.gp_place` deliberately matches the specificity of generated
set-placement consumers, allowing the explicit override to win without
`!important`. No cell/bleed/alignment matrix or per-line utility family was
added. Future utilities require a real editorial example.

#### Keep documentation coupled to production CSS

The configurator and documentation examples load `css/next.css`; JavaScript
selects classes and metadata but does not calculate production geometry.

The configurator currently provides:

- set, grid, rhythm, treatment, and compatible-flow controls;
- flow thumbnails rendered with actual generated CSS;
- a 280–1200px canvas-width control and live responsive-state label;
- 64-bit, lattice, macro-column, and source-order overlays;
- URL persistence for exact selections;
- copyable markup;
- a reciprocal link to the frozen legacy configurator.

The standalone grid catalog visually covers all 72 grid recipes. Moving those
visual grid choices directly into the primary configurator remains a possible
usability refinement, not a geometry blocker.

#### Treat size as a budget, not raw parity

`npm run size` reports raw and gzip sizes for the legacy file, prototype core,
standalone compatibility path, and combined prototype. The test suite enforces
a combined gzip ceiling of 12 KB.

The generated development artifact favors auditability and includes both
modern and compatibility behavior. Phase 9 will determine final minified and
possibly split distribution costs. Raw comparison to the hand-compressed
legacy cascade is therefore tracked but is not the sole acceptance criterion.

### Remaining work before a 1.0 release

#### Phase 9 — Required distribution work

- Decide when `css/next.css` replaces the current `css/main.css` and preserve a
  recoverable legacy artifact.
- Remove or extract legacy global typography, print rules, and unrelated image
  helpers from the shipping core. The prototype is already scoped; the
  production path has not yet changed.
- Generate unlayered and layered builds.
- Generate minified builds without making consumers run a build step.
- Preserve the existing `css/main.css` and `css/main.min.css` distribution
  paths at release time.
- Decide whether canvas-native and standalone compatibility rules ship
  together or as separately consumable builds.
- Add migration notes for rhythm modifiers, especially the old combined
  `--rule` behavior versus separate 1.0 rhythm and rule treatment classes.
- Document supported browsers for container queries, `cqi`, and subgrid.
- Add release notes, package metadata, CDN guidance, and a concise quick start.
- Re-run size analysis on minified distribution artifacts.

#### Validation and documentation still worth considering

- Add explicit `gp_state--expanded`, `gp_state--compact`, and
  `gp_state--stacked` debugging/fixture helpers if they prove useful.
- Decide whether the configurator should replace its grid `<select>` with
  thumbnail selection or link more prominently to the existing grid catalog.
- Add automated multi-browser screenshot regression testing if the maintenance
  cost is justified; current visual review is manual and focused geometry is
  asserted programmatically in Chrome.
- Verify the progressive-enhancement behavior against the final browser
  support matrix rather than assuming Chromium results generalize everywhere.

#### Phase 10 — Optional experiment

- Prototype fluid type tokens and modular-scale ratios separately from core.
- Test `lh`, `cap`, `em`, and `cqi` relationships in real editorial examples.
- Explore ruled layouts whose corner whitespace follows typography.
- Omit the extension from 1.0 if it does not demonstrate clear value at an
  acceptable size and complexity cost.

---

## 1. Product definition

Graph Paper is **not** a component library, design system, utility framework, typography framework, or site theme.

Graph Paper is a small CSS library for **spatial composition**.

Its purpose is to let an editor or designer:

1. choose a broad grid geometry,
2. specify how many content items need to be placed,
3. choose a visual flow,
4. iterate among substantially different editorial compositions without manually recalculating widths, gaps, alignment, or row/column placement.

The core value proposition is:

> **Pick a layout, add content, and iterate quickly without manually managing the spatial rhythm.**

Graph Paper should handle spatial alignment. The host project should continue to own:

- fonts,
- colors,
- component styling,
- cards,
- buttons,
- navigation,
- forms,
- shadows,
- radii,
- decorative treatments,
- application-specific spacing,
- content-specific styling.

The library should be small enough to drop into a WordPress, Shopify, Webflow, React, static HTML, or other site without adopting a broader design system.

---

## 2. Original design intent to preserve

The original architecture was based on several ideas that should remain explicit in 1.0.

### 2.1 Grid, set, and flow are independent editorial levers

The existing vocabulary is conceptually sound:

- `grid_0*` describes the broad spatial field and number of visual columns.
- `set_0*` describes how many items need to be placed.
- `flow_0*` describes an arrangement of those items within the available field.

The goal is not to name layouts after presumed content roles such as `hero-left`, `feature-stack`, or `promo-grid`.

Those names age badly and encode assumptions about content semantics that Graph Paper does not control.

A class such as:

```html
<section class="grid_03a--07 set_06 flow_04">
```

is intentionally closer to an abstract layout recipe than to a component name.

The problem with the current system is **not primarily that these IDs are abstract**. The problem is that users currently have to memorize what they look like.

The 1.0 solution should therefore be:

> Keep stable abstract recipe IDs; make them discoverable through a visual configurator.

### 2.2 Source order and visual prominence may differ

One of the animating ideas behind Graph Paper is that an editor may know:

- the logical order of content,
- the number of items,
- and the desired prominence,

without knowing the final composition in advance.

CSS Grid lets visual placement differ from DOM order without requiring editors to rewrite markup.

Preserve this capability.

However:

- DOM order must remain logical and accessible.
- Graph Paper must not use `order`, positive `tabindex`, JavaScript DOM reordering, or other mechanisms that alter keyboard/focus order.
- The documentation/configurator should expose source-order labels so authors can see when visual reading order differs from DOM order.
- Authors should be warned not to create visual arrangements whose reading sequence becomes misleading.

### 2.3 The 1/64 ruler is fundamental

Graph Paper's underlying rhythm is based on a 64-part horizontal measure:

```text
1 bit  = 1/64 = 1.5625%
1 cell = 2 bits = 1/32 = 3.125%
```

This is not an implementation accident. It is a core design idea.

The 64-bit ruler makes it possible to construct both 20-track and 24-track systems while keeping useful spacing regimes and avoiding long repeating decimals.

Graph Paper 1.0 should make this underlying ruler **more explicit**, not less.

### 2.4 Repeated alignment down the page matters

A key aesthetic goal is that a viewer scrolling down a page perceives implicit vertical guides: unrelated regions seem to snap to the same underlying spatial rhythm.

This means Graph Paper should not casually turn every layout into an independent container-relative coordinate system.

The default should remain a shared page-level rhythm.

Local container-relative layouts should be possible, but they should be an **explicit rebase** with an understood tradeoff: local modularity in exchange for losing alignment with the outer page ruler.

### 2.5 Zero consumer runtime

The distributed library must require:

- no JavaScript,
- no framework,
- no CSS-in-JS,
- no runtime layout calculations in application code,
- no npm dependency for consumers,
- no preprocessing by consumers.

The output should remain ordinary static CSS.

Build-time generation inside the repository is acceptable and desirable if it removes repetitive hand-authored CSS.

Contributor tooling and consumer runtime are separate concerns.

---

## 3. Current repository baseline

At the time of this plan, the repository is deliberately small:

```text
/
├── css/
│   ├── main.css
│   └── main.min.css
├── LICENSE
└── README.md
```

The README is minimal and the current implementation lives almost entirely in `css/main.css`.

The existing stylesheet currently includes, among other things:

- `--bit` and `--cell` viewport-relative variables,
- 20-track and 24-track precomputed width variables,
- `grid_02*`, `grid_03*`, and `grid_04*` recipes,
- `set_*` and `flow_*` placement rules,
- hard-coded viewport breakpoints around 30rem and 60rem,
- substring selectors such as `[class*="grid_"]`,
- global body typography,
- image helpers,
- a broad print stylesheet,
- many rule/border selectors,
- a large amount of repeated `nth-child()` placement logic,
- several `!important` overrides.

The first implementation task is **not** to immediately delete this file. Treat it as the behavioral reference for migration.

---

## 4. 1.0 architectural model

Graph Paper 1.0 should have the following conceptual layers:

```text
Canvas
  ↓
64-bit ruler
  ↓
20- or 24-track lattice
  ↓
Grid
  ↓
Set
  ↓
Flow
  ↓
Micro-alignment / optical adjustment
```

### Public concepts

1. **Canvas** — establishes the ruler and spacing regime.
2. **Grid** — chooses the broad column geometry.
3. **Set** — identifies the number of items to place.
4. **Flow** — chooses their visual arrangement.
5. **State** — expanded, compact, or stacked responsive behavior.
6. **Subgrid** — lets semantic descendants continue using the same tracks.
7. **Micro-alignment** — limited bit/cell-based adjustments.
8. **Type extension** — optional later extension for typographic rhythm.

The core API should remain small.

---

# 5. Canvas: establish the coordinate system

## 5.1 Add a functional canvas class

Introduce:

```html
<main class="gp_canvas">
```

This is an acceptable extra class because it is **not merely a namespace**. It creates a coordinate system.

Recommended behavior:

```css
.gp_canvas {
  container-type: inline-size;
  --gp-bit: 1.5625cqi;
  --gp-cell: 3.125cqi;
}
```

Descendant Graph Paper layouts use those inherited values.

For backward compatibility outside a canvas, provide viewport-based fallbacks:

```css
:root {
  --gp-bit: 1.5625vw;
  --gp-cell: 3.125vw;
}
```

Internally, 1.0 CSS should use `--gp-*` variables.

If compatibility with existing custom CSS is needed, expose aliases:

```css
--bit: var(--gp-bit);
--cell: var(--gp-cell);
```

Do not use generic custom-property names internally.

## 5.2 Page canvas is the default recommendation

Documentation should encourage:

```html
<main class="gp_canvas">
  <section class="grid_03a--07 set_06 flow_04">...</section>
  <section class="grid_02a--03 set_03">...</section>
  <section class="grid_04b--02 set_06">...</section>
</main>
```

All regions inherit one ruler.

This preserves the original "implicit guides down the page" behavior.

## 5.3 Nested canvas means explicit rebase

A nested canvas is allowed:

```html
<aside class="gp_canvas">
  ...
</aside>
```

That intentionally establishes a new 1/64 ruler relative to the nested container.

Document this explicitly:

> A nested canvas gains local modularity but no longer shares horizontal coordinates with its parent canvas.

Do not make every grid a query container. The canvas owns the coordinate system.

---

# 6. Make the 20/24 systems real CSS Grid lattices

This should be the most important implementation prototype.

The current CSS precomputes widths such as:

```css
--w-12-20: 34fr;
--w-10-24: 23fr;
```

Those values are consequences of the 64-bit ruler, outer margins, and gutters.

Instead of storing every possible width, construct the underlying lattice directly.

## 6.1 Default / wide rhythm

For the default rhythm:

```text
outer padding: 3 bits left + 3 bits right
gap:           2 bits
```

For 20 tracks:

```text
6 outer bits
+ 19 gaps × 2 bits = 38
+ 20 tracks × 1 bit = 20
= 64 bits
```

For 24 tracks:

```text
6 outer bits
+ 23 gaps × 2 bits = 46
+ 24 tracks × 0.5 bit = 12
= 64 bits
```

Therefore an actual grid can use:

```css
grid-template-columns: repeat(20, minmax(0, 1fr));
column-gap: var(--gp-cell);
```

or:

```css
grid-template-columns: repeat(24, minmax(0, 1fr));
column-gap: var(--gp-cell);
```

An item spanning 12 tracks naturally includes the internal gutters in its grid area and recreates the previous macro width.

## 6.2 Thin rhythm

The existing thin system has a useful arithmetic relationship:

```text
outer padding: 2 bits left + 3 bits right
gap:           1 bit
```

This yields:

```text
20-track lattice: 2-bit tracks
24-track lattice: 1.5-bit tracks
```

Preserve the geometry unless comparison testing shows the old asymmetry was accidental.

Do not "clean up" the asymmetry merely for aesthetic symmetry without first understanding the historical math.

## 6.3 Neat rhythm

The neat system uses:

```text
outer padding: 2 bits left + 2 bits right
grid gap:      0
```

This yields:

```text
20-track lattice: 3-bit tracks
24-track lattice: 2.5-bit tracks
```

When visual separation is needed, child insets can provide the effective gutter.

## 6.4 Rule treatment

In the current implementation, rule geometry and neat geometry are partly coupled.

For 1.0:

- treat **neat** as a spacing/rhythm choice,
- treat **rule** as a visual treatment,
- allow rule styling to reuse neat-style insets where appropriate,
- keep a legacy compatibility mapping where the old `--rule` modifier reproduces the old combination.

Where a 1px border would otherwise change apparent spacing, compensate with:

```css
calc(var(--gp-bit) - var(--gp-rule-width))
```

**Implemented decision:** the prototype avoids box-model compensation entirely.
Rule markers are absolutely positioned pseudo-elements offset by half of the
active gap, so the line bisects the gutter without changing item width or
padding. The `calc()` compensation above remains useful guidance only for a
future treatment that uses an in-flow border.

Do not let rule selectors become another large hand-authored combinatorial matrix.

---

# 7. Keep the existing naming philosophy

Do **not** rename grids to implementation-heavy names such as:

```text
grid_8-8-8
grid_12-8-4
```

Those expose the internal lattice rather than the user's conceptual choice.

Retain the existing broad convention:

```text
grid_02...
grid_03...
grid_04...
set_03
set_04
set_05
set_06
flow_01
flow_02
...
```

Interpretation:

- `grid_03` means "three-column field."
- letters and suffix numbers are stable recipe IDs within that field.
- `set_06` means "six content items."
- `flow_04` means "flow recipe 04."

The visual configurator should make IDs discoverable so users do not need to memorize them.

Do not replace `flow_04` with presumed semantic labels.

Do not replace it with encoded permutations such as `flow_2134`; a flow recipe can contain more than a simple permutation and may interact with the grid family.

---

# 8. Introduce a layout manifest as the source of truth

The source of truth should no longer be the compiled CSS.

Create data files describing the system.

Suggested structure:

```text
src/
├── geometry/
│   ├── ruler.mjs
│   └── rhythms.mjs
├── manifest/
│   ├── grids.mjs
│   ├── sets.mjs
│   ├── flows.mjs
│   └── responsive.mjs
└── emit/
    ├── core.mjs
    ├── placements.mjs
    ├── utilities.mjs
    └── layers.mjs

scripts/
├── build.mjs
├── validate.mjs
└── minify.mjs

docs/
tests/
css/
```

Exact filenames may change, but preserve the separation of concerns.

## 8.1 Grid manifest

Represent grid recipes in terms of lattice and spans.

Example:

```js
export const grids = {
  "grid_03a--07": {
    columns: 3,
    lattice: 20,
    spans: [12, 4, 4],
    family: "03a",
    variant: "07"
  },

  "grid_03a--01": {
    columns: 3,
    lattice: 24,
    spans: [10, 8, 6],
    family: "03a",
    variant: "01"
  }
};
```

The generator should calculate track start/end lines from the spans.

Do not hand-author precomputed width variables.

## 8.2 Set manifest

A set primarily records item count and any default arrangement behavior.

Example:

```js
export const sets = {
  set_03: { items: 3 },
  set_04: { items: 4 },
  set_05: { items: 5 },
  set_06: { items: 6 }
};
```

If a set has a default slot pattern independent of grid family, encode it here.

## 8.3 Flow manifest

Represent flows as abstract placement recipes wherever possible.

Prefer references to macro-column positions over absolute microgrid line numbers.

Conceptually:

```js
flow_04: {
  items: {
    1: { column: 1, rowStart: 1, rowEnd: 2 },
    2: { column: 1, rowStart: 2, rowEnd: 3 },
    3: { column: 1, rowStart: 3, rowEnd: 4 },
    4: { column: 2, rowStart: 1, rowEnd: 4 },
    5: { column: 3, rowStart: 1, rowEnd: 4 }
  }
}
```

This is illustrative, not a mandate for the exact schema.

The important rule is:

> Normalize flow recipes against abstract grid slots wherever possible; use grid-family-specific overrides only when genuinely required.

This should convert the maintenance problem from hand-authored `grid × set × flow` CSS into a compact declarative model plus generated output.

## 8.4 Do not force `grid-template-areas`

`grid-template-areas` may be useful for some patterns, but the new real 20/24-track lattice changes the tradeoff.

The generator may emit:

- explicit grid-line placement,
- custom-property-based placement,
- grid-template areas,
- or a mixture,

depending on which produces the smallest and clearest CSS.

The architectural requirement is the manifest separation, not a particular generated syntax.

A promising generated pattern is:

```css
.grid_03a--07 {
  --gp-col-1-start: 1;
  --gp-col-1-end: 13;
  --gp-col-2-start: 13;
  --gp-col-2-end: 17;
  --gp-col-3-start: 17;
  --gp-col-3-end: 21;
}
```

with set/flow rules assigning item placement through custom properties.

Prototype before committing.

---

# 9. Generated CSS, not runtime abstraction

The consumer should still receive ordinary CSS:

```text
css/main.css
css/main.min.css
```

Preserve these paths because existing jsDelivr integrations use them.

Add generated-file headers:

```css
/*
 * Graph Paper CSS 1.0
 * GENERATED FILE — DO NOT EDIT DIRECTLY
 * Source: src/manifest + scripts/build.mjs
 */
```

## 9.1 Build philosophy

Prefer a small Node-based build script.

The ideal contributor command is:

```bash
node scripts/build.mjs
```

or:

```bash
npm run build
```

Consumer runtime remains dependency-free.

Dev-only dependencies are acceptable if they provide substantial value, but keep them limited.

Recommended distinction:

- **Core generation:** Node built-ins if practical.
- **CSS minification:** one small dev dependency is acceptable if needed.
- **Visual regression testing:** Playwright is acceptable as a dev dependency.
- **Configurator:** vanilla HTML/CSS/JS; no React/Vue/Svelte requirement.

Do not add a large frontend toolchain merely to generate static CSS and documentation.

---

# 10. Responsive behavior: states, not breakpoint classes

The current implementation hard-codes viewport breakpoints around 30rem and 60rem.

That has two problems:

1. a Graph Paper region may be narrower than the viewport,
2. site breakpoints may not match Graph Paper breakpoints.

The 1.0 mental model should be:

```text
expanded
compact
stacked
```

These are layout **states**, not device names.

## 10.1 Default behavior uses container size

A `gp_canvas` is a size query container.

Default 1.0 behavior should initially preserve the old thresholds as closely as possible, but apply them to the canvas/container rather than the viewport.

Start with approximately:

```text
stacked: < 30rem
compact: 30rem–60rem
expanded: >= 60rem
```

Use the configurator and real examples to tune these later.

This makes full-width pages behave similarly to legacy Graph Paper while allowing local canvases to respond to their own available width.

## 10.2 Thresholds must be build-configurable

CSS custom properties still cannot simply replace lengths inside `@container` conditions.

Therefore add a build configuration mechanism.

Example:

```js
// graphpaper.config.mjs
export default {
  breakpoints: {
    compact: "30rem",
    expanded: "60rem"
  }
};
```

The default distributed build uses Graph Paper defaults.

A site that wants its own breakpoint system can generate a compatible build.

Do not require this config for normal CDN usage.

## 10.3 Host-controlled responsive state

Investigate custom-property container style queries as a progressive enhancement.

Desired host-side integration:

```css
@media (max-width: 52rem) {
  .site-layout {
    --gp-state: compact;
  }
}
```

Graph Paper could react with:

```css
@container style(--gp-state: compact) {
  /* compact state */
}
```

This would let a host design system map its own breakpoints onto Graph Paper without Graph Paper knowing those breakpoints.

However:

- treat this as progressive enhancement until browser support is verified across the project's support matrix,
- do not make it the only responsive mechanism,
- retain size-query defaults.

Also provide explicit force-state classes for debugging/configurator use:

```text
gp_state--expanded
gp_state--compact
gp_state--stacked
```

They should not be required for ordinary authoring.

---

# 11. Responsive state behavior

Each valid combination should have predictable behavior in each state.

## Expanded

- full grid/set/flow composition,
- preserve intended visual hierarchy,
- use full lattice geometry.

## Compact

- simplify complex arrangements,
- preserve recognizable hierarchy where possible,
- avoid tiny columns merely because a three- or four-column recipe exists,
- do not depend on viewport assumptions.

## Stacked

- normal source-order reading,
- one item per row,
- remove grid-column and grid-row placements cleanly,
- preserve only intentional micro insets that make sense in a stack,
- no visual reordering.

The manifest should be capable of recording state-specific placement where needed.

---

# 12. Subgrid: preserve semantic DOM hierarchy without losing alignment

Add a small utility:

```html
<article class="gp_subgrid">
```

Conceptual CSS:

```css
.gp_subgrid {
  display: grid;
  grid-template-columns: subgrid;
}
```

Use case:

```html
<section class="grid_03a--07">
  <article class="gp_subgrid">
    <header>...</header>
    <div>...</div>
    <footer>...</footer>
  </article>
  <aside>...</aside>
  <aside>...</aside>
</section>
```

If the article spans 12 tracks, its semantic descendants can align with those same tracks.

This is preferable to:

- flattening meaningful DOM hierarchy,
- duplicating an approximate nested grid,
- or abandoning outer alignment.

Guidance:

> Use subgrid when nested semantic content should continue participating in the outer Graph Paper geometry. Do not use it for components whose internal layout is genuinely independent.

Add configurator/demo examples showing:

1. flat grid,
2. semantic wrapper without subgrid,
3. same wrapper with subgrid.

---

# 13. Escape hatches: constrained micro-alignment

Graph Paper needs escape hatches, but they must not become a second general-purpose layout framework.

Adopt this rule:

> Escape hatches may adjust an element's relationship to Graph Paper; they should not recreate Tailwind inside Graph Paper.

## 13.1 Natural units

Use:

- bit,
- cell,
- line / font-relative units where appropriate.

Potential vocabulary:

```text
inset
bleed
shift
align
rule
```

Example classes may include:

```text
gp_inset--bit
gp_inset--cell
gp_bleed--bit
gp_bleed--cell
gp_align--start
gp_align--center
gp_align--end
gp_rule--start
gp_rule--end
```

Do not automatically implement every permutation.

Start with actual use cases found in the current CSS and AidData-style editorial layouts.

**Implemented subset:** `gp_inset--bit`, `gp_rule--start`, and
`gp_rule--end`. Cell inset, bleed, shift, and alignment families were not added
because the current examples did not justify them.

## 13.2 Advanced placement override

For rare cases where an item needs to opt out of a recipe, expose advanced CSS custom properties rather than generating dozens of utility classes:

```css
--gp-column-start
--gp-column-end
--gp-row-start
--gp-row-end
```

An opt-out helper may consume them.

**Implemented helper:** `gp_place`. Its doubled emitted selector
`.gp_place.gp_place` matches generated placement specificity so the explicit
override wins without `!important`.

This is intentionally less convenient than grid/set/flow so it remains an escape hatch.

Do **not** ship a complete `col-start-1 ... col-start-24` / `span-1 ... span-24` utility framework in the first implementation.

## 13.3 Optical typography adjustment

Distinguish spatial movement from optical movement.

A Graph Paper geometric adjustment should use bit/cell units.

An optical correction should not change layout geometry.

Provide an optional pattern:

```css
.gp_optical {
  translate:
    var(--gp-optical-x, 0)
    var(--gp-optical-y, 0);
}
```

**Implemented helper:** `gp_optical` follows this pattern unchanged.

Authors may use font-relative units:

```css
--gp-optical-x: -0.04em;
```

or:

```css
--gp-optical-y: -0.05cap;
```

Principle:

> Bits change layout. Font-relative units change optical alignment.

---

# 14. Remove global styling from core

The 1.0 core stylesheet must not set generic site styles.

Remove from core:

- `body` font-family,
- global heading sizes,
- global paragraph styling,
- generic link print behavior,
- generic `header`, `footer`, `form`, `main`, `article` styling,
- broad print overrides,
- unrelated image-component helpers unless directly tied to layout.

If useful, preserve legacy extras in a separate optional file:

```text
css/legacy-extras.css
```

or:

```text
extras/
├── print.css
└── image.css
```

But do not load them from `main.css`.

Core Graph Paper should touch only Graph Paper classes and their direct layout children.

---

# 15. Optional cascade-layer build

The default distribution should remain unlayered for easy use in WordPress, Shopify, Webflow, and existing themes:

```text
css/main.css
css/main.min.css
```

Also generate an optional layered build:

```text
css/main.layer.css
css/main.layer.min.css
```

wrapped in:

```css
@layer graphpaper {
  ...
}
```

Do not make cascade-layer knowledge a prerequisite for using Graph Paper.

Document that unlayered site CSS can outrank layered Graph Paper depending on cascade ordering, so the layered build is intended for projects that deliberately manage cascade layers.

Goal: remove all or nearly all `!important` declarations from generated 1.0 CSS.

Any remaining `!important` must have an explicit comment explaining why it is unavoidable.

---

# 16. Typography extension: separate from core

Do not make typography part of the first core refactor, but architect for an optional extension.

Potential files:

```text
css/type.css
css/type.min.css
```

The extension should provide **dimensions and rhythm**, not a visual identity.

It must not choose:

- font family,
- font weight conventions,
- text colors,
- heading semantics.

It may provide:

- fluid type-scale tokens,
- vertical rhythm tokens,
- measure tokens,
- line-height relationships,
- font-relative spacing helpers.

Example:

```css
--gp-type--1: ...;
--gp-type-0: ...;
--gp-type-1: ...;
--gp-type-2: ...;
--gp-type-3: ...;
```

Use `clamp()` and container-relative sizing where appropriate.

Explore scale ratios inspired by modular/musical intervals, e.g.:

- compact containers use a restrained ratio,
- broad editorial canvases can use a more dramatic ratio.

Do not commit to exact ratios until tested visually.

Useful units include:

- `em`,
- `lh`,
- `cap`,
- `cqi`.

This extension should make layouts such as ruled editorial cards possible where:

- horizontal geometry follows bit/cell,
- top/bottom spacing follows typographic rhythm,
- borders can intentionally stop short of corners based on type-derived insets.

Keep it optional.

---

# 17. Visual configurator: required for 1.0 usability

The visual configurator is not a CMS integration.

It is the documentation interface that makes an abstract recipe system teachable.

Build it as static, framework-free HTML/CSS/JS under `docs/`, suitable for GitHub Pages.

## 17.1 Core principle

The configurator must use the **actual distributed Graph Paper CSS**.

Do not recreate layout rules in JavaScript.

JavaScript should only:

- choose classes,
- filter valid combinations,
- change demo content,
- resize the preview,
- expose metadata,
- copy markup/class strings,
- persist selections.

## 17.2 Primary controls

Include:

### Item count

```text
3  4  5  6
```

Selecting an item count chooses/filter `set_*`.

### Grid

Show visual thumbnails grouped by:

```text
2 columns
3 columns
4 columns
```

Each thumbnail should display the recipe ID underneath or on hover.

Do not require users to remember IDs.

### Flow

Show all valid flows for the selected grid/set combination as visual thumbnails.

This is the most important teaching surface.

### Rhythm / spacing

Controls for:

```text
default / wide
thin
neat
rule treatment
```

Clearly distinguish spacing regime from visual border treatment in the new API.

### Preview width

Provide a draggable or slider-controlled preview container.

As width changes, users should see:

```text
expanded → compact → stacked
```

Display the current state.

### Guide overlays

Toggles:

```text
64-bit ruler
20/24 lattice
macro columns
source-order labels
visual slot labels
```

These overlays are documentation only; they should not be part of the production CSS API.

### Content modes

Provide at least:

1. numbered neutral blocks,
2. headline + paragraph cards with varied text lengths,
3. image + text items.

The configurator should demonstrate that layouts work with realistic uneven content, not just equal-height colored boxes.

## 17.3 Output

Show:

```html
<section class="grid_03a--07 set_06 flow_04">
  ...
</section>
```

and when relevant:

```html
<main class="gp_canvas">
  ...
</main>
```

Provide a copy button.

Also display:

- lattice: 20 or 24,
- macro spans,
- current responsive state,
- source-order sequence,
- whether a nested canvas would rebase alignment.

## 17.4 Shareable state

Persist configuration in URL query parameters or hash.

A user should be able to share a link that opens the exact composition.

Example conceptual parameters:

```text
?grid=grid_03a--07&set=set_06&flow=flow_04&rhythm=wide&width=960
```

## 17.5 "Try all" view

Add a gallery mode that displays all valid flows for one selected grid + set.

This directly supports the real editorial workflow:

> "I have six pieces of content. Show me the plausible compositions so I can judge the visual balance."

This may be more valuable than a traditional documentation page.

---

# 18. Documentation structure

The README should become an orientation page, not an exhaustive class reference.

Suggested structure:

```text
README.md
docs/
├── index.html            # visual intro
├── configurator.html     # interactive explorer
├── concepts.html         # canvas, ruler, grid, set, flow
├── responsiveness.html
├── subgrid.html
├── escape-hatches.html
└── migration.html
```

The first documentation screen should explain:

> Graph Paper is a tiny CSS library for editorial spatial composition.

Then show the three main levers visually:

```text
GRID     SET     FLOW
```

Do not begin documentation with a long table of class names.

The class catalog should be generated from the same manifest as the CSS.

---

# 19. Accessibility requirements

Treat accessibility as part of layout correctness.

## 19.1 Source order

- Keep source order meaningful.
- Never use JavaScript to reorder DOM nodes.
- Do not use positive `tabindex`.
- Do not use CSS `order` to simulate reading order.
- Visual grid placement may differ from source order, but documentation must explain the implications.

## 19.2 Configurator

The configurator should include a source-order overlay:

```text
DOM 1
DOM 2
DOM 3
...
```

This allows authors to evaluate whether a selected flow still produces understandable visual logic.

## 19.3 Responsive stack

The stacked state must return to ordinary source order.

This is a hard acceptance criterion.

---

# 20. Validation and invariant tests

A generated system makes strong automated validation possible.

Create `scripts/validate.mjs`.

It should fail the build when any invariant is violated.

## Geometry invariants

For every grid:

- `columns` matches the number of macro spans.
- `lattice` is an allowed value.
- all spans are positive integers.
- the spans sum exactly to the lattice.
- calculated macro lines are monotonic.
- no placement extends beyond the lattice.

## Set invariants

For every set:

- item count is positive.
- all referenced flows support the item count.

## Flow invariants

For each valid grid/set/flow combination:

- every source item is assigned exactly once,
- no item index exceeds the set count,
- no required item is omitted,
- placements use valid column lines,
- row placement is valid,
- stacked state clears placement,
- overrides are explicit rather than accidental selector collisions.

## CSS invariants

Assert that core CSS contains no unintended selectors for:

```text
body
h1
h2
p
a
header
footer
form
main
article
```

unless scoped beneath an explicit Graph Paper class.

Also test:

- no accidental global substring selectors unless approved,
- no unexplained `!important`,
- deterministic build output,
- generated files are up to date.

---

# 21. Regression testing

## 21.1 Preserve a legacy reference during implementation

Before replacing the current stylesheet, save a test-only legacy snapshot:

```text
tests/fixtures/legacy-main.css
```

Do not ship this as part of the 1.0 public API.

Use it to compare representative existing compositions.

## 21.2 Representative matrix

Do not attempt to screenshot every theoretical combination initially.

Start with a matrix covering:

- 2-column, 3-column, 4-column,
- 20-track and 24-track lattices,
- default, thin, neat, rule,
- sets 3 through 6,
- simple and complex flows,
- expanded, compact, stacked,
- long and short content,
- subgrid,
- nested canvas.

## 21.3 Playwright

Use Playwright as a dev-only dependency if feasible.

Generate screenshots for known fixture pages.

The goal is not pixel-for-pixel preservation of every legacy quirk.

The goal is:

- preserve intentional geometry,
- detect accidental drift,
- document intentional 1.0 changes.

## 21.4 Mathematical comparison

For expanded layouts, add programmatic browser tests that inspect element bounding boxes and verify expected relationships:

- outer padding in ruler units,
- gap width,
- macro-column proportions,
- alignment across consecutive page sections,
- nested-canvas rebase behavior.

This is more useful than screenshot tests alone.

---

# 22. Compatibility and migration strategy

Graph Paper 1.0 is allowed to be a major release, but avoid unnecessary breakage.

## Preserve

- `css/main.css`
- `css/main.min.css`
- `grid_*`
- `set_*`
- `flow_*`
- the 1/64 spatial concept
- existing recipe IDs where their behavior remains intentional

## Change

- internal implementation,
- width arithmetic,
- responsiveness mechanism,
- global styling,
- border/rule architecture,
- build process,
- documentation.

## Add

- `gp_canvas`,
- container-relative behavior,
- subgrid utility,
- layout manifest,
- build/validation scripts,
- configurator,
- optional layered build,
- constrained micro-alignment,
- optional later typography extension.

## Legacy behavior outside a canvas

Existing markup should continue to work without immediately adding `gp_canvas`.

Use viewport-relative fallbacks for standalone legacy grids.

Documentation should nevertheless recommend canvas usage for all new 1.0 work.

---

# 23. Specific current issues to eliminate

The refactor should directly address these known pain points.

## Hand-coded width tables

Remove them from source.

The generated implementation should make the erroneous/manual-sequence class of bug impossible.

The current stylesheet appears to contain a suspicious neat 24-track sequence around `--w-20-24`, which is exactly the kind of maintenance failure the lattice implementation should prevent.

## Substring sniffing

Current selectors such as:

```css
[class*="grid_"]
[class*="--thin"]
[class*="set_"]
```

were originally chosen to minimize repeated selectors and markup.

Do not add a mandatory base class solely to namespace grids.

Instead, because the CSS is generated, emit exact class groups where practical.

Example:

```css
:where(
  .grid_02,
  .grid_02a,
  .grid_02a--01,
  ...
) {
  display: grid;
}
```

The generator absorbs the tedious repetition.

Use `:where()` where its zero specificity is useful.

## Global styling

Remove from core.

## Hard-coded viewport breakpoints

Replace with generated container-query thresholds.

## Border selector matrix

Replace with manifest-driven or utility-driven rule behavior.

## `!important`

Remove wherever possible.

---

# 24. Proposed repository structure

Target structure after the first several implementation phases:

```text
/
├── css/
│   ├── main.css
│   ├── main.min.css
│   ├── main.layer.css
│   ├── main.layer.min.css
│   ├── type.css                 # later / optional
│   └── type.min.css             # later / optional
│
├── src/
│   ├── geometry/
│   │   ├── ruler.mjs
│   │   └── rhythms.mjs
│   ├── manifest/
│   │   ├── grids.mjs
│   │   ├── sets.mjs
│   │   ├── flows.mjs
│   │   └── responsive.mjs
│   └── emit/
│       ├── core.mjs
│       ├── placements.mjs
│       ├── utilities.mjs
│       └── layers.mjs
│
├── scripts/
│   ├── build.mjs
│   ├── validate.mjs
│   └── minify.mjs
│
├── docs/
│   ├── index.html
│   ├── configurator.html
│   ├── configurator.js
│   ├── docs.css
│   └── examples/
│
├── tests/
│   ├── fixtures/
│   │   └── legacy-main.css
│   ├── geometry.test.mjs
│   └── visual/
│
├── graphpaper.config.mjs
├── package.json
├── README.md
├── LICENSE
└── .gitignore
```

Keep the structure smaller if some files would be nearly empty.

Avoid architecture for architecture's sake.

---

# 25. Implementation phases

The agent should work in small, reviewable phases.

Do **not** attempt a complete rewrite in one commit.

## Phase 0 — Baseline and inventory

**Status: complete.** The frozen stylesheet, generated JSON/Markdown
inventory, legacy gallery, configurable legacy preview, and 416 expanded-state
browser captures now provide the migration baseline. `css/main.css` has not
been modified.

1. Preserve current `css/main.css` as a test fixture.
2. Inventory all existing:
   - grid classes,
   - set classes,
   - flow classes,
   - rhythm modifiers,
   - rule variants,
   - utility classes,
   - responsive exceptions.
3. Generate a machine-readable inventory.
4. Create a representative legacy demo page.
5. Record screenshots/bounding boxes for representative layouts.

Deliverable:

```text
tests/fixtures/legacy-main.css
tests/legacy-gallery.html
docs/legacy-inventory.md
```

Do not change production CSS yet.

## Phase 1 — Geometry proof of concept

**Status: complete and extended beyond the original proof.** Representative
geometry matched the legacy reference, after which the same real-lattice model
was applied to every grid recipe. Wide, thin, and neat closure is validated
mathematically and in browser fixtures.

Build only enough new CSS to prove the real lattice model.

Implement:

- `gp_canvas`,
- 64-bit ruler,
- default 20-track lattice,
- default 24-track lattice,
- 3–5 representative grid recipes.

Compare new geometry to legacy.

Acceptance criterion:

> Representative macro-column bounding boxes match intentional legacy geometry within normal browser rounding tolerance.

Then add thin and neat rhythms and verify their arithmetic.

Do not implement every flow yet.

## Phase 2 — Manifest and generator

**Status: complete.** Grid, set, compact-pattern, layout, compatibility,
rhythm, and responsive metadata drive deterministic generation of
`css/next.css`. All 72 concrete grids are validated against the frozen legacy
inventory.

Create:

- grid manifest,
- build script,
- validation script.

Generate representative grid CSS from the manifest.

Once stable, migrate all grid recipes.

Delete hand-coded width tables from the new source.

Continue to leave existing production `main.css` untouched until parity is demonstrated.

## Phase 3 — Sets and flows

**Status: complete.** Browser-observed legacy results were normalized into 90
layout records covering 161 family/set/flow combinations. Identical emitted
placements are grouped, while meaningful family differences and legacy aliases
remain explicit.

Inventory existing set/flow behavior.

Normalize it into:

- grid-independent placement where possible,
- family-level overrides where necessary,
- explicit exceptions rather than selector accidents.

Prototype different emitters.

Choose the strategy that gives the best combination of:

1. small CSS,
2. understandable generated output,
3. easy manifest maintenance,
4. faithful layout behavior.

Do not optimize solely for pretty generated CSS; humans should edit the manifest, not the compiled placement matrix.

## Phase 4 — Responsive states

**Status: complete for ordinary authoring.** Canvas container queries implement
expanded, compact, and stacked states at source-configured 60rem/30rem
thresholds. The standalone compatibility path uses equivalent media queries.
Stacked mode restores source-order block flow. The optional `gp_state--*`
force-state/debug helpers have not been implemented.

Implement:

- expanded,
- compact,
- stacked,
- container size queries,
- build-configured thresholds.

Initially match legacy 30rem/60rem behavior where sensible.

Then test real layouts in containers of different widths.

Ensure stacked state returns to source-order flow.

## Phase 5 — Visual configurator MVP

**Status: functionally complete.** The current configurator includes all
required behaviors except that grid selection is textual rather than a
thumbnail picker. Visual grid browsing is available in the separate 72-recipe
catalog; compatible flows use actual-CSS thumbnails in the primary UI.

Build the configurator before spending time on extensive prose documentation.

Minimum viable configurator:

- set selector,
- grid thumbnail selector,
- flow thumbnail selector,
- preview-width slider,
- source-order labels,
- class-string output,
- copy button,
- actual production CSS.

This is a high-priority phase because it tests whether the abstraction is teachable.

## Phase 6 — Canvas rhythm and nested composition

**Status: complete.** The canvas documentation demonstrates shared page
coordinates, all three rhythms, four guide overlays, and deliberate nested
rebasing. Nested canvases reset to wide and respond to their own inline size.

Add:

- page canvas examples,
- nested canvas examples,
- guide overlays,
- 20/24 lattice overlays,
- explicit documentation of rebase behavior.

Use this phase to decide how opinionated guidance should be about mixing rhythm regimes on one page.

Recommendation:

> One canvas should generally use one spacing rhythm. Switching rhythm should be intentional and visually demonstrated, not casually applied section by section.

## Phase 7 — Subgrid

**Status: complete.** `gp_subgrid` ships in the prototype, with semantic
editorial comparisons and verified inheritance across representative 20- and
24-track parent spans.

Implement `gp_subgrid`.

Add real editorial examples with nested semantic markup.

Test across 20- and 24-track parent grids.

## Phase 8 — Rules and micro-alignment

**Status: complete.** The legacy inferred-border matrix is replaced by explicit
start/end rule ownership with gutter-centered pseudo-element markers. The only
additional escape hatches are one-bit inset, custom-property placement, and
optical translation.

Replace large rule-selector matrices with a smaller treatment model.

Add only the micro-alignment utilities justified by real examples.

Avoid a general utility-framework expansion.

## Phase 9 — Remove globals and prepare distribution

**Status: next; not started as a distribution change.** The prototype core is
already scoped and free of generic element styling, but production files still
contain the legacy globals. Promotion, extraction, layering, minification, and
migration/release documentation remain.

Remove global typography/print styling from core.

Generate:

- unlayered build,
- layered build,
- minified files.

Preserve existing distribution paths.

Add release/migration notes.

## Phase 10 — Typography extension experiment

**Status: not started and not required for 1.0.** Begin only after Phase 9 and
omit it from the release if the examples do not justify the added surface.

Only after core 1.0 geometry and configurator are stable:

- prototype fluid type tokens,
- test modular-scale ratios,
- test `lh`, `cap`, `em`, and `cqi` relationships,
- test ruled layouts whose corner whitespace follows typography.

Keep this experiment separate enough that it can be omitted from the 1.0 release if it is not clearly valuable.

---

# 26. Visual configurator implementation guidance

The configurator should be intentionally low-tech.

Suggested architecture:

```text
docs/configurator.html
docs/configurator.js
docs/docs.css
```

Import manifest metadata as ES modules if practical.

Use no framework unless plain JS becomes demonstrably harder to maintain.

## Data flow

```text
manifest
   ↓
available grids / sets / flows
   ↓
UI selection
   ↓
classes applied to preview
   ↓
actual Graph Paper CSS renders result
```

JavaScript must not calculate layout positions.

## Thumbnail generation

Prefer thumbnails rendered by the actual CSS.

For example, each flow thumbnail can contain neutral numbered items:

```html
<div class="mini grid_03a--07 set_06 flow_04">
  <i>1</i>
  <i>2</i>
  ...
</div>
```

This prevents documentation diagrams from drifting away from production behavior.

## Filtering

When the user selects `set_06`, show only:

- grids compatible with six items,
- flows valid for the selected grid/set,
- rhythm/treatment options supported by that configuration.

Invalid combinations should disappear or be disabled rather than fail silently.

## Debug view

Add a developer/debug toggle exposing:

- lattice count,
- macro spans,
- grid lines,
- generated CSS selector,
- responsive state,
- calculated canvas width.

This will be useful while implementing 1.0.

---

# 27. Design guidance for mixing grids

Graph Paper supports 20-track and 24-track projections of one 64-bit ruler.

Do not promise that every internal grid line from a 20-track composition will align with every internal line from a 24-track composition.

The intended relationship is closer to **polyrhythms sharing one measure**:

- same canvas,
- same outer ruler,
- related spacing,
- selected coincident alignments,
- different internal subdivisions.

Documentation should distinguish:

### Alignment-safe changes

Generally safe within a canvas:

- switching grid recipe,
- switching item count,
- switching flow,
- moving between 20- and 24-track projections designed around the same canvas rhythm.

### Rhythm changes

More consequential:

- wide → thin,
- wide → neat,
- resetting the canvas,
- introducing independent container-relative geometry.

These should be visually deliberate.

The configurator should make the distinction visible.

---

# 28. Naming and API rules for new classes

Use names only when they express a real Graph Paper concept.

Good:

```text
gp_canvas
gp_subgrid
gp_state--compact
gp_inset--bit
gp_rule--start
```

Avoid adding a namespace class that exists solely because a selector could otherwise be written more conveniently.

Preserve existing recipe naming:

```text
grid_03a--07
set_06
flow_04
```

Do not encode content semantics in recipe names.

Do not rename recipes solely to make the CSS look more modern.

---

# 29. Non-goals

The implementation should explicitly reject scope creep.

Graph Paper 1.0 is not trying to provide:

- a 12-column Bootstrap-style universal grid,
- Tailwind-style comprehensive utilities,
- cards,
- buttons,
- forms,
- navigation,
- color tokens,
- shadows,
- rounded corners,
- font families,
- CMS components,
- React components,
- JavaScript layout,
- drag-and-drop page building,
- automatic content prioritization,
- a full design system.

The configurator is a **layout explorer and documentation interface**, not a CMS/page builder.

---

# 30. Release acceptance criteria

Graph Paper 1.0 is ready when all of the following are true.

## Core identity

- The library can still be explained as "grid + set + flow."
- Existing recipe IDs are preserved where practical.
- Users can use the library without JavaScript.
- Host projects bring their own visual styling.

## Geometry

- The 1/64 ruler is explicit and documented.
- 20- and 24-track lattices are real grid tracks rather than hand-maintained width tables.
- Representative legacy compositions match intended geometry.
- Multiple sections in one page canvas visibly share alignment.

## Responsiveness

- Layout behavior is container-aware.
- Expanded, compact, and stacked states are predictable.
- Breakpoint thresholds can be changed at build time.
- Stacked state returns to source order.
- Graph Paper works inside a deliberately rebased local canvas.

## Maintainability

- Grid recipes live in a manifest.
- Flow logic is declarative.
- CSS is generated deterministically.
- Validation catches invalid geometry.
- No hand-maintained width arithmetic remains.
- Global styling is out of core.
- `!important` is eliminated or extremely rare and documented.

## Usability

- A user can choose a layout visually without memorizing IDs.
- The configurator can show all flows for a chosen grid/set.
- The configurator can simulate container width.
- The configurator outputs copyable classes/markup.
- Source order is visible.

## Distribution

- `css/main.css` exists.
- `css/main.min.css` exists.
- existing CDN path remains valid.
- an optional layered build exists.
- README explains quick start.
- release notes explain breaking changes.

---

# 31. Agent operating instructions

When implementing this plan:

1. **Do not rewrite everything at once.**
2. **Do not change public recipe names before the configurator proves a rename is needed.**
3. **Do not optimize generated CSS by reintroducing hard-to-maintain source CSS.**
4. **Do not make the configurator calculate the layout in JS.**
5. **Do not add a frontend framework without a concrete need.**
6. **Do not let escape hatches become the primary layout API.**
7. **Do not make nested container behavior implicit.**
8. **Do not mix typography into core before spatial composition is stable.**
9. **Preserve a legacy fixture throughout the migration.**
10. **Prefer mathematical/invariant tests over visual inspection alone.**
11. **Keep each implementation phase reviewable and working.**
12. **Whenever behavior differs from legacy Graph Paper, document whether the difference is:**
    - a bug fix,
    - an intentional 1.0 design change,
    - or an unresolved experiment.

---

# 32. Recommended first Codex task

Start with a **prototype branch/commit**, not the full migration.

Implement only:

1. inventory script for existing classes,
2. legacy fixture page,
3. `gp_canvas`,
4. 20-track and 24-track real lattices,
5. default/wide rhythm,
6. `grid_03a--01`,
7. `grid_03a--07`,
8. one `set_06`,
9. one representative `flow`,
10. a minimal configurator that can switch between those two grids and resize the canvas.

The first review question should be:

> Does the real-lattice implementation reproduce the spatial behavior we want while making the model easier to reason about?

The second should be:

> Does selecting recipes visually make the existing abstract naming feel usable to someone who did not memorize the framework?

Only after those answers are positive should the agent migrate the entire current selector matrix.

---

# 33. Suggested first milestone demo

The first end-to-end demo should show one page with:

```text
[ 64-bit guide overlay ]

Section A
grid_03a--01 set_06 flow_X

Section B
grid_03a--07 set_06 flow_X

Section C
24-track layout with gp_subgrid

[ nested local gp_canvas ]
same content rebased into a narrower sidebar
```

Controls:

```text
Grid     [ thumbnails ]
Flow     [ thumbnails ]
Width    [----------●----]
Guides   [x] 64-bit [x] tracks [x] source order
```

This one demo can validate:

- the ruler,
- the lattice math,
- visual recipe selection,
- container responsiveness,
- shared page alignment,
- nested rebasing,
- source-order handling,
- the feasibility of the configurator.

---

# 34. Rationale summary

Graph Paper's original abstraction should survive 1.0.

The main lessons from using it in production are:

- the layout freedom is genuinely useful,
- the combinatorial CSS is painful to maintain,
- the abstract class system is difficult to teach from text,
- hard-coded viewport breakpoints make integration awkward,
- full-width-only geometry limits reuse,
- global styling does not belong in core,
- spatial escape hatches are necessary,
- semantic DOM hierarchy should not be sacrificed merely to preserve alignment.

Modern CSS provides tools that did not exist when the library was originally designed:

- container queries,
- container query units,
- subgrid,
- `clamp()`,
- font-relative units such as `lh` and `cap`,
- cascade layers.

Use those tools to remove accidental implementation constraints while preserving the original editorial idea.

The intended result is not "a modern CSS framework."

It is a smaller, clearer, more maintainable version of the same experiment:

> **Graph Paper is a tiny CSS library for editorial spatial composition. Grid chooses the field, set describes the content count, flow changes the arrangement, and a shared ruler keeps the page in rhythm. The visual configurator makes those abstract recipes usable without requiring humans to memorize them.**

---

# 35. Reference links

Repository:

- https://github.com/johnwcuster/graphpapercss

Current stylesheet:

- https://raw.githubusercontent.com/johnwcuster/graphpapercss/main/css/main.css

Relevant modern CSS references:

- Container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- Container size/style queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries
- Subgrid: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid
- `clamp()`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp
- CSS length units (`cqi`, `lh`, `cap`): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
- Cascade layers: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer
