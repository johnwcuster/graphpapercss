# Migrating to 0.6

The 0.5 API, introduced in 0.5.0 and unchanged in **0.5.2**, is a deliberate authoring change from the published **0.4.1** release and its byte-identical **0.4.0** CSS. This is not a drop-in class rename. Proportions remain ruler-aligned, but response, occupancy and nesting are expressed differently.

## Upgrade from 0.5.2

**0.6.0** preserves layout classes and geometry. Column lines now require the optional extension, loaded after a core stylesheet from the same release:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.6.0/css/main.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.6.0/css/extensions/column-rules.min.css">
```

Keep existing `gp_spacing--ruled`, `gp_ruler--measure`, and rule-owner classes. Without the extension the 56-bit field and gutters remain, but lines and rule-related positioning are absent. Other layouts need no markup changes. Custom CSS exported by the 0.6 configurator already bundles the extension when needed; rebuild older custom exports to adopt this split. See [Column rules and layering](class-reference.md#column-rules-extension).

## Choose a version boundary

Use the root `css/main*.css` builds for new markup. To keep an existing 0.4 page running during migration, use a pinned 0.4 release or `css/legacy/0.4/main.css` with its matching legacy bands if needed. Do not load both cores onto one document. An isolated frame is appropriate for a side-by-side comparison.

The versioned reference retains original 0.4 CSS bytes, including layered builds and optional bands. The portable inspector remains a 0.4 tool, exposed through `graphpapercss/legacy/0.4/inspector`; it does not edit the new layout API.

## Translate the decisions

| Previous expression | New decision |
| --- | --- |
| `gp_canvas` | Establish coordinates with `gp_ruler` |
| `gp_field gp_field--wide` | Select a layout and apply `gp_spacing--wide` on it |
| `grid_*` and numbered/letter variants | Choose an explicit physical ratio such as `two-3-2` or `three-1-2-1` |
| `set_*` | Direct participants are counted automatically; choose composition or repetition intentionally |
| `flow_*` | Choose traversal, allocation or a spanning arrangement according to the intended relationship |
| Bundled compact behavior | Select another layout at an explicit viewport threshold |
| `gp_band--*` | Choose transition timing, or use author-owned conditions where needed |
| `gp_subgrid` | Use an assigned `gp_continue_tracks` wrapper before the inner layout |
| Nested canvas | Use a continuation wrapper and `gp_rebase_64` for 64 new local tracks |

No one-to-one mapping is promised for grid/set/flow combinations. Inspect the rendered source hierarchy, physical widths and compact behavior, then choose the new expression in the configurator.

## Re-author a small composition

The old shape might have been:

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03">
    <article>Lead.</article><article>Support.</article><article>Support.</article>
  </section>
</div>
```

A new choice could be:

```html
<section class="gp_ruler gp_layout--stack
                gp_sm--two-1-1 gp_sm-arrangement--first-above
                gp_lg--three-1-2-1 gp_lg-arrangement--across
                gp_lg-traversal--center-first gp_spacing--wide">
  <article>Lead.</article>
  <article>Support.</article>
  <article>Support.</article>
</section>
```

This deliberately chooses a full-width lead above supports from 40rem, then a centered lead in three regions from 64rem. It illustrates design intent, not geometry parity with every old `grid_03` configuration. Set thresholds using the actual content and available widths.

## Revisit assumptions about occupancy

Automatic counts can change which earlier items belong to a region. Use nested source groups when membership is semantic. Exact physical-count requests can refine known source totals; invalid requests return to automatic allocation rather than hiding content.

Underfilled Three/Four layouts stack. Empty supporting regions are not reserved by applying a larger layout to one item. If a reading component needs a narrower measure, use host typography constraints within a sensible field. Reassess older one-position layouts that relied on unoccupied named slots.

## Move spacing deliberately

Gutters are selected independently of item padding and vertical spacing. Ordinary compositions supply no implicit row gaps. Use `gp_pad`, `gp_vertical-spacing--0/1/2` and their responsive aliases only where intended, or retain component-owned spacing.

Thin mosaics have a one-bit lower-start margin by default; explicit vertical spacing replaces it. Ruled decoration needs explicit rule owners and `gp_ruler--measure`. Mosaics do not support Ruled.

## Retest nesting and response

Continuation preserves the assigned parent track count; rebasing makes 64 new tracks. Neither introduces a local breakpoint. Viewport prefixes continue to respond to viewport width inside a narrow component. Component-owned CSS can select named layout tokens under an intentional local condition.

Check source/focus order, every authored threshold, long content, changed counts, rule ownership, utility resets and nested isolation. The [Class reference](class-reference.md) documents the exact contracts.

## Earlier 0.2.3 migration record

The [frozen 0.2.3 reference](legacy-reference.html), [twelve whole-bit adjustments](geometry-record.html) and [visual comparisons](geometry-changes.html) describe migration from 0.2.3 to the 0.4 ruler implementation. They are retained historical geometry evidence, not a promise that 0.5 reproduces old recipe IDs.

The sole original 0.2.3 baseline remains `css/legacy/main.css`. The new 0.5 catalogue is validated against its own reviewed geometry and composition contracts. Published release tags remain unchanged.
