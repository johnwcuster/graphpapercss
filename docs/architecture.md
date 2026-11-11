# Architecture

Graph Paper is a spatial arrangement library. Its authoritative model is a **64-bit ruler**, an assigned field and layout, direct participants, and explicit continuation or rebasing for nested composition. Responsive selection is authored separately.

## Coordinates and usable space

A `gp_ruler` establishes 64 equal local tracks. Layouts use those coordinates directly or receive an assigned portion through a continuation wrapper. A `gp_rebase_64` starts 64 new tracks inside its local area.

Spacing selects the usable field and internal gutters. Full, Neat, Thin, Wide and Ruled use nominal fields of 64, 60, 59, 58 and 56 bits. Item spans account for internal gutters; a field's bit count is not the width of one column. Whole-bit cumulative rounding closes the field and preserves nonempty spans on inherited rulers.

There is no separate `gp_field` or `gp_canvas` requirement in the new API. Those names belong to the previous version; [Migration](migration.md) explains the boundary.

## Select an arrangement

The catalogue includes Stack, repeating Peers, two-/three-/four-region compositions, and exact-count mosaics. Proportions are physical left to right. Traversal assigns source runs independently. Selection is available through public classes and equivalent named custom-property tokens.

A recognized layout class activates composition behavior; assigning `--gp-layout` to an arbitrary unmarked element is insufficient. Public selection inputs are typed and non-inheriting so an outer layout does not silently configure an independently selected inner layout.

## Count and allocate direct participants

Native CSS counts direct element children. All elements count, including hidden ones; comments, text and descendants do not increase the outer count. There is no author-maintained count variable or `set_*` selection.

Repeating layouts traverse rows. Compositions allocate consecutive source runs to regions and coordinate content-sized rows. Adjacent coprime counts avoid shared internal subdivisions that can look like row-major reading. Exact physical-count requests refine eligible allocations; invalid requests restore automatic behavior.

Mosaics use fixed reviewed maps for exactly six through thirteen items. Their implicit rows remain content-sized. They do not pack a viewport, guarantee equal visible areas, or create independent masonry columns.

## Keep response separate from coordinates

Six mobile-up viewport steps select layouts and controls. Every decision carries forward independently until replaced. Continuing or rebasing tracks does not create a local breakpoint. Component-specific conditions remain author CSS selecting the same public tokens.

The library does not infer an item's semantic importance, inspect text length or automatically replace a narrow but structurally valid composition. The author owns those decisions.

## Own each kind of spacing explicitly

Gutters, item padding and vertical spacing are distinct. Ordinary layouts have no implicit vertical gaps. Thin mosaics supply one-bit top-margin defaults below their top row; explicit vertical-spacing classes replace those defaults.

Padding and vertical spacing resolve percentages from assigned tracks without capturing a length on an ancestor. Column rules and author-owned CSS can opt into `gp_ruler--measure` when they need a captured `--gp-ruler-bit` length. Continuation preserves that rhythm; a measured rebase establishes a local one. Measurement is not a responsive selection.

## Preserve normal CSS ownership

Selection and placement use zero-specificity selectors. Host CSS supplies type, measure, images, component styling and any custom positioning. It can override public layout tokens or utility declarations through ordinary cascade rules. Private numeric IDs and `--_gp-*` arithmetic are implementation details; minification may rename them.

The layered build contains the same core in `@layer graph-paper`. It is an alternative delivery form, not an additional sheet to load on top of the unlayered core.

## Apply conservative safeguards

An underfilled or unsupported Three/Four composition stacks. An ineligible mosaic stacks without choosing another map. The two-region native-arithmetic-off profile uses equal repeating pairs, retaining explicitly spanning endpoints when applicable. Feature-disabled tests in modern engines do not establish an older-browser support guarantee.

The core needs no runtime JavaScript. The configurator generates HTML and the inspector is optional tooling; neither is part of layout computation. See [Class reference](class-reference.md), [Browser support and builds](browser-support.md), and [Validation](validation.md).

## Layout and layering boundary

Core assigns no positioning, z-index, transforms, or decorative pseudo-elements. The optional [column-rules extension](class-reference.md#column-rules-extension) adds positioning only to explicit rule owners and decoration to their pseudo-elements. It consumes a stable, reserved geometry interface shared by full, predefined, and custom builds. Load the extension after a core from the same release; independently compiled core builds remain alternatives, not addons.

Measurement remains an explicit ruler choice. It supplies the bit length needed by lines and introduces inline-size containment. Ordinary rulers do not acquire that measurement context automatically. Application overlays and layer hierarchies remain author responsibilities.
