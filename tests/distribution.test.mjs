import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { distributionArtifacts } from "../src/ruler/distribution.mjs";
import { recipes, fields } from "../src/ruler/geometry.mjs";

test("all distribution artifacts are reproducible and retain the frozen legacy profile", async () => {
  const legacy = await readFile(new URL("../css/legacy/main.css", import.meta.url), "utf8");
  const artifacts = distributionArtifacts(legacy);
  assert.deepEqual(artifacts, distributionArtifacts(legacy));
  for (const [path, expected] of Object.entries(artifacts)) assert.equal(await readFile(new URL(`../${path}`, import.meta.url), "utf8"), expected);
  assert.equal(artifacts["css/legacy/main.css"], legacy);
  assert.equal(artifacts["css/compat.css"], legacy);
  assert.ok(artifacts["css/main.layer.css"].includes("@layer graph-paper"));
  assert.ok(gzipSync(artifacts["css/main.min.css"]).byteLength < 12000, "modern minified core exceeds 12 KB gzip budget");
});

test("modern core contains the full vocabulary and no legacy globals or vertical spacing defaults", async () => {
  const css = await readFile(new URL("../css/main.css", import.meta.url), "utf8");
  for (const id of Object.keys(recipes)) assert.ok(css.includes(`.${id}.`) || css.includes(`.${id} {`), id);
  for (const field of Object.keys(fields)) assert.ok(css.includes(`.gp_field--${field}`));
  assert.ok(!/\[class\*=|!important|@media|row-gap\s*:|margin-block|font-family\s*:/.test(css));
  assert.ok(!/(?:^|\n)(?:body|h[1-6]|p|a|img|svg|table)\s*[{,]/.test(css));
});
