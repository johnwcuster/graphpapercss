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
    if (/^(https?:|data:|mailto:)/.test(link)) continue;
    const target = link ? resolve(dirname(path), link) : path;
    if (!target.startsWith(root + "/") || !await stat(target).catch(() => null)) missing.push(`${path}: ${link}`);
    if (/\.md(?:[?#]|$)/.test(match[1])) missing.push(`${path}: raw Markdown site link ${match[1]}`);
    const anchor = match[1].split('#')[1];
    if (anchor && target.endsWith('.html')) {
      const targetHtml = await readFile(target, 'utf8').catch(() => '');
      if (!targetHtml.includes(`id="${decodeURIComponent(anchor)}"`)) missing.push(`${path}: missing anchor ${match[1]}`);
    }
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
