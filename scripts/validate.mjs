import { readFile } from "node:fs/promises";
import { rhythms } from "../src/geometry/rhythms.mjs";
import { compactPatterns } from "../src/manifest/compact.mjs";
import { grids } from "../src/manifest/grids.mjs";
import { layouts } from "../src/manifest/layouts.mjs";
import { sets } from "../src/manifest/sets.mjs";
import {
  validateGeneratedCss,
  validateLegacyGridCoverage,
  validateManifest
} from "../src/validate.mjs";

validateManifest({ compactPatterns, grids, layouts, rhythms, sets });

const css = await readFile(new URL("../css/next.css", import.meta.url), "utf8");
validateGeneratedCss(css);

const inventory = JSON.parse(
  await readFile(new URL("../tests/fixtures/legacy-inventory.json", import.meta.url), "utf8")
);
validateLegacyGridCoverage(grids, inventory.gridGeometry);

console.log("Manifest, legacy coverage, and generated CSS are valid");
