# Getting started

Graph Paper composes content into responsive editorial layouts. It supplies horizontal relationships and placement—not typography, cards, image treatments, or an application shell. Use it when you want a constrained catalogue of compositions rather than designing every grid from scratch.

Version 0.4.1 updates the documentation and configurator without changing the CSS or authoring API from 0.4.0, a preview of the 1.0 architecture. Examples intentionally remain pinned to 0.4.0 CSS and also work with 0.4.1. Bands remain experimental. See [releases](releases.html) for details.

## Load the CSS

Use the pinned 0.4.0 CSS, unchanged in 0.4.1:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.4.0/css/main.min.css">
```

Or copy `css/main.min.css` from your chosen checkout and serve it locally. No runtime JavaScript, package installation, or framework integration is required. The configurator is optional documentation tooling, not a script your site must load.

Modern core requires container queries, container units, and column subgrid. Check [browser support and builds](browser-support.md) before adopting it. Do not load the legacy compatibility profile alongside modern core.

## Make a first composition

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03 set_03 stories">
    <article><h2>Lead story</h2><p>Your primary content.</p></article>
    <article><h2>Related story</h2><p>Supporting content.</p></article>
    <article><h2>Another perspective</h2><p>Additional content.</p></article>
  </section>
</div>
```

The canvas starts the coordinate system and responsive context. Its direct-child field selects the usable width and gutters. The recipe, `grid_03`, defines broad regions; `set_03` places three direct children. No flow class is needed for the default placement.

The elements are semantic choices: `section` and `article` are not required tags. The nesting and direct children are important. An extra wrapper around all three articles would become the single item the field places.

## Add your own treatment

Load your project stylesheet after core. For example:

```css
.stories { row-gap: 1.5rem; }
.stories > article { margin-block-end: 1.5rem; }
.stories h2 { margin-block: 0 .5rem; }
.stories p { margin-block: 0; max-inline-size: 65ch; }
.stories img { display: block; max-inline-size: 100%; block-size: auto; }
```

These are example host styles, not required Graph Paper defaults. The margin keeps stacked articles separated when the field becomes block flow; row gaps separate grid rows in wider states. Tune both to your design. Core intentionally supplies neither.

Keep horizontal gaps and padding off the canvas/field grid itself. Put component padding, backgrounds, and text treatments inside its items. See the [class reference](class-reference.md) for the geometry contract.

## Check narrow and wide

With the default root font size, this example is stacked below 480px of **canvas width**, compact from 480px, and expanded from 960px. The actual thresholds are 30rem and 60rem; they are not fixed pixel promises or viewport queries.

Resize the parent container, not just the browser window. Verify source-order reading when stacked, the compact arrangement, and the expanded proportions. A recipe family name is not a column-count guarantee at every width.

[Open this example in the configurator](configurator.html?grid=grid_03&set=set_03&flow=default&items=3&field=wide&width=1024). Compare the illustrated states, test transitions, and copy markup without example-only styling.

## Choose the next step

- [Authoring compositions](authoring.md): choose relationships that suit actual content.
- [Class reference](class-reference.md): look up exact class placement and defaults.
- [Responsive design](responsive-design.md): understand compact layouts and optional bands.
- [Troubleshooting](troubleshooting.md): diagnose unexpected placement or uncomfortable content.
- [Implementation checklist](authoring.md#implementation-checklist): a compact contract for humans and coding agents.
