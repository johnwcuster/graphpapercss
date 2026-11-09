// One reproducible build. --check is read by each generator without writes.
// The versioned reference and its migration records stay isolated from core.
await import('./build-layouts.mjs');
await import('./build-geometry-changes.mjs');
await import('./build-legacy-distribution.mjs');
await import('./build-core.mjs');
await import('./build-integration-fixture.mjs');
await import('./check-configurator-content.mjs');
await import('./sync-docs-assets.mjs');
await import('./build-docs.mjs');
