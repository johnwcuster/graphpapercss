import { readFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';

// Audit the shipped native-ES-module graph, including metadata and UI styles.
// Sizes sum individually compressed responses, not a hypothetical single bundle.
export async function inspectorGraph(root) {
  const seen = new Set(), files = [];
  async function visit(path) {
    const name = relative(root, path).replaceAll('\\', '/');
    if (!/^(?:tools\/(?:inspector|shared)|src\/legacy\/0\.4\/(?:ruler|manifest))\//.test(name)) {
      throw new Error(`Inspector depends on a non-portable file: ${name}`);
    }
    if (seen.has(name)) return;
    seen.add(name);
    const source = await readFile(path, 'utf8');
    if (/\bimport\s*\(/.test(source)) throw new Error(`Dynamic imports need an explicit graph audit: ${name}`);
    files.push({ name, raw: Buffer.byteLength(source), gzip: gzipSync(source).length });
    for (const [,specifier] of source.matchAll(/\b(?:from|import)\s*['"]([^'"]+)['"]/g)) {
      if (!specifier.startsWith('.')) throw new Error(`Non-local inspector dependency: ${specifier}`);
      await visit(resolve(dirname(path), specifier));
    }
  }
  await visit(resolve(root, 'tools/inspector/index.js'));
  files.sort((a,b)=>a.name.localeCompare(b.name));
  return { files, raw:files.reduce((n,f)=>n+f.raw,0), gzip:files.reduce((n,f)=>n+f.gzip,0) };
}
