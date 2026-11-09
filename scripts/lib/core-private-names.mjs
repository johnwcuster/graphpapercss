import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Test/diagnostic lookup only. Never load this into a production page.
const map=JSON.parse(await readFile(new URL('../../css/private-names.json',import.meta.url),'utf8'));
const css=await readFile(new URL('../../css/main.min.css',import.meta.url));
assert.equal(map.version,1);
assert.equal(map.cssSha256,createHash('sha256').update(css).digest('hex'),'stale private-name diagnostics');
export const privateNames=map.properties;
