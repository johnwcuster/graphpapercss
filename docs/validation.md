# 1.0 release-candidate validation

Validated October 12, 2026, using pinned Playwright 1.64.0 and Lightning CSS
1.33.0. These are actual engine versions tested, not inferred minimum versions.

| Engine | Tested version | Modern variants | Combinations per variant | Assertions per variant |
| --- | --- | ---: | ---: | ---: |
| Chromium | 156.0.8078.4 | 4 | 15,585 | 229,463 |
| Firefox | 157.0 | 4 | 15,585 | 229,463 |
| WebKit | 27.2 | 4 | 15,585 | 229,463 |

All passed. The four variants are `main.css`, `main.min.css`,
`main.layer.css`, and `main.layer.min.css`. Coverage spans all 72 migrated
legacy recipes plus three accepted additive recipes, five fields, compatible
flows, expanded/compact/stacked states, and focused structural assertions.
The suite checks rule offsets and responsive ownership across every ruled-field
combination, semantic subgrid, nesting, overlays, host-controlled spacing,
breakpoint boundaries, and explicit placement overrides.

The primary configurator and accepted-change comparisons passed regression
checks in each engine. The complete modern matrix was run in the isolated
official Linux container; Chromium and WebKit also passed local macOS runs.
Firefox's macOS launch issue did not require changes to personal browser data
or permissions. See [browser support](browser-support.md) for reproduction.

Ordinary and minified compatibility and explicit legacy builds each matched
416 frozen-reference layout captures in all three engines. The regression harness
measures in memory without writing to the preserved baseline.

`npm run check` passes eight Node test groups covering manifest invariants,
frozen legacy coverage, source hashes, horizontal placement, non-overlap,
accepted replacements, deterministic builds, legacy preservation, modern
selector scope, absence of core vertical spacing, and size budgets.

The 216-record historical audit contains 204 EXACT and twelve ACCEPTED records,
with zero NEAR or REVIEW warnings. Accepted coordinates are explicitly frozen
and tested against the approved replacements.

| Asset | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Frozen legacy | 39,291 | 4,795 |
| Modern readable core | 224,503 | 11,209 |
| Modern minified core | 200,470 | 10,699 |
| Modern layered minified | 200,490 | 10,718 |

The modern minified ceiling is 12,000 gzip bytes. Minified core is approximately
5.10× legacy raw size and 2.23× legacy gzip size. Modern core includes five
field policies and full rule metadata, with no standalone compatibility path.

`npm pack --dry-run --json` verifies the prepared `1.0.0-rc.0` package includes
release CSS, explicit legacy alternatives, license, quick start, migration,
architecture, browser notes, and release notes. Self-contained visual documentation includes only the pure geometry modules it
uses. Contributor scripts, tests, and node_modules are excluded.
The dry run does not publish or create a Git tag.
