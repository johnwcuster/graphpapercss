import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const compatibilityMarker = "/* A compatibility path for existing markup without .gp_canvas. */";

function bytes(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function measure(label, source) {
  return { label, raw: source.byteLength, gzip: gzipSync(source).byteLength };
}

const [legacySource, prototypeSource] = await Promise.all([
  readFile(new URL("../css/main.css", import.meta.url)),
  readFile(new URL("../css/next.css", import.meta.url))
]);
const compatibilityOffset = prototypeSource.indexOf(compatibilityMarker);
if (compatibilityOffset === -1) throw new Error("Could not find the standalone compatibility section");

const measurements = [
  measure("Legacy css/main.css", legacySource),
  measure("Prototype canvas/core", prototypeSource.subarray(0, compatibilityOffset)),
  measure("Prototype standalone", prototypeSource.subarray(compatibilityOffset)),
  measure("Prototype combined", prototypeSource)
];

const labelWidth = Math.max(...measurements.map(({ label }) => label.length));
console.log(`${"Asset".padEnd(labelWidth)}  ${"Raw bytes".padStart(10)}  ${"Gzip bytes".padStart(10)}`);

for (const measurement of measurements) {
  console.log(
    `${measurement.label.padEnd(labelWidth)}  ${bytes(measurement.raw).padStart(10)}  ${bytes(measurement.gzip).padStart(10)}`
  );
}

const legacy = measurements[0];
const prototype = measurements.at(-1);
console.log(`\nPrototype / legacy: ${(prototype.raw / legacy.raw).toFixed(2)}× raw, ${(prototype.gzip / legacy.gzip).toFixed(2)}× gzip`);
