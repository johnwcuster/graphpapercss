import {deliveryProfiles,profileCoverage} from '../assets/graph-paper/src/core/profiles.mjs';
import {layouts} from '../assets/graph-paper/src/core/catalogue.mjs';

export function smallestCompatibleProfile(selection,sizes){
 const candidates=deliveryProfiles.filter(p=>profileCoverage(p.id,selection).compatible);
 candidates.sort((a,b)=>sizes[a.id].gzip-sizes[b.id].gzip||sizes[a.id].minified-sizes[b.id].minified);
 if(!candidates.length)throw Error('No predefined build covers this selection');
 return candidates[0];
}
export function fullOnlyReason(selection){
 const families=new Set(selection.layouts.map(id=>layouts.find(p=>p.id===id)?.family));
 if(!families.has('four')&&!families.has('mosaic'))return 'The full library is the smallest predefined build that covers this sequence.';
 const reason=families.has('four')&&families.has('mosaic')?'Four compositions and a mosaic':families.has('four')?'Four compositions':'a mosaic';
 return `Your sequence includes ${reason}, so no smaller predefined build covers it.`;
}
