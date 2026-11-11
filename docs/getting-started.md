# Getting started

Graph Paper provides section-level composition tools for building site-level spatial continuity. It supplies ruler-aligned spatial arrangements while your site supplies typography, content treatments and visual identity.

These instructions describe **Graph Paper 0.6.0**. The 0.4 releases use a different API; see [Migration](migration.md).

## Load one stylesheet

Serve the current build from your project:

```html
<link rel="stylesheet" href="css/main.min.css">
```

For version-pinned CDN delivery:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.6.0/css/main.min.css">
```

Use `css/main.css` for readable source or `css/main.layer.min.css` when you want the core in the `graph-paper` cascade layer. Choose one. No JavaScript or optional tool is required. Pin an exact release when publishing a production site; do not point the new markup at a 0.4 stylesheet.

## Start with meaningful source order

```html
<section class="gp_ruler gp_layout--stack
                gp_md--two-3-2 gp_spacing--neat
                gp_vertical-spacing--1">
  <article class="gp_pad"><h2>Ruler</h2><p>Establish shared coordinates.</p></article>
  <article class="gp_pad"><h2>Fields</h2><p>Select usable space and gutters.</p></article>
  <article class="gp_pad"><h2>Layouts</h2><p>Choose relationships and proportions.</p></article>
</section>
```

`gp_ruler` establishes 64 local tracks. `gp_layout--stack` starts with one column. From a **48rem viewport**, `gp_md--two-3-2` selects two physical regions, left wider than right. Three source items allocate as one on the left and two on the right; source order is unchanged. The layout keeps using the element's available width, which can be narrower than the viewport.

Neat spacing uses the 60-bit field with touching internal edges. `gp_pad` optionally adds one bit inside each item; `gp_vertical-spacing--1` optionally separates items beginning below the top row. They are separate choices. Omit them when your components already supply the intended spacing.

## Choose the relationship before refinements

Use [the configurator](configurator.html) to choose a layout type, number of columns, width relationship and proportion. Its preview shows the actual item count and selected viewport sequence. Copy HTML and replace the placeholders with content.

| Content relationship | Starting choice |
| --- | --- |
| A single reading sequence | `gp_layout--stack` |
| Comparable records continuing in rows | `gp_layout--peers-2` through `peers-6` |
| Consecutive source groups in two, three or four regions | `gp_layout--two-*`, `three-*`, `four-*` |
| An interlocking composition with an exact item count | `gp_layout--mosaic-6` through `mosaic-13` |

For a left-led composition, `two-3-2` is a plausible first choice. For a centered lead and exactly three items, try `three-1-2-1` with `gp_traversal--center-first`. Proportions name physical left-to-right widths; traversal decides which region receives the first source run.

## Decide when it changes

```html
<section class="gp_ruler gp_layout--stack
                gp_md--two-3-2 gp_lg--three-1-2-1
                gp_lg-traversal--center-first
                gp_spacing--wide">
  <article>First source item.</article>
  <article>Second source item.</article>
  <article>Third source item.</article>
</section>
```

This stacks below 48rem, uses two regions from 48rem, and three from 64rem. No implicit compact arrangement or band chooses those transitions. Test the narrowest important region with actual content before selecting a threshold. See [Responsive design](responsive-design.md).

## Verify before refining

Resize across both sides of every selected transition. Check source and focus order, text length, image treatment, larger text and the actual composition width. Change grouping or content treatment when a layout cannot express the intended relationship; a new ratio cannot undo a DOM grouping decision.

The library counts **direct element children**, including hidden ones. Comments, text nodes and grandchildren do not increase that count. You do not need a `set_*` class or an author-maintained item-count variable. [Class reference](class-reference.md) covers allocation, traversal, exact counts and fallbacks; [Alignment and nesting](alignment.md) explains wrappers.

## Optional column lines

The 0.6.0 core retains ruled gutter spacing but draws no lines. For column rules, add the matching-version [column-rules extension](class-reference.md#column-rules-extension) after core. The configurator supplies both CDN links, or bundles the extension into a custom download. No extension is needed for ordinary layouts, padding, or vertical spacing.
