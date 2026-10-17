# Authoring compositions

Graph Paper reduces the geometry choices; it does not choose your editorial hierarchy. Start with actual content and use the recipes to test relationships. A valid layout is a starting point, not proof that the design serves its readers.

For installation, use [Getting started](getting-started.md). For exact class behavior, use the [class reference](class-reference.md). The [configurator](configurator.html) helps you compare alternatives without memorizing their IDs.

For relationships between sections, recurring reading edges, and page-wide versus bounded coordinates, see [Composing a site](site-authoring.md).

The companion essay [Inside-out and outside-in](inside-out-outside-in.md) explores how content treatments and spatial structure inform one another.

## Establish source order and content treatments

Arrange items in a sensible reading order before selecting their visual placement. Stacked mode exposes that order; visual flow does not rewrite DOM order or keyboard focus order.

Identify the main reading experience, supporting material, and incidental material. Decide what each item needs to show: full text, an excerpt, a headline, an image, a caption, or a link to further reading. These are editorial decisions, not Graph Paper classes.

Content and layout are an iteration loop. You need not squeeze the same treatment into every position. A narrow supporting position may work with a headline and summary where full body text would become unreadable. Preserve access to omitted information, and do not use visual hiding to erase content that readers need.

## Choose relationships before IDs

Choose the broad number of regions and their relationship: equal peers, a lead with support, or a reading region beside supplementary material. Then compare letter and numbered alternatives in the configurator.

Macro regions are broad compositional divisions, not necessarily individual items. A named set can place multiple items in a region or span an item across regions. Three macro regions do not imply three source items.

`grid_03*` identifies a responsive recipe family with three expanded macro regions. It does not promise three visible columns at every width. Letters are alternatives within a family, not a universal left/right switch. Numbered variants change proportions; a higher number does not universally mean greater prominence.

Width emphasis and editorial prominence are related but distinct. Source position, imagery, type scale, contrast, and content treatment can outweigh width. Inspect the resulting hierarchy rather than inferring it from the recipe name.

## Choose occupancy and placement

Omit a set for sequential occupancy: items fill macro regions, then continue into later rows. This is a useful starting point for peer collections or unknown counts.

Use a named set when you want its deliberate multi-item composition. Supported named sets are `set_03` through `set_06`, with recipe-specific availability. There is no `set_02`; a two-item composition can use a two-region grid without a set. A set's number describes positions, not macro regions.

Omit flow for the set's default placement. Select a compatible `flow_*` only when its alternative better serves the content. The same flow ID need not have a distinct visible effect for every recipe, state, or number of occupied positions.

Matching a named set's position count to item count is a useful starting point, not a requirement. Fewer items leave positions unfilled rather than redesigning the recipe. Those positions can be intentional negative space: this site's reading sections occupy only the primary position of a three-position composition. See [Composing a site](site-authoring.md#establish-a-recurring-reading-position). A count mismatch warrants review, not automatic correction.

Extra items use full-width fallback rather than extending the named composition. Treat fallback as predictable behavior to review, not an automatic editorial solution.

## Test the limiting region

Narrow the canvas progressively. Which important position becomes unusable first? Check text measure, image interpretation, captions, controls, and any component padding.

When a region is under pressure, you can change its content treatment, choose another recipe or set, revise the grouping, or use a band to change transition timing. A band does not select a new compact composition or fix an unsuitable treatment.

Inspect all three responsive states. Compact is a designed arrangement supplied by the recipe/set/flow, not simply the expanded layout squeezed smaller. Stacked is the source-order baseline. [Responsive design](responsive-design.md) explains the choices and their limits.

## Judge height as well as width

Decide what should extend below the fold. A long reading section may appropriately exceed the viewport; a short opener may need a more bounded treatment. The least prominent item should not accidentally dictate the height of the whole composition.

Large empty areas can be intentional negative space, but can also signal that a narrow secondary item has made a shared row excessively tall. Consider a shorter secondary treatment or a different composition before forcing equal heights or clipping text.

Three equal expanded regions do not guarantee that a pair plus a remaining item is a good compact design. Four peers may work as two pairs, but that depends on their content. If the supplied compact arrangement remains wrong after reasonable treatment changes, choose another recipe or use an explicitly host-authored alternative. Graph Paper currently has no independently selectable compact recipe.

## Continue alignment deliberately

Use `gp_subgrid` when a semantic wrapper's descendants should share inherited tracks. Use a nested `gp_canvas` when the inner composition needs its own ruler and width-dependent response. Neither is a routine requirement for adding padding or grouping ordinary text.

See [Alignment and nesting](alignment.md) for worked examples. Start with simple items, and introduce another alignment context only when you can explain what it should inherit or rebase.

## Implementation checklist

This checklist is also the entry point for coding agents. The linked reference is the contract; do not infer additional classes from naming patterns.

1. Confirm the target release, modern browser requirements, and chosen build. Do not mix core and legacy compatibility CSS.
2. Establish logical DOM order. Put a field directly inside a canvas; give it exactly one field modifier.
3. Put the selected grid, optional compatible set/flow, and at most one optional band on that field. Items must be direct children.
4. Use the [configurator](configurator.html) to find valid combinations, or the manifest-backed [lookup methods](class-reference.md#find-valid-combinations) for repository tooling. Do not invent a numbered variant, set, or flow.
5. Supply host typography, components, image treatment, and vertical spacing. Preserve the canvas/field horizontal ruler.
6. Test source order, item-count mismatch, compact and expanded arrangements, and both sides of actual canvas transition widths. Optional bands require their separate stylesheet.
7. If adding rules, subgrid, or explicit placement, follow their documented ownership and local-coordinate requirements.
8. Inspect real content visually. Structural validity does not guarantee useful reading measure, balanced height, or appropriate emphasis.
