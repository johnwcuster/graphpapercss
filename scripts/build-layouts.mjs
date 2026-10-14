import { readFile, writeFile } from "node:fs/promises";
import { candidateFlows, legacyFamilies } from "../src/manifest/compatibility.mjs";

const capturePath = new URL("../tests/fixtures/legacy-layouts.json", import.meta.url);
const inventoryPath = new URL("../tests/fixtures/legacy-geometry.json", import.meta.url);
const outputPath = new URL("../src/manifest/layouts.mjs", import.meta.url);
const checkOnly = process.argv.includes("--check");
const capture = JSON.parse(await readFile(capturePath, "utf8"));
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));

if (capture.schemaVersion !== 1) {
  throw new Error(`Unsupported legacy layout capture schema: ${capture.schemaVersion}`);
}

if (capture.state !== "expanded" || capture.viewport.width < 960) {
  throw new Error("Legacy layout capture must use the expanded state");
}

if (capture.source?.sha256 !== inventory.source.sha256) {
  throw new Error("Legacy layout capture does not match the frozen legacy stylesheet");
}

const expectedCaptureCount = legacyFamilies.length * 4 * 8;
if (Object.keys(capture.configurations).length !== expectedCaptureCount) {
  throw new Error(`Legacy layout capture must contain ${expectedCaptureCount} configurations`);
}

function setName(itemCount) {
  return `set_${String(itemCount).padStart(2, "0")}`;
}

function flowName(flow) {
  return flow === null ? null : `flow_${String(flow).padStart(2, "0")}`;
}

function signature(configuration) {
  return JSON.stringify(configuration.placements);
}

function compactPattern(itemCount, flow) {
  if (itemCount === 6 && flow !== null) return "set06Flow";
  return `set${String(itemCount).padStart(2, "0")}`;
}

const configurations = [];

for (const family of legacyFamilies) {
  for (const itemCount of [3, 4, 5, 6]) {
    const defaultCapture = capture.configurations[`${family}|${itemCount}|default`];
    if (!defaultCapture) throw new Error(`Missing default capture for ${family}/set ${itemCount}`);

    configurations.push({ family, itemCount, flow: null, capture: defaultCapture });

    for (const flow of candidateFlows(family, itemCount)) {
      const flowCapture = capture.configurations[`${family}|${itemCount}|${flow}`];
      if (!flowCapture) throw new Error(`Missing flow capture for ${family}/set ${itemCount}/flow ${flow}`);

      if (signature(flowCapture) !== signature(defaultCapture)) {
        configurations.push({ family, itemCount, flow, capture: flowCapture });
      }
    }
  }
}

const groups = new Map();
for (const configuration of configurations) {
  const key = [
    configuration.itemCount,
    configuration.flow ?? "default",
    signature(configuration.capture)
  ].join("|");
  const group = groups.get(key) ?? { ...configuration, families: [] };
  group.families.push(configuration.family);
  groups.set(key, group);
}

const layouts = [...groups.values()].map((group) => {
  const flow = flowName(group.flow);
  return {
    id: `${group.families.join("-")}-${setName(group.itemCount)}-${flow ?? "default"}`,
    families: group.families,
    set: setName(group.itemCount),
    flow,
    items: group.itemCount,
    states: {
      expanded: { placements: group.capture.placements },
      compact: compactPattern(group.itemCount, group.flow),
      stacked: { sourceOrder: true }
    }
  };
});

function formatLayout(layout) {
  const families = `[${layout.families.map((family) => JSON.stringify(family)).join(", ")}]`;
  const placements = layout.states.expanded.placements
    .map(({ item, column, row }) => `      [${item}, [${column.join(", ")}], [${row.join(", ")}]]`)
    .join(",\n");

  return `  defineLayout(
    ${JSON.stringify(layout.id)},
    ${families},
    ${JSON.stringify(layout.set)},
    ${JSON.stringify(layout.flow)},
    ${JSON.stringify(layout.states.compact)},
    [
${placements}
    ]
  )`;
}

const source = `// GENERATED FILE — DO NOT EDIT DIRECTLY
// Source: 0.2.3 legacy-layouts.json + compatibility.mjs
// Placement tuples: [source item, macro-column range, row range]
function defineLayout(id, families, set, flow, compact, placementTuples) {
  return {
    id,
    families,
    set,
    flow,
    items: Number(set.slice(-2)),
    states: {
      expanded: {
        placements: placementTuples.map(([item, column, row]) => ({ item, column, row }))
      },
      compact,
      stacked: { sourceOrder: true }
    }
  };
}

export const layouts = [
${layouts.map(formatLayout).join(",\n")}
];
`;


if (checkOnly) {
  const currentSource = await readFile(outputPath, "utf8").catch(() => "");
  if (currentSource !== source) {
    console.error("src/manifest/layouts.mjs is not up to date; run npm run layouts:build");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, source);
  console.log(`Generated ${layouts.length} normalized layout recipes`);
}
