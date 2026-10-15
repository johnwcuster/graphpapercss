import { readFile, writeFile } from "node:fs/promises";
import { auditGeometry } from "../src/ruler/geometry.mjs";

const baseline = JSON.parse(await readFile(new URL("../tests/fixtures/legacy-geometry.json", import.meta.url), "utf8"));
const records = auditGeometry(baseline);
if (records.some(record => !["EXACT", "ACCEPTED"].includes(record.classification))) throw new Error("Undocumented 0.2.3-to-1.0 geometry change");
const accepted = records.filter(record => record.classification === "ACCEPTED");
const publicRecords = records.map(({ id, field, classification, displacement, legacy, candidate }) => ({
  id, field, classification, displacement,
  ...(classification === "ACCEPTED" ? { legacy, candidate } : {})
}));
const widths = columns => columns.map(c => c.end - c.start).join(" / ");
const markdown = `# 0.2.3 to 1.0 geometry changes\n\nBaseline: [released 0.2.3 CSS](${baseline.source.url}), retained at \`css/legacy/main.css\`. SHA-256: \`${baseline.source.sha256}\`.\n\nAll 72 released grid IDs are represented in 1.0. Across neat, thin, and wide fields, 204 macro geometries match exactly. The twelve intentional changes below replace half-bit edges with whole-bit coordinates. Maximum edge displacement is 0.5 bit; formerly equal small columns differ by one bit. These replacements are frozen in \`src/ruler/accepted-changes.mjs\`. Full and ruled fields are new designed extents, not legacy parity claims.\n\n| Grid | Field | 0.2.3 widths (bits) | 1.0 widths (bits) | 1.0 intervals (bits) |\n| --- | --- | --- | --- | --- |\n${accepted.map(r => `| ${r.id} | ${r.field} | ${widths(r.legacy)} | ${widths(r.candidate)} | ${r.candidate.map(c => `${c.start}–${c.end}`).join(", ")} |`).join("\n")}\n\nCoordinates are zero-based ruler bits. CSS line indices are coordinates plus one. See [visual comparisons with 0.2.3](geometry-changes.html).\n`;
for (const [path, content] of [
  ["../docs/geometry-changes.md", markdown],
  ["../docs/geometry-changes.json", `${JSON.stringify({ source: baseline.source, records: publicRecords }, null, 2)}\n`]
]) {
  const url = new URL(path, import.meta.url);
  if (process.argv.includes("--check")) {
    if (await readFile(url, "utf8").catch(() => "") !== content) throw new Error(`${path} is stale; run pnpm run build`);
  } else await writeFile(url, content);
}
console.log(`0.2.3 migration geometry: ${records.length - accepted.length} exact matches, ${accepted.length} accepted changes`);
