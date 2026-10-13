import { readFile, writeFile } from "node:fs/promises";
import { grids } from "../src/manifest/grids.mjs";
import { layouts } from "../src/manifest/layouts.mjs";
import { compactPatterns } from "../src/manifest/compact.mjs";
import { responsive } from "../src/manifest/responsive.mjs";
import { sets } from "../src/manifest/sets.mjs";
import { rhythms } from "../src/geometry/rhythms.mjs";
import { emitPrototypeCss } from "../src/emit/prototype.mjs";
import { validateGeneratedCss, validateManifest } from "../src/validate.mjs";

const outputPath = new URL("../css/next.css", import.meta.url);
const checkOnly = process.argv.includes("--check");

validateManifest({ compactPatterns, grids, layouts, rhythms, sets });
const css = emitPrototypeCss({ compactPatterns, grids, layouts, responsive, rhythms });
validateGeneratedCss(css);

if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== css) {
    console.error("css/next.css is not up to date; run npm run build");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, css);
  console.log("Generated css/next.css");
}
