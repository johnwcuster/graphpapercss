# Spatial continuity, section by section

Graph Paper provides section-level composition tools for building site-level spatial continuity. Choose ruler-aligned relationships, keep meaningful source order, and supply your own typography, images and component styling.

## Start with a spatial relationship

Use the [configurator](configurator.html) to compare physical proportions, allocation, source traversal and explicit viewport transitions. Copy a configuration into your own content; no configurator JavaScript is needed on the finished page.

For a first implementation, start with [Getting started](getting-started.md). If you already know the rendered relationship you want, use [Class reference](class-reference.md#layout-catalogue) to locate the family and nearby ratios.

## Learn, look up, maintain

- **Learn:** [Authoring compositions](authoring.md), [Composing a site](site-authoring.md), [Responsive design](responsive-design.md), [Alignment and nesting](alignment.md), and [Edges and mixed spacing](edges-and-spacing.md).
- **Look up:** [Class reference](class-reference.md), [Architecture](architecture.md), [Troubleshooting](troubleshooting.md), [Browser support and builds](browser-support.md), and [Configurator help](configurator-help.md).
- **Maintain:** [Migration](migration.md), [Validation](validation.md), [Contributing](contributing.md), and [Releases](releases.html).

## One ruler, explicit decisions

A ruler establishes coordinates. A layout selects physical proportions and an arrangement; direct items are counted automatically. Gutters, item padding and vertical spacing are independent. Viewport aliases say when another design begins. Nested content can continue assigned parent tracks or rebase to 64 new local tracks.

The result is a constrained vocabulary for composition, not a theme or an automatic content designer. The library does not infer readable widths, crop images, pack a viewport or fix an unsuitable source grouping. Your design still needs realistic content and editorial judgment.

## Release status

These pages document **Graph Paper 0.5.1**. Use the matching [0.5.1 stylesheet](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.1/css/main.min.css) with the examples. Earlier 0.4 markup follows a different API; see [Migration](migration.md).

Existing tags remain unchanged. Use [Migration](migration.md) and the [0.4 reference](configurator-0.4.html) for existing pages. Structural qualification covers Chromium, Firefox and WebKit. Runtime policy, manual assistive-technology review and release metadata remain separate gates; the documentation does not claim that release is already complete.
