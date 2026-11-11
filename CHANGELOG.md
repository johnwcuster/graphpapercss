# Release notes

## 0.5.2 — predefined CDN profiles

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/main.min.css)

The full CSS builds and authoring API are unchanged from 0.5.1. Two optional standalone profiles offer smaller pinned CDN delivery without a build process.

- [`repeating.min.css`](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/profiles/repeating.min.css): Stack and repeating Peers 2–6; six layouts, 3,378 gzip bytes.
- [`two-three.min.css`](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/profiles/two-three.min.css): Stack, Peers 2–6, and all Two/Three compositions; 69 layouts, 9,844 gzip bytes. Four compositions and mosaics remain in the full library.
- Both profiles retain every viewport step, gutter mode, applicable refinement, padding/vertical-spacing utility, nested ruler, rule and safeguard. Readable and minified files and a capability/size manifest are included in the package.
- The configurator separates CDN delivery from self-hosting, offers full or smallest-compatible coverage, and shows one stylesheet result. It highlights Brotli/gzip sizes with site-wide caching guidance, consolidates full-only cases, and keeps Copy HTML beside the markup. Custom self-hosted CSS uses explicit build and download steps.
- Profiles are complete alternatives: load one instead of combining them with each other or the full library. Full builds retain their existing paths and bytes.
- Generated profile files pass readable/minified and forced-count-fallback geometry comparisons in Chromium, Firefox and WebKit. Package tests include exports, static mirrors and the delivery module graph.

## 0.5.1 — selective CSS downloads

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.1/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.1/css/main.min.css)

The full CSS builds and authoring API are unchanged from 0.5.0. This patch adds smaller, standalone stylesheet downloads to the configurator.

- Build CSS locally for the layouts, viewport steps, gutters, and utilities in a responsive sequence. Choose readable or minified CSS and download matching HTML. Exported layouts require no JavaScript.
- Retain automatic allocation, exact refinements, nested rulers, fallbacks, and row-budget safeguards within the included layouts. Changed build requirements prompt a rebuild; source counts and exact values remain adjustable.
- Load the compiler in a worker only when requested, reject stale results, and retain the full-stylesheet workflow when compilation is unavailable.
- Preserve focused controls while the preview rescales in short windows, and document custom-build usage and boundaries.
- Validate actual downloads, no-script rendering, and browser minification in Chromium, Firefox, and WebKit; audit the static worker dependencies in the package archive.

## 0.5.0 — explicit layouts and ruler-based composition

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.0/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.0/css/main.min.css)

Graph Paper 0.5.0 replaces the `grid_*` / `set_*` / `flow_*` and band-based authoring API with explicit layouts and independently selected viewport transitions. Existing 0.4 markup needs migration; this is not a drop-in class rename. The versioned 0.4 reference remains available under `css/legacy/0.4/`.

- 102 layout selections: Stack, five repeating Peers, seventeen Two, forty-six Three, twenty-five Four, and eight exact-count mosaics.
- Mobile-up viewport steps at 30, 40, 48, 64, 80, and 96rem. Layout, allocation, traversal, gutters, padding, and vertical spacing carry forward independently.
- Automatic direct-item counting, proportional regions, exact physical count refinements, and explicit first/last spanning endpoints for two-region layouts. Native source and focus order remain unchanged.
- A 64-bit ruler with explicit assigned-track continuation and local rebasing. Full, Neat, Thin, Wide, and Ruled fields; mosaics support Neat and Thin.
- Zero/one/two-bit padding and vertical-spacing utilities. Thin mosaics use percentage-based vertical gutters without ruler measurement. Column rules retain explicit measurement and ownership.
- A shared 9,998-construction-row budget stacks over-budget coupled allocations in source order, consistently across browsers. Safe source or layout changes restore composition automatically.
- Readable, minified, and optional layered builds with zero-specificity selection and placement. No runtime layout JavaScript or compatibility aliases for the former API.
- A configurator for the new API, library-focused examples, migration guidance, ruler-aligned documentation, and an optional inspector scoped to the legacy 0.4 API.
- Chromium, Firefox, and WebKit qualification, bounded real older-browser fallbacks, deterministic/package checks, and recorded size/runtime assessments.

## 0.4.1 — documentation and configurator

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.1/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.1/css/main.min.css)

The CSS builds and authoring API are unchanged from 0.4.0. These updates improve documentation and exploration tooling.

### Documentation

- Refined paper-and-ink identity shared with the configurator: eight site-only
  color roles, a consistent wordmark, reading typography, and quieter editorial
  boundaries. Source and diagnostic colors retain their independent meanings.
- Task-oriented learning guides, class reference, troubleshooting, and a manifest-generated recipe catalogue, with an implementation checklist for human and agent authors.
- Site-level composition guidance and a companion inside-out/outside-in essay.
- Shared Graph Paper navigation and page-wide composition, recurring reading tracks, typographic measures, and deliberate wider reference views.
- Deterministic static HTML from maintained Markdown, with a full-height ruler toggle that remembers its state. The 0.2.3 comparison renderer remains isolated from modern CSS.

### Configurator

- Floating Preview controls and Composition panel with independent docking, keyboard hide/restore, and contextual help.
- Illustrated recipe, position, flow, gutter, and band choices; compatible selections are preserved, equivalent choices remain selectable, and unavailable combinations explain the next action.
- Source-count controls, paired responsive previews, proportional-width cues, applied classes, and copyable markup without tool-only styling.
- Independent visual aids, measured geometry, shared-scale band timelines, exact transition-testing widths, and a working rule-color example. Configuration changes preserve preview width and content nodes.

### Accessibility

- Radio-group keyboard navigation, concise names and descriptions, restrained announcements, and focus handling for nonmodal floating controls.
- Narrow-screen adaptations, forced-color checks, and source-number labels that do not rely on color alone. Automated coverage does not replace manual assistive-technology testing.

### Validation

- Reproducible documentation builds, local links and anchors, and manifest-backed catalogue checks.
- Cross-browser structural and interaction coverage for the configurator and documentation, including ruler geometry, preview independence, recurring reading edges, and representative page layouts through 2560px.

## 0.4.0 — authoring defaults and response bands

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.0/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.0/css/main.min.css)

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

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.3.0/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.3.0/css/main.min.css)

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

[Readable CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.2.3/css/main.css) · [Minified CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.2.3/css/main.min.css)

The stylesheet is also retained byte-for-byte at `css/legacy/main.css` for migration and regression comparisons.
