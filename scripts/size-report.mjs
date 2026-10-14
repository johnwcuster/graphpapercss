import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const assets = ["css/legacy/main.css", "css/main.css", "css/main.min.css", "css/main.layer.min.css", "css/compat.min.css"];
console.log("Asset".padEnd(26) + "Raw bytes".padStart(12) + "Gzip bytes".padStart(12));
for (const asset of assets) {
  const source = await readFile(new URL("../" + asset, import.meta.url));
  console.log(asset.padEnd(26) + source.byteLength.toLocaleString("en-US").padStart(12) + gzipSync(source).byteLength.toLocaleString("en-US").padStart(12));
}
