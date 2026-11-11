import {layouts,hinges,spacingModes} from './catalogue.mjs';

// One capability manifest for compilation, documentation and delivery advice.
// Profiles are complete alternatives, not independently composable shards.
const definitions=[
 {id:'repeating',label:'Repeating',description:'Stack and repeating Peers 2–6.',families:['stack','peers']},
 {id:'two-three',label:'Two/Three compositions',description:'Stack, repeating Peers 2–6, and all Two/Three compositions.',families:['stack','peers','two','three']},
 {id:'full',label:'Full library',description:'Every layout, including Four compositions and mosaics.',families:['stack','peers','two','three','four','mosaic']},
];
export const deliveryProfiles=definitions.map(profile=>({...profile,
 selection:{layouts:layouts.filter(p=>profile.families.includes(p.family)).map(p=>p.id),hinges:hinges.map(([rem])=>rem),spacing:Object.keys(spacingModes),padding:true,verticalSpacing:true},
 files:{readable:profile.id==='full'?'css/main.css':`css/profiles/${profile.id}.css`,minified:profile.id==='full'?'css/main.min.css':`css/profiles/${profile.id}.min.css`},
}));
export const predefinedProfiles=deliveryProfiles.filter(p=>p.id!=='full');
export function deliveryProfile(id){
 const profile=deliveryProfiles.find(p=>p.id===id);if(!profile)throw Error(`Unknown delivery profile: ${id}`);return profile;
}
export function profileCoverage(id,selection){
 const supported=deliveryProfile(id).selection;
 const missing={layouts:[],hinges:[],spacing:[],utilities:[]};
 for(const key of ['layouts','hinges','spacing'])missing[key]=(selection[key]??[]).filter(value=>!supported[key].includes(value));
 for(const key of ['padding','verticalSpacing'])if(selection[key]&&!supported[key])missing.utilities.push(key);
 return {compatible:Object.values(missing).every(values=>!values.length),missing};
}
export function profileCDNTag(id,version){
 if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version))throw Error('Expected a pinned release version');
 return `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@${encodeURIComponent(version)}/${deliveryProfile(id).files.minified}">`;
}
