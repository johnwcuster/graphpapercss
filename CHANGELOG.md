# Release notes

## 0.4.1 — documentation and configurator

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
