# Validation

Validation checks the current 0.6 contracts and preserves the explicitly versioned legacy references. It does not turn any particular composition into a universally appropriate design or an accessibility guarantee for arbitrary content.

## Reproduce the build and package

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm validate
pnpm docs:check
pnpm test:package
pnpm test:distribution --engine=chromium
pnpm test:distribution --engine=webkit
```

`check` verifies deterministic distributions, diagnostic mappings, maintained fixtures, static docs and unit tests without changing generated files. `validate` checks catalogue/ruler invariants. Package tests inspect the actual publish tarball, exported bytes, static docs assets, development exclusions and the complete scoped legacy inspector module graph. They do not publish or install it.

## Run the structural matrices

```sh
pnpm test:browsers --engine=chromium
pnpm test:browsers --engine=webkit
pnpm test:padding --engine=chromium
pnpm test:padding --engine=webkit
pnpm test:vertical-spacing --engine=chromium
pnpm test:vertical-spacing --engine=webkit
```

The core matrix covers proportions, whole-bit fields, allocation, traversal, exact-count eligibility/restoration, spanning endpoints, responsive selections, narrow inherited rulers, continuation/rebasing, rules, source/focus order, mosaics, cleanup and no-JavaScript rendering. Independent frozen geometry and enumeration oracles guard against merely repeating the compiler formulas.

Utility matrices cover zero/one/two-bit amounts, overrides, overlays, nesting, viewport resets, content-sized row effects and percentage-based gutters without measurement. Distribution checks exercise all four delivery forms and layered author overrides.

`--quick` on the core browser script omits exhaustive profiles. Report it as a smoke test, not full release qualification. Feature-off tests in modern engines are not tests of an actual older browser.

## Reproduce the complete qualification

`pnpm test:release --suite=core`, `--suite=utilities`, `--suite=tools` and `--suite=package` run the maintained groups and record browser versions, commands, logs and before/after CSS hashes. Browser groups default to Chromium, Firefox and WebKit; add `--engine=firefox` to choose one. Run groups sequentially when they share fixed server ports.

`pnpm test:fallback` accepts an explicitly supplied older executable through `--executable`; a matching older driver can be supplied with `--driver`. It requires an actual engine without native counting and records the observed fallback mode without changing CSS. Older executable downloads are a test prerequisite, not a package dependency. See [Browser support](browser-support.md) for the actual tested builds and limitations.

## Check the documentation and configurator

Run `pnpm test:docs --engine=chromium` or `--engine=webkit` for site navigation, modern layout geometry, readable measures, ruler visibility, copyable examples and narrow-screen reflow. Run `pnpm test:configurator --engine=chromium` and then `--engine=webkit --docs-only` for controls, all catalogue choices, transitions, exact counts, exports, URL state, keyboard focus and isolated static delivery. Run the configurator engines sequentially because they share one local server port.

Markdown is maintained source; HTML and module/CSS mirrors are generated and checked in for static delivery. `docs:check` verifies local links, anchors and module imports. No dependency on the separate editorial demo is required.

## Preserve baselines without confusing APIs

The 0.4 stylesheet hashes are checked against the preserved reference. Original 0.2.3 CSS has its own frozen source hash and geometry fixture. Their regression commands remain separate from current-core qualification. The twelve historical whole-bit adjustments are recorded under [Migration](migration.md#earlier-023-migration-record).

## Interpret evidence carefully

Runtime benchmarks measure synchronous style/layout work on identified hardware and browser versions; they exclude paint, GPU work and real-device interaction. Record the CSS hash and keep content, options and device matched for comparisons. Compressed transfer size and runtime work are different costs.

Structural and keyboard checks do not replace manual screen-reader, magnification, contrast, source-hierarchy or content review. Native focus order is preserved; visual traversal can still be inappropriate. Current checks focus on horizontal left-to-right writing. The structural matrix includes the shared row-budget safeguard described in [Browser support](browser-support.md): boundary counts, exact requests, endpoint rows, visible non-overlap and restoration across all four builds. Manual assistive-technology review remains a separate release gate.

Column-rule rendering is tested separately from core. Run `pnpm test:column-rules --engine=chromium` (also Firefox/WebKit) to compare with the 0.5.2 decoration and verify core-only positioning neutrality and overlay traversal. Current structural artifact bindings are in the maintainer 0.6 qualification record; earlier 0.5 records do not qualify the new bytes.
