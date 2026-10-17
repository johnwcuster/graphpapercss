# Validation

This is the maintainer's reference for checking the library, static documentation, and configurator. For everyday use, see [Getting started](getting-started.md); for repository setup and source ownership, see [Contributing](contributing.md).

## Local checks

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm docs:check
pnpm size
pnpm pack --dry-run
```

The build regenerates distributions, geometry records, configurator mirrors, and static documentation. `pnpm check` verifies deterministic output and runs Node tests. Edit maintained Markdown sources and shared navigation, then run `pnpm docs:build` or the full build. Documentation checks catch stale HTML, raw Markdown site links, missing local targets and anchors, and broken module imports.

Node coverage includes ruler closure, supported recipe/set/flow placements, sequential occupancy, source order, discovery metadata, band arithmetic, normalized flows, accepted geometry changes, emission specificity, and distribution independence. All 1,039 named combinations are covered by emission checks.

Core and optional bands retain separate gzip ceilings of 12KB and 8KB. Use `pnpm size` for current measured sizes rather than inferring footprint from generated line counts.

## Browser commands

```sh
pnpm browsers:install
pnpm test:browsers
pnpm test:distribution
# Configurator and documentation only, all three engines:
pnpm test:browsers --configurator-only
```

The runner uses pinned Playwright against Chromium, Firefox, and WebKit. The distribution matrix additionally exercises ordinary, minified, and layered builds with host overrides.

An isolated Linux environment can run the same suite after dependencies are installed and `test-results/` exists:

```sh
docker run --rm --ipc=host \
  -v "$PWD":/workspace:ro \
  -v "$PWD/test-results":/workspace/test-results \
  -w /workspace mcr.microsoft.com/playwright:v1.64.0-noble \
  node scripts/run-browsers.mjs
```

Add `--distribution` to the final command for all distribution variants, or `--configurator-only` for documentation/tooling checks. Results are written to ignored `test-results/browsers.json`; tested engines are not claims about oldest-supported browser versions.

## Structural coverage

The core matrix tests 16,710 combinations per build: recipe/field geometry, named flows, sequential continuation, source order, subgrid, nested canvases, overlays, rules, and explicit placement. Optional bands add 64,230 boundary cases plus 2,070 minified cases per engine, including nested responsiveness and enlarged root text.

The 0.2.3 migration audit has 204 exact matches and twelve accepted whole-bit adjustments. The isolated baseline renderer is retained for regression and visual comparison. See the [migration guide](migration.html) and [coordinate record](geometry-changes.md).

## Configurator and site coverage

Tooling checks cover compatible choices and explicit defaults, item-count changes without replacing content nodes, equivalent versus unavailable options, responsive diagrams and transition targets, rule customization, visual aids, independent docking, and hide/restore behavior. Rendered placements are checked against actual generated CSS, not just thumbnail drawings.

Editorial checks measure ruler alignment, recipe geometry, bounded reading measure, narrow-width reflow, and preview independence. Every public documentation page is checked at 320, 640, and 1440px for shared navigation geometry, active-page links, target sizes, and page overflow. Static HTML links and the isolated legacy reference are also checked.

The copyable alignment examples are extracted from the generated documentation and rendered against core CSS. Checks verify outer item placement, inherited-bit subgrid insets, and inner canvases responding independently across narrow and wide widths.

Page-level composition checks additionally exercise representative pages through 2560px. They verify a page-width ruler without a bounded site shell, centered recipe-based reading positions, and host typographic measures that stop text containers growing without shrinking the ruler or data fields.

The responsive-design and site-authoring guides additionally check recurring title, prose, and ordinary-table left edges, including either side of their shared expanded transition. Dense reference views have their own bounded measure instead of widening every table section.

## Accessibility and design limits

Accessibility regression checks cover short control names and separate descriptions, radio-group semantics and keyboard navigation, unavailable-choice skipping, stable announcements, Escape behavior, unobscured page focus, narrow-screen docking, and forced colors. Source labels are tested for contrast and do not rely on color alone.

These automated checks do not replace manual VoiceOver/NVDA testing, a comprehensive accessibility audit, or evaluation with real content. Passing geometry does not guarantee a useful reading measure, balanced composition height, or good editorial emphasis. Test host typography, imagery, component behavior, and content diversity in the consuming site.
