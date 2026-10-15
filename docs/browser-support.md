# Browser support

Modern Graph Paper requires CSS Grid, column subgrid, named inline-size
container queries, and container-query units. The optional band stylesheet uses
the same browser capabilities. Unsupported browsers do not receive a legacy
fallback automatically; the 0.2.3 compatibility profile is a separate choice.

Structural tests use pinned Playwright 1.64.0 against Chromium, Firefox, and
WebKit. Tested versions are recorded in `test-results/browsers.json`; these are
test environments, not claims about the oldest supported browser.

## Run

```sh
pnpm install --frozen-lockfile
pnpm browsers:install
pnpm test:browsers
pnpm test:distribution
```

The distribution matrix additionally checks ordinary/minified/layered builds
and replays the frozen legacy regression fixture.

An isolated Linux environment is also supported:

```sh
docker run --rm --ipc=host \
  -v "$PWD":/workspace:ro \
  -v "$PWD/test-results":/workspace/test-results \
  -w /workspace mcr.microsoft.com/playwright:v1.64.0-noble \
  node scripts/run-browsers.mjs
```

Create `test-results/` first. Install dependencies before using this image.
Add `--distribution` to the final command to test every distribution variant.
See [validation](validation.md) for coverage and limitations.
