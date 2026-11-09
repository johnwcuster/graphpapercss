import { inspectorGraph } from './lib/inspector-graph.mjs';
const graph = await inspectorGraph(process.cwd());
console.log('Optional inspector module graph (includes metadata; excludes core CSS):');
for (const file of graph.files) console.log(`${file.name.padEnd(42)} ${String(file.raw).padStart(7)} raw  ${String(file.gzip).padStart(6)} gzip`);
console.log(`${graph.files.length} modules · ${graph.raw.toLocaleString('en-US')} raw bytes · ${graph.gzip.toLocaleString('en-US')} individually gzipped bytes`);
