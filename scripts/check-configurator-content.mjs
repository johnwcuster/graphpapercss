// Public content is maintained with the configurator, independent of experiments.
import {sourceItems} from '../docs/sequence/content.mjs';
import {access} from 'node:fs/promises';
if(sourceItems.length!==14)throw Error('Expected thirteen records and one overflow diagnostic');
for(const item of sourceItems)for(const match of item.matchAll(/src="([^" ]+)"/g)){
 if(!match[1].startsWith('https:'))await access(new URL(`../docs/sequence/${match[1]}`,import.meta.url));
}
console.log('Public configurator content checked');
