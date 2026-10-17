# Responsive bands reference

Bands let an author select a minimum useful slot width without choosing device
breakpoints. They change **when** a composition transitions, not **which** compact
arrangement the recipe supplies. Available since 0.4.0, this optional feature has
a provisional scale that may change before 1.0.

Start with [Responsive design](responsive-design.md) for the stacked/compact/expanded model and authoring decisions. This page documents the optional band's calculation, limits, and custom-build calibration.

A slot is a defined item position, which can span one or more macro regions. Slot width is its structural width, not necessarily the width of a single macro region or the text inside it. Without a named set, sequential positions correspond to macro regions in expanded mode and equal pairs in compact mode.

Load the optional stylesheet after the modern core:

```html
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/bands.css">

<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03 gp_band--02">
    <article>Lead</article>
    <article>Support</article>
    <article>Support</article>
  </section>
</div>
```

Use exactly one band on a recipe-bearing field, not on its canvas or individual
items. Omitting a band preserves the 30rem compact / 60rem expanded defaults.
For layered projects, load the optional bands stylesheet in the same
`graph-paper` layer, after the layered core; an unlayered bands sheet would have
different cascade precedence.

| Class | Provisional minimum useful slot width |
| --- | ---: |
| `gp_band--01` | 12rem |
| `gp_band--02` | 16rem |
| `gp_band--03` | 20rem |

Numbers are ordinal scale positions, not measurements or column counts.
To calibrate a custom build, change the values in `src/manifest/bands.mjs` and run
`pnpm build` to regenerate CSS and configurator inspection data. No JavaScript
is needed for the actual CSS transitions.

## What a band protects

The compiler finds the narrowest item span in each selected expanded and compact
recipe. Bare grids use the narrowest macro region and compact pair respectively.
All defined positions count, including currently empty positions. This is
deliberately conservative: a band does not let you designate one limiting item
or select a different compact arrangement.

For a minimum M and a slot spanning B canvas bits, its canvas threshold is
`ceil(M × 64 / B)` rem. Whole-rem upward rounding never reduces the declared
minimum. Expanded cannot start before compact is viable; equal thresholds skip
the intermediate state. Wide-field `grid_03 set_03 gp_band--02` therefore uses
37rem for compact (28-bit slots) and 57rem for expanded (18-bit slots).

The canvas remains the responsive reference. Fields and subgrids do not create
new query containers. Two fields on the same ruler may select different bands
and transition independently; a nested canvas still rebases both geometry and
responsive context.

The minimum refers to the structural slot, not text measure after host padding.
If a reading treatment needs 16rem plus padding, include that extra room in your
choice or calibration. The library does not measure text, infer hierarchy, change
content, or diagnose excessive height. Stacking is the source-order baseline,
not a promise that a very narrow screen can supply the selected minimum.

Unsupported recipe/set/flow combinations and multiple simultaneous band classes
are unsupported. Unmatched extra children retain the
existing full-width fallback; a band does not fix a count mismatch.

## Inspect and calibrate

- [Configurator](configurator.html?grid=grid_03&set=set_03&items=3&field=wide&band=02&width=900):
  select a band, drag canvas width, inspect computed thresholds and copied markup.

Ask whether the expanded state stops at the right point, whether compact actually
relieves pressure, and whether the chosen treatment—not merely its geometry—is
still useful. Larger bands preserve more room, so generally transition earlier.

## Stylesheet cost

Bands ship separately as `bands.css` / `bands.min.css`; load them only when using
band classes. Both modern core and the band stylesheet are required. Existing
unbanded compositions are unchanged. Use `pnpm size` to inspect the core and
optional stylesheet footprints separately.
