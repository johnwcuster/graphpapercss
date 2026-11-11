import { readFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import {predefinedProfiles} from '../src/core/profiles.mjs';

const assets = ["css/main.css", "css/main.min.css", "css/main.layer.css", "css/main.layer.min.css", "css/legacy/0.4/main.min.css", "css/legacy/0.4/bands.min.css", "css/legacy/main.css"];
assets.push(...predefinedProfiles.flatMap(p=>[p.files.readable,p.files.minified]));
console.log("Asset".padEnd(32) + "Raw bytes".padStart(12) + "Gzip bytes".padStart(12) + "Brotli bytes".padStart(14));
for (const asset of assets) {
  const source = await readFile(new URL("../" + asset, import.meta.url));
  console.log(asset.padEnd(32) + source.byteLength.toLocaleString("en-US").padStart(12) + gzipSync(source).byteLength.toLocaleString("en-US").padStart(12) + brotliCompressSync(source).byteLength.toLocaleString("en-US").padStart(14));
}
