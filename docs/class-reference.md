# Class reference

Use this page to look up the modern CSS authoring contract. For a first example, see [Getting started](getting-started.md); for choosing relationships around content, see [Authoring compositions](authoring.md).

## Required structure

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--wide grid_02">
    <article>First item</article>
    <article>Second item</article>
  </section>
</div>
```

| Class | Apply to | Contract |
| --- | --- | --- |
| `gp_canvas` | A container around fields | Starts 64 equal tracks and a named inline-size responsive context. Its width normally follows its parent. |
| `gp_field` | A direct child of a canvas | Continues the ruler and selects its usable span through exactly one field modifier. |
| `grid_*` | The field | Chooses the responsive composition recipe and expanded macro proportions. Use one recipe. |
| `set_03`–`set_06` | The recipe-bearing field, if compatible | Selects a named arrangement of positions. Omit for sequential occupancy. |
| `flow_*` | The same field, if compatible with the named set | Refines placement. Omit for the set's default flow. |
| `gp_band--01`–`gp_band--03` | The same field, optionally | Replaces default transition thresholds. Requires the separate bands stylesheet. Use at most one. |

Items are the field's direct element children, regardless of tag name. A wrapper, heading, or decorative element added as another direct child participates in item counting. Put internal component structure inside the intended item instead.

A field without a recipe can frame prose or other full-span content: its direct children default to full field width. A field is not an independent query container.

## Fields and gutters

| Modifier | Canvas interval | Usable bits | Internal gutter |
| --- | --- | ---: | ---: |
| `gp_field--full` | [0,64] | 64 | 0 bits |
| `gp_field--neat` | [2,62] | 60 | 0 bits |
| `gp_field--thin` | [2,61] | 59 | 1 bit |
| `gp_field--wide` | [3,61] | 58 | 2 bits |
| `gp_field--ruled` | [4,60] | 56 | 2 bits, with explicit rule owners |

One bit is 1/64 of the canvas content width. These intervals are zero-based coordinates, not CSS line numbers. Gutters occupy ruler bits between macro regions; they are not CSS `column-gap`. An item spanning regions includes their intervening space.

Do not add horizontal CSS gap or padding, or replace track definitions, on the canvas/field grids. Component padding belongs inside items. Vertical gaps and margins remain host-controlled; stacked fields become block flow, so grid row gaps alone do not supply stacked spacing.

## Recipes, positions, and defaults

Recipe families include two-, three-, and four-region alternatives, plus equal five- and six-region recipes. `grid_02a--07` is a 5:3 content-proportion option. The catalogue is constrained: not every number, letter, and variant combination exists.

The region count describes expanded macro geometry, not item count or a guarantee at compact widths. Letters are family-specific alternatives. Numbered variants are proportional alternatives, not a universal prominence scale.

| Choice | If omitted | With a supported selection |
| --- | --- | --- |
| Set | Sequential macro occupancy in expanded, pairs in compact, source order in stacked; continues into later rows | Recipe-specific named positions; unfilled positions remain, extra items fall back full-width |
| Flow | The named set's intentional default | A compatible alternative placement without DOM reordering |
| Band | Compact at 30rem and expanded at 60rem of canvas width | Geometry-derived thresholds for both transitions |

Named sets are `set_03`, `set_04`, `set_05`, and `set_06`, subject to recipe compatibility. There is no `set_02`. Do not add a set just to make its suffix match the macro-region count.

Item count need not equal position count. Unfilled positions can be deliberate negative space rather than an authoring error; [Composing a site](site-authoring.md#establish-a-recurring-reading-position) demonstrates a reading section occupying only its primary position. Review the result across responsive states instead of automatically changing the set.

Flow IDs are also compatibility-dependent. A supported alternative can be visually equivalent for certain settings or occupied positions. An unsupported combination is not a documented way to request a fallback: use a real combination instead.

## Find valid combinations

The [configurator](configurator.html) exposes the catalogue, compatible sets and flows, real responsive previews, applied classes, and copyable markup. Disabled choices do not exist for the current combination; muted selectable choices are equivalent for the compared settings.

The [static recipe catalogue](#recipe-catalogue) below lists every recipe and its supported named set/flow combinations without JavaScript. It is generated from the same manifests as the CSS. Search for an exact ID rather than assuming that every possible suffix exists.

Repository tooling can read the same manifests without parsing generated CSS:

```js
import { recipes, layoutsFor, expandedPlacements, compactPlacements,
  sequentialPlacements } from './src/ruler/geometry.mjs';

const recipe = recipes.grid_03;
const choices = layoutsFor(recipe); // Supported named set/flow combinations.
const layout = choices.find(choice => choice.set === 'set_03' && !choice.flow);
const expanded = expandedPlacements(recipe, 'wide', layout);
const compact = compactPlacements('wide', layout);
const gridOnly = sequentialPlacements(recipe, 'wide', 3, 'expanded');
```

`Object.keys(recipes)` lists valid recipe IDs. `layoutsFor` returns named combinations, not grid-only occupancy. Returned item line indices are local to the field. These modules are repository inspection/build tools, not a required client-side JavaScript API or a separately versioned package export.

## Subgrid and nested canvases

| Choice | Apply to | Inherits or starts |
| --- | --- | --- |
| `gp_subgrid` | A grid item/semantic wrapper spanning inherited tracks | Continues occupied tracks; does not create a new query context or automatically assign descendants a recipe |
| Nested `gp_canvas` | An item or a container inside it | Starts an independent 64-bit ruler and responsive context; select an inner field again |

Subgrid descendants use local inherited line numbers. A nested canvas's bits refer to its own width, not the outer ruler. See [Alignment and nesting](alignment.md) for complete examples.

## Column rules

Use `gp_field--ruled`, then assign `gp_rule--start` or `gp_rule--end` to a direct item owning an internal gutter edge. Assign one owner per shared gutter to avoid duplicate rules.

```html
<div class="gp_canvas">
  <section class="gp_field gp_field--ruled grid_02 publication">
    <article class="gp_rule--end">First item</article>
    <article>Second item</article>
  </section>
</div>
```

```css
.publication {
  --gp-rule-color: #64748b; /* Defaults to currentColor. */
  --gp-rule-width: 1px;    /* Defaults to 1px. */
}
```

The marker is centered one bit outside the item, halfway through the two-bit gutter. Generated placement metadata suppresses outer-edge markers, responsive full-span markers, and stacked rules. Rules use `::before`/`::after`; avoid assigning competing component decoration to the same pseudo-element. Other field modifiers do not activate ruled treatment.

## Explicit adjustments

These are escape hatches, not prerequisites for normal recipe authoring.

| Class | Inputs | Effect |
| --- | --- | --- |
| `gp_place` | `--gp-column-start`, `--gp-column-end`; optional `--gp-row-start`, `--gp-row-end` | Explicit grid placement using local CSS line numbers. Row inputs default to `auto`. |
| `gp_inset--bit` | Inherited `--gp-bit` | Adds one canvas-bit inline padding to an element; use inside items, not on the canvas/field grid. |
| `gp_optical` | `--gp-optical-x`, `--gp-optical-y`, default `0em` | Translates visual appearance without changing structural layout; use font-relative offsets deliberately. |

For example, on a descendant inside a subgrid:

```html
<div class="gp_place" style="--gp-column-start: 1; --gp-column-end: -1">
  Content spanning the inherited tracks
</div>
```

Explicit placement must be authored and checked across responsive states. It does not automatically acquire a compact design or repair rule ownership; generated metadata still describes the original recipe. Do not treat internal generated custom properties as a general-purpose public placement API.

## Recipe catalogue

Each row lists one real recipe. Region widths run from start to end in the wide field's expanded layout; these are content widths in canvas bits, excluding internal gutters, not universal proportions for every field. Use the configurator to see other fields and compact arrangements.

All recipes also support sequential occupancy with no set or flow class. In the named-combinations column, **default means omit the flow class**. Only the flows listed beside that set are supported for that recipe. Presence here does not imply a visible difference for every occupied item count or responsive state.

<!-- Source readers: the marker below expands in class-reference.html#recipe-catalogue.
Repository agents can also use the manifest lookup above. -->

<!-- recipe-catalogue -->
