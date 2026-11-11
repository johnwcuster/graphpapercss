# Browser support and builds

The 0.5 build uses modern native CSS rather than a runtime placement script. The support policy targets current evergreen engines with the required capabilities, plus the bounded older-engine fallbacks described below. Engine qualification does not establish support for every device, operating system or older patch version.

## Choose a delivery form

| Files | Purpose |
| --- | --- |
| `css/main.css`, `main.min.css` | Current unlayered core |
| `css/main.layer.css`, `main.layer.min.css` | The same core inside `@layer graph-paper` |
| `css/profiles/repeating.css`, `repeating.min.css` | Stack and repeating Peers 2–6 |
| `css/profiles/two-three.css`, `two-three.min.css` | Stack, Peers 2–6 and all Two/Three compositions |
| `css/legacy/0.4/main*.css` | Byte-preserved 0.4 reference |
| `css/legacy/0.4/bands*.css` | Optional bands for that 0.4 reference only |
| `css/legacy/main.css`, `main.min.css` | Original 0.2.3 baseline and its minification |

Load one core. With the layered form, unlayered author rules outrank library declarations in normal cascade order. Both forms retain zero-specificity library selectors. The core does not include compatibility aliases for the previous class vocabulary. See [Migration](migration.md).

The checked-in minification keeps native features and shortens private property names; it does not transpile them into an older-browser implementation.

## Predefined CDN profiles

Profiles are complete standalone alternatives to the full library. They retain all six viewport steps, all five gutter modes, applicable allocation/traversal/exact-count controls, padding, vertical spacing, ruler continuation, rebasing, rules, and safeguards. The difference is which layout families are available. Browser capability requirements stay the same.

<!-- delivery-profiles -->

The table is generated from the maintained build manifest and build measurements. Sizes use the same minifier and compression settings as the full build. Gzip figures describe compressed file size, not a guarantee of CDN transfer encoding or runtime speed.

Actual transfer depends on CDN compression and caching. Reusing the same pinned URL across pages lets the browser reuse its cached stylesheet. A smaller build may require a separate download on pages using another build; the smallest file for one sequence is not necessarily the best choice for the whole site.

`two-three` limits **composed** columns, not repeating content: Peers still support 2–6 across. It contains all 69 Stack/Peers/Two/Three layouts and excludes Four compositions and mosaics. `repeating` contains six Stack/Peers layouts. The full library contains all 102 layouts.

Load one Graph Paper stylesheet. These builds are not addons; combining them with each other or with the full library can conflict through shared registrations and build-specific private names. Your typography, colors and component styles can load alongside your chosen library stylesheet as usual.

The profile files first ship in **0.5.2**. Pin that or a later release; the earlier 0.5.1 tag does not contain these paths. Version-pinned links become available when the corresponding release tag is published.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.2/css/profiles/two-three.min.css">
```

Use the [configurator](configurator.html#delivery) to choose full-library or smallest-compatible CDN delivery and copy its pinned stylesheet tag. When only full covers the sequence, the tool explains why and consolidates the choices. Other compositions on the page must also fit the chosen profile. Layouts excluded from a profile are unavailable, not an alternative design fallback; switch to a broader build when needed.

For a smaller build of just your selected layouts and viewport steps, use the configurator's [custom CSS downloads](configurator-help.html#download-css-for-a-sequence). If your site needs unrestricted catalogue choices, keep `css/main.min.css`. Layered profiles, viewport shards and automatic project scanning are not provided.

## Understand capability dependencies

Basic layout uses CSS Grid, custom properties and native nesting. Continued tracks depend on subgrid. Enhanced allocation relies on typed custom properties, native sibling counting/indexing and CSS arithmetic including `abs()`, `mod()` and rounding. Mosaic activation and internal computation gates also use custom-property style queries. Measured rule lengths use inline-size query units in an explicit measurement context.

These capabilities have distinct availability. A JavaScript feature check or the presence of Grid alone is insufficient to qualify the complete core. The test suite exercises actual geometry and cleanup, not only syntax detection.

## Feature availability and support policy

The last key counting functions arrived in [Chrome 138](https://developer.chrome.com/blog/new-in-chrome-138?hl=en), [Firefox 154](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154) and [Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/). Chrome 138 also introduced `abs()`. These vendor release notes describe feature availability; they are not full Graph Paper qualification at every minimum version.

For production, target current evergreen browsers with the complete capability set. Use the tested builds below as concrete release evidence. There is no user-agent sniffing, layout polyfill or legacy transpilation in core. Validate an older target with its actual engine before promising equivalent behavior.

## Know the fallback contract

When the common Grid/subgrid/nesting/typed-property/arithmetic foundation is available but native counting is not, the tested fallback is:

| Selection | Without native count arithmetic, with base arithmetic available |
| --- | --- |
| Stack | Source-order single column |
| Peers | Simple repeating equal positions |
| Two | Equal row-major pairs; eligible explicit spanning endpoints remain |
| Three/Four | Source-order stack |
| Mosaic | Source-order stack |

Missing more than counting can produce a simpler result. Real Chromium 136 lacks `abs()` too: every family stacks, including Peers and Two. The equal-pairs fallback is therefore not a blanket promise for every older browser. Real Firefox 137 retains base arithmetic and demonstrates that pair/repeating profile. Both retain tested field geometry and continued/rebased padding.

Simulated feature-off tests remain useful for isolating a dependency, but do not establish older-engine support by themselves. Unsupported style queries leave mosaics inactive. Invalid counts and fields stack without selecting another map. Engines missing the broader modern foundation are unqualified; the library makes no universal fallback claim for them.

## Qualified builds

The structural release pass verified the following Playwright engine builds:

| Engine build | Qualification |
| --- | --- |
| Chromium 156.0.8078.4 | Full source/minified/feature-off core, four distributions, utilities, docs and tools |
| Firefox 157.0 | The same full structural and interaction scope |
| WebKit 27.2 | The same full structural and interaction scope |
| Firefox 137.0 | Real count-off repeating/equal-pairs fallback across four builds |
| Chromium 136.0.7103.25 | Real source-order stack fallback across four builds |

The current-engine core matrices each passed 39,145 geometry checks; the real older-engine matrices each passed 204,916 assertions. These are automated engine tests, not certification of all retail Safari/Chrome/Firefox patch versions, mobile devices, screen readers or writing modes. Source/focus order is checked; finished designs still need content-specific accessibility review.

Runtime/performance policy and manual assistive-technology review remain separate release gates. See [Validation](validation.md) for reproducible commands.

Coupled Two/Three/Four compositions reserve at most **9,998 construction rows**, including spanning endpoints. If an allocation exceeds that shared budget, the whole composition stacks in source order across all browsers. This avoids the Firefox row-clamping overlap found during stress testing. Exact requests follow the same safeguard; a safe layout/source change restores composition automatically. The limit applies to construction complexity, not a fixed number of items: a default Three composition can fit at 65 items, stack at 66 and fit again at 67. Browser grid capacity is finite even though source counts are not enumerated in the library.

## Separate CSS from authoring tools

The core needs no runtime JavaScript. The standalone configurator is a static documentation application whose copied markup runs without its scripts. Its ruler, inspector overlays and simulated width are not part of exported site behavior.

The optional on-page inspector targets the **0.4 API only**. Its explicit package entry is `graphpapercss/legacy/0.4/inspector`. Using the current core does not require loading it or any legacy metadata.
