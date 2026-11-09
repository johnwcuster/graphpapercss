import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {transform} from 'lightningcss';
import {generateCSS} from './compiler.mjs';
import {layouts} from './catalogue.mjs';
import {compactPrivateProperties} from '../../scripts/lib/compact-core.mjs';

// Both delivery forms use the same private-property mapping. Keep the readable
// source untouched; no browser lowering or compatibility rewriting is applied.
export function distributionArtifacts(){
 const css=generateCSS(),compact=compactPrivateProperties(css);
 const minify=source=>transform({filename:'graph-paper.css',code:Buffer.from(source),minify:true}).code.toString();
 const min=minify(compact.css);
 const layer=source=>`@layer graph-paper {\n${source}}\n`;
 const report={layouts:layouts.length,source:Buffer.byteLength(css),minified:Buffer.byteLength(min),gzip:gzipSync(min).length,brotli:brotliCompressSync(min).length};
 return {
  'css/main.css':css,
  'css/main.min.css':min,
  'css/main.layer.css':layer(css),
  'css/main.layer.min.css':minify(layer(compact.css)),
  'css/private-names.json':JSON.stringify({version:1,cssSha256:createHash('sha256').update(min).digest('hex'),properties:compact.properties},null,2)+'\n',
  'css/size.json':JSON.stringify(report,null,2)+'\n',
 };
}
