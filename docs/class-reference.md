# Class reference

This reference describes the **0.5 API in the current build**. Use the [configurator](configurator.html) to discover a plausible arrangement, then use this page to understand its markup and defaults. Older grid/set/flow classes are documented only through [migration](migration.md) and the [0.4 reference](configurator-0.4.html).

## Coordinates and wrappers

| Expression | Place it on | Effect |
| --- | --- | --- |
| `gp_ruler` | A standalone coordinate root | Establish 64 local tracks; it can also select a layout |
| `gp_continue_tracks` | An assigned participant containing an inner layout | Continue only the parent tracks spanning this participant |
| `gp_rebase_64` | The local root inside the continuation wrapper | Subdivide its assigned area into 64 fresh tracks |
| `gp_ruler--measure` | The ruler/rebased root needing captured lengths | Enable `--gp-ruler-bit` for rules or author CSS; unnecessary for padding and mosaic margins |

Use [the documented nesting forms](alignment.md), keeping parent placement separate from inner selection. Coordinates do not themselves select a responsive design.

## Layouts and viewport aliases

`gp_layout--ID` selects the base layout. `gp_PREFIX--ID` selects it at a supported viewport threshold. Examples: `gp_layout--two-3-2`, `gp_md--three-1-2-1`, `gp_xl--mosaic-8`.

| Prefix | Minimum viewport |
| --- | ---: |
| `xs` | 30rem |
| `sm` | 40rem |
| `md` | 48rem |
| `lg` | 64rem |
| `xl` | 80rem |
| `2xl` | 96rem |

Class order does not change breakpoint priority. Omitted decisions carry forward. A custom-property selection such as `--gp-layout: var(--gp-two-3-2)` uses the same arrangement, but the element still needs a recognized layout class for participation.

## Allocation and traversal

| Decision | Classes | Default and scope |
| --- | --- | --- |
| Automatic preference | `gp_allocation--closest`, `--stronger` | Closest; Two and Four |
| Fewer-item side | `gp_fewer--left`, `--right` | Left; Two only |
| First source run | `gp_traversal--left-to-right`, `--right-to-left`, `--center-first`, `--widest-first` | Left-to-right; permitted alternatives depend on family |
| Full-width endpoints | `gp_arrangement--across`, `--first-above`, `--last-below`, `--first-above-last-below` | Across; spanning applies to Two only |

Each control has viewport aliases, for example `gp_md-allocation--stronger`, `gp_lg-fewer--right`, `gp_xl-traversal--center-first` and `gp_sm-arrangement--first-above`. Explicit defaults reset earlier values. Selection through CSS uses `--gp-allocation:var(--gp-stronger)`, `--gp-fewer:var(--gp-fewer-right)`, `--gp-traversal:var(--gp-center-first)` and `--gp-arrangement:var(--gp-first-above)`.

Two chooses a coprime pair differing by at most four. Closest prefers the nearest valid pair; Stronger prefers greater difference. The fewer-side choice and source traversal are independent of physical widths.

Three chooses among positive physical triples with spread at most two and coprime neighbors. Its automatic preference favors matching outer counts, a differentiated center, then smaller spread and the remaining deterministic tie-breaks. There is no Three allocation-mode switch. Center-first is available at all supported counts; right-to-left is available only at exactly three items and otherwise normalizes to left-to-right.

Four selects from its reviewed automatic candidate pool, with spread at most four and coprime physical neighbors. Widest-first ranks nominal physical widths, independently of bit-rounding ties. Equal quarters and unsupported traversal requests normalize to left-to-right. Proportions and traversal can change which automatic allocation is eligible.

## Exact physical counts

The configurator offers eligible tuples for the current source count; it does not require memorizing them. A copied refinement names physical regions and includes viewport-specific properties when needed.

```html
<section class="gp_ruler gp_layout--three-1-2-1 gp_spacing--neat"
         style="--gp-exact-count-left:5;
                --gp-exact-count-center:3;
                --gp-exact-count-right:4;">
  <!-- Exactly 12 direct participants for this request -->
</section>
```

| Layout | Physical properties | Eligibility |
| --- | --- | --- |
| Spanning Two supports | `left`, `right`; `center` zero/unset | Total equals non-spanning support count; positive coprime pair, difference at most four |
| Three | `left`, `center`, `right` | Total equals direct count; positive integers, spread at most two, coprime neighbors |
| Four | `left`, `center-left`, `center-right`, `right` | Total equals direct count; positive integers, spread at most four, coprime neighbors |

Prefix every property with `--gp-exact-count-`. Responsive forms insert the viewport prefix: `--gp-md-exact-count-left`. Ordinary Across Two ignores exact requests. Mosaics and Peers do not use these inputs.

Requests remain present when counts change. Incomplete, invalid or mismatched tuples use automatic allocation and reactivate when eligible. Omission carries forward the last matching regional input; explicit zero replaces it and restores automatic allocation when the tuple becomes ineligible. `initial` or `unset` removes that breakpoint input and reveals an earlier value. Requests do not inherit into independently selected nested layouts.

## Gutters and fields

| Class | Field bits | Outer insets, left/right | Internal gutter |
| --- | ---: | --- | ---: |
| `gp_spacing--full` | 64 | 0 / 0 | 0 |
| `gp_spacing--neat` | 60 | 2 / 2 | 0 |
| `gp_spacing--thin` | 59 | 2 / 3 | 1 bit |
| `gp_spacing--wide` | 58 | 3 / 3 | 2 bits |
| `gp_spacing--ruled` | 56 | 4 / 4 | 2 bits |

Use an explicit spacing class in ordinary authoring; the unconfigured field is Full. Responsive forms include `gp_lg-spacing--wide`. Nominal field bits include internal gutters; actual item spans deduct them. On continued rulers, insets and gutters are bounded to preserve nonempty spans. Mosaics support only Neat/Thin and otherwise stack.

Ruled spacing reserves the field. Decoration requires the optional [column-rules extension](#column-rules-extension), plus the measured coordinate root and an explicit `gp_rule--end` or `gp_rule--start` owner on a participant. Choose one owner per shared gutter. The library suppresses outer/nonexistent boundaries. Colors and stroke widths are public host choices:

```css
.article-group {
  --gp-rule-color: #52625f;
  --gp-rule-width: 1px;
}
```

Rule color defaults to `currentColor` and width to `1px`. Keep measurement on the ruler that supplies the relevant coordinate rhythm. See [Edges and mixed spacing](edges-and-spacing.md).

## Column rules extension

Core supplies gutter geometry; the optional extension draws the lines. Load it after one **matching-version** full or predefined core build. It is not a standalone layout stylesheet.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.6.0/css/main.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.6.0/css/extensions/column-rules.min.css">
```

```html
<section class="gp_ruler gp_ruler--measure gp_layout--two-3-2 gp_spacing--ruled">
  <article class="gp_rule--end">First item.</article>
  <article class="gp_rule--end">Second item.</article>
</section>
```

For layered core, use `column-rules.layer.css` or `column-rules.layer.min.css`; both use the `graph-paper` layer. The configurator includes the extension in CDN links for a ruled sequence. With self-hosted full CSS, download and load both files. Custom downloads bundle the extension when needed, so they still require only one stylesheet.

### Positioning and stacking

**Core assigns no `position`, `z-index`, transforms, or decorative pseudo-elements.** Application layering remains author-controlled. Grid placement, padding, and vertical spacing do not opt content into rule decoration.

Loading the extension gives explicit `gp_rule--start` / `gp_rule--end` owners `position: relative`. Their absolute `::before` / `::after` pseudo-elements paint the lines in the gutter. This has specific consequences:

- An absolutely positioned descendant without a closer containing block anchors to the rule owner. Author positioning rules can override the extension's zero-specificity owner selector.
- The extension assigns no z-index. Relative positioning with `z-index: auto` does not itself make the owner a stacking context. A translated rule pseudo-element has its own stacking context, which does **not** contain the item's headings, text, menus, or other content.
- Rule pseudo-elements use `pointer-events: none`. They can visually intersect content extending into the gutter; they are not guaranteed to paint behind that content.
- Start rules reserve `::before`; end rules reserve `::after`. Avoid using that same pseudo-element for another decoration on the owner.

The positioning applies to marked owners while the extension is loaded, even at widths where the line is suppressed. Existing author styles can independently create stacking contexts. Graph Paper makes no blanket promise that an authored page has none.

`gp_ruler--measure` is a separate, explicit core facility using `container-type: inline-size`. It establishes a size-query context and inline-size containment; it is not added to ordinary rulers. Continuations retain the captured bit, while a rebased ruler needs its own measurement marker for lines. Containment behavior has varied across browser versions; do not treat the marker as a general overlay-isolation guarantee. See the [CSS positioning specification](https://www.w3.org/TR/css-position-3/), [transform specification](https://www.w3.org/TR/css-transforms-2/), and [query-container specification](https://drafts.csswg.org/css-conditional-5/#container-type).

## Padding and vertical spacing

| Expression | Placement | Effect |
| --- | --- | --- |
| `gp_pad`, `gp_pad--2`, `gp_pad--0` | Content item or full-region content layer | One, two or zero assigned ruler bits inside the element |
| `gp_md-pad--0/1/2` and other prefixes | The same element | Mobile-up padding selection |
| `gp_vertical-spacing--0/1/2` | Composition | Zero, one or two top-margin bits on direct items beginning below the top row |
| `gp_md-vertical-spacing--0/1/2` and other prefixes | Composition | Mobile-up vertical-spacing selection |

Keep rulers and continuation wrappers unpadded. A width-changing intermediate wrapper can interrupt percentage-based rhythm. Use a correctly sized content layer or host CSS for the constrained box.

Ordinary layouts have no implicit vertical gaps. Thin mosaics default to one bit below the top row; Neat mosaics default to zero. Explicit vertical-spacing amounts replace those defaults; removing all utility classes restores them. Host margins/padding override the zero-specificity utilities normally. None of these utilities requires ruler measurement, fixed row heights or a native `row-gap`.

## Counts, fallback and source order

Every direct element child counts, including hidden elements and inline element-level metadata. Keep stylesheet/script elements outside a composition when they are not intended participants. Text nodes, comments and grandchildren do not add to the count.

Stack is the conservative underfill fallback. Peers repeat row-major and retain partial-row slots. Two/Three/Four group consecutive source items by region, with no enumerated maximum count. Spanning Two excludes the actual first item, last item or both before allocating supports; at least two supports are required. Three/Four underfill and mismatched mosaics stack without silently selecting a different layout.

The DOM and native focus sequence never change. Visual reordering and column-first traversal still require an author to review the finished content. Missing native count arithmetic has family-specific fallbacks; see [Browser support](browser-support.md).

## Layout catalogue

IDs describe physical proportions, not semantic importance. Mosaic suffixes name exact item counts. The catalogue lists all current selections; use the configurator to narrow it by width relationship and then compare nearby proportions. Nominal ratios can round differently across fields; the accepted Four 9:8:7:6 Wide treatment uses 16/14/12/10 bit widths on a full ruler.

<!-- layout-catalogue -->
