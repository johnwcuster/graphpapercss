# Graph Paper 1.0 architecture

Graph Paper has one 64-bit ruler. A canvas starts it. A field selects an
interval. Grid, set, and flow compose content on it. Subgrid continues it;
a nested canvas starts a new ruler.

`gp_canvas` establishes a named inline-size query container and 64 equal CSS
Grid tracks. One bit is 1/64 of its content inline size. Structural coordinates
are integer bits; CSS line numbers equal the zero-based bit coordinate plus one.

`gp_field` continues canvas tracks with subgrid. Add exactly one field modifier:

| Field | Interval (bits) | Width | Structural gutter |
| --- | --- | ---: | ---: |
| `gp_field--full` | [0,64] | 64 | 0 |
| `gp_field--neat` | [2,62] | 60 | 0 |
| `gp_field--thin` | [2,61] | 59 | 1 |
| `gp_field--wide` | [3,61] | 58 | 2 |
| `gp_field--ruled` | [4,60] | 56 | 2 |

Gutters occupy empty ruler bits rather than CSS column gaps. Do not add a
horizontal CSS gap, padding, or altered track definition to canvas/field grids;
those would change the ruler. Vertical spacing belongs to the host project.

All 72 legacy `grid_*` IDs retain their proportional design intent and family
semantics. Equal five/six columns and the 5:3 `grid_02a--07` are additive recipes.
Recipes declare content proportions on the neat field. The compiler accounts
for each field's gutters and quantizes cumulative boundaries together,
preserving closure and integer gutters. Flow placement
refers to macro starts/ends independently of field geometry. Resolved coordinates
are available through `src/ruler/geometry.mjs` without parsing compiled CSS.

The twelve intentional changes for `grid_03a/b/c/d` in neat/thin/wide are frozen
in `src/ruler/accepted-changes.mjs`. See the [migration record](geometry-changes.md) and
[accepted-change comparisons](geometry-changes.html). Full and ruled are new field
policies; they are not claims of legacy pixel parity.

Expanded starts at 60rem of canvas width; compact starts at 30rem. Thresholds
are build-time inputs in `src/manifest/responsive.mjs`. Compact recompiles the
normalized simplified layouts onto field coordinates. Stacked mode uses normal
source-order block flow. No `order`, DOM reordering, or positive `tabindex` is used.

`gp_subgrid` continues the tracks occupied by its semantic wrapper without
creating a query context. Place its descendants using local inherited line
numbers. A nested `gp_canvas` creates independent geometry and responsive state;
its field is explicitly selected again. Full-bleed surfaces and inset content can
overlap on the same row without starting a second canvas.

The ruled field reserves two bits per gutter. `gp_rule--start` / `gp_rule--end`
explicitly assign an edge's ownership, placing a customizable one-pixel marker
one bit outside the item, centered on an integer ruler line. Choose one owner
per shared gutter. Generated flow metadata hides markers on outer edges,
full-span compact items, and stacked compositions. Other fields do not receive
ruled treatment. Rule width and color are host-overridable custom properties.

The existing escape hatches remain small: `gp_inset--bit`, `gp_place`, and
`gp_optical`. Explicit placement should use integer local lines; optical shifts
use font-relative units and are deliberate exceptions to structural alignment.
Custom placements must also explicitly manage rule ownership; generated rule
metadata describes the recipe placement, not arbitrary author overrides.

Modern core requires container queries, `cqi`, and subgrid. It supplies no fonts,
colors, global typography, image helpers, print theme, or vertical rhythm. Legacy
standalone behavior is a separate compatibility choice, not a modern fallback.

The [configurator](configurator.html) renders actual generated CSS and offers
width, field, flow, ruler, macro, and source-order controls. Its optional legacy
comparison uses the released 0.2.3 stylesheet.
