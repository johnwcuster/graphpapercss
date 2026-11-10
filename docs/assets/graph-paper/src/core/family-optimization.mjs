import {pairScalars,pairGeometryScalars} from './pair-compiler.mjs';
import {threeScalars} from './three-compiler.mjs';
import {fourScalars} from './four-compiler.mjs';
import {mosaicScalars} from './mosaic-compiler.mjs';

export const familyScalarGroups={
 two:[...pairGeometryScalars,...pairScalars.map(n=>`p-${n}`)],
 three:threeScalars.map(n=>`t-${n}`),
 four:fourScalars.map(n=>`f-${n}`),
 mosaic:mosaicScalars.map(n=>`m-${n}`),
};
export const exactValidationScalars=Object.values(familyScalarGroups).flat()
 .filter(n=>/^(p-exact-|t-exact-|f-exact-|f-e[0-3]$)/.test(n));
// Every eligible exact tuple needs a positive physical left count. Zero is
// the default and proves the request cannot succeed, so bypass validation
// without changing inputs or the automatic allocation it falls back to.
// Keep all nonzero inputs on the fully validated path, including malformed
// requests. Unsupported style queries retain the original arithmetic.
export function dormantExactCancellationRules(groups=familyScalarGroups){
 const scalars=Object.values(groups).flat().filter(n=>exactValidationScalars.includes(n));
 return `@container style(--_gp-exact-l:0) {
  & > :where(*) { ${scalars.map(n=>`--_gp-${n}:initial;`).join(' ')} }
 }`;
}
// Follow resolved family metadata, including author property overrides. At
// cascade time, cancel expressions the selected family cannot use. Engines
// without style queries retain the original arithmetic and safeguards.
export function compositionCancellationRules(groups=familyScalarGroups){
 return ['two','three','four'].filter(family=>family in groups).map(family=>`
 @container style(--_gp-${family}:1) {
  & > :where(*) { ${Object.entries(groups).filter(([name])=>name!==family).flatMap(([,names])=>names).map(n=>`--_gp-${n}:initial;`).join(' ')} }
 }`).join('\n');
}
