# Authoring compositions

Start with what the reader should notice, understand and do. Graph Paper reduces the geometry search to a catalogue of spatial relationships; it cannot decide which relationship serves your material.

## Establish the source hierarchy

Write a meaningful source sequence before choosing a layout. A lead might be first, followed by evidence and related material. Stacking restores that sequence. Do not use positive `tabindex` values to imitate a visual arrangement: keyboard and reading order should remain intelligible from the document.

A direct child is a participant. A figure containing an image and a caption is one participant until you deliberately expose those children to a nested layout. The configurator can refine an existing composition; it does not regroup content or turn a caption into an independent participant.

## Distinguish composition from repetition

Repeating peers fill rows left to right and continue into new rows. Use them for comparable records whose sequence is naturally row-major.

Two-, three- and four-region compositions allocate consecutive source runs to columns. Reading and keyboard traversal follow the source through one run and then the next. They are not repeating grids or independent masonry columns. The library avoids shared internal subdivisions between adjacent regions where they would imply false rows, but actual content heights can still create visual ambiguities.

Mosaics supply reviewed interlocking maps for exact counts of six through thirteen. They require more deliberate source order and content treatment. Do not use one merely to accommodate a large collection; several smaller compositions may be clearer.

## Choose physical proportions and source traversal

`two-3-2` means wider left and narrower right. `three-1-2-1` means a wider center. `four-6-5-4-3` progressively narrows toward the right. These names do not declare which source item is editorially primary.

Left-to-right is the shared traversal default. Choose right-to-left for Two when the first run belongs on the right, center-first for Three when it belongs in the middle, or widest-first for unequal Four when the widest region should receive it. Three supports right-to-left at exactly three items only. Review the finished focus path, especially when it crosses several columns.

The [catalogue](class-reference.md#layout-catalogue) and configurator show nearby ratios. Prefer changing one decision at a time: width relationship, proportion, allocation, traversal or viewport timing.

## Fit the treatment as well as the layout

A long body text in a narrow supporting region may be the wrong treatment even when the geometry is valid. Alternatives include a headline and short summary linked to the full text, a different image crop, a nested image/text arrangement, or a wider supporting region. Keep meaningful content accessible; choosing a shorter presentation is an editorial decision, not permission to silently discard it.

Repeated semantic structure does not imply equal visual weight. A modest image can carry the stronger explanation while a striking image needs little text. Judge those assets together rather than assuming identical cards are the only truthful presentation.

Consider which items should determine composition height. Less prominent text should not accidentally become the binding height constraint simply because it was squeezed into the narrowest column. Above-the-fold height is a host design decision; the core supplies no viewport packing or fixed-height system.

## Author the intermediate design

A three-region composition need not become an automatic pair at a standard compact width. Select a useful smaller-screen layout explicitly. Three items might stack, form an ordinary pair of source runs, or use a two-region arrangement with the first item spanning above the supporting pair.

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

The first item spans above two supports from 40rem. Three regions begin at 64rem; the explicit `across` reset makes the arrangement intent clear. Layout and control selections carry forward independently, so include resets when changing the design. Use content and available width to choose those thresholds.

## Design for changing counts

Automatic allocation derives counts without maintaining classes per source item. It can move an earlier item to another region when the total changes. It does not promise permanent group membership.

Use the source structure to preserve genuine groups. A parent item containing seven related links is different from seven direct participants. An exact physical-count refinement is useful for a known matching count; it is not a substitute for grouping, and an invalid request returns to automatic allocation.

Underfilled Three/Four selections stack. A mismatched mosaic stacks rather than picking another map. If that is the wrong design, limit the source or choose a different layout deliberately. There is no general maximum count for ordinary compositions, but readability and focus traversal can establish a much earlier editorial limit.

## Implementation checklist

1. Write the source sequence and decide which wrappers represent real groups.
2. Choose Stack, Repeating, Composition or Mosaic.
3. Select proportions; use the configurator before inspecting raw bit coordinates.
4. Check automatic occupancy with the actual and plausible future counts.
5. Choose traversal and optional spanning endpoints without changing DOM order.
6. Add viewport transitions and explicit resets; test the limiting region at each boundary.
7. Choose gutters, vertical spacing and item padding independently.
8. Continue parent tracks or rebase only where nested content needs its own arrangement.
9. Test keyboard traversal, large text, long titles, mixed images and static HTML without tooling.
10. Revisit continuity across neighboring sections, not just the section in isolation.

Continue with [Composing a site](site-authoring.md), [Responsive design](responsive-design.md) or the [Class reference](class-reference.md).
