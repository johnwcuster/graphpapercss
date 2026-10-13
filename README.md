# Graph Paper CSS

Graph Paper is a small CSS library for editorial spatial composition. Its public vocabulary combines a grid field, an item set, and a visual flow.

## 1.0 geometry prototype

The current 0.2 stylesheet remains unchanged at `css/main.css`. Work toward 1.0 lives in a separate generated prototype at `css/next.css`.

Requirements: Node.js 20 or newer. There are no package dependencies.

```sh
npm run inventory
npm run build
npm run check
npm run size
npm run dev
```

Then open <http://127.0.0.1:4173/docs/configurator.html>. The complete grid catalog is at <http://127.0.0.1:4173/docs/grids.html>, canvas rhythm and rebasing are demonstrated at <http://127.0.0.1:4173/docs/canvas.html>, semantic subgrid composition is at <http://127.0.0.1:4173/docs/subgrid.html>, and rules and micro-alignment are at <http://127.0.0.1:4173/docs/treatments.html>. A configurable frozen-legacy preview is available at <http://127.0.0.1:4173/tests/legacy-configurator.html>, and browser geometry assertions are visible at <http://127.0.0.1:4173/tests/browser-geometry.html>.

The prototype currently covers:

- the 64-bit ruler and real 20-/24-track lattices;
- all 72 concrete legacy grid recipes, generated as real lattices;
- sets of 3–6 items and 161 supported family/set/flow combinations;
- 90 normalized layout recipes derived from 416 browser-captured legacy measurements;
- container-relative expanded, compact, and stacked states;
- wide, thin, and neat canvas-level rhythm regimes;
- explicit nested-canvas rebasing with independent container response;
- `gp_subgrid` for carrying parent tracks through semantic wrappers;
- explicit rule treatments, one-bit content insets, advanced placement, and optical correction;
- viewport-relative compatibility for markup without `gp_canvas`;
- a configurator for every supported grid/set/flow combination;
- deterministic generation, geometry validation, and browser placement checks.

The build checks every manifest grid against geometry independently extracted from the frozen legacy stylesheet. The normalized set/flow matrix is documented in [`docs/legacy-layout-inventory.md`](docs/legacy-layout-inventory.md). Open the browser geometry page while the development server is running to execute placement checks across all 1,018 expanded layout/grid combinations, all 161 compact family/layout combinations, and all 161 standalone compatibility combinations.

`npm run size` reports both raw and gzip sizes against the legacy stylesheet. The automated test suite currently enforces a 12 KB gzip ceiling for the prototype. The source build remains intentionally readable and includes the standalone legacy-compatibility path; minified and split distribution builds belong to the later distribution phase.

`css/next.css` is experimental and is not yet a replacement for `css/main.css`.
