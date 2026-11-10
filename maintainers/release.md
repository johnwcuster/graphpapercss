# 0.5.1 release preparation

Graph Paper provides section-level composition tools for building site-level spatial continuity.

The compiler lives in `src/core/` and emits canonical `css/main*.css` distributions. Package metadata targets 0.5.1. The [composition contracts](../src/core/README.md), executable catalogue and [test guide](../tests/README.md) describe the maintained implementation. The public [configurator](../docs/configurator.html) uses that core. Metadata preparation does not create a commit, tag, GitHub release, or registry publication; those remain owner actions.

## Patch scope

0.5.1 adds local selective compilation, readable/minified CSS downloads and matching HTML to the configurator. It also preserves focus visibility while the preview rescales in short windows. All four full CSS artifacts are byte-identical to 0.5.0; its authoring API, geometry, specificity and qualification fingerprints are unchanged.

The patch passes 121 unit tests, documentation/package checks, all three configurator browser suites, and an additional 2,446 browser-minifier parity comparisons per engine. See [selective-build findings](selective-builds.md). Version-pinned 0.5.1 links are prepared for the owner-created tag; metadata preparation does not make them live.

## Fixed scope

- 102 selections: Stack, five repeating Peers, seventeen Two, forty-six Three, twenty-five Four and eight exact-count mosaics.
- Explicit mobile-up viewport steps at 30/40/48/64/80/96rem. Layout, allocation, traversal, spacing, item padding and vertical spacing carry forward independently.
- 64-bit rulers, assigned-track continuation and explicit local rebasing. No implicit item-level responsive constraint.
- Full/Neat/Thin/Wide/Ruled spacing for ordinary layouts; mosaics support Neat/Thin only. Column rules retain explicit ownership and measured-ruler scope.
- Automatic direct-item counting and allocation, exact physical refinements where supported, and source-order safeguards. No author-maintained count or arbitrary item cutoff.
- Explicit zero/one/two-bit padding and vertical-spacing utilities. Thin mosaic margins use assigned-track percentages without measurement.
- Zero-specificity selection/placement and ordinary author CSS overrides. No runtime placement JavaScript.
- Typography, measure, height grids, viewport packing, masonry and application shells remain outside core scope. Configurator-selected standalone builds are available in 0.5.1; predefined distribution profiles remain deferred.

## Remaining release work

1. **Distribution promotion implemented.** Root core and layered builds use the new compiler. The 0.4 reference is versioned under `css/legacy/0.4/` and `src/legacy/0.4/`; its inspector export is explicitly scoped. The frozen 0.2.3 baseline remains for migration/regression. Package tests exercise the actual tarball, export bytes, exclusions, docs assets and legacy inspector dependency graph. Final release validation still reruns those checks.
2. **Documentation migration implemented.** Learning, reference, architecture, builds/support and migration pages describe the new API; the catalogue is generated from all 102 current layouts. The site uses the new core with a shared reading measure. Previous configurator, band and historical geometry material is explicitly labeled. The inspector is documented as 0.4-only. Documentation checks execute the actual HTML snippets and verify current/legacy page boundaries.
3. **Structural qualification complete, including the row-budget safeguard.** Full Chromium/Firefox/WebKit matrices each pass 39,145 checks. All four builds, utilities, docs, configurator and scoped legacy inspector pass. The shared 9,998-construction-row budget stacks over-budget Two/Three/Four allocations across engines, including exact requests and endpoint rows. Boundary and nesting checks verify visible non-overlap and restoration. Real Firefox 137 and Chromium 136 retain their distinct older-engine fallbacks. The [qualification record](qualification.md) binds these reruns to the guarded artifacts.
4. **Size/runtime assessment complete.** The [final assessment](performance.md) records all four distributions, reference ordinary/shared/measured profiles, and fresh three-engine paired guard comparisons and high-count stress runs. The 192,555-byte minified core transfers as 17,817 gzip / 10,411 Brotli bytes under the recorded settings. The safeguard adds 601 minified / 77 gzip / 50 Brotli bytes; ordinary timings show a small measured cost and resizing stays inexpensive. Complete any remaining manual screen-reader/magnification review; automated keyboard/narrow-screen coverage does not replace it.
5. **Release metadata prepared and content reviewed.** Package version, changelog, version-pinned delivery links and public version labels target 0.5.1. Historical 0.4 references retain their own versions. README license wording, pinned release links and the discussion-first contribution policy have been reviewed. Complete final local review before committing and creating the release tag. Commit/tag/publish remain owner actions.

## Repository boundaries

Maintain one current implementation, its canonical configurator, necessary regression fixtures and concise behavioral contracts. Temporary experiments and superseded authoring proposals are not build dependencies or public documentation. Current generated CSS and documentation mirrors remain checked in for direct static delivery. Generated test artifacts belong under ignored `test-results/`.

Cleanup and promotion preserve reviewed core geometry, original 0.4 CSS bytes and published release tags. They do not claim new browser support. Historical working material was archived locally before removal; that archive is not part of the package or a dependency of maintained tooling.
