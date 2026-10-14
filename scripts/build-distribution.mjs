import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { distributionArtifacts } from "../src/ruler/distribution.mjs";
import { createHash } from "node:crypto";
import { validateManifest } from "../src/validate.mjs";

validateManifest();
const legacy = await readFile(new URL("../css/legacy/main.css", import.meta.url), "utf8");
const baseline = JSON.parse(await readFile(new URL("../tests/fixtures/legacy-geometry.json", import.meta.url), "utf8"));
if (createHash("sha256").update(legacy).digest("hex") !== baseline.source.sha256) throw new Error("Released 0.2.3 baseline was modified");
for (const [path, source] of Object.entries(distributionArtifacts(legacy))) {
  const url = new URL(`../${path}`, import.meta.url);
  if (process.argv.includes("--check")) {
    if (await readFile(url, "utf8").catch(() => "") !== source) throw new Error(`${path} is stale; run npm run build`);
  } else {
    await mkdir(dirname(fileURLToPath(url)), { recursive: true });
    await writeFile(url, source);
  }
}
console.log("Modern unlayered/layered/minified distributions and explicit legacy profile are up to date");
