# 0.5 size and runtime assessment

This assessment measures the row-budget-guarded release candidate on macOS 27.2 / arm64. The machine-readable companion, `performance-0.5.json`, records artifact hashes, environment, options and timing summaries. Raw samples remain under ignored `test-results/runtime/`.

## Transfer and parsing surface

| Distribution | Raw bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
| Core readable | 228,484 | 20,497 | 12,536 |
| Core minified | 192,555 | 17,817 | 10,411 |
| Layered readable | 228,507 | 20,511 | 12,578 |
| Layered minified | 192,575 | 17,834 | 10,473 |

Compression uses Node's default gzip/Brotli settings; a CDN's settings may differ. Browser parsing and computed-style work depend on the decompressed stylesheet, not its transfer size. Load one distribution. Legacy CSS and authoring-tool JavaScript are separate requests and contribute zero bytes when not loaded.

The 0.4 reference minified core is 173,873 raw / 8,493 gzip / 5,261 Brotli bytes. Its optional bands are another 163,018 / 4,978 / 3,457 bytes. The new core is about 11% larger raw than the old core alone, but approximately twice its compressed size; relative to old core plus bands, it is smaller raw and larger compressed. These are scope comparisons, not equivalent APIs: the new build includes independent responsive selections, the expanded catalogue, allocation and spacing utilities.

## What the runtime figures mean

The harness inserts an inline stylesheet and forces layout, then measures warm width changes, layout-class changes and one direct-source-item append/remove per composition. It uses varied headline/body lengths, a 1,200px workspace (resized to 1,180px), one or twenty compositions, and alternates library/precompiled-CSS order across three rounds. Each operation updates every composition in that profile: twenty-root selection/source timings are deliberately bulk updates, not the cost of editing one isolated component. Initial timing combines parsing, registration, style and layout, not parsing alone. Timings exclude download, image decoding, paint, GPU, scrolling and real-device interaction. They are not frame-rate or responsiveness guarantees.

The fixed-CSS comparison knows both source counts and both arrangements in advance. It does not supply automatic allocation, track metadata, feature fallbacks or the full public API; it is a useful lower bound, not a feature-equivalent replacement. Geometry is compared for every composition before timing. Any state with visible same-region overlap invalidates the corresponding timings; broken layouts cannot qualify as fast.

Ordinary Thin mosaics are unmeasured: their vertical margins use assigned-track percentages. Shared-ruler and deliberately measured controls are separate profiles. An explicitly measured ruler carries semantics beyond the fixed baseline's containment; that comparison must not be presented as interchangeable implementations.

### Reference ordinary profile results (before the safeguard)

Apple M4 Pro; Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2. Three rounds, twenty timed operations per round after four warmups. Each composition has thirteen items, except the separate eight-item mosaic profile. The mixed twenty-composition page contains five each of Stack, Two, Three and Four. A single-composition `mixed` case is only Stack and must not be interpreted as all four families.

All values below are milliseconds; operation cells show **median / p95**. Initial is a three-round median. A measured zero means below timer resolution (approximately 0.1ms in Chromium, 1ms in Firefox/WebKit), not free work. Width changes here resize the workspace without crossing a viewport media-query threshold; layout selection is measured separately.

| Engine | Profile | Initial | Width change | Layout change | Add/remove source |
| --- | --- | ---: | ---: | ---: | ---: |
| Chromium | One Four | 16.2 | 0 / 0.1 | 7.8 / 8.1 | 5.6 / 6.2 |
| Firefox | One Four | 15 | 0 / 1 | 8 / 9 | 5 / 5 |
| WebKit | One Four | 33 | 0 / 1 | 9 / 10 | 8 / 9 |
| Chromium | Twenty mixed | 184.6 | 0.8 / 0.8 | 114.9 / 119.2 | 63.5 / 68.6 |
| Firefox | Twenty mixed | 33 | 1 / 2 | 47 / 48 | 28 / 29 |
| WebKit | Twenty mixed | 151 | 2 / 3 | 124 / 126 | 88 / 97 |

For twenty Four compositions, bulk layout changes reach median 155ms / 91ms / 186ms in Chromium / Firefox / WebKit; source changes reach 115.1ms / 45ms / 158ms. Ordinary unmeasured width changes remain around 1–2ms median. The meaningful remaining cost is allocation/style recomputation and initial style/layout, not just resizing tracks. This is material main-thread work when many compositions are changed together. One-composition edits and whole-page bulk updates have different practical costs.

The precompiled mixed-page comparison changes layouts in median 1.6ms / 3ms / 3ms, versus 114.9ms / 47ms / 124ms for the library. Its initial style/layout takes 3.1ms / 4ms / 6ms versus 184.6ms / 33ms / 151ms. These large differences show the price of the complete vocabulary, registrations and automatic machinery; transfer compression does not remove that work. They do not establish which part can be eliminated without changing the contract. No additional performance-only or design-scope changes are included in this assessment.

Thin thirteen-item mosaic source changes intentionally test falling out of the exact-count map into Stack and returning. Their higher p95 is not a measurement-root cost: the ordinary profile does not create a measurement context. See the companion JSON for every family, fixed-CSS comparisons and the separate shared-ruler control profiles.

### Shared ruler and measurement controls

Three rounds of twelve timed operations, twenty compositions under one ruler. Width-update values are median / p95 milliseconds:

| Engine | Mixed, unmeasured | Thin Mosaic 13, unmeasured |
| --- | ---: | ---: |
| Chromium | 0.9 / 1 | 1.1 / 1.2 |
| Firefox | 2 / 2 | 2 / 2 |
| WebKit | 2 / 3 | 3 / 3 |

The additional Chromium control deliberately marks that shared ruler for measurement. Width updates become **128.8 / 134.7ms** for mixed content and **129.3 / 135.8ms** for Thin mosaics. This isolates an avoidable captured-length invalidation cost in that tested engine/context. It supports leaving measurement explicit and absent from ordinary mosaic/padding/vertical-spacing use. It does not benchmark every measured nesting topology or establish an equivalent slowdown in the other engines.

## Reference coverage

The companion retains the original thirteen profiles and 148 summaries under `referenceProfiles`, including both fixed and library modes. All profiles use three rounds. Ordinary profiles use twenty timed operations per round and one/twenty compositions; shared and stress profiles use twelve. High-count profiles use one composition with 65 or 129 items and test both layout changes and the next source count. The explicit measurement control is Chromium-only. These are representative runtime samples, not performance qualification of every one of the 102 catalogue entries, every exact allocation or every viewport transition.

## Safeguard comparison

The guard adds **601 minified / 77 gzip / 50 Brotli bytes**: two private non-inheriting scalars and arithmetic in shared placement, with no new selectors or public classes. The following fresh paired runs use the archived pre-guard CSS and current CSS on the same machine/browser/content, three rounds of twelve timed operations. All ordinary cases use thirteen source items. Cells show median milliseconds **before → guarded**; p95, initial times, hashes and raw-report paths are retained in the companion. Before and after are separate serial browser launches, so small differences are noise candidates, not proof of a precise percentage cost.

| Engine | Profile | Width update | Layout update | Source update |
| --- | --- | ---: | ---: | ---: |
| chromium | One Four | 0.1 → 0 | 7.9 → 8 | 5.8 → 5.9 |
| chromium | Twenty Four | 1 → 1 | 156.2 → 158.6 | 115.3 → 115.2 |
| chromium | Twenty mixed | 0.8 → 0.8 | 115.8 → 116.8 | 61.2 → 64.9 |
| firefox | One Four | 0 → 0 | 8 → 9 | 5 → 5 |
| firefox | Twenty Four | 2 → 2 | 90 → 94 | 45 → 46 |
| firefox | Twenty mixed | 1 → 1 | 47 → 48 | 28 → 29 |
| webkit | One Four | 0 → 0 | 10 → 10 | 8 → 8 |
| webkit | Twenty Four | 2 → 3 | 191 → 189 | 161 → 158 |
| webkit | Twenty mixed | 2 → 2 | 127 → 127 | 93 → 92 |

Additional current profiles use one composition with 129 source items in each coupled family. Every geometry phase passes in all three engines, including Three/Four stacks that previously overlapped in Firefox. Source changes to 130 also test returning to a safe composition. Allocation arithmetic still runs before the budget check: the safeguard bounds realized construction work, not all computed-style work.

## Correctness limit exposed by stress testing

Before the safeguard, at 129 source items, Firefox 157 realizes only 9,999 rows in the tested default Three/Four compositions. The intended construction grids require 39,732 and 32,736 rows respectively; visible items overlap. Chromium 156 and WebKit 27.2 realize these cases without overlap in the same preflight. This is a browser realization limit, not a successful library fallback. The [Grid specification permits implementations to limit overlarge grids](https://www.w3.org/TR/css-grid-1/#overlarge-grids).

Row demand depends on the least common multiple of regional counts. It is nonmonotonic: the tested Three arrangement needs 462 construction rows at 65 items and 10,626 at 66. Thus neither passing a large-count case nor imposing an arbitrary item-count cap solves the general issue. Exact allocations and alternate arrangements need the same protection.

**Resolved on 8 November:** coupled placement now has a shared 9,998-row budget, including endpoint rows, reserving one row below Firefox's observed limit. Over-budget automatic or exact allocations stack the entire composition in source order across browsers; no alternate allocation is silently substituted. Safe counts and removal of an over-budget exact request restore composition. The expanded structural matrix verifies actual non-overlap and nested metadata across all four distributions. Public classes, selector specificity and the capability fallback contract are unchanged.

## Comparison policy

- Treat these hashes and measurements as the candidate baseline. Review compressed-size growth above 5% (roughly 18.7kB gzip / 10.9kB Brotli for minified core). This is a review trigger, not an automatic design cut or a promise about CDN compression.
- Repeat runtime comparisons on matched hardware, browser build, content, hash and options, with no concurrent browser benchmarks. Retain median, p95, raw samples and validity results across at least three rounds. Consider a repeatable increase greater than both 20% and 1ms a review trigger; rerun noisy cases before attributing a regression.
- Keep ordinary small compositions, twenty-composition pages, shared/measured contexts and high-count stress profiles separate. Do not average a correctness failure into performance results or use one engine's timing as another engine's budget.
- A passing automated benchmark does not complete manual accessibility, target-device or finished-content review.

## Reproduce

```sh
pnpm size
node scripts/benchmark-core-runtime.mjs --engine=chromium --rounds=3 --iterations=20 --tag=final-chromium
```

Repeat engines sequentially with `firefox` and `webkit`. Use `--context=shared`, `--measure-all`, `--padding`, `--cases=two-3-2,three-1-2-1,four-6-5-4-3`, `--count=65` or `--count=129` for focused profiles. The companion JSON records the actual options of every retained run. The benchmark checks the CSS fingerprint again after measurement.

The safeguard comparison is reproduced on current CSS with `--cases=four-6-5-4-3,mixed --rounds=3 --iterations=12`; its stress profile adds `--count=129 --compositions=1 --cases=two-3-2,three-1-2-1,four-6-5-4-3`. The pre-guard control used a temporary archived stylesheet, identified by its reference fingerprint; it is not an additional shipped distribution.
