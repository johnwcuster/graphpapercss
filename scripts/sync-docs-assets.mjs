import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Committed local mirrors make /docs deployable without access to parent paths.
const files = [
  ...["main.css", "bands.css"].map(name => [`css/legacy/0.4/${name}`, `docs/assets/graph-paper/legacy/0.4/${name}`]),
  ["css/legacy/main.css", "docs/assets/graph-paper/legacy.css"],
  ...["grids", "layouts", "compact", "responsive", "bands"].map(name => [`src/legacy/0.4/manifest/${name}.mjs`, `docs/assets/graph-paper/src/legacy/0.4/manifest/${name}.mjs`]),
  ...["geometry", "accepted-changes", "discovery", "bands"].map(name => [`src/legacy/0.4/ruler/${name}.mjs`, `docs/assets/graph-paper/src/legacy/0.4/ruler/${name}.mjs`]),
  ...["composition", "response", "source", "accessibility"].map(name => [`tools/shared/${name}.mjs`, `docs/assets/graph-paper/tools/shared/${name}.mjs`]),
  ...["index.js", "model.mjs", "style.mjs"].map(name => [`tools/inspector/${name}`, `docs/assets/graph-paper/tools/inspector/${name}`]),
];
// The 0.5 configurator is a static docs application. Mirror only its arithmetic
// catalogue/oracle dependency graph, not the compiler or design experiments.
const coreModules=new Set(),pending=['catalogue.mjs','geometry.mjs','padding.mjs','vertical-spacing.mjs'];
while(pending.length){
  const name=pending.pop();if(coreModules.has(name))continue;coreModules.add(name);
  const source=await readFile(new URL(`../src/core/${name}`,import.meta.url),'utf8');
  for(const match of source.matchAll(/from\s*['"]\.\/([^'"]+)['"]/g))pending.push(match[1]);
  files.push([`src/core/${name}`,`docs/assets/graph-paper/src/core/${name}`]);
}
for(const name of ['main.css','main.min.css'])files.push([`css/${name}`,`docs/assets/graph-paper/${name}`]);
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
