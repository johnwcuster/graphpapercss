# Legacy 0.4 response bands

**This page describes the previous API only.** `gp_band--01` through `--03` were available since 0.4.0 with the matching optional bands stylesheet. They are not part of the 0.5 core and must not be loaded to configure new layouts.

## What the old bands did

The 0.4 implementation combined recipe geometry, canvas width and a provisional minimum-slot scale to choose bundled stacked, compact and expanded arrangements. Changing a band could move both transition widths. The constraint protected defined recipe slots, not measured text.

The current API instead lets the author select each arrangement and its activation threshold explicitly. There is no direct band-to-prefix rename because the intermediate design is now also an author choice. See [Responsive design](responsive-design.md) and [Migration](migration.md).

## Keep an existing 0.4 page working

```html
<link rel="stylesheet" href="css/legacy/0.4/main.css">
<link rel="stylesheet" href="css/legacy/0.4/bands.css">
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03 gp_band--01">
    <article>First.</article><article>Second.</article><article>Third.</article>
  </section>
</div>
```

These paths are the versioned reference in the current checkout. A published site can also retain its exact pinned older release. The [0.4 configurator](configurator-0.4.html) remains available for comparison. Do not combine this stylesheet pair with the new core.
