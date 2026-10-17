# Architecture

Graph Paper has one 64-bit ruler. A canvas starts it; a field selects an interval. Grid, set, and flow compose content on it. Subgrid continues inherited alignment; a nested canvas starts a new ruler and responsive context.

This architecture ships in the 0.4.0 preview of 1.0 and is unchanged in 0.4.1, which updates documentation and the configurator. The examples work with both releases. For installation, use [Getting started](getting-started.md). For class syntax and defaults, use the [class reference](class-reference.md).

## Canvas and fields

A `gp_canvas` establishes 64 equal CSS Grid tracks and a named inline-size query container. One bit is 1/64 of its content width. Structural coordinates are integer bits; zero-based ruler coordinates translate to CSS line numbers by adding one.

A direct-child `gp_field` continues the canvas tracks through subgrid. Its modifier chooses an interval, outer insets, and internal structural gutters.

| Field | Interval (bits) | Width | Internal gutter |
| --- | --- | ---: | ---: |
| Full | [0,64] | 64 | 0 |
| Neat | [2,62] | 60 | 0 |
| Thin | [2,61] | 59 | 1 |
| Wide | [3,61] | 58 | 2 |
| Ruled | [4,60] | 56 | 2 |

Gutters occupy ruler bits, rather than CSS column gaps. Adding horizontal grid gaps, padding, or a different track definition to these grids breaks that coordinate model. Component styling and vertical spacing belong to the host project.

## Recipes and occupancy

A grid recipe defines broad macro regions and expanded proportions. A set selects named item positions; flow refines their placement without changing source order. Region count, position count, and actual item count are distinct.

Without a named set, items occupy regions sequentially and continue into later rows. With a named set, unfilled positions preserve the selected geometry and additional items use full-width fallback. Each field resets inherited placement inputs so an outer recipe does not accidentally populate an inner one.

Geometry is resolved onto whole-bit boundaries for the selected field. Flow describes placement relative to macro starts and ends, independently of field geometry. See [Authoring compositions](authoring.md) for editorial decisions and the [class reference](class-reference.md) for valid-combination lookup.

## Responsive context

The default compact and expanded thresholds are 30rem and 60rem of canvas width. Compact layouts use normalized simplified arrangements; stacked layouts use block flow in source order. Graph Paper does not reorder the DOM or use positive tabindex to reconcile reading order.

Optional experimental bands replace default thresholds with geometry-derived transitions based on minimum useful position width. They do not change the recipe's expanded proportions or select another compact arrangement. Fields on the same canvas may choose different bands, but they still reference that canvas's width.

A narrower field does not establish a narrower query context. See [Responsive design](responsive-design.md) for the authoring model and the [band reference](responsive-bands.md) for arithmetic and calibration.

## Continuing and rebasing alignment

Subgrid continues the tracks occupied by a semantic wrapper. Its descendants use local inherited line numbers; it creates no query container and assigns no automatic inner recipe.

A nested canvas rebases both geometry and response. It establishes its own 64 bits based on its own width, with fields explicitly selected again. Choose it for independent inner composition, not as a substitute for inherited alignment. See [Alignment and nesting](alignment.md).

## Rules and exceptions

Ruled fields reserve whole-bit gutters. Explicit edge ownership places markers at their centers; placement metadata suppresses outer edges and inappropriate responsive markers. Rules, explicit placement, bit insets, and optical adjustments are documented in the [class reference](class-reference.md).

Structural alignment uses integer ruler coordinates. Optical adjustments are intentional visual exceptions, not changes to the coordinate system.

## Scope

Core supplies composition, not typography, colors, components, image helpers, print styling, or vertical rhythm. Modern browser requirements and distribution choices are documented under [Browser support and builds](browser-support.md).

The configurator is optional documentation tooling, separate from core CSS. Its interface is documented in [Configurator help](configurator-help.html); it is not a published inspector script or a required runtime.

For existing sites, [Migration from 0.2.3](migration.html) explains compatibility choices and the twelve intentional whole-bit geometry changes. For maintainers, [Contributing](contributing.md) identifies manifests, generators, and tests.
