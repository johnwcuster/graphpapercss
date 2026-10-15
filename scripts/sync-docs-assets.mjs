import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Committed local mirrors make /docs deployable without access to parent paths.
const files = [
  ...["main.css", "bands.css"].map(name => [`css/${name}`, `docs/assets/graph-paper/${name}`]),
  ["css/legacy/main.css", "docs/assets/graph-paper/legacy.css"],
  ...["grids", "layouts", "compact", "responsive", "bands"].map(name => [`src/manifest/${name}.mjs`, `docs/assets/graph-paper/src/manifest/${name}.mjs`]),
  ...["geometry", "accepted-changes", "discovery", "bands"].map(name => [`src/ruler/${name}.mjs`, `docs/assets/graph-paper/src/ruler/${name}.mjs`]),
];
for (const [source, destination] of files) {
  const content = await readFile(new URL(`../${source}`, import.meta.url));
  const output = new URL(`../${destination}`, import.meta.url);
  if (process.argv.includes("--check")) {
    if (!content.equals(await readFile(output).catch(() => Buffer.alloc(0)))) throw new Error(`${destination} is stale; run pnpm run docs:sync`);
  } else {
    await mkdir(dirname(fileURLToPath(output)), { recursive: true });
    await writeFile(output, content);
  }
}
console.log("Configurator assets match the local Graph Paper build");
