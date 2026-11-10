import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {transform} from 'lightningcss';
import {compileSelection,selectiveProfiles} from './lib/selective-core.mjs';
import {compactPrivateProperties} from './lib/compact-core.mjs';
const directory=new URL('../test-results/selective-builds/',import.meta.url);
await mkdir(directory,{recursive:true});
const rows=[];
for(const [name,options] of Object.entries(selectiveProfiles)){
 const {css,selection}=compileSelection(options);
 const min=transform({filename:`${name}.css`,code:Buffer.from(compactPrivateProperties(css).css),minify:true}).code.toString();
 const row={name,readable:Buffer.byteLength(css),registrations:(css.match(/@property\s/g)??[]).length,minified:Buffer.byteLength(min),gzip:gzipSync(min).length,brotli:brotliCompressSync(min).length,sha256:createHash('sha256').update(min).digest('hex'),selection};
 await writeFile(new URL(`${name}.css`,directory),css);
 await writeFile(new URL(`${name}.min.css`,directory),min);
 rows.push(row);
}
const full=await readFile(new URL('../css/main.min.css',import.meta.url),'utf8');
const baseline={name:'published-full',readable:Buffer.byteLength(await readFile(new URL('../css/main.css',import.meta.url))),minified:Buffer.byteLength(full),gzip:gzipSync(full).length,brotli:brotliCompressSync(full).length,sha256:createHash('sha256').update(full).digest('hex')};
await writeFile(new URL('sizes.json',directory),JSON.stringify({baseline,profiles:rows},null,2)+'\n');
console.table([baseline,...rows].map(({name,readable,minified,gzip,brotli})=>({name,readable,minified,gzip,brotli})));
console.log('Experimental outputs: test-results/selective-builds/ (ignored; canonical CSS unchanged).');
