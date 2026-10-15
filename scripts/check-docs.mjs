import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve("docs");
async function files(directory) {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? files(resolve(directory, entry.name)) : resolve(directory, entry.name)))).flat();
}
const allFiles = await files(root);
const pages = allFiles.filter(path => path.endsWith(".html"));
const markdown = [resolve("README.md"), resolve("CHANGELOG.md"), ...allFiles.filter(path => path.endsWith(".md"))];
const missing = [];
for (const path of pages) {
  const html = await readFile(path, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const link = match[1].split("#")[0].split("?")[0];
    if (!link || /^(https?:|data:|mailto:)/.test(link)) continue;
    const target = resolve(dirname(path), link);
    if (!target.startsWith(root + "/") || !await stat(target).catch(() => null)) missing.push(`${path}: ${link}`);
  }
}
for (const path of markdown) {
  const source = await readFile(path, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].split("#")[0].split("?")[0];
    if (!link || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link)) continue;
    const target = resolve(dirname(path), link);
    if (!target.startsWith(resolve(".") + "/") || !await stat(target).catch(() => null)) missing.push(`${path}: ${link}`);
  }
}
for (const path of allFiles.filter(path => /\.(?:js|mjs)$/.test(path))) {
  const source = await readFile(path, "utf8");
  for (const match of source.matchAll(/(?:from|import)\s*["'](\.[^"']+)["']/g)) {
    if (!await stat(resolve(dirname(path), match[1])).catch(() => null)) missing.push(`${path}: ${match[1]}`);
  }
}
if (missing.length) throw new Error(`Documentation is not self-contained:\n${missing.join("\n")}`);
console.log(`${pages.length} HTML pages and ${markdown.length} Markdown documents: local links and module imports resolve`);
