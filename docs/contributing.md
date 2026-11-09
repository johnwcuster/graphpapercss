# Contributing

Graph Paper welcomes thoughtful contributions that improve the library, its documentation, and its authoring tools.

## Start a conversation

For new layouts, API changes, optimizations, or substantial documentation work, please start with an issue describing the problem and your proposed approach. Agreeing on scope before implementation helps us focus review time and gives your contribution the best chance of becoming part of the project.

Small corrections—such as typos and broken links—can go directly to a pull request. Bug reports are especially helpful when they include the Graph Paper version, browser, a minimal reproduction, and the expected versus actual behavior.

Whether you work by hand or with AI assistance, please submit changes you understand and have verified. Explain what improves, why it matters, and how you tested it.

Graph Paper is maintained with limited review time. We prioritize agreed-upon work and may close substantial pull requests that haven't been discussed first.

## Install and build

Use Node.js 20+ and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm docs:check
pnpm dev
```

The development server defaults to `http://127.0.0.1:4173`. Open the configurator or any static documentation page. No separate demo repository is needed for build or regression checks.

## Edit maintained source

The current compiler and catalogue live in `src/core/`. Generated core CSS is in `css/main*.css`. The versioned implementation in `src/legacy/0.4/` supports the reference and its inspector; it is not another active authoring architecture.

Edit maintained Markdown and the shared documentation templates rather than generated HTML. The configurator lives in `docs/sequence/`; reusable local assets are synchronized into `docs/assets/graph-paper/` so the directory can be served independently.

Do not introduce an experiment or private content source as a build dependency. Maintained regression fixtures and independent oracles belong in `tests/`; generated screenshots, benchmark reports and temporary comparison CSS belong in ignored `test-results/`.

## Review a geometry change

Graph Paper supplies section-level arrangements for site-level spatial continuity. Preserve the distinction between geometry, source hierarchy, explicit response and host design.

State the author-visible problem and intended behavior. Show proportions, allocation, traversal, counts and viewport conditions separately. Verify rounded field closure, nested metadata, fallback and cleanup rather than judging only a screenshot.

Frozen geometry fixtures should change only with an explicit accepted geometry decision. Keep enumeration/GCD/LCM oracles independent of optimized CSS expressions. A performance optimization must preserve public names, zero specificity, author overrides, exact restoration and native focus order unless a contract change is intentional.

## Validate the surface you changed

Run the relevant unit, geometry, utility, distribution, package, configurator or docs checks. [Validation](validation.md) explains the commands and limits. A quick browser run is not a replacement for the full release matrix.

When documenting evidence, name engines and profiles actually tested. Do not infer a browser-support guarantee from a syntax check or a forced-feature-off test. Test copyable examples with the linked stylesheet, not a separate approximation.

## Prepare a release

Before a tag, align public docs and package paths, qualify final readable/minified/layered artifacts, resolve browser and performance gates, and check migration guidance. Update version, pinned URLs and changelog together after those decisions. Existing published tags remain immutable; no build command commits, tags or publishes.
