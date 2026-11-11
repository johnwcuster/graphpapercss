import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {distributionArtifacts} from '../src/core/distribution.mjs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const check=process.argv.includes('--check');
if(!check)await mkdir(new URL('../css/',import.meta.url),{recursive:true});
for(const [name,content] of Object.entries(distributionArtifacts())){
 const path=new URL('../'+name,import.meta.url);
 if(check){if(await readFile(path,'utf8').catch(()=>'')!==content)throw Error(`Stale ${name}; run pnpm build`);}
 else {await mkdir(dirname(fileURLToPath(path)),{recursive:true});await writeFile(path,content);}
}
console.log('Core, layered and standalone profile distributions are current.');
