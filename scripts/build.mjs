// One reproducible build: normalized flows, migration record, distributions.
// --check is consumed by every generator without modifying files.
await import("./build-layouts.mjs");
await import("./build-geometry-changes.mjs");
await import("./build-distribution.mjs");
await import("./sync-docs-assets.mjs");
await import("./build-docs.mjs");
