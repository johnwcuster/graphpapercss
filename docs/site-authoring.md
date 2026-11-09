# Composing a site

Graph Paper provides section-level composition tools for building site-level spatial continuity. Readers experience alignment through transitions between sections, so a useful page design needs recurring relationships as well as locally successful grids.

## Establish coordinates without assuming a shell

```html
<main class="gp_ruler">
  <nav class="gp_layout--stack gp_lg--three-1-2-1 gp_spacing--wide">
    <div class="gp_pad">Site identity.</div>
    <div class="gp_pad">Learning links.</div>
    <div class="gp_pad">Reference links.</div>
  </nav>
  <div class="gp_layout--stack gp_lg--two-1-3 gp_spacing--wide">
    <nav class="reading-contents" aria-label="On this page">Article links.</nav>
    <article class="reading">Title, headings and paragraphs.</article>
  </div>
</main>
```

The page ruler can occupy the available screen width. Wide spacing establishes outer insets; navigation expresses real relationships among three groups. A maximum-width site shell remains legitimate when the project needs one, but it is not a prerequisite for the library.

## Establish a recurring reading position

This documentation site uses one Wide field. Below 64rem, the contents and article stack. At 64rem, a `two-1-3` layout puts contents on the left and the normal-flow article on the right. The article's title, prose and ordinary tables share a reading position. Its maximum width follows typography, rounded down to whole ruler bits:

```css
.reading, .reading-contents {
  inline-size: 100%;
  max-inline-size: max(
    calc(100% * 2 / 58),
    round(down, 76ch, calc(100% * 2 / 58))
  );
  justify-self: center;
}
@media (min-width: 64rem) {
  .reading {
    max-inline-size: max(
      calc(100% * 2 / 42),
      round(down, 76ch, calc(100% * 2 / 42))
    );
  }
  .reading-contents { max-inline-size:100%; }
}
```

Wide supplies 58 usable bits, so `100% * 2 / 58` is two bits of the stacked grid area. In the two-column layout, the two-bit gutter leaves 56 bits; the 1:3 proportion assigns 14 to contents and 42 to the article. Its rounding step therefore uses `100% * 2 / 42`. Centering an even-bit width within either assigned region puts both edges on whole lines of the original ruler. The width stays below the `76ch` target in ordinary windows and uses the full assigned region when space is limited. The two-bit minimum prevents a zero-width result on unusually broad rulers.

This is host typography CSS calibrated to this site's fixed Wide field, not a new library measure utility. It uses percentages and CSS rounding, with no query container, captured ruler length or resize script. No empty source items or supporting columns are needed. An underfilled composition stacks; it is not a mechanism for reserving empty columns.

## Keep text in ordinary flow

An article's headings and paragraphs do not need individual grid wrappers. The outer field handles the contents/article relationship; ordinary block flow handles the reading sequence. Heading, paragraph and list margins provide typographic vertical rhythm. The site navigation's direct items use `gp_pad` for spatial padding; Wide supplies the gutter between contents and article. Code blocks and tables align with the prose rather than adding unrelated horizontal padding.

The contents navigation is sticky on reading pages when the window has sufficient width and height. In narrow or short windows it scrolls normally, so zoom does not leave a pinned block consuming the available space. Sticky behavior and its bounded scrolling are site CSS, independent of Graph Paper's placement.

```css
.reading-contents { align-self: start; }
@media (min-width: 64rem) and (min-height: 40rem) {
  .reading-contents {
    position: sticky;
    top: 1rem;
    max-block-size: calc(100dvh - 2rem);
    overflow: auto;
  }
}
```

The article remains a text block rather than a continued subgrid. A snapped outer edge does not make its descendants grid participants or update inherited track metadata to its narrower width. Apply ruler-relative padding to actual participants before that width constraint; use an explicit new composition when content genuinely needs columns.

## Widen for a task, not a tag

A small table belongs with the explanation that makes it meaningful. It should not become a screen-wide interruption merely because it is a table. The dense class-reference page uses the full article region for its tables, with sticky contents on the left when the window has sufficient space. Its prose retains a readable line cap and shares that region's left edge. Other reading pages keep the snapped `76ch` target throughout; no per-heading breakout grids are required.

Wide diagrams, image comparisons and dense reference data can justify the same departure. Returning to the shared reading position afterward helps the reader recognize the transition.

## Let sections choose real arrangements

Some sections need a lead with supporting material; others need equal repeated links. Use a small set of recognizable relationships rather than applying the same layout everywhere. Keep related viewport transitions coherent, while letting content justify different timing.

Source hierarchy and treatment belong in this loop. The least prominent item's long body text should not accidentally dictate the height of a whole composition. A headline-only link can be appropriate if it is an intentional editorial presentation with access to the full material.

## Continue or rebase with intent

Use `gp_continue_tracks` when descendants need the parent's assigned rhythm, and a local `gp_rebase_64` when an article or component needs 64 new subdivisions. Neither creates a local responsive threshold. See [Alignment and nesting](alignment.md).

The configurator's preview is intentionally independent of the documentation ruler. Its simulated viewport must remain the requested width while its display scales to fit the workspace. The prose around it belongs to the page ruler; its control chrome remains ordinary application UI.

## Draw the boundary deliberately

The library owns ruler coordinates, fields, arrangements, allocation and explicit responsive selections. The site owns type, readable measure, image treatment, surfaces, sticky behavior and navigation mechanics. Optional padding and vertical-spacing utilities share the ruler rhythm where appropriate; they do not replace every component's spacing needs.

Design from the outside in to establish relationships, then from the inside out to test them against content. See [Inside-out and outside-in](inside-out-outside-in.md). A consistent page can still have purposeful changes of edge; the goal is a readable sequence, not maximal uniformity.
