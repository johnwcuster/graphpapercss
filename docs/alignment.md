# Alignment and nesting

Use a shared ruler when edges should relate across sections. Continue assigned tracks when descendants should preserve that rhythm. Rebase when a component needs 64 new local subdivisions. Neither nesting choice selects a responsive design by itself.

## Establish a ruler

`gp_ruler` starts 64 tracks across its available width. It can also carry a layout, or provide coordinates to direct child layouts. Give the ruler the width your page actually assigns; it need not be the full viewport or live in an extra site wrapper.

A direct participant already receives its own assigned area. A separately selected nested layout needs a wrapper so parent placement and child selection remain separate. Use the following forms rather than placing two independent layout roles on the same assigned item.

## Continue assigned tracks

```html
<section class="gp_ruler gp_layout--stack gp_md--two-3-2 gp_spacing--neat">
  <article class="gp_continue_tracks">
    <div class="gp_layout--stack gp_md--two-1-1 gp_spacing--full">
      <figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'/%3E" alt="Illustrative placeholder"></figure>
      <p>Explanation aligned to the parent's track rhythm.</p>
    </div>
  </article>
  <aside>Related material.</aside>
</section>
```

`gp_continue_tracks` belongs on the **assigned wrapper**. It exposes the tracks spanning that wrapper to an inner layout through native subgrid. If the assigned area spans 36 parent tracks, the child works with those 36 tracks; it does not receive 64 new ones. Whole-bit rounding and nonempty-span safeguards operate on that available count.

Choose Full spacing inside when you want the inner composition to reach its assigned edges. Applying another inset is deliberate: continuation does not imply that the parent should apply its outer gutter twice.

## Rebase to 64 local tracks

```html
<section class="gp_ruler gp_layout--stack gp_md--two-3-2 gp_spacing--neat">
  <article class="gp_continue_tracks">
    <div class="gp_rebase_64 gp_layout--stack gp_md--two-1-1 gp_spacing--full">
      <figure>Illustration.</figure>
      <p>Explanation using a fresh local 64-track ruler.</p>
    </div>
  </article>
  <aside>Related material.</aside>
</section>
```

The same assigned wrapper now contains a local coordinate root. Its bits are one sixty-fourth of its own area. This is useful for an article-local title/definition list or a component with a reusable internal proportion system. Its inner edges may no longer coincide with every parent bit.

`gp_rebase_64` changes coordinates, not activation conditions. `gp_md--…` inside it still means a 48rem **viewport** threshold. It does not test the nested area's width. Use author-owned component CSS when a genuine local condition is needed, as shown in [Responsive design](responsive-design.md#add-a-component-specific-condition-when-needed).

## Choose the relationship deliberately

| Need | Choice |
| --- | --- |
| Align descendants to the assigned parent rhythm | `gp_continue_tracks` and an inner layout |
| Subdivide the assigned area into 64 local tracks | Continuation wrapper, then `gp_rebase_64` with an inner layout |
| Bound prose to a comfortable reading measure | Host `max-inline-size`; a new ruler is not required |
| Draw rules with a captured ruler length | `gp_ruler--measure` on the intended coordinate root |
| Select a different arrangement at an available component width | An explicit host condition selecting `--gp-layout` |

If neither continuation nor rebasing is supplied, ordinary content remains inside its assigned item. It does not automatically gain a nested Graph Paper composition. No library class is required just to render an article's normal headings and paragraphs.

## Preserve geometry around spacing

Keep coordinate roots and continuation wrappers unpadded. Put `gp_pad` on content items or a full-region content layer. A narrower intermediate wrapper can change the percentage basis without changing inherited track metadata; apply padding before that interruption or use host spacing for the constrained text component.

Continuation and rebasing also preserve independent layout controls: parent allocation, traversal and exact-count requests do not become child selections. Test nested arrangements at their actual assigned width, including narrow sources and source-count changes. See [Edges and mixed spacing](edges-and-spacing.md).
