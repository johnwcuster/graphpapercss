# Troubleshooting

Start with the visible symptom, then check structure, classes, available width, and host styling. The [configurator](configurator.html) can help distinguish a library arrangement from styles introduced by your project.

## The example looks unstyled

That may be expected. Graph Paper supplies geometry, not a type system, card theme, image sizing, or vertical rhythm. Confirm that core CSS loaded and compare item placement at wide and narrow canvas widths. Then add your project's treatment as shown in [Getting started](getting-started.md).

## The layout stays stacked

Inspect the width of the nearest `gp_canvas`, not just the viewport. A nested canvas may be much narrower than the page. Defaults switch at 30rem and 60rem; a band may request different thresholds.

Check that the field is a direct child of the canvas, has one field modifier and a valid recipe, and is not being overridden by host `display` or track styles. If using a band, confirm that the optional bands stylesheet is loaded after core. Removing a band class is a useful diagnostic, not necessarily the final design decision.

## My wrapper broke placement

The field places direct element children. Wrapping several articles together changes them from several items into one. Headings or decorative elements added as direct children also count as items.

Keep component wrappers inside each intended item, or deliberately use a semantic wrapper as an item. Use [subgrid](alignment.md) only if the wrapper's descendants need inherited track alignment.

## Changing flow or variant does nothing

First confirm the combination exists. Then check the responsive state and actual occupied positions. Proportional differences may appear only in expanded mode; different placements can be equivalent for the occupied items. Default is an intentional selection, not an incomplete configuration.

The configurator keeps equivalent choices selectable and distinguishes them from unavailable combinations. Use it to compare all states. Do not assume that identical appearance at one width means two recipes are universally interchangeable.

## Extra items form full-width rows

With a named set, items beyond its position count use full-width fallback. Fewer items leave positions unfilled; Graph Paper does not automatically choose a new composition. Check whether your content count and selected set agree.

For a collection that should continue through the regions into later rows, omit the set class. Grid-only occupancy has sequential continuation rather than named-set fallback. See the [occupancy contract](class-reference.md#recipes-positions-and-defaults).

## Gutters or edges do not align

Check for horizontal gap, grid padding, or replacement track definitions on the canvas or field. These compete with the ruler. Check that each field has exactly one modifier and that an inner canvas was not introduced when inherited alignment was intended.

Component padding is different from structural alignment: an item can sit on the correct tracks while its text is inset. Use inspection aids to distinguish the item edge from its contents.

## A rule is missing or doubled

Rules require the ruled field and explicit start/end ownership on direct items. Choose one owner per shared gutter. Stacked items, outer edges, and responsive full-span edges intentionally suppress markers.

Check competing `::before`/`::after` styles and explicit placement overrides. Host-authored placement must also manage rule ownership; generated metadata cannot infer your custom design. See [Column rules](class-reference.md#column-rules).

## A band changes the diagram but not the layout

A band changes transition timing, not expanded proportions or the compact arrangement. The current canvas width may remain within the same state under both policies. Test either side of the new thresholds.

In the configurator, choosing a band does not resize the preview. Test transitions performs a one-time resize; later edits can move those transition targets without moving the current preview width.

## The geometry works but reading suffers

Check the narrowest important content treatment, not just the overall composition. Long text in a narrow supporting position can cause both uncomfortable measure and excessive shared-row height.

Try an appropriate excerpt or headline treatment, another recipe/set, different grouping, or a band that transitions earlier. Do not expect a band to measure text or choose another compact layout. A fallback can be structurally correct without being the right editorial design. See [Authoring compositions](authoring.md).

## An override behaves differently in a layered build

Check your cascade layer order and whether host styles are layered. Normal unlayered styles override normal layered styles. Optional bands should share the core's layer when using layered core. Do not mix the standalone compatibility profile with modern core. See [Browser support and builds](browser-support.md).
