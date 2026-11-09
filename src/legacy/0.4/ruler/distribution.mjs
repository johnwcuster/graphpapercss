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
    "css/legacy/0.4/main.css": core,
    "css/legacy/0.4/main.min.css": minify(core),
    "css/legacy/0.4/main.layer.css": layered,
    "css/legacy/0.4/main.layer.min.css": minify(layered),
    "css/legacy/0.4/bands.css": bands,
    "css/legacy/0.4/bands.min.css": minify(bands),
    // Optional *alternative* profile. Exact legacy globals are deliberate.
    "css/legacy/main.css": legacy,
    "css/legacy/main.min.css": legacyMin
  };
}
