import {verticalSpacingCSS} from './vertical-spacing.mjs';
import {enhancementCondition} from './features.mjs';
export {enhancementCondition} from './features.mjs';
import {paddingCSS} from './padding.mjs';
import {mosaicParameters,mosaicRootDeclarations,mosaicChildDeclarations,mosaicRules,mosaicPlacement} from './mosaic-compiler.mjs';
import {fourDeclarations,fourPlacement} from './four-compiler.mjs';
import {fourSearchRootScalars,fourSearchRootDeclarations} from './four-search.mjs';
import {placementScalars,placementDeclarations} from './placement-compiler.mjs';
import {variable as v,equal as eq,sum} from './expressions.mjs';
import {layoutCode as coded,layoutMembership,groupedLayoutTerms as grouped} from './metadata.mjs';
import {ruleScalars,ruleDeclarations,ruleDecoration} from './rule-compiler.mjs';
import {layouts,hinges,spacingModes,allocationPolicies,directionPolicies,traversalPolicies,arrangementPolicies,controlPolicies,exactCountRegions} from './catalogue.mjs';
import {pairDeclarations,pairPlacement,endpointPlacement} from './pair-compiler.mjs';
import {threeDeclarations,threePlacement} from './three-compiler.mjs';
import {compositionCancellationRules,dormantExactCancellationRules,familyScalarGroups} from './family-optimization.mjs';
const token=n=>`var(--gp-${n})`;
const rule=(selector,body)=>`${selector} { ${body} }`;
const ordinaryScalarNames=['two','three','four'].flatMap(name=>familyScalarGroups[name]);
const familyScalarNames=[...ordinaryScalarNames,...familyScalarGroups.mosaic];
const scalarNames=['inset','tail','usable','c','gap','content','slot','repeat-active','repeat-start','repeat-span','n','i','fallback-row','first','last','spanning',...placementScalars,...familyScalarNames,...ruleScalars,'m-enabled','simple'];
const parameters=[...mosaicParameters,'parent','inset-start','inset-end','gutter','ruled','two','weight','total','has-two','has-three','has-four','three','weight1','repeat','stronger','reverse','rtl','center-first','exact-l','exact-c','exact-r','above','below','span-mode','four','exact-cl','exact-cr','f-wide','f-widest',...[0,1,2,3].flatMap(i=>[`f-w${i}`,`f-slot${i}`,`f-order${i}`])];
// Selection metadata follows --gp-layout even when an author overrides the
// class through CSS. Traversal ranks nominal weights, never rounded widths.
function fourParameters(plans){
 const ranking=p=>p.weights.map((weight,slot)=>({weight,slot})).sort((a,b)=>b.weight-a.weight||a.slot-b.slot).map(p=>p.slot);
 return [0,1,2,3].map(i=>`
 --_gp-f-w${i}:calc(1 + ${grouped(plans,p=>p.weights[i]-1)} + ${v('f-wide')} * (${grouped(plans,p=>(p.wideWeights?.[i]??p.weights[i])-p.weights[i])}));
 --_gp-f-slot${i}:calc((1 - ${v('f-widest')}) * ${i} + ${v('f-widest')} * (${grouped(plans,p=>ranking(p)[i])}));
 --_gp-f-order${i}:calc((1 - ${v('f-widest')}) * ${i} + ${v('f-widest')} * (${grouped(plans,p=>ranking(p).indexOf(i))}));`).join('\n');
}

export function generateCSS(){
 const two=layouts.filter(p=>p.family==='two'),three=layouts.filter(p=>p.family==='three'),four=layouts.filter(p=>p.family==='four'),mosaics=layouts.filter(p=>p.family==='mosaic'),peers=layouts.filter(p=>p.family==='peers');
 const names=layouts.flatMap(p=>[`gp_layout--${p.id}`,...hinges.map(([,prefix])=>`gp_${prefix}--${p.id}`)]);
 const selector=`:where(${names.map(n=>`.${n}`).join(',')})`;
 const out=[
  '/* Graph Paper CSS. MIT license. */',
  paddingCSS,
  '@property --gp-arrangement { syntax:"<integer>"; inherits:false; initial-value:0; }',
  '@property --gp-layout { syntax:"<integer>"; inherits:false; initial-value:0; }',
  '@property --gp-allocation { syntax:"<integer>"; inherits:false; initial-value:0; }',
  '@property --gp-traversal { syntax:"<integer>"; inherits:false; initial-value:0; }',
  '@property --gp-fewer { syntax:"<integer>"; inherits:false; initial-value:0; }',
  ...exactCountRegions.map(n=>`@property --gp-exact-count-${n} { syntax:"<integer>"; inherits:false; initial-value:0; }`),
  // An absent breakpoint input stays guaranteed-invalid so var() carries the
  // earlier value forward. Explicit zero is a real reset, not an absent value.
  ...hinges.flatMap(([,prefix])=>exactCountRegions.map(n=>`@property --gp-${prefix}-exact-count-${n} { syntax:"*"; inherits:false; }`)),
  ...exactCountRegions.map(n=>`@property --_gp-selected-exact-${n} { syntax:"<integer>"; inherits:false; initial-value:0; }`),
  '@property --gp-ruler-bit { syntax:"<length>"; inherits:true; initial-value:0px; }',
  '@property --_gp-measure-tracks { syntax:"<integer>"; inherits:true; initial-value:64; }',
  '@property --_gp-measure-ready { syntax:"<number>"; inherits:true; initial-value:0; }',
  '@property --_gp-tracks { syntax:"<integer>"; inherits:true; initial-value:64; }',
  ...parameters.map(n=>`@property --_gp-${n} { syntax:"<number>"; inherits:true; initial-value:0; }`),
  ...fourSearchRootScalars.map(n=>`@property --_gp-f-${n} { syntax:"<number>"; inherits:false; initial-value:0; }`),
  ...[...scalarNames,...[2,3,4,5,6].map(n=>`slot-${n}`)].map(n=>`@property --_gp-${n} { syntax:"<number>"; inherits:false; initial-value:0; }`),
  rule(':where(:root)',[...layouts.map(p=>`--gp-${p.id}:${p.code};`),...Object.entries(arrangementPolicies).map(([n,code])=>`--gp-${n}:${code};`),...Object.entries(allocationPolicies).map(([n,code])=>`--gp-${n}:${code};`),...Object.entries(directionPolicies).map(([n,code])=>`--gp-fewer-${n}:${code};`),...Object.entries(traversalPolicies).map(([n,code])=>`--gp-${n}:${code};`)].join(' ')),
  rule(':where(.gp_ruler,.gp_rebase_64)','display:grid; --gp-ruler-bit:0px; --_gp-measure-ready:0;'),
  rule(':where(.gp_ruler > *,.gp_rebase_64 > *,.gp_continue_tracks > *)','grid-column:1 / -1; min-inline-size:0;'),
  rule(':where(.gp_continue_tracks)','display:grid; grid-template-columns:subgrid;'),
 ];
 // Override inactive family's declarations at cascade time, not by multiplying
 // their computed results by zero. Without style queries the original path
 // remains intact, so this optimization adds no new correctness prerequisite.
 const mosaicResets=ordinaryScalarNames.map(n=>`--_gp-${n}:initial;`).join(' ');
 const simpleResets=familyScalarNames.map(n=>`--_gp-${n}:initial;`).join(' ');
 // One exact opt-in list encloses shared geometry, guards, and native counting.
 // Ordinary author selectors override the zero-specificity candidate rules.
 out.push(ruleDecoration());
 out.push(`${selector} {
 display:grid; grid-template-columns:subgrid;
 ${exactCountRegions.map(n=>`--_gp-selected-exact-${n}:var(--gp-exact-count-${n});`).join(' ')}
 ${hinges.map(([rem],i)=>`@media(min-width:${rem}rem) { ${exactCountRegions.map(n=>{
   let value=`var(--gp-exact-count-${n})`;
   for(let j=0;j<=i;j++)value=`var(--gp-${hinges[j][1]}-exact-count-${n},${value})`;
   return `--_gp-selected-exact-${n}:${value};`;
 }).join(' ')} }`).join('\n')}
 --_gp-exact-l:var(--_gp-selected-exact-left); --_gp-exact-c:var(--_gp-selected-exact-center); --_gp-exact-r:var(--_gp-selected-exact-right); --_gp-exact-cl:var(--_gp-selected-exact-center-left); --_gp-exact-cr:var(--_gp-selected-exact-center-right);
 --_gp-parent:var(--_gp-tracks); --_gp-inset-start:0; --_gp-inset-end:0; --_gp-gutter:0; --_gp-ruled:0;
 --_gp-has-two:0; --_gp-has-three:0; --_gp-has-four:0;
 --_gp-two:${layoutMembership(two)};
 --_gp-three:${layoutMembership(three)};
 --_gp-four:${layoutMembership(four)};
 --_gp-f-wide:0;
 --_gp-f-widest:${eq('var(--gp-traversal)',3)};
 ${fourParameters(four)}
 ${mosaicRootDeclarations(mosaics)}
 --_gp-simple:calc(1 - min(1,calc(${v('two')} + ${v('three')} + ${v('four')} + ${v('m-count')})));
 --_gp-weight:calc(1 + ${grouped([...two,...three],p=>p.weights[0]-1)});
 --_gp-weight1:calc(1 + ${grouped(three,p=>p.weights[1]-1)});
 --_gp-total:calc(2 + ${v('three')} + ${grouped([...two,...three],p=>p.weights.reduce((s,w)=>s+w,0)-p.weights.length)});
 --_gp-above:calc(${v('two')} * (${eq('var(--gp-arrangement)',1)} + ${eq('var(--gp-arrangement)',3)}));
 --_gp-below:calc(${v('two')} * (${eq('var(--gp-arrangement)',2)} + ${eq('var(--gp-arrangement)',3)}));
 --_gp-span-mode:max(${v('above')},${v('below')});
 --_gp-repeat:calc(${sum(peers.map(p=>`${coded(p)} * ${p.columns}`))} + ${v('two')} * ((1 - ${v('span-mode')}) * ${v('has-two')} + ${v('span-mode')} * ((1 - ${v('above')} * ${v('below')}) * ${v('has-three')} + ${v('above')} * ${v('below')} * ${v('has-four')})) * 2);
 --_gp-stronger:clamp(0,var(--gp-allocation),1);
 --_gp-reverse:clamp(0,var(--gp-fewer),1);
 --_gp-rtl:${eq('var(--gp-traversal)',1)};
 --_gp-center-first:${eq('var(--gp-traversal)',2)};
 &:where(:has(> :nth-child(2))) { --_gp-has-two:1; }
 &:where(:has(> :nth-child(3))) { --_gp-has-three:1; }
 &:where(:has(> :nth-child(4))) { --_gp-has-four:1; }
${fourSearchRootDeclarations()}
 & > :where(*) {
  min-inline-size:0;
  --_gp-first:0; --_gp-last:0;
  --_gp-spanning:max(calc(${v('above')} * ${v('first')}),calc(${v('below')} * ${v('last')}));
  --_gp-inset:min(${v('inset-start')},max(0,calc(${v('parent')} - 1)));
  --_gp-tail:min(${v('inset-end')},max(0,calc(${v('parent')} - ${v('inset')} - 1)));
  --_gp-usable:calc(${v('parent')} - ${v('inset')} - ${v('tail')});
  --_gp-c:max(1,${v('repeat')},calc(3 * ${v('three')}),calc(4 * ${v('four')}));
  --_gp-repeat-active:calc((1 - ${v('spanning')}) * clamp(0,calc(${v('repeat')} - 1),1) * clamp(0,calc(${v('usable')} - ${v('c')} + 1),1));
  --_gp-gap:min(${v('gutter')},max(0,round(down,calc((${v('usable')} - ${v('c')}) / max(1,calc(${v('c')} - 1))),1)));
  --_gp-content:calc(${v('usable')} - (${v('c')} - 1) * ${v('gap')});
  --_gp-slot:calc(${sum([2,3,4,5,6].map(c=>`${eq(v('repeat'),c)} * ${c===2?`((1 - ${v('above')}) * ${v('slot-2')} + ${v('above')} * (1 - ${v('slot-2')}))`:v(`slot-${c}`)}`))});
  --_gp-repeat-start:round(nearest,calc(${v('content')} * ${v('slot')} / ${v('c')}),1);
  --_gp-repeat-span:calc(round(nearest,calc(${v('content')} * (${v('slot')} + 1) / ${v('c')}),1) - ${v('repeat-start')});
  grid-column:calc(1 + ${v('inset')} + ${v('repeat-active')} * (${v('repeat-start')} + ${v('slot')} * ${v('gap')})) / span calc((1 - ${v('repeat-active')}) * ${v('usable')} + ${v('repeat-active')} * ${v('repeat-span')});
  grid-row:auto;
  --_gp-tracks:calc((1 - ${v('repeat-active')}) * ${v('usable')} + ${v('repeat-active')} * ${v('repeat-span')});
 }
 & > :where(:first-child) { --_gp-first:1; }
 & > :where(:last-child) { --_gp-last:1; }
 ${[2,3,4,5,6].flatMap(c=>Array.from({length:c},(_,i)=>`& > :where(:nth-child(${c}n + ${i+1})) { --_gp-slot-${c}:${i}; }`)).join('\n')}
 @supports ${enhancementCondition} {
  & > :where(*) {
   --_gp-n:sibling-count(); --_gp-i:sibling-index();
${pairDeclarations()}
   --_gp-fallback-row:calc(1 + round(down,calc((${v('i')} - 1) / (1 + ${v('repeat-active')} * (${v('c')} - 1))),1));
${threeDeclarations()}
${fourDeclarations()}
${mosaicChildDeclarations()}
${placementDeclarations([pairPlacement,threePlacement,endpointPlacement,fourPlacement,mosaicPlacement])}
  }
${mosaicRules(mosaics)}
${compositionCancellationRules()}
${dormantExactCancellationRules()}
 @container style(--_gp-m-enabled:1) {
  & > :where(*) { ${mosaicResets} }
 }
 @container style(--_gp-simple:1) {
  & > :where(*) { ${simpleResets} }
 }
 }
${ruleDeclarations(enhancementCondition)}
}`);
 out.push(rule(':where(.gp_ruler,.gp_rebase_64)','grid-template-columns:repeat(64,minmax(0,1fr)); --_gp-tracks:64;'));
 const spacingAliases=prefix=>Object.entries(spacingModes).map(([name,[a,b,gap]])=>rule(`:where(.gp_${prefix}spacing--${name})`,`--_gp-inset-start:${a}; --_gp-inset-end:${b}; --_gp-gutter:${gap}; --_gp-f-wide:${['wide','ruled'].includes(name)?1:0}; --_gp-m-space:${name==='neat'?1:name==='thin'?2:0}; --_gp-ruled:${name==='ruled'?1:0};`)).join('\n');
 out.push(spacingAliases(''));
 out.push(rule(':where(.gp_ruler.gp_ruler--measure,.gp_rebase_64.gp_ruler--measure)','container-type:inline-size; --_gp-measure-ready:1; --_gp-measure-tracks:var(--_gp-tracks);'));
 out.push(rule(':where(.gp_ruler.gp_ruler--measure > *,.gp_rebase_64.gp_ruler--measure > *)','--gp-ruler-bit:calc(100cqi / var(--_gp-measure-tracks));'));
 for(const [name,code] of Object.entries(allocationPolicies))out.push(rule(`:where(.gp_allocation--${name})`,`--gp-allocation:${code};`));
 for(const [name,code] of Object.entries(directionPolicies))out.push(rule(`:where(.gp_fewer--${name})`,`--gp-fewer:${code};`));
 for(const [name,code] of Object.entries(traversalPolicies))out.push(rule(`:where(.gp_traversal--${name})`,`--gp-traversal:${code};`));
 for(const [name,code] of Object.entries(arrangementPolicies))out.push(rule(`:where(.gp_arrangement--${name})`,`--gp-arrangement:${code};`));
 const aliases=prefix=>layouts.map(p=>rule(`:where(.${prefix}${p.id})`,`--gp-layout:${token(p.id)};`)).join('\n');
 out.push(aliases('gp_layout--'));
 for(const [rem,prefix] of hinges)out.push(`@media(min-width:${rem}rem) {\n${aliases(`gp_${prefix}--`)}\n${spacingAliases(`${prefix}-`)}\n${Object.entries(controlPolicies).flatMap(([family,options])=>Object.entries(options).map(([name,code])=>rule(`:where(.gp_${prefix}-${family}--${name})`,`--gp-${family}:${code};`))).join('\n')}\n}`);
 return `${out.join('\n')}\n\n${verticalSpacingCSS}`.replace(/[ \t]+$/gm,'');
}
