# Composing a site

A shared ruler can organize a whole editorial page, not just individual sections. Start by choosing which relationships should repeat as the reader moves through the site: reading text, supporting material, navigation, and occasional wider views. Then give additional width a purpose rather than filling it automatically.

This guide describes an authoring approach used by this documentation site, not a required Graph Paper shell. For individual recipes, see [Authoring compositions](authoring.md); for the CSS contract, see the [class reference](class-reference.md).

For the design reasoning behind this approach, read [Inside-out and outside-in](inside-out-outside-in.md), a companion essay on moving between spatial relationships and content needs.

## Choose where the ruler begins

A page-wide canvas makes its bits a fraction of the available page width. Fields then establish insets and structural gutters. A bounded canvas is also valid when the project needs one: Graph Paper divides the width it receives, but does not prescribe that width.

These are separate decisions. Do not add a centered, fixed-width wrapper by habit, but do not avoid one when a real requirement calls for it. Ask whether backgrounds, navigation, reading, and data should share the page's coordinates, or whether the whole composition genuinely needs a bounded extent.

The documentation uses a page-width canvas. Typography limits particular reading components; there is no site-wide maximum-width container around every section. The optional ruler checkbox beneath the site name makes that distinction visible.

## Establish a recurring reading position

Choose an anchor that readers can recognize when they return from a different kind of section. It might be a field edge, a primary macro region, or a consistently bounded text container within that region. Not every section needs the same left edge, but repeated reading sections should not move accidentally.

This site's reading sections use the primary position of a center-led recipe:

```html
<link rel="stylesheet" href="css/main.min.css">
<link rel="stylesheet" href="css/bands.min.css">

<main class="gp_canvas">
  <section class="gp_field gp_field--wide grid_03c--07 set_03 gp_band--01">
    <article class="reading">
      <h1>A page title</h1>
      <p>The main reading content.</p>
    </article>
  </section>
  <section class="gp_field gp_field--wide grid_03c--07 set_03 gp_band--01">
    <div class="reading">
      <h2>The next section</h2>
      <p>Continue on the same reading track.</p>
    </div>
  </section>
</main>
```

```css
.reading {
  inline-size: 100%;
  max-inline-size: 76ch;
  justify-self: center;
}
.reading p { max-inline-size: 72ch; }
```

This recipe's default `set_03` puts the first source item in the central expanded region. Its two supporting positions are deliberately empty here. No placeholder elements are needed. In compact mode the first position spans the field; in stacked mode it reads in block flow.

The empty positions are an intentional use of a named set, not a requirement that every section contain three items. Select a different recipe if its actual occupancy or compact behavior better fits your content.

## Separate structural alignment from text measure

The recipe defines an assigned region. The host's `ch` limit bounds a reading component inside it. Those are complementary constraints: a large screen should not force long text lines merely because the ruler offers more space.

Here the bounded reading component is centered inside its primary region. Once its measure cap applies, its visible left edge is not necessarily a ruler line. Repeating the same region, font, cap, and alignment keeps that edge consistent across sections at a given width.

If literal ruler-line alignment is more important, align the component to the start of its region instead of centering it. Its text then stops growing toward the end, leaving additional whitespace there. Neither treatment is universally correct. Do not alternate between them unintentionally.

Headlines, paragraphs, code, captions, and tables need not share one measure. But independently centering each child at a different width can create several unrelated left edges. Align those children within a stable reading component unless the composition gives them a reason to depart.

## Give secondary content a job

Use supporting positions for material that explains or contextualizes the primary content: a contents list, caption, related reading, or a necessary note. An available region is not a request to invent another sidebar.

To extend the example, add a contents `nav` as the second field child; this recipe places it in the left supporting region when expanded. A third child would occupy the right supporting region. Check the actual compact and stacked sequence before adding either.

On these documentation pages, the contents list is useful support and also holds the configurator link. The right-hand space can remain quiet rather than repeating a generic invitation in another region. Source order still starts with the page's primary content.

At very wide widths, supporting regions can become distant from a measure-capped reading component. Check whether they still read as related. You can simplify the support, choose a different relationship, or bound that particular composition. Do not assume that page-wide coordinates require every component to occupy the page's full breadth.

## Widen for a task, not a tag

A table is not automatically a wide-screen composition. Small comparisons often belong on the same reading track as their heading and explanation. That avoids making readers travel to another left edge just to read three short rows.

This site's responsive-state and band-scale tables stay within the reading component. They can scroll locally when necessary at narrow widths. Dense recipe and coordinate catalogues receive a separate, wider field-based view, with a host measure limit of `128ch` rather than unlimited growth. Their explanatory headings remain on the reading track.

Consider additional width for side-by-side evidence, charts whose detail improves, or a reference workspace with genuinely dense relationships. Leave it quiet when it would only lengthen prose, spread a small table apart, or give minor content undue weight. A full-bleed surface can also share a ruler with inset content without forcing that content to become full width.

## Coordinate responsive decisions across sections

Sections can be individually valid yet feel disconnected if their related edges shift at different widths. Test the page as a sequence, not only each recipe in isolation.

Introductions and reading sections here share `gp_band--01`. With this wide-field recipe and set, compact begins at 28rem and expanded at 77rem. Sharing the policy means the primary reading position changes at the same widths in both treatments.

The band protects all defined positions, even when supporting positions are empty. This is a deliberate continuity choice, not content measurement. The band scale is experimental; the numerical policy is an example, not a universal site setting. Site navigation can use its own transitions because its content and geometry differ.

Check stacked source order, the compact arrangement, each side of transitions, enlarged root text, and very wide screens. A change of left edge can be a useful compositional event. The question is whether it signals a new task or emphasis, rather than being an accidental consequence of another wrapper or stylesheet.

## Continue or rebase with intent

Keep sections on one canvas when they should share page coordinates. Use subgrid when descendants need a wrapper's inherited tracks. Start a nested canvas when a component genuinely needs independent geometry and responsive context—not merely because its text needs a readable measure.

The configurator's live preview is an intentional independent canvas: its selected width must not change when the surrounding documentation reflows. The prose around it continues to belong to the page ruler. See [Alignment and nesting](alignment.md).

## Draw the boundary deliberately

Graph Paper supplies coordinates, fields, recipe relationships, occupancy, and responsive arrangements. The site supplies type, measures, images, vertical spacing, surfaces, navigation behavior, and editorial judgment. A maximum width can be part of those host decisions, but need not be an outer shell applied to everything.

The resulting test is practical: can a reader recognize recurring relationships, read comfortably, and understand when a wider section offers a different task? A perfectly aligned page can still be monotonous; a page with several purposeful edges can still feel coherent. The ruler is a shared reference for making those decisions, not a requirement to make every section look alike.
