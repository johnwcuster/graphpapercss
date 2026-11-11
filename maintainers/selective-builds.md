# Selective compiler feasibility

Measurements dated 10 November 2026. Selective compilation is shared by build
tooling and configurator downloads; it does not change the authoring contract.
The [predefined profile distributions](profiles.md) use the same implementation.
The canonical four CSS artifacts remain byte-for-byte unchanged.

## Approach

The compiler accepts a selection of existing layouts, viewport hinges, spacing
modes, and optional padding/vertical-spacing utilities. A selection wrapper
validates those choices and removes unreferenced private declarations and typed
property registrations. It follows dependencies across scopes and keeps public
inputs, public tokens, shared ruler metadata, and style-query dependencies.
Pruning understands only the compiler's generated CSS dialect; it is not a
general-purpose CSS tree shaker.

Whole unused family engines are omitted, including their placement descriptors,
allocation calculations and cancellation rules. Remaining families preserve
automatic counting, allocation, exact refinements, traversal, fallbacks and the
construction-row safeguard. Stack is always included as the implicit initial
layout. Layout token numbers stay identical to the full build.

This pass selects the union of layouts and hinges: each selected layout gets a
base alias and an alias at every selected hinge. It does not yet narrow each
layout to the one particular hinge where a configurator sequence uses it.
Refinement choices remain available within selected families. If any Four plan
is selected, its allocation engine still includes the shared search-order tables.
There is room for further specialization without changing the authoring API.

The build input for the one-composition profile is:

```js
compileSelection({
  layouts: ['stack', 'two-3-2', 'three-1-2-1'],
  hinges: [48, 64],
  spacing: ['neat'],
  padding: true,
  verticalSpacing: true,
});
```

This returns readable CSS plus a normalized selection manifest. The shared
implementation is `src/core/selection.mjs`; it is not a public package export.

## Delivery sizes

Bytes, using the existing private-name compaction, Lightning CSS minifier,
Node gzip and Brotli settings. These are complete standalone stylesheets, not
selector fragments requiring the full library alongside them.

| Profile | Layouts | Readable | Minified | Gzip | Brotli | Typed properties |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Full library | 102 | 228,484 | 192,555 | 17,817 | 10,411 | 350 |
| One responsive composition | 3 | 41,284 | 31,357 | 3,938 | 3,234 | 153 |
| Small site | 7 | 49,138 | 38,219 | 4,552 | 3,591 | 163 |
| Everything except Four/Mosaic | 69 | 104,377 | 89,326 | 9,844 | 5,998 | 177 |
| Stack and repeating Peers | 6 | 33,757 | 27,727 | 3,378 | 2,676 | 94 |
| Selected Four and mosaics | 4 | 81,191 | 64,472 | 6,766 | 4,925 | 247 |

Exact profile definitions live in `scripts/lib/selective-core.mjs`:

- **One composition:** Stack → Two 3:2 → Three 1:2:1; 48/64rem hinges,
  Neat spacing, padding and vertical spacing.
- **Small site:** Stack, Peers 2/3, Two 1:3 and 3:2, Three 1:2:1 and 2:1:1;
  40/48/64/80rem hinges, Neat/Thin/Wide spacing, both utilities.
- **Without Four/Mosaic:** all remaining layouts, all six hinges, all fields,
  both utilities and ruled measurement/ownership support.
- **Repeating:** Stack and Peers 2–6, all hinges/fields and both utilities.
- **Four and mosaics:** Stack, Four 6:5:4:3, Mosaic 8 and 13; 64/80rem hinges,
  Neat/Thin spacing, both utilities.

The one-composition and small-site builds cut gzip transfer by approximately
78% and 74%. A broad build without Four/Mosaic cuts it by 45%. Savings depend on
both selected machinery and vocabulary; this is not a per-layout linear cost.

## Qualification and runtime

The parity harness compares selective output directly with canonical CSS in
isolated pages. It checks bounding boxes, assigned-track metadata, explicit grid
positions, padding, vertical margins and visible rules. Cases cover every
selected layout/field, empty and underfilled sources, representative counts,
larger counts and row-budget transitions, exact requests and rejection,
spanning endpoints, public-token overrides, continued/rebased nesting, and
viewport boundaries with responsive exact-count and utility changes.

Readable and minified output are tested separately. A third profile disables
the native-count enhancement condition in both stylesheets. This is fallback
parity evidence, not testing in real older browsers. The full selection is
asserted byte-identical in unit tests instead of redundantly comparing it to
itself in the browser.

All **7,338 case comparisons per engine** passed in Chromium 156.0.8078.4,
Firefox 157.0 and WebKit 27.2. These are 2,446 configurations checked in each of
three formats, not 7,338 distinct layouts. The regular build/unit suite now
passes 121 tests, including eight selective-compiler/export tests. Documentation
and actual package checks also pass.

The bounded runtime harness compares minified full/selective CSS in fresh pages,
alternates execution order across three rounds, and tests one and twenty
compositions. It records initial CSS insertion plus forced style/layout and
warm width/source mutations, with four warmups and twelve measured operations
per round. Initial timing includes parsing, registration, style and layout; it
does not isolate any one of those costs. No network, paint or device frame-rate
claim is made. Raw timing samples and exact CSS hashes are retained in ignored
`test-results/selective-builds/`.

The [recorded summary](selective-builds.json) includes exact CSS hashes, profile
selections, engine versions and all runtime medians/p95 values. Runs used an
Apple M4 Pro on arm64 macOS, with the same engine builds listed above.

For the **small-site profile with twenty compositions**, observed medians were:

| Engine | Initial full → selective | Bulk source mutation full → selective | Width change full → selective |
| --- | ---: | ---: | ---: |
| Chromium | 85.2 → 23.4 ms | 46.1 → 18.5 ms | 0.7 → 0.7 ms |
| Firefox | 28 → 15 ms | 21 → 11 ms | 1 → 1 ms |
| WebKit | 115 → 36 ms | 69 → 32 ms | 2 → 2 ms |

A source mutation appends one participant to **every** composition, or removes
that added participant on the next iteration. These are bulk changes to twenty
roots, not the latency of editing one component. The selected layouts cycle
through the profile's non-Stack plans; profile labels describe available
capabilities, not one fixed layout. Individual compositions were also measured.

Across the tested profiles, initial and source-mutation timings improved in all
three engines. Warm width-change medians were mostly unchanged; p95 samples
include occasional spikes, and one WebKit width median changed from 1 to 2 ms.
Single-root width samples often hit timer resolution and must not be read as
zero cost. Removing unused registrations and dependency graphs appears useful
for style recalculation as well as transfer. This probe does not isolate their
individual contributions, prove memory savings or establish a universal speedup.

## Interpretation and next steps

Selective compilation is worthwhile without removing design capabilities from
the full library. The configurator requests the union of choices in a responsive
sequence; a future project build can request the union across its pages.
The predefined profiles use that same compiler rather than maintaining
separate CSS implementations.

Smaller output is still computational CSS, not a short hand-written diagram of
the design. A future explanation view should show the public selections and
their responsive sequence separately from complete runnable output.

Selections are explicit: include every layout used through classes or public
custom-property overrides, every needed hinge, and every spacing/utility family.
An excluded layout token is not available. Automatic template scanning, dynamic
class discovery, layered selective delivery and public build APIs remain future
work.

For now, load one selective stylesheet. Combining independently generated
subsets is not qualified: they have shared declarations, global registrations,
different private-name compaction mappings and potentially conflicting cascade
order. Independent viewport shards would need an explicit linking contract.

## Configurator delivery

The static configurator offers readable/minified CSS and matching HTML below
the markup panel. Compilation starts only on request in a module worker. Its
entire dependency graph is mirrored under `docs/assets/graph-paper/`; no build
server, external service or Node module is required. Compiler code is not
imported into the normal UI thread. The packed-distribution check verifies the
worker/UI graph from the actual archive and rejects dependencies outside docs.

Requirements come from emitted classes and exact-count properties. Unchanged
inherited transitions add no hinge, and unused padding/vertical-spacing utility
families are omitted. Layouts/fields remain selectable across all included
hinges. Changes to count, exact values or preview aids do not invalidate a build;
changed requirements do. Downloads use current HTML and the chosen filename.
Responses from stale worker requests cannot enable mismatched downloads.

Browser minification uses the shared private-name compactor and a conservative
generated-CSS whitespace pass, preserving quoted strings, selector combinators
and arithmetic operators. It performs no syntax lowering. CLI/minified
distribution builds still use Lightning CSS, so browser download sizes differ
from the CLI profile table above and include a version/selection banner.

Browser-minified parity adds 2,446 comparisons per engine. End-to-end
configurator checks in all three engines download actual CSS/HTML pairs, render
them with JavaScript disabled at ten viewport widths, and compare them with
full CSS. The sequence covers Stack/Two/Three/Four/Mosaic, ruled measurement,
responsive exact refinements, padding and vertical-spacing resets. Tests also
cover count changes, stale builds and unavailable-worker recovery. The full
stylesheet remains available when compilation cannot start.

## Reproduce

```sh
node scripts/probe-selective-builds.mjs
node --test tests/selective-core.test.mjs
node scripts/test-selective-builds.mjs --engine=chromium
node scripts/test-selective-builds.mjs --engine=firefox
node scripts/test-selective-builds.mjs --engine=webkit
node scripts/benchmark-selective-builds.mjs --engine=chromium
node scripts/benchmark-selective-builds.mjs --engine=firefox
node scripts/benchmark-selective-builds.mjs --engine=webkit
pnpm check
pnpm docs:check
pnpm test:package
```

Generated CSS, size JSON, parity reports and runtime samples stay under ignored
`test-results/selective-builds/`. Predefined profiles are maintained separately from these probe outputs; the
configurator also generates individual downloads locally.
