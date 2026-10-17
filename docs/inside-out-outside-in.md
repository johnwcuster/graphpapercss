# Inside-out and outside-in

A page can have correct geometry and still feel unresolved. Its columns align, its text fits, and its responsive transitions work. Yet a heading starts on an unfamiliar edge, a small table stretches across the screen, or a supporting note feels disconnected from the material it explains.

These are not necessarily grid problems. They are problems of relationship. Designing this documentation site brought two complementary approaches into focus: establish relationships from the outside in, then test their usefulness from the inside out.

## Outside-in: establish the relationships

Outside-in design begins with the available space and its broad organization. Where does the composition begin? Which regions carry primary content, which support it, and which should remain quiet? What relationships should repeat as the reader moves down the page?

A familiar answer is a centered container with a maximum width, with sections composed inside it. That can work well. But the container has already made editorial decisions before the section grid becomes involved: it bounds the page, establishes outer spacing, and gives every section the same maximum extent.

Graph Paper does not require that answer. A canvas can use the available page width, fields can establish insets, and recipes can organize the content directly on that ruler.

This site uses that approach. A center-led recipe supplies a primary region with supporting positions on either side. Reading sections can occupy the primary position alone. Empty supporting positions do not require placeholder elements or invented content; they can be intentional negative space.

Outside-in thinking establishes a shared spatial language. It does not yet establish how much of that space the content should use.

## Inside-out: test what the content needs

Inside-out design begins with the material and its treatment. How much width makes an explanation comfortable to read? Does an image need room to reveal detail? Does a comparison benefit from more horizontal space? Can a supporting item remain useful in its narrow position?

A page-wide ruler makes more space available, but availability is not evidence of usefulness. Long prose still needs a readable measure. A short comparison table does not become more informative when its columns spread across a large monitor. A generic invitation to explore the library does not necessarily deserve an entire sidebar.

Here, the ruler remains wide while particular reading components have typography-based bounds. The reading container stops at `76ch`, with paragraphs bounded further. Those values are host design choices, not Graph Paper requirements or a universal prescription for readable text.

The distinction matters: constrain the content treatment without necessarily shrinking the coordinate system around every section. The [responsive-design page](responsive-design.md) keeps its small tables with their explanations; the dense [recipe catalogue](class-reference.md#recipe-catalogue) receives a wider view.

Additional width is a resource to assign, not a condition every element must express.

## A section can work while the page does not

Some of the most revealing problems occur between sections. A comfortable paragraph can be followed by a heading and table that begin on another edge. Each section may be defensible in isolation, while the sequence asks the reader to keep finding a new reading position.

The answer is not necessarily one left edge for everything. A change of edge can announce a different task, alter emphasis, or invite comparison. A site need not encourage uninterrupted downward scrolling at the expense of every other experience.

But the change should have a reason.

A recurring reading position gives introductions, prose, and ordinary comparisons a recognizable relationship. A wider reference view can be a deliberate departure. When readers return from it, they return to a familiar track.

Typography participates in that continuity. Centering several children independently at different measure limits can create unrelated left edges inside an otherwise consistent grid. Bounding and aligning a shared reading component is often more coherent. Its visible edge need not coincide with a ruler line once its measure cap applies; the assigned region still belongs to the ruler.

Responsive timing matters too. Related sections can use the same recipe yet shift arrangements at different widths. On this site, introductions and reading sections share a band policy so that their relationship changes together. That is an editorial continuity decision, not merely a test of whether each section fits.

## Move between the two directions

Outside-in and inside-out are sometimes framed as opposing commitments: design a structure and fit content into it, or let content determine the structure. Neither description is sufficient on its own.

Outside-in gives a page coherence. It establishes relationships that individual components cannot determine for themselves. Inside-out tests those relationships against actual material. A useful authoring loop is:

1. Establish a small set of spatial relationships.
2. Place realistic content with appropriate treatments.
3. Identify where those relationships become strained.
4. Adjust the treatment, composition, or transition timing.
5. Revisit how the section connects to its neighbors.

Preserve the intent while remaining willing to revise its expression. A narrow supporting position might need a headline and summary rather than full body text. Alternatively, the material may deserve a different composition. Neither the content nor the initial layout must always win.

These directions do not prescribe a responsive workflow. Outside-in is not synonymous with desktop-first, and inside-out does not mean mobile-first. The relevant outside may be a page, a section, or a component's available container—not necessarily the viewport.

## Decide what the framework should own

Graph Paper contributes a constrained vocabulary of coordinates, fields, recipes, positions, and responsive arrangements. It does not decide whether a sidebar is worth having, whether a table needs more room, or whether the resulting hierarchy serves the reader. Bands do not measure text and infer when reading becomes uncomfortable.

The site still supplies typography, content treatment, images, vertical spacing, and editorial judgment. A maximum-width container remains a legitimate option when the project needs one; it need not be an automatic prerequisite around everything.

The lesson is not that every site should use a page-wide ruler. It is that the boundary deserves to be chosen.

Outside-in establishes the relationships worth preserving. Inside-out tests whether the content makes those relationships useful. A good grid supports that conversation; it does not end it.

For implementation examples and the decisions used on these pages, continue with [Composing a site](site-authoring.md). For choosing individual relationships, see [Authoring compositions](authoring.md).
