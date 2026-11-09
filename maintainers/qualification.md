# 0.5 structural qualification

Verified 8 November 2026 on macOS 27.2 / arm64. The [machine-readable record](qualification-0.5.json) binds this checkpoint to all four CSS artifact hashes. This is structural/browser qualification; it does not close the separate runtime budget, manual assistive-technology or release-metadata gates.

**Row-limit finding resolved:** shared placement now limits coupled construction grids to 9,998 rows, including full-width endpoints. Over-budget Two/Three/Four allocations stack in source order consistently in all engines. Boundary tests check actual visible non-overlap, exact requests, nondefault traversal, continued/rebased nesting and restoration across all four builds. The full matrices below were rerun against the guarded artifacts; see [the performance assessment](performance.md).

## Tested engines

| Playwright engine | Build | Full core checks | Padding | Vertical spacing | Four distributions |
| --- | --- | ---: | ---: | ---: | ---: |
| Chromium | 156.0.8078.4 | 39,145 | 8,886 | 183,169 | 27,324 |
| Firefox | 157.0 | 39,145 | 8,886 | 183,169 | 27,324 |
| WebKit | 27.2 | 39,145 | 8,886 | 183,169 | 27,324 |

All three also passed the 24-page/84-width documentation check with twelve executed HTML examples, the complete configurator workflow, and the separately scoped 0.4 inspector's cross-origin/session-safety checks. Playwright's engine builds are not a certification of every corresponding retail patch version, device, OS or mobile browser.

Core checks used full readable/minified/native-arithmetic-off matrices, not `--quick`. They include viewport transitions, nested tracks, rebasing, exact-count restoration, overrides, native focus order, rules, mosaic cleanup and no-script rendering. Unlayered and layered distributions retain the same geometry and author-override behavior.

Minified core SHA-256: `ed8c6e8388ea15bfe716ad34ef1faae86bebce8658b9aa2877e4e09866919b58`. Core CSS did not change during this pass.

After full qualification, readable private identifiers were normalized to `--_gp-*`. Both minified distributions remain byte-for-byte identical to the qualified artifacts; readable output was verified as a pure identifier substitution with the same compact mapping. Supplementary Chromium/Firefox/WebKit smoke runs each passed 3,133 geometry checks using the updated diagnostic names. The machine record preserves the prior readable fingerprints and this equivalence evidence; the full-matrix totals above were not rerun for this naming-only change.

## Real older engines

Both real engines passed **204,916 assertions each** against the unchanged readable/minified/layered builds, across all catalogue entries, five fields, selected source counts, endpoint arrangements and nested padding. No CSS feature was disabled or rewritten to obtain these results.

- **Firefox 137.0:** lacks sibling counting, retains ordinary CSS arithmetic. Peers repeat; Two uses equal row-major pairs, retaining eligible explicit endpoints; Three/Four/Mosaic stack.
- **Chromium 136.0.7103.25:** lacks both sibling counting and `abs()`. Every family conservatively stacks in source order. Tested field geometry and continued/rebased padding remain usable. Do not promise the equal-pairs fallback in this engine.

The older runner and browser downloads were isolated in temporary storage; the repository's Playwright dependency and lockfile did not change. Firefox 137 uses its matching Playwright 1.52 driver because the current Juggler protocol is incompatible with that older browser.

These observations are bounded compatibility evidence, not a guarantee for every older engine. Engines missing the common Grid/subgrid/nesting/typed-property/rounding foundation are unqualified. See the public [support policy](../docs/browser-support.md) for vendor capability references and the boundary between feature availability and actual qualification.

## Reproduction and artifacts

```sh
pnpm test:release --suite=core
pnpm test:release --suite=utilities
pnpm test:release --suite=tools
pnpm test:release --suite=package
```

Add `--engine=firefox` (or Chromium/WebKit) to select one engine for a browser suite. The release runner records exact commands, versions, logs and before/after CSS fingerprints in ignored `test-results/release/`. Current core, utility and tool groups were rerun through the release runner after adding the row-budget safeguard. Original pre-safeguard evidence is superseded by the current artifact fingerprints.

Real older-engine testing requires an intentionally provisioned executable:

```sh
pnpm test:fallback --engine=chromium --executable="/path/to/older/headless_shell"
pnpm test:fallback --engine=firefox --driver="/path/to/matching/playwright/index.mjs" --executable="/path/to/older/firefox"
```

The fallback harness rejects an engine that already has native count arithmetic. It records the actual arithmetic capabilities, observed fallback mode, browser version and unchanged CSS hashes under `test-results/fallback/`. Use matching drivers when older protocols differ.

On macOS, the launcher isolates Firefox application-data discovery as well as its temporary profile to avoid the [upstream Playwright/macOS issue](https://github.com/microsoft/playwright/issues/42768). It changes neither CSS feature preferences nor the user's normal browser profile. Some generated special directories can remain in OS temporary storage when macOS denies cleanup; the launcher does not change their permissions.

## Fixes from qualification

- The dev server's CORS allowlist now includes versioned legacy metadata and docs-only module paths, restoring actual cross-origin inspector imports after source relocation.
- The configurator distinguishes a missing base arithmetic capability from the ordinary native-count-off profile. It does not claim equal pairs when the tested engine instead stacks.
- Browser tests share isolated Firefox launching and accept explicit older executable/driver overrides. The initial compatibility fixes did not change layout geometry. The subsequent shared row-budget guard intentionally changes only over-budget coupled placements; public authoring classes and selector specificity remain unchanged.
