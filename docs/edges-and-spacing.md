# Edges and mixed spacing

A useful alignment can occur at a background edge, a region edge or a text inset. Decide which edge should relate before choosing a gutter mode. Mixing spacing modes is supported; it does not imply that every kind of edge will coincide.

## Name the edge

| Edge | What it describes |
| --- | --- |
| Surface edge | The visible background, image or color block |
| Region edge | The grid area assigned to an item |
| Content edge | The inset at which its text or other content begins |

Neat can make adjacent surfaces touch while `gp_pad` moves their content inward. Wide separates the region edges themselves. An overlay can keep a full-region image while padding only its text layer. The host supplies overlay positioning, image crop and contrast treatment.

## Compare Neat and Wide deliberately

On a 64-bit ruler, Neat spans bits 2–62 with no internal gap. Wide spans bits 3–61 with two-bit internal gutters. For equal three-region divisions, insetting each Neat item by one bit makes its content edges meet the Wide region edges:

| Mode | Physical intervals, zero-based ruler bits |
| --- | --- |
| Neat `three-1-1-1` | 2–22, 22–42, 42–62 |
| Wide `three-1-1-1` | 3–21, 23–41, 43–61 |

This is **not a universal conversion**. Unequal proportions use cumulative whole-bit rounding after gutter space is deducted; one-bit padding on every Neat item can differ from the corresponding Wide region. Check the chosen recipe and field rather than assuming the inset relationship.

## Separate the three spacing decisions

```html
<section class="gp_ruler gp_layout--peers-3 gp_spacing--neat
                gp_vertical-spacing--1 gp_lg-spacing--wide">
  <article class="gp_pad gp_lg-pad--0">Content.</article>
  <article class="gp_pad gp_lg-pad--0">Content.</article>
  <article class="gp_pad gp_lg-pad--0">Content.</article>
</section>
```

Gutters separate physical regions. Padding moves content inside each item. Vertical spacing separates lower item starts by one or two assigned bits while preserving content-sized construction rows. Each decision can change at a viewport independently. The explicit zero padding reset above avoids unintentionally carrying the smaller-screen treatment into the wider one.

Do not use native `row-gap` to imitate the utility on overlapping construction rows. It inserts space between every construction track and changes the geometry. Bottom margins, typography and component-specific spacing remain host-controlled.

## Mix fields across sections and nested layouts

Sibling sections can choose different modes on a shared ruler. A full-bleed image section might use Full, a touching dashboard group Neat, and a reading/support composition Wide. Their outer field edges intentionally differ; use the ruler toggle to identify the alignment that matters.

Inside a continued parent area, Full keeps nested content at the assigned edges. Choosing another inset creates an additional inset; it does not restore the original page field. Rebasing makes all local bit-derived spacing smaller or larger with the new ruler. See [Alignment and nesting](alignment.md).

## Draw a rule in its gutter

```html
<section class="gp_ruler gp_ruler--measure gp_layout--two-3-2
                gp_spacing--ruled article-group"
         style="--gp-rule-color:#52625f; --gp-rule-width:1px;">
  <article class="gp_rule--end">Lead.</article>
  <article class="gp_rule--end">Support.</article>
</section>
```

Ruled uses the 56-bit field and whole-bit centers in two-bit internal gutters. The ruler captures a bit length for decoration; each participant explicitly owns its end-side rule. Outer and nonexistent boundaries are suppressed. Choose only one owner per shared gutter. The public rule properties can live in author CSS instead of the inline style.

Mosaics support Neat/Thin only. Thin mosaic gutters, padding and vertical-spacing utilities use assigned-track percentages and do not need measurement. Avoid adding a measured ancestor merely to obtain those utilities.

## Keep constrained text honest

A max-width reading box can interrupt the relationship between an item's actual width and its inherited track count. Apply `gp_pad` to an appropriate full-region content layer, before that interruption, or give the constrained reading component ordinary host padding. Do not add an unimplemented helper such as `gp_inset--bit`; the shipped utility is `gp_pad`.

Column lines require the optional [column-rules extension](class-reference.md#column-rules-extension) in 0.6.0. Ruled spacing alone preserves the gutter geometry.
