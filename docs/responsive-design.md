# Responsive design

Graph Paper responds to the width available to a canvas, not necessarily the browser viewport. A sidebar, a full-width page, and an independently nested composition can therefore reach different responsive states on the same screen.

## Understand the default sequence

| State | Default canvas width | What to expect |
| --- | --- | --- |
| Stacked | Below 30rem | Items read in source order using block flow. |
| Compact | At least 30rem and below 60rem | The recipe/set/flow uses its simplified arrangement; grid-only occupancy uses pairs. |
| Expanded | At least 60rem | The recipe's expanded proportions and placement apply. |

At a 16px root font size, 30rem is 480px and 60rem is 960px. They are canvas-width transitions, not viewport media queries. There is no requirement to fix canvas width; in your site it normally follows its container.

The `grid_*` class names the responsive recipe as a whole. `grid_03*` has three expanded macro regions but can have a different compact arrangement. The compact design is not separately selectable through the current API.

## Know what changes the response

Without a band, all fields use the default canvas thresholds. Changing a field changes insets and gutters but does not create a new query container or move those default thresholds.

With a band, the selected recipe, field, set, and flow determine the narrowest defined positions, and therefore the transition widths. Changing those choices can change when the composition shifts. Two fields inside one canvas can use different bands and transition at different widths.

A subgrid continues alignment without creating a responsive context. A nested canvas starts an independent context based on its own available width. See [Alignment and nesting](alignment.md).

## Adjust timing with an optional band

A band requests a minimum useful structural slot width. Here, a slot is a defined item position, which can span one or more macro regions; it does not necessarily mean a single macro region. Graph Paper calculates transition widths from the narrowest defined positions in the expanded and compact layouts. It does not measure text, images, or padding.

| Selection | Minimum slot width | Stylesheet |
| --- | --- | --- |
| No band class | Fixed 30rem / 60rem transitions | Core only |
| `gp_band--01` | 12rem | Core plus bands |
| `gp_band--02` | 16rem | Core plus bands |
| `gp_band--03` | 20rem | Core plus bands |

```html
<link rel="stylesheet" href="css/main.min.css">
<link rel="stylesheet" href="css/bands.min.css">
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03 gp_band--02">
    <article>Lead</article>
    <article>Support</article>
    <article>Support</article>
  </section>
</div>
```

Apply one band to the recipe-bearing field, not to individual items or the canvas. Bands replace the default thresholds; they do not add another viewport condition. Their scale is experimental and available since 0.4.0.

For this example, compact starts at 37rem and expanded at 57rem. A larger band generally asks the layout to simplify earlier as width shrinks. Compared with the defaults, however, a band can move either threshold in either direction. If compact and expanded thresholds coincide, the compact interval is skipped.

All defined positions count, including empty ones. Extra fallback items do not redefine the named recipe's minimum. Stacked mode cannot promise the requested minimum when the canvas itself is narrower than it.

## Evaluate success rather than just a transition

A successful adjustment preserves the wider arrangement while its limiting content region remains useful, then switches to a simpler arrangement that actually relieves the pressure.

An unsuccessful adjustment can be mechanically correct: it might stack too early, keep uncomfortable narrow text too long, or expose a compact arrangement that is unsuitable for the material. Change treatment or recipe rather than expecting the band to choose a different design.

Test the full width range. A band can change the future transition policy without changing the arrangement at the width you happen to be viewing.

## Inspect in the configurator

The Responsive design diagrams compare policies on one canvas-width axis. The solid line is the current preview width; dashed lines mark the default 30rem and 60rem references. Preview controls' Test transitions actions resize just below or above the selected policy's actual boundaries.

Changing a setting does not automatically resize the preview. Its current pixel width is a tool setting, not a fixed-width class copied into your site. Use [Configurator help](configurator-help.html) for interface details and the [band reference](responsive-bands.md) for calculations and custom-build calibration.
