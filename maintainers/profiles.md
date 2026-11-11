# Standalone profile qualification

Prepared for 0.5.2 on 10 November 2026. The four full CSS distributions retain
their qualified 0.5.0/0.5.1 bytes; these profiles add optional delivery paths.
The source capability manifest is `src/core/profiles.mjs`. Generated
`css/profiles/manifest.json` records exact selections, sizes and CSS hashes.

| Profile | Layouts | Readable bytes | Minified bytes | Gzip | Brotli |
| --- | ---: | ---: | ---: | ---: | ---: |
| repeating | 6 | 33,757 | 27,727 | 3,378 | 2,676 |
| two-three | 69 | 104,377 | 89,326 | 9,844 | 5,998 |

Both retain every supported viewport hinge and field, applicable allocation,
traversal and exact-count controls, padding, vertical spacing, rules, nesting
and row-budget safeguards. They are unlayered standalone alternatives; sharing
registrations or private-name mappings between separately loaded profiles is
not a supported delivery mode. The full build remains the unrestricted choice.

## Geometry coverage

`pnpm test:profiles` reads the actual checked-in readable and minified files,
rather than recompiling an approximation. Each is compared with full CSS in
isolated documents. Four formats cover readable, CLI-minified, forced-count-off
readable and forced-count-off minified output. The test asserts that the
enhancement condition was present before disabling it.

| Engine | repeating | two-three | Total comparisons |
| --- | ---: | ---: | ---: |
| Chromium 156.0.8078.4 | 174 × 4 | 1,843 × 4 | 8,068 |
| Firefox 157.0 | 174 × 4 | 1,843 × 4 | 8,068 |
| WebKit 27.2 | 174 × 4 | 1,843 × 4 | 8,068 |

Cases cover every included layout and field; empty/underfilled sources;
representative and high counts; exact acceptance/rejection; first/last spanning
endpoints; row-budget neighbors; public token overrides; continued and rebased
nesting; and viewport boundaries with responsive exact counts and utility
changes. Snapshots compare visible bounds, grid placements, assigned tracks,
padding, vertical margins and visible rules. These are comparisons, not distinct
layout names or additional browser-support minima.

Forced-count-off profiles test fallback parity in current engines. The earlier
real older-engine full-library qualification is not a new profile-specific
older-browser test. No CSS feature is transpiled or polyfilled by the profiles.

## Delivery and UI

The capability manifest drives compilation, documentation tables and
configurator advice. Build metadata supplies measured sizes and the pinned
release version. The configurator checks every layout in the sequence, even
outside the previewed width. CDN delivery offers the full library or smallest predefined build, with one
result/tag. When only full fits, the selector collapses to that result and names
the required families. Brotli/gzip sizes appear alongside an explicit site-wide
caching qualification. Self-hosting offers custom and full-library
downloads with their actual filenames; Copy HTML remains beside the layout markup. Clipboard denial focuses the visible
tag for manual copying. Profile advice and complete downloads need no worker.

The existing three-engine configurator suite exercises these controls and the
custom-download workflow. A copied pinned CDN tag is routed to the actual local
profile bytes, rendered with JavaScript disabled, and compared with full CSS at
viewport boundaries. This verifies markup and asset selection without claiming
the unreleased CDN URL is live. Published paths become available after the
owner creates the 0.5.2 tag.

Package checks inspect the actual tarball: all stylesheet exports, profile
manifest, independently deployable docs mirrors and browser module graph.
Deterministic builds, generated documentation and unit contracts also pass.
Raw browser reports stay in ignored `test-results/profiles/`; the durable
[evidence summary](profiles.json) binds this pass to the generated CSS hashes.

The emitted profile CSS matches the corresponding selections in the prior
[selective compiler measurements](selective-builds.md). That report supplies
bounded runtime evidence; this pass does not claim a new timing measurement or
guarantee a speedup for arbitrary sites.

## Reproduce

```sh
pnpm build
pnpm check
pnpm docs:check
pnpm test:package
pnpm size
pnpm test:profiles --engine=chromium
pnpm test:profiles --engine=firefox
pnpm test:profiles --engine=webkit
pnpm test:configurator --engine=chromium --docs-only
pnpm test:configurator --engine=firefox --docs-only
pnpm test:configurator --engine=webkit --docs-only
```

Run configurator engines sequentially because they share a test-server port.
Layered profiles, viewport shards and automatic project scanning remain
outside this delivery contract.
