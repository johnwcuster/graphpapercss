# Configurator help

The [configurator](configurator.html) explores **Graph Paper 0.5.0**: one composition, explicit viewport transitions, and copyable Graph Paper HTML. The linked stylesheet is the same core delivered at `css/main.css`. Use the matching stylesheet linked beneath the preview with the exported markup. Existing `grid_*` links open the [0.4 configurator reference](configurator-0.4.html).

In narrow or short windows, including when browser zoom reduces the available space, Preview controls and Layout controls scroll with the page. Close Layout controls to reach the preview sooner; reopening them brings their heading into view.

## Start with source order

Use − and + to choose the number of direct content items. The preview contains short explanations of Graph Paper with varied text lengths and an original ruler diagram. The final item, number 14, demonstrates an exact-count mosaic fallback.

A new exploration starts stacked, with no preset transition widths. Source order remains reading and keyboard order in every layout. Visual placement changes where those items appear; it does not rearrange the HTML.

## Choose a layout

Open Layout controls and choose a layout type. For Composition, choose Number of columns, then Column widths: equal, one wider, two equally wider, or different widths, where available. Column-order silhouettes run from left to right; they describe widths rather than source items.

Use the Proportion slider or −/+ buttons to move through existing proportional choices, from closer widths to greater contrast. The slider selects discrete catalogue entries rather than arbitrary widths. Changing column order keeps the nearest available degree of contrast. Changing column widths keeps the wider column in the same position where possible. The current ratio is shown beside the Proportion control and with the class beside one placement schematic; source numbers appear in that schematic. Every existing catalogue entry remains selectable. Stack needs no further choice; Repeating uses a number-across selector, and mosaics use an exact-item-count selector.

Allocation and traversal remain separate decisions under Placement. Proportion and column-order changes retain those refinements, gutters, vertical spacing, padding, and preview width. Changing the number of columns changes family and resets placement refinements; the other spacing choices remain. Saved links reconstruct these controls from the selected layout.

- **Stack** puts each item across the available field.
- **Repeating** fills equal-width positions in row-first order.
- **Composition** places consecutive source runs in two, three, or four columns. Width proportions and allocation are separate choices.
- **Mosaics** select a map for an exact item count. They support Neat and Thin spacing.

An incompatible item count or unsupported spacing retains the selection and displays a source-order stack with an explanation. A valid arrangement still needs editorial review: check hierarchy, readable widths, image treatment, and keyboard traversal with your actual content.

## Full-width items

For a two-column Composition, **Full-width items** appears directly below Number of columns. Its four illustrated choices are None, First above, Last below, and First above + last below. First and last refer to source order. The selected items span both columns, with supporting items occupying the columns between them.

Column proportions, allocation, traversal, gutters, vertical spacing, and padding remain separate choices. Changing proportions keeps the full-width selection. At least two supporting items are required; an underfilled source retains the selection and previews the explained source-order stack. Exact physical counts apply to the supporting items and exclude the full-width first/last items.

## Spacing controls

Layout and Placement come first in each selected viewport editor. **Spacing** follows them as a disclosure, closed by default. Its summary shows the current gutters, vertical spacing, and item padding even when closed. Open it to change those independent settings. It stays open while editing or switching transitions until you close it; reloading starts with it closed. Expanding or collapsing the section changes no classes or preview width.

## Vertical spacing at each viewport

**Vertical spacing** in the Spacing section offers Layout default at the base, then Zero, 1 bit, or 2 bits. Later transitions offer Use previous. Choices carry forward independently of layout, gutters, and item padding.

Layout default emits no override: ordinary layouts retain host spacing, Neat mosaics touch vertically, and Thin mosaics retain their one-bit vertical gutters. Zero explicitly removes vertical spacing, including mosaic margins. One or two bits separate items that start below the composition's top row; side-by-side top-row items stay flush.

```html
<section class="gp_layout--three-1-2-1 gp_spacing--neat
                gp_vertical-spacing--1 gp_md-vertical-spacing--2 gp_xl-vertical-spacing--0">
  <!-- Direct content items -->
</section>
```

This supplies one bit initially, two from 48rem, and zero from 80rem. It adds item margins rather than gaps between every construction row. Spanning items keep their shared-row relationships; content determines height, and the total composition height may change. No extra stylesheet or measurement marker is needed. Amounts apply to direct participants; nested compositions make their own choices. Author margins can override these zero-specificity defaults. Engines without the required counting/arithmetic features retain host spacing.

## Item padding at each viewport

The selected viewport editor offers **Item padding** in the Spacing section: None, 1 bit, or 2 bits. Added transitions also offer **Use previous**. Padding carries forward independently of layout and gutters; changing either does not reset the padding choice. None explicitly removes an earlier padding choice at that viewport. The base defaults to None.

The copied HTML adds the necessary classes directly to each item:

```html
<article class="gp_pad gp_md-pad--2 gp_xl-pad--0">…</article>
```

This gives one bit initially, two from 48rem, and none from 80rem. Selections persist until another matching override; class order does not change precedence. No extra CSS panel, author stylesheet, or ruler measurement is needed. Neat backgrounds still touch, and mosaic margins remain intact.

Apply these classes to content items or full-region content layers. Keep rulers and track-continuation wrappers unpadded. A narrowed, padded, or side-bordered intermediate wrapper changes the containing-block width without updating the inherited track count, so padding inside it may no longer match the original ruler bit. For an overlay, keep the image on the outer item and pad the text layer while its containing block still matches the assigned region.

Padding choices are saved in exploration links. Earlier links with global item padding keep that choice as the base and inherit it at later transitions. Measurement markers remain only when another feature needs them, such as column rules.

## Add viewport transitions

Choose **Add transition** above the preview. Available minimum widths are 30, 40, 48, 64, 80, and 96rem. Pixel references assume 16px per rem; the browser evaluates the media queries in rem.

A new transition inherits the preceding layout and adds no layout class until you change that selection. Layout and placement carry forward together. Gutters and item padding inherit separately, so changing a layout keeps both choices. The base selection applies before the first transition.

Click a timeline segment to preview and edit that part of the sequence. Its chevron opens actions to move the minimum width or remove the transition. Removing it requires confirmation and removes its layout, gutter, padding, and placement overrides; source content stays intact. The preceding choices then carry forward until another explicit selection. The −1px and +1px buttons test either side of a transition.

These are **viewport media queries**. They do not automatically change when a nested region becomes narrow. Choose transition widths after testing the limiting content region. This configurator does not offer the 0.4 band system.

## Refine placement

Placement refinements depend on the family: allocation strength, which side receives fewer items, or traversal. Full-width first/last items are selected with the illustrated control under Number of columns. These change placement while retaining source order.

**Exact physical counts** shows valid allocations for the current source count and spanning selection. Choose Automatic to use the library's allocation. Exact values describe counts in physical regions from left to right, independently of traversal. If a subsequent change invalidates a saved exact request, the request stays visible and automatic allocation applies. Select Automatic to clear it or choose a valid option.

Named refinements export as responsive classes. Exact counts export as inline custom properties with the corresponding breakpoint prefix. You do not need to write stylesheet rules to reproduce a configurator selection.

## Gutters and rules

Full, Neat, Thin, Wide, and Ruled select 64, 60, 59, 58, and 56 usable bits respectively. Each transition can choose its own gutters or inherit the previous choice.

Ruled puts vertical rules in interior gutters of supported column layouts. Field edges and full-width items have no rule. Mosaics support Neat or Thin, so selecting Ruled for a mosaic produces the explained stack fallback.

The exported markup includes ruler measurement when needed for Ruled layouts, and rule ownership on items when needed. To customize a rule, add optional properties to the composition:

```html
<section class="gp_layout--two-3-2 gp_spacing--ruled"
         style="--gp-rule-color: #64748b; --gp-rule-width: 1px;">
  <!-- Keep the exported ruler wrapper and item ownership classes. -->
</section>
```

## Preview controls and visual aids

Preview viewport controls set the simulated browser width inside the preview. A wide preview scales down to fit your workspace; its media queries continue to use the simulated width. **Use workspace width** deliberately changes that width to the space available on the page. Opening or closing the Layout controls panel changes display scale, not the selected layout width or exported HTML.

The timeline shows each selected layout and its width range; the highlighted segment is active in the preview. Gutters, vertical spacing, and padding are shown in Layout controls. The preview caption reports the simulated viewport width and display scale.

Visual aids show the preview ruler, source labels, and item boundaries. The 0–64-bit caption appears only while the preview ruler is enabled. They are inspection tools and are omitted from the exported markup. The separate ruler toggle in site navigation shows the documentation page's ruler.

## Copy and share

**Copy HTML** copies layout configuration and placeholder items. Replace those placeholders with your content and load the linked 0.5.0 stylesheet. The result runs without configurator JavaScript. The HTML does not include sample explanations, visual aids, or the simulated preview width. Vertical-spacing classes are included on the composition, and enabled padding utilities are included on the placeholder items; no additional author CSS is required.

The stack is implicit unless another base layout is selected. `gp_ruler` establishes shared coordinates; a viewport class such as `gp_md--…` selects a layout from 48rem. Selections carry forward until another transition, while source order stays unchanged. Named refinements use responsive classes. Exact counts use inline custom properties with matching breakpoint prefixes; they require no author-written style tags.

**Copy exploration link** saves item count, transitions, refinements, preview width, and visual aids in the URL. A link is a saved exploration, not a published page or an automatic conversion of a 0.4 recipe.

## Keyboard and panels

Use Tab to reach controls, arrow keys for native radio groups and selects, and Enter or Space for buttons and disclosures. The timeline chevron opens a menu; Escape dismisses it and returns focus to its trigger. Closing the Layout controls panel returns focus to its toggle.

**Alt+Shift+G** (⌥ ⇧ G on Mac) hides or restores both Preview controls and the Layout controls panel. A Show workbench button remains available while hidden. The Layout controls panel can also be hidden independently. Hidden controls are removed from keyboard navigation.

## Scope

This tool edits **one standalone composition**. It does not edit content, source grouping, nested layouts, sticky behavior, typography, or image crops. Those decisions remain in your markup and content styles. The library supports shared tracks and rebased rulers, but this configurator does not author their nesting.

The [portable on-page inspector](configurator-help-0.4.html#on-page) still targets the 0.4 API. It is not a 0.5 editor. The learning and reference documentation describes the new API. Browsers missing base CSS arithmetic can show a source-order stack instead of the ordinary equal-pairs fallback; the preview reports that limitation. The older configurator and its help are explicitly versioned references only.
