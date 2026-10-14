# Browser support and verification

Modern core requires CSS Grid, subgrid, inline-size container queries, `cqi`,
`:where()` / `:is()`, and modern range-query syntax. The layered variants also
require cascade layers. Container queries and subgrid are foundational rather
than optional enhancements: there is no automatic legacy layout fallback.

Feature references: [subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns),
[container contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type),
and [container-relative units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#container_query_length_units).
Only versions actually run by the structural suite are claimed as tested;
feature availability is not proof of behavior in every older browser.

Recorded tested versions and size/build evidence are in [validation](validation.md).

The Playwright 1.64.0 suite runs Chromium, Firefox, and WebKit with a fixed
16px root font and 1280px viewport. Each modern asset checks 15,585 combinations:
all 75 recipes, their compatible normalized flows, five fields, and expanded,
compact, and stacked canvas widths. Focused tests cover breakpoint boundaries,
semantic subgrid, nested-canvas rebasing, shared-ruler overlays, rule ownership
and integer offsets, explicit placement, host-controlled spacing, and source
order. Configurator and accepted-change pages are also exercised.

Distribution checks also replay all 416 frozen-reference configurations against
ordinary/minified compatibility and explicit legacy builds. The regression
harness measures in memory and does not write to the released baseline.

Reports include actual engine versions and are written to
`test-results/browsers.json`. The ordinary browser command checks `main.css`;
the distribution command additionally checks ordinary, minified, layered, and
layered-minified release assets. This is structural regression coverage, not
a claim that every font, writing mode, accessibility tool, or host stylesheet
has been visually tested.

```sh
npm run browsers:install
npm run test:distribution
```

On macOS 27, Firefox can fail before page load because its shared application
data directory is OS-protected. This [upstream Playwright issue](https://github.com/microsoft/playwright/issues/42768)
is separate from Graph Paper geometry. Use an isolated Linux runner rather
than changing the permissions of your personal Firefox installation:

```sh
mkdir -p test-results
docker run --rm --init --ipc=host \
  --mount type=bind,source="$PWD",target=/workspace,readonly \
  --mount type=bind,source="$PWD/test-results",target=/workspace/test-results \
  --workdir /workspace \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  node scripts/run-browsers.mjs --distribution
```

Install contributor dependencies with `npm ci` first. The official pinned image
contains browser engines; this runner uses the repository's matching Playwright
package. Source is read-only and only reports are writable. See the
[official container documentation](https://playwright.dev/docs/docker).
