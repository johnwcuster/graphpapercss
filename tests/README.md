# Maintaining regression coverage

The tests exercise the current core and versioned released baselines independently. No test or build requires the experimental workspace.

## Current checks

| Command | Coverage |
| --- | --- |
| `pnpm test` | Unit contracts, catalogue inventory, arithmetic, configurator model, repository invariants |
| `pnpm check` | Deterministic distributions, private diagnostic mapping, integration fixture, content/assets and all unit tests |
| `pnpm test:browsers --engine=chromium` | Full readable/minified/feature-off geometry and workflow matrix |
| `pnpm test:browsers --engine=webkit` | The same matrix in WebKit |
| `pnpm test:padding --engine=chromium` | Responsive zero/one/two-bit padding, overlays, nesting, author overrides and no-script rendering |
| `pnpm test:vertical-spacing --engine=chromium` | Generated comparison profiles and responsive vertical-spacing matrix, nesting, margin restoration and real content |
| `pnpm test:configurator --engine=chromium` | Public configurator controls, all catalogue selections, exports, URL restoration, keyboard interactions and preview scaling |
| `pnpm docs:check` | Generated documentation, deployed asset mirrors and local links |
| `pnpm test:docs --engine=chromium` | Site-wide current/legacy geometry, reading measures, ruler toggle and executed published HTML examples |

The docs script supports `--docs-only` to serve only the static directory. Padding, vertical-spacing, docs and configurator scripts also accept `--engine=webkit`. Run configurator engines sequentially because the harness uses one fixed port. Other browser scripts also start local HTTP servers; check their ports before overlapping runs. Use `pnpm browsers:install` when the required Playwright browsers are absent.

Configurator reflow checks include 720×450 and 960×540 CSS viewports (the available geometry at 200% zoom on common laptop/desktop windows), short wide windows, mobile, and 320×256. They verify that the header scrolls out of view, the panel has no constrained internal scrollport, focus restoration and native tabbing stay visible, and the simulated preview width is preserved. These automated viewport checks complement manual browser-zoom testing; they do not drive the browser's native zoom setting.

`--quick` on the core browser script is a smoke test; it omits exhaustive profiles and is not a release qualification. Browser evidence must name engines, script options and artifacts tested. Feature-disabled tests in modern engines do not prove older-browser support. Current three-engine qualification and real older-engine observations are recorded in the [qualification checkpoint](../maintainers/qualification.md).

The core runner also checks the 9,998-construction-row safeguard in every distribution: safe/unsafe neighboring counts, exact inputs, full-width endpoints, nondefault traversal, continued/rebased nesting and restoration. It checks actual visible same-region overlap as well as declared grid coordinates. The limit is shared across engines and is not an item-count cutoff.

## Fixtures and independent oracles

- `fixtures/library/`: the current integration harness. `scripts/build-integration-fixture.mjs` generates its HTML from the current catalogue and attributed configurator records. Browser assertions use its stable control IDs and record template. There is no separate staged engine.
- `fixtures/padding/`: touching blocks, image overlays and continued/rebased content. It loads the current core directly.
- `fixtures/vertical-spacing/`: shared cases, fixtures and real-content preview. `scripts/build-vertical-spacing-fixture.mjs` creates readable, minified, baseline and feature-off profiles in ignored `test-results/vertical-spacing/`.
- `oracles/catalogue.mjs`: frozen reviewed proportions and mosaic rectangles, intentionally independent of the production generator. Update only after reviewing an intentional geometry change.
- Other `oracles/*.mjs`: bounded enumeration and Euclidean GCD/LCM checks. These stay independent of optimized CSS expressions, so tests do not merely repeat the implementation.

Original library explanations and a ruler diagram are maintained with `docs/sequence/content.mjs` and its adjacent assets. Integration fixtures reuse that content and diagram instead of maintaining duplicate copies.

## Release groups and real older engines

`pnpm test:release --suite=core|utilities|tools|package` records commands, browser versions, complete CSS fingerprints and logs. The pipe notation names alternatives: pass one suite value. Browser groups default to all three engines; add `--engine=firefox` to select one. The runner rejects a CSS artifact change during a group.

`pnpm test:fallback --engine=chromium --executable="/path/to/older/headless_shell"` tests an actual engine without counting; it deliberately rejects a modern counting-capable engine. Firefox 137 additionally needs its matching Playwright driver via `--driver="/path/to/playwright/index.mjs"`. Keep older downloads isolated from repository dependencies. The harness distinguishes base-arithmetic equal pairs from the broader no-`abs()` stack, rather than assuming a single fallback.

The shared launcher isolates Firefox application data on macOS, in addition to Playwright's temporary profile. It does not change CSS feature preferences or use the normal personal profile. See the qualification record for the upstream issue and cleanup limits.

## Runtime and artifacts

`node scripts/benchmark-core-runtime.mjs --engine=chromium` (or `firefox`/`webkit`) benchmarks synchronous style/layout work. Options include `--rounds=3`, `--iterations=20`, `--css=PATH`, `--tag=NAME`, `--count=65`, `--compositions=1,20`, `--context=shared`, `--padding` and an intentional `--measure-all` control. Thin mosaics are unmeasured by default. Run engines and profiles serially; competing browser work invalidates timing comparisons.

Before timing, the harness compares fixed-CSS and library geometry for every composition at initial/resized/alternate-layout/added-source states. Visible same-region overlaps invalidate those operation timings instead of reporting fast but broken layouts. The fixed baseline knows both arrangements and counts in advance; it does not implement the library's allocation/metadata/fallback contracts. Reports name the browser, hardware, options and CSS hash and retain raw samples, median and p95. The benchmark excludes paint, GPU work and real-device interaction; it does not establish an interaction budget by itself. See [the final assessment](../maintainers/performance.md), including the Firefox high-row-count limitation.

Reports, screenshots, temporary package archives and generated comparison CSS belong in ignored `test-results/` or the system temporary directory. Current distribution CSS and docs asset mirrors remain checked in so static/CDN delivery works without a build.

## Released baseline

`pnpm legacy:test:browsers` runs the 0.4 reference harness. `pnpm test:inspector` and `pnpm test:inspector:package` qualify its scoped portable inspector. Those checks do not validate a 0.5 inspector API. `pnpm test:distribution` checks all four modern stylesheets in a browser; `pnpm test:package` audits the actual publish archive without publishing.
