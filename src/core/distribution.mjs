import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {transform} from 'lightningcss';
import {generateColumnRulesCSS} from './rule-compiler.mjs';
import {generateCSS} from './compiler.mjs';
import {layouts} from './catalogue.mjs';
import {compactPrivateProperties} from '../../scripts/lib/compact-core.mjs';
import {predefinedProfiles} from './profiles.mjs';
import {compileSelection} from './selection.mjs';

// Both delivery forms use the same private-property mapping. Keep the readable
// source untouched; no browser lowering or compatibility rewriting is applied.
export function distributionArtifacts(){
 const extension=generateColumnRulesCSS();
 const css=generateCSS(),compact=compactPrivateProperties(css);
 const minify=source=>transform({filename:'graph-paper.css',code:Buffer.from(source),minify:true}).code.toString();
 const min=minify(compact.css);
 const layer=source=>`@layer graph-paper {\n${source}}\n`;
 const report={layouts:layouts.length,source:Buffer.byteLength(css),minified:Buffer.byteLength(min),gzip:gzipSync(min).length,brotli:brotliCompressSync(min).length};
 const profileFiles={},profileManifest={schemaVersion:1,profiles:{}};
 const describe=(path,source)=>({path,bytes:Buffer.byteLength(source),gzip:gzipSync(source).length,brotli:brotliCompressSync(source).length,sha256:createHash('sha256').update(source).digest('hex')});
 for(const profile of predefinedProfiles){
  const selected=compileSelection(profile.selection),readable=selected.css,compressed=minify(compactPrivateProperties(readable).css);
  profileFiles[profile.files.readable]=readable;
  profileFiles[profile.files.minified]=compressed;
  profileManifest.profiles[profile.id]={label:profile.label,description:profile.description,selection:selected.selection,files:{readable:describe(profile.files.readable,readable),minified:describe(profile.files.minified,compressed)}};
 }
 profileFiles['css/profiles/manifest.json']=JSON.stringify(profileManifest,null,2)+'\n';
 return {
  'css/extensions/column-rules.css':extension,
  'css/extensions/column-rules.min.css':minify(extension),
  'css/extensions/column-rules.layer.css':layer(extension),
  'css/extensions/column-rules.layer.min.css':minify(layer(extension)),
  'css/main.css':css,
  'css/main.min.css':min,
  'css/main.layer.css':layer(css),
  'css/main.layer.min.css':minify(layer(compact.css)),
  'css/private-names.json':JSON.stringify({version:1,cssSha256:createHash('sha256').update(min).digest('hex'),properties:compact.properties},null,2)+'\n',
  'css/size.json':JSON.stringify(report,null,2)+'\n',
  ...profileFiles,
 };
}
