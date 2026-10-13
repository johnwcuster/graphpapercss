import { access, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const repositoryRoot = new URL("../", import.meta.url);
const productionPath = new URL("css/main.css", repositoryRoot);
const fixturePath = new URL("tests/fixtures/legacy-main.css", repositoryRoot);
const jsonPath = new URL("tests/fixtures/legacy-inventory.json", repositoryRoot);
const markdownPath = new URL("docs/legacy-inventory.md", repositoryRoot);
const checkOnly = process.argv.includes("--check");

async function exists(path) {
  return access(path).then(() => true, () => false);
}

function uniqueMatches(source, expression, group = 1) {
  return [...source.matchAll(expression)].map((match) => match[group]).filter(
    (value, index, values) => values.indexOf(value) === index
  ).sort();
}

function lineOf(source, needle) {
  const offset = source.indexOf(needle);
  if (offset === -1) return null;
  return source.slice(0, offset).split("\n").length;
}

function extractLegacyGridGeometry(css) {
  const geometry = {};

  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const template = rule[2].match(/grid-template-columns:\s*([^;]+);/)?.[1];
    if (!template) continue;

    const exactGridSelectors = rule[1]
      .split(",")
      .map((selector) => selector.trim().match(/^\.(grid_0[234][\w-]*)$/)?.[1])
      .filter(Boolean);
    if (exactGridSelectors.length === 0) continue;

    const widthTokens = [...template.matchAll(/--w-(\d+)-(20|24)/g)];
    let lattice;
    let spans;

    if (widthTokens.length > 0) {
      const lattices = new Set(widthTokens.map((token) => Number(token[2])));
      if (lattices.size !== 1) throw new Error(`Mixed lattices in ${rule[1].trim()}`);
      lattice = Number(widthTokens[0][2]);
      spans = widthTokens.map((token) => Number(token[1]));
    } else {
      const repeated = template.match(/repeat\(\s*(\d+)\s*,\s*1fr\s*\)/);
      const explicitFractions = [...template.matchAll(/\b1fr\b/g)];
      const columns = repeated ? Number(repeated[1]) : explicitFractions.length;
      if (columns < 2 || columns > 4) continue;
      lattice = columns === 2 ? 20 : 24;
      spans = Array.from({ length: columns }, () => lattice / columns);
    }

    for (const gridName of exactGridSelectors) {
      geometry[gridName] = { lattice, spans };
    }
  }

  return Object.fromEntries(Object.entries(geometry).sort(([a], [b]) => a.localeCompare(b)));
}

function createInventory(css) {
  const classNames = uniqueMatches(css, /\.(-?[_a-zA-Z][\w-]*)/g);
  const gridClasses = classNames.filter((name) => /^grid_0[234]/.test(name));
  const setClasses = classNames.filter((name) => /^set_\d+$/.test(name));
  const flowClasses = classNames.filter((name) => /^flow_\d+$/.test(name));
  const utilityClasses = classNames.filter(
    (name) => !gridClasses.includes(name) && !setClasses.includes(name) && !flowClasses.includes(name)
  );
  const substringSelectors = uniqueMatches(css, /\[class\*="([^"]+)"\]/g);
  const mediaQueries = uniqueMatches(css, /@media\s+([^\{]+)\{/g).map((query) => query.trim());
  const globalCandidates = [
    "body", "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "header",
    "footer", "form", "main", "article", "img", "svg", "table"
  ];
  const globalSelectors = globalCandidates.filter((element) => {
    const pattern = new RegExp(`(^|[\\n,])\\s*${element}(?=\\s*[,\\{])`, "m");
    return pattern.test(css);
  });
  const suspiciousSelector = `[class*="grid_03d"].set_03\n    > :nth-child(2)\n    [class*="grid_03a"]`;
  const gridGeometry = extractLegacyGridGeometry(css);

  return {
    schemaVersion: 1,
    generatedFrom: "tests/fixtures/legacy-main.css",
    source: {
      bytes: Buffer.byteLength(css),
      lines: css.split("\n").length,
      sha256: createHash("sha256").update(css).digest("hex")
    },
    summary: {
      concreteClassCount: classNames.length,
      concreteGridClassCount: gridClasses.length,
      flowClassCount: flowClasses.length,
      importantDeclarationCount: (css.match(/!important/g) ?? []).length,
      setClassCount: setClasses.length,
      substringSelectorCount: (css.match(/\[class\*=/g) ?? []).length,
      utilityClassCount: utilityClasses.length
    },
    classes: {
      grids: gridClasses,
      sets: setClasses,
      flows: flowClasses,
      utilities: utilityClasses
    },
    gridGeometry,
    substringSelectors,
    mediaQueries,
    globalSelectors,
    knownAnomalies: [
      {
        id: "neat-24-track-w20",
        line: lineOf(css, "--w-20-24: 40fr;"),
        status: "requires-review",
        note: "The sequence advances by 2.5fr but --w-20-24 is 40fr rather than 50fr."
      },
      {
        id: "grid-03-set-03-selector",
        line: lineOf(css, suspiciousSelector),
        status: "requires-review",
        note: "A likely missing comma turns two intended selectors into one descendant selector."
      }
    ]
  };
}

function markdownList(values) {
  return values.map((value) => `- \`${value}\``).join("\n");
}

function createMarkdown(inventory) {
  return `# Legacy CSS inventory

> Generated by \`npm run inventory\` from the frozen legacy fixture. Do not edit manually.

## Snapshot

- Source: \`${inventory.generatedFrom}\`
- SHA-256: \`${inventory.source.sha256}\`
- Size: ${inventory.source.bytes.toLocaleString("en-US")} bytes across ${inventory.source.lines} lines
- Concrete grid classes: ${inventory.summary.concreteGridClassCount}
- Extracted grid geometries: ${Object.keys(inventory.gridGeometry).length}
- Set classes: ${inventory.summary.setClassCount}
- Flow classes: ${inventory.summary.flowClassCount}
- Substring-selector occurrences: ${inventory.summary.substringSelectorCount}
- \`!important\` declarations: ${inventory.summary.importantDeclarationCount}

## Concrete grid classes

${markdownList(inventory.classes.grids)}

## Set classes

${markdownList(inventory.classes.sets)}

## Flow classes

${markdownList(inventory.classes.flows)}

## Substring selector values

${markdownList(inventory.substringSelectors)}

## Media queries

${markdownList(inventory.mediaQueries)}

## Global element selectors detected

${markdownList(inventory.globalSelectors)}

## Known anomalies requiring classification

${inventory.knownAnomalies.map((anomaly) => `- **${anomaly.id}** (legacy line ${anomaly.line ?? "unknown"}): ${anomaly.note}`).join("\n")}

These anomalies are recorded rather than silently reproduced. Each must be classified as an intentional behavior, a defect, or an unresolved experiment before full migration.
`;
}

if (!(await exists(fixturePath))) {
  if (checkOnly) {
    console.error("Legacy fixture is missing; run npm run inventory");
    process.exit(1);
  }
  await copyFile(productionPath, fixturePath);
  console.log("Created frozen legacy CSS fixture");
}

const legacyCss = await readFile(fixturePath, "utf8");
const inventory = createInventory(legacyCss);
const json = `${JSON.stringify(inventory, null, 2)}\n`;
const markdown = createMarkdown(inventory);

if (checkOnly) {
  const [currentJson, currentMarkdown] = await Promise.all([
    readFile(jsonPath, "utf8").catch(() => ""),
    readFile(markdownPath, "utf8").catch(() => "")
  ]);

  if (currentJson !== json || currentMarkdown !== markdown) {
    console.error("Legacy inventory is not up to date; run npm run inventory");
    process.exitCode = 1;
  }
} else {
  await Promise.all([
    writeFile(jsonPath, json),
    writeFile(markdownPath, markdown)
  ]);
  console.log("Generated legacy inventory");
}
