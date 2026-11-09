# Graph Paper compiler and composition contracts

Graph Paper 0.5.0 provides section-level composition tools for building site-level spatial continuity. Its source lives here; generated CSS is delivered from the canonical `css/main*.css` paths. Versioned 0.4 references live under `css/legacy/0.4/`. The package version is 0.5.0; creating and publishing its release tag is a separate owner action.

Start with the [configurator](../../docs/configurator.html) for visual selection and [its guide](../../docs/configurator-help.md) for ordinary authoring. This document specifies composition behavior for maintainers and authors using custom CSS. [Release preparation](../../maintainers/release.md) tracks the remaining distribution work.

## Catalogue

| Family | Selections | Contract |
| --- | ---: | --- |
| Stack | 1 | Source-order single column |
| Repeating peers | 5 | Two through six equal positions; row-major repetition |
| Two regions | 17 | Independent proportions, allocation, traversal and spanning endpoints |
| Three regions | 46 | Automatic allocation, traversal and optional physical exact counts |
| Four regions | 25 | Equal quarters and three graduated families; allocation and traversal |
| Mosaics | 8 | Fixed maps for exactly six through thirteen participants |
| **Total** | **102** | All selections compile |

[catalogue.mjs](catalogue.mjs) is the executable registry. [catalogue-data.mjs](catalogue-data.mjs) contains reviewed whole-bit geometry. Frozen geometry fixtures and independent enumeration oracles in `tests/oracles/` guard against accidental catalogue or algorithm changes without importing earlier implementations.

## Readable and compact builds

`pnpm build` emits readable `css/main.css` and compact `css/main.min.css`. Private calculations use the version-neutral `--_gp-*` namespace. Minification deterministically shortens those properties, except shared ruler metadata (`--_gp-tracks`, `--_gp-measure-tracks`, `--_gp-measure-ready`). Public classes and public `--gp-*` inputs/tokens retain their names. Use one matching stylesheet per page.

`css/private-names.json` records the property map and compact CSS checksum for computed-style assertions. It is a diagnostic artifact, not a public API or a page dependency. `pnpm check` verifies deterministic output; unit tests reverse the complete mapping and compare ordinary minification. The generated integration fixture embeds the map so the same controls can inspect readable and compact builds.

## Authoring forms

The core uses explicit viewport selections. A layout does not silently select its own compact design.

```html
<main class="gp_ruler">
  <section class="gp_layout--stack gp_md--two-3-2
                  gp_spacing--neat gp_allocation--stronger gp_fewer--left
                  gp_traversal--right-to-left">
    <article>First source item.</article>
    <article>Second source item.</article>
    <article>Third source item.</article>
  </section>
</main>
```

Stack is the base. At a 48rem viewport, the two-region composition activates and remains selected until another matching selection replaces it. No bundled compact arrangement or hidden band changes that decision. Available viewport hinges remain 30/40/48/64/80/96rem (`xs/sm/md/lg/xl/2xl`). They refer to viewport width, independently of the assigned composition width.

Standalone coordinate roots may also carry layout selections. A direct layout child uses its parent's ruler. An assigned participant needs a continuation wrapper before an inner layout selects its own plan:

```html
<section class="gp_ruler gp_layout--two-3-2 gp_spacing--neat">
  <article class="gp_continue_tracks">
    <div class="gp_layout--two-1-1 gp_spacing--full">
      <figure>Image.</figure>
      <p>Explanation.</p>
    </div>
  </article>
  <article class="gp_continue_tracks">
    <div class="gp_rebase_64 gp_layout--two-1-1 gp_spacing--full">
      <p>A fresh local 64-bit ruler.</p>
      <p>Independent subdivision.</p>
    </div>
  </article>
</section>
```

Continuation preserves assigned parent tracks; rebasing establishes 64 new local tracks. Neither operation authorizes responsive reflow by itself. Do not put a separately selected nested layout directly on an assigned participant and assume its parent placement parameters remain isolated; use the explicit wrapper path.

CSS selects the same layout through the same mechanism:

```html
<section class="gp_ruler gp_layout--stack component">...</section>
```

```css
.component {
  --gp-layout: var(--gp-two-3-2);
  --gp-allocation: var(--gp-stronger);
  --gp-fewer: var(--gp-fewer-left);
  --gp-traversal: var(--gp-right-to-left);
}

.component.is-expanded {
  --gp-layout: var(--gp-stack);
}
```

A recognized class supplies opt-in and base behavior; a custom property alone does not activate arbitrary markup. Base public selection/control properties are typed and non-inheriting; responsive exact-count inputs use the separately documented absent-value contract. Private numeric codes are compiler details. Layout aliases and geometry selectors have zero specificity; ordinary component selectors can override them, even when loaded before the library CSS. Removing an override restores the underlying matching selection. No literal-width local query class family is added.

## Element-level padding

`gp_pad` adds one ruler bit of padding on all sides; `gp_pad--2` adds two; `gp_pad--0` explicitly removes padding. Choose one class on the content element. All use zero-specificity selectors and assigned-track percentage arithmetic. They add no measurement context, property registration, margin, row gap, height, or typography defaults. Padding is independent of field gutters and viewport layout selections; responsive aliases use the same six viewport hinges as layouts and gutters: `gp_{prefix}-pad--0`, `--1`, and `--2`. Each amount carries forward until a later matching override; zero resets earlier padding. No additional measurement occurs.

```html
<div class="gp_ruler">
  <section class="gp_layout--peers-2 gp_spacing--neat">
    <article class="gp_pad">One bit inside this background.</article>
    <article class="gp_pad--2">Two bits inside this background.</article>
  </section>
</div>
```

The containing block must represent the region described by the inherited assigned-track count. Direct grid participants and full-region content layers satisfy that relationship. Continued tracks preserve the outer rhythm; rebased tracks establish a local bit. Keep coordinate roots and continuation wrappers unpadded, and apply the utility to their content instead. Neat and Thin are useful starting points; the utility does not change the chosen spacing mode and can be deliberately combined with the other fields.

For an image overlay, keep the image/background on the item and put `gp_pad` on its text layer. A width-changing intermediate wrapper (including max-width, padding, or side borders) can make an inner layer's percentage basis differ from its inherited track metadata. Put the utility on the appropriate content box before that interruption, or use explicit author CSS for that case. The utility does not discover or compensate for arbitrary host geometry. Existing captured ruler lengths remain a separate, opt-in facility.

Ordinary author selectors override these utilities, including when loaded before core. Among base classes, the two-bit rule wins by stylesheet order; choose one base amount. Responsive rules follow in increasing viewport order, so a later matching viewport overrides earlier/base padding regardless of HTML class order. For example, `class="gp_pad gp_md-pad--2 gp_xl-pad--0"` means one bit initially, two from 48rem, and none from 80rem. These classes belong on the padded element, independently of the ancestor's layout and gutter selections.

The internal `--_gp-tracks` dependency is not a new author-facing input. Fractional CSS-pixel rounding still applies to used padding, including inherited subgrid edges.

## Responsive placement controls

Every layout hinge also supports the named controls: `gp_{prefix}-allocation--closest/stronger`, `gp_{prefix}-fewer--left/right`, `gp_{prefix}-traversal--…`, and `gp_{prefix}-arrangement--…`. Prefixes are the same `xs/sm/md/lg/xl/2xl` viewport steps as layout selection. Unprefixed control classes retain their existing meanings. Each control carries forward independently until another matching class replaces it; class attribute order does not determine priority. Explicit default choices reset earlier nondefault values.

```html
<section class="gp_layout--stack gp_md--two-3-2
                gp_md-allocation--stronger gp_md-fewer--right
                gp_lg-fewer--left gp_xl--three-1-2-1
                gp_xl-allocation--closest gp_spacing--neat">
  <!-- Source items. No configuration stylesheet is required. -->
</section>
```

Exact physical counts use the same prefix in property names. The base inputs remain `--gp-exact-count-{region}`; responsive inputs are `--gp-{prefix}-exact-count-{region}`. Supported physical regions are `left`, `center`, `center-left`, `center-right`, and `right`, according to the selected family. Selection, validation, and source-count eligibility follow the existing exact-count contracts.

```html
<section class="gp_layout--three-1-2-1 gp_spacing--neat"
  style="--gp-exact-count-left: 5;
         --gp-exact-count-center: 3;
         --gp-exact-count-right: 4;
         --gp-lg-exact-count-left: 4;
         --gp-lg-exact-count-right: 5;
         --gp-xl-exact-count-left: 0;
         --gp-xl-exact-count-center: 0;
         --gp-xl-exact-count-right: 0;">
  <!-- Twelve source items: 5+3+4, then 4+3+5 at 64rem,
       then automatic allocation at 80rem. -->
</section>
```

Omitted inputs retain the latest earlier value for that physical region. Explicit zero replaces it and invalidates the exact tuple, restoring automatic allocation. `initial`/`unset` remove a breakpoint input, exposing the earlier value; they are not zero resets. Values are validated after resolution, so malformed or ineligible requests use automatic allocation rather than another guessed exact tuple. The configurator emits all changed/reset regions needed by each explicit snapshot, including when changing families.

Breakpoint inputs are registered with wildcard syntax, no initial value, and `inherits:false`. This preserves the distinction between an absent input and an explicit zero while preventing leakage into continued or rebased nested compositions. The resolved values are typed, non-inheriting integers. A wider input can therefore supersede a base inline count by selecting a different property; it does not try to override the same inline declaration through the cascade.

Named control classes stay zero specificity. An inline declaration of the same named-control property still outranks those classes by normal CSS precedence; use the control classes consistently for a responsive control, or supply your own stylesheet deliberately. Authors may still select layouts and controls from custom CSS, but ordinary configurator output requires only HTML and the library stylesheet. Spacing follows the same hinges through `gp_{prefix}-spacing--full/neat/thin/wide/ruled`. A spacing choice carries forward independently of layout and placement. Each alias changes inset, gutter, wide-ratio rounding, and mosaic spacing metadata together; it does not add row-gap defaults or ruler measurement. Column-rule decoration needs the `gp_ruler--measure` marker. The configurator adds it automatically when any selected transition needs it and removes it when unused; manual authors include it on the coordinate root. No container-query class family is introduced.

## Two-region behavior and fallback

Two-region composition separates physical proportions, filtered count allocation, fewer-left/right direction, and traversal. Closest selects the nearest coprime pair within a count difference of four; Stronger selects the most asymmetric valid pair within four. Coprime neighboring counts avoid shared internal subdivisions that misleadingly suggest row-major reading. Equal singletons remain valid.

`gp_allocation--closest` / `gp_allocation--stronger` choose the preference. `gp_fewer--left` / `gp_fewer--right` choose which physical side receives fewer items. `gp_traversal--left-to-right` / `gp_traversal--right-to-left` choose which region receives the first consecutive source run. Defaults are Closest, fewer-left, and left-to-right. Changing traversal does not swap physical widths or allocated counts; source items within each region remain in document order. Stacking always restores source-order presentation.

The compiler derives valid counts directly from parity/remainders, with no item-count selectors, runtime placement JavaScript, or enumerated count limit. Since selected counts are coprime, LCM rows equal A×B and each item's span equals the neighboring region's count. The independent geometry oracle still searches candidate pairs and uses Euclidean GCD, so tests do not merely duplicate the compiler formula.

The three public control properties, like `--gp-layout`, are typed and non-inheriting, so outer choices cannot leak into nested layouts.

Zero stays empty; one item fills the usable field. All direct element children count, including hidden ones; comments, whitespace, and descendants do not add to the outer count. Source count can change group membership under the selected rule. No fixed-first-two mode or permanent-group inference is added.

The fallback contract is:

1. With native count arithmetic: selected two-region proportions, filtered allocation, traversal, and shared rows.
2. Without that arithmetic: equal-width repeating pairs in row-major source order at the same selected activation boundary; this intentionally gives up enhanced allocation/proportions/traversal.
3. One participant, too few usable tracks, Stack, or unknown numeric selection: full usable-field stacking.

The fallback is contained in the same stylesheet and requires no extra author class, placement script, or item-count table. Its odd final item retains a half-width slot; a lone participant fills the field. Actual fallback spans become descendant metadata. Feature-off tests in current engines are not older-browser validation.

Repeating selections `peers-2` through `peers-6` are catalogue utilities: row-major equal positions, with partial final rows retaining their slots. These layouts do not infer editorial hierarchy.

The core implements Full/Neat/Thin/Wide/Ruled spacing with the reviewed insets and whole-bit gutters; mosaics remain Neat/Thin only. By default, ordinary layouts receive no vertical gaps, margins, typography, readable-measure or height defaults, or application shell. Element padding is an explicit `gp_pad` / `gp_pad--2` choice. Active mosaics add only their documented top-margin gutter defaults; these disappear when the mosaic gate closes.

### Ruled fields and ownership

`gp_spacing--ruled` selects a 56-bit field with four-bit outer insets and two-bit internal gutters. It uses the same reviewed Four wide-family rounding as Wide spacing. Its viewport aliases follow the ordinary spacing scale.

```html
<div class="gp_ruler gp_ruler--measure">
  <section class="gp_layout--stack gp_md--two-3-2 gp_spacing--ruled"
           style="--gp-rule-color: #64748b; --gp-rule-width: 1px;">
    <article class="gp_rule--end">First item.</article>
    <article class="gp_rule--end">Second item.</article>
  </section>
</div>
```

Ownership is explicit: `gp_rule--end` draws on an item's physical right side; `gp_rule--start` draws on its left. Choose one owner per shared gutter. The configurator uses end ownership for source participants, includes the measurement marker when the sequence needs rules, and exports no style tag or placement script. Rule color defaults to `currentColor`; width defaults to `1px`. The inline styling above is optional.

The captured ruler bit positions each line halfway across the two-bit gutter. Continuing layouts inherit that bit; a rebased coordinate root requires its own `gp_ruler--measure`. Without measurement, field geometry still works and decoration stays absent. No query container is silently added to all rulers.

Rules disappear at field edges, on full-field stacked/spanning items, outside Ruled spacing, and when a narrow inherited ruler cannot retain a complete two-bit gutter. Ruled mosaics use the existing unsupported-spacing stack. Decorative pseudo-elements are empty, ignore pointer input, and follow the owner's block extent; host vertical gaps/margins are preserved. Horizontal positioning compensates for the owner's side borders. Owners reserve `::before`/`::after`; ordinary host selectors can override the decoration. Selection and placement rules retain zero specificity; decorative pseudo selectors have only pseudo-element specificity.



## Three-region automatic allocation

All 46 three-region proportions compile through the same opt-in, ruler, spacing, and viewport-selection mechanism. Automatic allocation ranks valid physical allocations by matching outer counts, a differentiated center, smaller spread, then fewer center/left items. No count-specific exception is added for eleven items: its default is 4+3+4.

```html
<section class="gp_ruler gp_layout--stack gp_md--three-1-2-1
                gp_spacing--neat gp_traversal--center-first">
  <!-- Direct source participants, in original order -->
</section>
```

The proportions describe physical left/center/right widths. Counts change automatically with the source; traversal independently assigns consecutive source runs. Center-first is explicit; the shared default remains left-to-right. Right-to-left is supported at exactly three items and normalizes to left-to-right at other counts. The integration controls disable that request outside three items. Two-region allocation/fewer controls do not alter three-region counts.

`three-compiler.mjs` derives the accepted ranking using N mod 3 and quotient parity. It does not enumerate source counts, search candidates at runtime, inspect content, or import design experiments. `three-geometry.mjs` independently enumerates and ranks the bounded tuple pool and uses Euclidean GCD/LCM for verification.

Zero/one/two participants, too few usable tracks, and unavailable native arithmetic retain conservative source-order full-field stacking. There is no repeating-triples fallback. Actual assigned span metadata continues through nested rulers. Typography, measure, and height remain host-controlled.

Exact physical allocation uses three optional inputs:

```css
.featured-stories {
  --gp-exact-count-left: 5;
  --gp-exact-count-center: 3;
  --gp-exact-count-right: 4;
}
```

Place these declarations on the element selecting the three-region layout, either through author CSS or an inline style. The inputs are typed non-inheriting CSS integers, initially zero. They request physical counts independently of proportion/traversal; they do not expose the resolved output.

A complete positive tuple activates only when its total matches the direct-item count, spread is at most two, adjacent counts are coprime, and enhanced three-region geometry is active. Otherwise automatic allocation (or the existing stack safeguard) applies. Requests are retained across count changes and reactivate when eligible. Invalid, incomplete, negative, zero, or literal fractional requests safely fall back. CSS math expressions follow normal CSS integer computation. Other layout families do not reinterpret the three-region tuple. Four regions use their own complete four-input request; supporting pairs use the explicit endpoint arrangement contract.

The compiler bounds inputs before eligibility arithmetic and uses the spread-two neighbor test; no tuple selector catalogue, general GCD routine, new wrapper, or placement JavaScript is added. Continued/rebased nested layouts require their own inputs. Removing the declarations restores automatic allocation.

The integration page lists valid alternatives for the current source count, supports numeric entry, shows Active/Inactive status and actual resolved counts, and generates an explanatory comment alongside inline properties. For example:

```html
<!-- With 12 direct items: 5 left, 3 center, 4 right.
     Other counts use automatic allocation. -->
<section class="gp_ruler gp_layout--three-1-2-1 gp_traversal--center-first"
         style="--gp-exact-count-left:5; --gp-exact-count-center:3; --gp-exact-count-right:4;">
  <!-- Direct source participants -->
</section>
```

Resolved output properties remain private pending their own public scope/availability contract. Spanning is an explicitly selected two-region arrangement, as described below; it is not automatically selected as a compact arrangement.

## Four-region automatic allocation and exact refinement

The **25 four-region proportions** are: equal quarters and eight single-peak arrangements each for 6:5:4:3, 7:6:5:4, and 9:8:7:6. Names follow the same physical left-to-right grammar as two/three regions: `gp_layout--four-6-5-4-3`, with matching custom-property token and six viewport alias families. No `graded-*` alias or data attribute is needed.

```html
<section class="gp_ruler gp_layout--stack gp_md--two-3-2
                gp_lg--four-4-6-5-3 gp_spacing--thin
                gp_allocation--closest gp_traversal--widest-first">
  <!-- Direct source participants in original order -->
</section>
```

**Closest** is the default; **Stronger** is an explicit alternative using the same `gp_allocation--closest/stronger` classes and `--gp-allocation` tokens as two regions. Four regions search the reviewed finite offset pool, not every possible positive tuple. Candidates total N, remain within a count difference of four, and must have coprime physical neighbors after traversal. The first eligible candidate under the preference wins. Automatic allocation can change source-group membership when widest-first changes physical adjacency. Changing proportions under left-to-right preserves automatic membership.

Left-to-right is the shared default. `gp_traversal--widest-first` / `--gp-traversal:var(--gp-widest-first)` place consecutive source runs by descending **nominal** region width. Actual rounded width ties do not change that ranking. Equal quarters normalize widest-first to left-to-right. Unsupported right-to-left/center-first requests normalize to left-to-right for four regions. Widest-first requests on other integrated families likewise use their ordinary left-to-right behavior. The integration UI disables unsupported requests rather than changing to another family.

Optional exact inputs name physical regions:

```html
<!-- With 12 direct items: 2 left, 3 center-left, 4 center-right, 3 right.
     Other counts use automatic allocation. -->
<section class="gp_ruler gp_layout--four-4-6-5-3 gp_spacing--neat
                gp_traversal--widest-first"
         style="--gp-exact-count-left:2;
                --gp-exact-count-center-left:3;
                --gp-exact-count-center-right:4;
                --gp-exact-count-right:3;">
  <!-- Original direct source sequence -->
</section>
```

Four typed, non-inheriting positive CSS integer inputs must total N, have spread at most four, and have coprime physical neighbors. Complete valid requests override the automatic preference and keep their **physical counts** as proportions/traversal change. Traversal changes which consecutive source runs occupy those counts; it does not preserve logical source-group membership. Unused three-region `--gp-exact-count-center` does not affect a four-input request. Invalid, partial, fractional literal, huge, or count-mismatched requests restore automatic allocation; removing declarations restores automatic behavior, and retained requests reactivate at matching counts. CSS math follows normal integer computation.

Zero stays empty. Fewer than four source items, fewer than four usable tracks, no passing allocation, or unavailable native count arithmetic use source-order full-field stacking. There is no implicit repeating-fours fallback, lower-region substitution, content cutoff, or actual-width breakpoint. Viewport aliases and author-owned CSS conditions select activation independently. Geometry validity alone does not ensure readable narrow regions.

Proportions use cumulative whole-bit rounding, common field spacing, and actual assigned-span metadata. The 9:8:7:6 wide treatment retains the accepted **16/14/12/10** rank widths on the full ruler, using effective weights 8:7:6:5 on inherited rulers. Nominal ranking remains 9:8:7:6. Shared content-sized rows use the exact four-group LCM with the reviewed spread-four subset-GCD shortcut; this is not a general arbitrary-allocation LCM utility. There are no implicit vertical gaps, height defaults, or endpoint spanning for four regions; vertical spacing is an explicit utility.

`four-allocation.mjs` owns reviewed candidate data and build-time preference ordering. `four-compiler.mjs` emits native CSS search, exact eligibility, mapped groups, bounded row arithmetic, and the common private placement descriptor. `four-geometry.mjs` independently evaluates the pool with Euclidean GCD/LCM and physical rounding. Neither build nor oracle imports design experiments. Selection metadata follows `--gp-layout` overrides even when the underlying HTML class names another family. Continued/rebased nesting captures its own controls; parent allocation, traversal, and exact requests do not silently become child selections.

The integration page exposes eligible exact tuples beyond the automatic pool and keeps separate pair/three/four refinement drafts. Its output labels physical counts and source/focus order remains unchanged. Public resolved output tokens and arbitrary group permutations remain out of scope.

## Two-region spanning arrangements

Select `gp_arrangement--first-above`, `gp_arrangement--last-below`, or `gp_arrangement--first-above-last-below` alongside any existing `two-*` proportion. Across remains the default; `gp_arrangement--across` makes that explicit. Author CSS selects the same modes through non-inheriting `--gp-arrangement:var(--gp-first-above)`, `var(--gp-last-below)`, `var(--gp-first-above-last-below)`, or `var(--gp-across)`.

```html
<!-- First source item spans above; the other five form the pair. -->
<section class="gp_ruler gp_layout--two-3-2 gp_arrangement--first-above
                gp_spacing--neat gp_traversal--left-to-right">
  <!-- Six direct items in unchanged source order -->
</section>
```

First above reserves item 1. Last below reserves item N. Selecting both reserves both endpoints and leaves M=N−2 supports; a single spanning endpoint leaves M=N−1. These supporting items reuse the accepted two-region proportions, Closest/Stronger allocation, fewer-left/right direction, and supporting traversal. The span occupies the full usable field in one content-sized row; support rows use LCM(A,B). It receives full usable-field track metadata, and nested layouts retain their existing continuation/rebase contracts.

Zero stays empty. One is full-field. With fewer than two supports, all items get full-field source-order rows; a lone support does not reserve an empty column. When native arithmetic is unavailable, the selected endpoint remains full-width and supports use row-major equal pairs. Too few usable tracks invokes full-field stacking. This adds no height defaults, vertical gaps, or automatic responsive transition.

The supporting pair can request exact counts through `--gp-exact-count-left/right`. Both must be positive CSS integers, coprime, differ by at most four, and total **N−1**, or **N−2** when both endpoints span. Center must be zero/unset, preventing a three-region request from being interpreted as a pair request. Invalid/mismatched inputs restore automatic supporting allocation. Requests remain intact and reactivate at their matching count. Ordinary Across two-region layouts ignore exact inputs.

```html
<!-- With 6 direct items: last item below; 1 left and 4 right
     among the 5 supports. Other counts allocate supports automatically. -->
<section class="gp_ruler gp_layout--two-3-2 gp_arrangement--last-below"
         style="--gp-exact-count-left:1; --gp-exact-count-right:4;">
  <!-- Six direct items -->
</section>
```

```html
<!-- First and last span; the five middle items form a 1+4 pair. -->
<section class="gp_ruler gp_layout--two-3-2 gp_arrangement--first-above-last-below"
         style="--gp-exact-count-left:1; --gp-exact-count-right:4;">
  <!-- Seven direct items in unchanged source order -->
</section>
```

Spanning reallocates the supports after reserving one or both actual source endpoints. Exact counts always refer to the non-spanning participants.

## Vertical item spacing

`gp_vertical-spacing--0`, `--1`, and `--2` select zero, one, or two ruler bits of top-margin separation on a composition's direct participants. The top row stays flush. `gp_{prefix}-vertical-spacing--0/1/2` aliases use the same six viewport hinges; amounts carry forward independently of layout, field gutters, and item padding.

```html
<section class="gp_ruler gp_layout--three-1-2-1 gp_spacing--neat
                gp_vertical-spacing--1 gp_md-vertical-spacing--2 gp_xl-vertical-spacing--0">
  <article class="gp_pad">Content.</article>
  <!-- Other direct participants -->
</section>
```

Omitting these classes preserves ordinary host spacing and existing mosaic defaults. Explicit amounts override mosaic margins, including zero; removing all utility classes restores defaults. The zero-specificity selectors follow mosaic defaults in the generated cascade. Author margins still win normally. There is no new registration, ruler measurement, query context, native row gap, or fixed height. Percentages resolve against assigned tracks and the existing resolved starting row; continuation preserves parent bits and rebasing uses local bits. Unmarked nested compositions do not inherit this utility. Without required native counting/arithmetic, additional margins are omitted and host spacing remains.

The configurator exports the amount on the composition, saves it per transition, and offers Layout default only at the base; later steps inherit unless explicitly overridden. Shared rows remain content-sized and can redistribute height. See the [utility test fixtures](../../tests/README.md).

## Exact-count mosaics and track-relative gutters

All eight maps `gp_layout--mosaic-6` through `gp_layout--mosaic-13` are compiled, with matching `--gp-mosaic-*` tokens and six viewport alias families. The suffix names the exact direct-item count. Mismatches, unsupported full/wide/ruled spacing, empty rounded spans, or missing required CSS features stack; no other map or previous breakpoint choice is inferred. There are no compiled pixel/rem minimum widths. Ordinary selection overrides retain their normal precedence.

```html
<section class="gp_ruler gp_layout--stack
                gp_lg--mosaic-8 gp_spacing--thin">
  <!-- Eight direct source participants -->
</section>
```

Thin mosaics resolve their vertical gutter directly as `100% / var(--_gp-tracks)` on mapped participants, masked to zero on the top row. Continued layouts retain the parent bit size; rebased layouts use their new local bit size. Neither Thin nor Neat mosaics need a measurement marker or query containment. The separate `gp_ruler--measure` facility remains available for column rules and author-owned captured-length uses.

Mosaic row placements create twelve **implicit auto rows**. No root row template, auto-row, gap, or alignment declarations are added. Internal custom-property style queries activate map placement and top margins only while the selected parent is eligible. Closing the gate restores ordinary author/UA margins. Explicit host margins can override the zero-specificity default; arbitrary host margins/gaps are not automatically combined or rewritten. The CSS does not introduce a general width-query vocabulary. Unsupported style queries leave the stack fallback.

Mosaics have no implicit activation width or bundled smaller-screen alternative. Authors choose useful widths and replacement layouts explicitly. Counts outside the map contract stack in source order.

## Compiler boundaries

- `expressions.mjs` and `placement-compiler.mjs` compose shared arithmetic and final placement declarations. Family modules provide allocation and coordinates.
- `four-search.mjs` generates periodic selection from bounded candidate pools. Small-count corrections and a 24-item phase reproduce the independent enumeration oracle without imposing an item cutoff. Build-time guards check the proof assumptions.
- Four-region count-independent coefficients are cached on the selecting element and explicitly transferred to direct participants. Non-inheriting registrations isolate nested layouts.
- Adjacent physical counts are coprime. Four-region coupled rows therefore need pair GCDs only; tests compare the identity with an independent Euclidean LCM.
- Resolved-family style queries cancel unrelated calculations. Custom-property selection overrides follow the same path as classes. Missing query support preserves the documented fallback.
- Metadata decoding groups equal coefficients. Contiguous-family shortcuts are used only when the registry proves continuity; sparse catalogues retain exact membership.
- Selection and placement rules retain zero specificity. Host rules can override margins, padding and decoration through ordinary CSS.

## Build and validation

```sh
pnpm build
pnpm check
pnpm test
pnpm test:browsers --engine=chromium
pnpm test:browsers --engine=webkit
pnpm test:padding --engine=chromium
pnpm test:vertical-spacing --engine=chromium
```

Builds emit canonical unlayered/layered CSS, its size report and diagnostic mapping, generate the maintained integration fixture, validate attributed configurator content, and synchronize docs assets. They verify the versioned legacy build independently and do not change the release version. See the [test guide](../../tests/README.md) for full versus quick checks and utility matrices.

The generated [size report](../../css/size.json) is authoritative. At this checkpoint: 228,484 source bytes; 192,555 minified; 17,817 gzip; 10,411 Brotli. These figures cover the full 102-selection core, not legacy compatibility or prospective selective profiles.

Runtime can be reproduced with `node scripts/benchmark-core-runtime.mjs --engine=chromium` (or `webkit`); reports go to ignored `test-results/runtime/`. Check the script's options before a controlled comparison. Compression does not establish a runtime budget: synchronous computation/layout measurements are machine-specific and exclude paint, GPU and real-device interaction.

## Scope and limits

Coupled Two/Three/Four placements have a shared internal budget of **9,998 construction rows**, including any full-width endpoint rows. This reserves one row below Firefox's observed 9,999-row realization limit. Over-budget allocations stack the entire composition in source order in every browser; they do not repeat, clip content, drop endpoints or silently choose another allocation. Valid exact inputs remain selected but also stack when their construction grid exceeds the budget. Removing the request or changing source/layout restores composition automatically when safe. The check preserves field geometry and assigned-track metadata; continued and rebased layouts are checked independently. No new author class, measurement or script is required. It limits construction complexity rather than source count: Three can compose at 65 items, stack at 66 and compose again at 67. This safeguard does not promise unlimited browser grid capacity. See the [performance assessment](../../maintainers/performance.md) for the finding and follow-up evidence.

Native DOM and focus order are retained; visual column-first traversal still needs content-specific accessibility review. Structural tests do not establish conformance for arbitrary content, right-to-left writing or all assistive technology. Current Chromium, Firefox and WebKit structural qualification and bounded older-engine fallback evidence are recorded in [qualification](../../maintainers/qualification.md). Native-count-off equal pairs require the base arithmetic foundation; the tested Chromium 136 without `abs()` instead stacks all families. These observations do not establish support for every older engine. Runtime policy and manual assistive-technology review remain separate release gates.

Graph Paper does not supply typography, readable measure, image cropping, fixed composition heights, masonry, viewport packing, application shells, automatic minimum useful widths, or an authored container-query class family. Component CSS can select public layout tokens under author-owned conditions. Nested layouts use the explicit continuation/rebase forms above.
