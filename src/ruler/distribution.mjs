import { transform } from "lightningcss";
import { emitRulerCss } from "./emit.mjs";
import { emitBandCss } from "./bands.mjs";

function minify(css) {
  // Preserve native modern features; no legacy browser transpilation targets.
  return `${transform({ filename: "graph-paper.css", code: Buffer.from(css), minify: true }).code.toString()}\n`;
}

export function distributionArtifacts(legacy) {
  const core = emitRulerCss();
  const layered = `/* Graph Paper CSS 1.0 — optional graph-paper cascade layer. MIT license. */\n@layer graph-paper {\n${core}}\n`;
  const legacyMin = minify(legacy);
  const bands = `${emitBandCss()}\n`;
  return {
    "css/main.css": core,
    "css/main.min.css": minify(core),
    "css/main.layer.css": layered,
    "css/main.layer.min.css": minify(layered),
    "css/bands.css": bands,
    "css/bands.min.css": minify(bands),
    // Optional *alternative* profile. Exact legacy globals are deliberate.
    "css/compat.css": legacy,
    "css/compat.min.css": legacyMin,
    "css/legacy/main.css": legacy,
    "css/legacy/main.min.css": legacyMin
  };
}
