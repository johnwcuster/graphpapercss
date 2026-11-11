# 0.6.0 release preparation

Column-rule rendering is now an optional extension. Core retains ruled geometry and explicit measurement but introduces no positioning, z-index, transforms, or pseudo-elements. Existing ruled pages must add the matching-version extension; this delivery change is why the next version is 0.6.0.

The current structural record is [qualification-0.6.json](qualification-0.6.json). It binds the four core distributions, four rule-extension distributions, and two predefined profiles to fresh browser checks. Earlier 0.5 qualification and timing records remain evidence for their named artifacts, not fresh runtime or older-browser claims for 0.6.

- Run `pnpm check`, `pnpm docs:check`, and `pnpm test:package`.
- Run `pnpm test:browsers --engine=…`, `pnpm test:profiles --engine=…`, and `pnpm test:column-rules --engine=…` for Chromium, Firefox, and WebKit.
- Run configurator checks for extension links/downloads and bundled custom exports; the browser suite exercises both readable and minified downloads without runtime JavaScript.
- Review the migration note and positioning/stacking contract in Class reference. Rule-owner positioning can affect absolute descendants; the decoration does not enclose item content in a stacking context.
- Commit and publish the version tag separately. The prepared 0.6.0 CDN links become available after the owner publishes that tag. Existing pinned releases are unchanged.

Full/profile cores remain alternatives. The column-rules extension is the explicit exception: load it after a core from the same release, using its layered form with layered core. Custom downloads include it in one file when needed. The stable reserved metadata interface is in `src/core/rule-interface.mjs`; its names must survive compaction and selective pruning.
