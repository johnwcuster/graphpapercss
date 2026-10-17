# Alignment and nesting

Use subgrid to continue an existing alignment through a wrapper. Use a nested canvas to start an independent composition. Neither is necessary simply to group text or add component padding.

## Choose what should be inherited

| Need | Choice | Consequence |
| --- | --- | --- |
| Ordinary content inside an item | Normal semantic markup | No additional ruler or placement contract |
| Descendants aligned to the tracks occupied by a wrapper | `gp_subgrid` | Inherited tracks and the existing responsive context |
| An inner recipe that responds to its own available width | Nested `gp_canvas` plus a new field | A new 64-bit ruler and independent responsive context |

Starting another canvas does not preserve parent bit size. Continuing a subgrid does not make the wrapper's width the new breakpoint reference.

## Continue tracks through a semantic wrapper

This two-region example places a semantic wrapper in the first region. Its heading and description align one inherited bit inside the wrapper's edges. That inset stays tied to the outer ruler, rather than being recalculated as a fraction of the wrapper:

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_02">
    <article class="gp_subgrid">
      <h2 class="gp_place" style="--gp-column-start: 2; --gp-column-end: -2">Main story</h2>
      <p class="gp_place" style="--gp-column-start: 2; --gp-column-end: -2">Its description.</p>
    </article>
    <aside>Related material</aside>
  </section>
</div>
```

In expanded and compact states, the wrapper occupies one region of this grid-only recipe. Local line `1` is its first inherited line; `-1` is its last. Selecting `2 / -2` leaves one inherited track at each side. Those tracks retain the outer canvas's bit size. Local line `1` is not the first line of the outer canvas unless the wrapper happens to start there.

Below the default compact threshold, this field and its subgrid use block flow: the grid-line inset no longer applies. The heading and paragraph read normally before the related material. The wrapper does not introduce a separate query container.

This demonstrates a shared inset, not a second composition recipe. To place descendants on other internal spans, select integer local lines from the wrapper's actual inherited tracks and verify those lines in every responsive state. A wrapper's track count can change when its placement changes. There is no automatic inner recipe attached to `gp_subgrid`. Use `1 / -1` instead if descendants should span the whole wrapper.

## Start an independent inner composition

Here the first outer item is itself a canvas. Its two inner items respond to that item's width, rather than the outer page's width:

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_02">
    <div class="gp_canvas">
      <section class="gp_field gp_field--neat grid_02">
        <article>Inner first item</article>
        <article>Inner second item</article>
      </section>
    </div>
    <aside>Outer supporting material</aside>
  </section>
</div>
```

The inner field explicitly selects neat geometry. Its 64-bit ruler belongs to the inner canvas; its bits are smaller than outer bits when that canvas is narrower. The inner content can remain stacked while the outer composition is expanded.

That is success if the inner items need room to read independently. It is the wrong choice if the goal was to keep their edges on the outer ruler. Use subgrid for that goal instead.

## Check the boundary with real content

For subgrid, check which parent lines the wrapper actually inherits and how they change in compact mode. Do not assume every wrapper inherits all 64 tracks. For nested canvases, inspect inner and outer transition widths separately; nesting can create a narrow context that stays stacked much longer than expected.

Keep reading order sensible in both cases. Neither technique measures content or promises that a structurally correct arrangement has a comfortable text measure. The [architecture](architecture.md) explains the underlying coordinate model, and the [class reference](class-reference.md) documents explicit adjustments.
