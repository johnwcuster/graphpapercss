import assert from 'node:assert/strict';

// Delivery-only names. Public --gp-* inputs/tokens and shared --_gp-*
// ruler metadata remain verbatim. The map is build-specific, not author API.
export const sharedRulerProperties=new Set(['--_gp-tracks','--_gp-measure-tracks','--_gp-measure-ready']);
export function compactPrivateProperties(css){
 assert.ok(!/--_gp[0-9a-z]+\b/.test(css),'reserved compact-name namespace collision');
 const names=[...new Set(css.match(/--_gp-[a-z0-9-]+/g)??[])].filter(name=>!sharedRulerProperties.has(name)).sort();
 const properties=Object.fromEntries(names.map((name,i)=>[name,`--_gp${i.toString(36)}`]));
 const compact=css.replace(/--_gp-[a-z0-9-]+/g,name=>properties[name]??name);
 const inverse=Object.fromEntries(Object.entries(properties).map(([name,short])=>[short,name]));
 assert.equal(compact.replace(/--_gp[0-9a-z]+\b/g,name=>inverse[name]),css,'private-name round trip');
 return {css:compact,properties};
}
