# Responsive design

Graph Paper 0.5 uses explicit mobile-up **viewport transitions**. A selected layout retains its proportions as its available width changes; it does not contain an automatic compact alternative. The published 0.4.1 API used a different response model, described only in [migration guidance](migration.md).

## Select a layout at a threshold

```html
<section class="gp_ruler gp_layout--stack
                gp_md--two-3-2 gp_xl--three-1-2-1
                gp_xl-traversal--center-first
                gp_spacing--neat gp_xl-spacing--thin">
  <article>First.</article>
  <article>Second.</article>
  <article>Third.</article>
</section>
```

Below 48rem the items stack. From 48rem they use a two-region 3:2 composition. From 80rem they use three regions, a wider center and center-first traversal. Thin gutters begin at that same threshold because they are explicitly selected there.

| Prefix | Minimum viewport width | At a 16px initial font size |
| --- | ---: | ---: |
| `xs` | 30rem | 480px |
| `sm` | 40rem | 640px |
| `md` | 48rem | 768px |
| `lg` | 64rem | 1024px |
| `xl` | 80rem | 1280px |
| `2xl` | 96rem | 1536px |

Queries use `min-width`: the new selection applies at the threshold itself. These pixel equivalents are reference values, not a guarantee under different browser initial font settings. Changing `html` font size is not a reliable way to move rem-based media-query thresholds.

## Carry forward each decision independently

Layout, spacing, allocation, fewer-item direction, traversal, arrangement, padding and vertical spacing each keep the latest matching value. Class attribute order does not determine breakpoint priority.

```html
<section class="gp_ruler gp_layout--stack gp_sm--two-3-2
                gp_sm-allocation--stronger gp_lg-allocation--closest
                gp_spacing--neat gp_lg-spacing--wide
                gp_vertical-spacing--1 gp_xl-vertical-spacing--0">
  <article class="gp_pad gp_md-pad--2 gp_xl-pad--0">Content.</article>
  <article>Content.</article>
  <article>Content.</article>
</section>
```

The two-region layout starts at 40rem and persists. Allocation returns to Closest at 64rem. Item padding becomes two bits at 48rem and zero at 80rem. Vertical spacing independently resets to zero at 80rem.

Exact-count inputs follow the same scale, for example `--gp-md-exact-count-left`. Omission carries forward; an explicit zero replaces an earlier value and makes the tuple ineligible, restoring automatic allocation. See [exact physical counts](class-reference.md#exact-physical-counts).

## Test available width rather than assuming it

Viewport conditions select the design; the actual element width supplies its ruler. A composition inside a sidebar can therefore activate a large-screen layout while occupying only a small part of a wide screen. That is an authoring concern, not an automatic content-pressure calculation.

Identify the narrowest important region and test whether its intended treatment remains useful. Then adjust the threshold, the ratio, the presentation or the grouping. The library does not inspect text, enforce a universal minimum readable width or prohibit structurally valid narrow layouts.

The configurator's viewport sequence tests authored thresholds. Its width control changes the simulated viewport; it is a preview control rather than another class in the copied HTML. A real page may give the same layout a narrower container.

## Add a component-specific condition when needed

A component can select the same public layout tokens under author-owned CSS conditions. Keep a recognized layout class to activate participation:

```html
<div class="feature-context">
  <section class="gp_ruler gp_layout--stack feature">
    <article>Lead.</article>
    <article>Support.</article>
  </section>
</div>
```

```css
.feature-context { container: feature / inline-size; }
@container feature (min-width: 42rem) {
  .feature { --gp-layout: var(--gp-two-3-2); }
}
```

The wrapper measures available width; the inner composition selects an arrangement. Inline-size containment has sizing consequences, so put it on an intentional host wrapper. Graph Paper supplies no `gp_cq-*` selection family or automatic measurement on every ruler. Ordinary component selectors override the zero-specificity library selectors; removing them restores class selection.

## Make fallback intentional

A selected but ineligible mosaic stacks; it does not recover a previous viewport layout. Underfilled Three/Four compositions also stack. Native feature fallbacks are capability safeguards, not another editorial breakpoint. Use a smaller-screen layout explicitly rather than relying on an invalid selection to create it.

Check threshold minus one pixel, the threshold, and threshold plus one; then test continuously between them, with long content and enlarged text. Verify focus order as well as appearance. See [Browser support and builds](browser-support.md) for qualification limits.
