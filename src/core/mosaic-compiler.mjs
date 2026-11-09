import {variable as v,equal as eq,sum} from './expressions.mjs';
const coded=p=>eq(v('m-code'),p.code);
const round=(x,basis)=>`round(nearest,calc(${x} * ${v('m-usable')} / ${basis}),1)`;
const span=(p,r)=>`calc(${round(r[1],p.basis)} - ${round(r[0],p.basis)} - ${r[0]>0?1:0} * ${v('m-thin')})`;
export const mosaicParameters=['m-code','m-inset','m-tail','m-usable','m-count','m-thin','m-space','m-geometry'];
export const mosaicScalars=['active','x','end','y','last','basis','start','span','row','rowspan'];
export function mosaicRootDeclarations(plans){return `
 --_gp-m-code:var(--gp-layout);
 --_gp-m-enabled:0;
 --_gp-m-inset:min(${v('inset-start')},max(0,calc(${v('parent')} - 1)));
 --_gp-m-tail:min(${v('inset-end')},max(0,calc(${v('parent')} - ${v('m-inset')} - 1)));
 --_gp-m-usable:calc(${v('parent')} - ${v('m-inset')} - ${v('m-tail')});
 --_gp-m-count:calc(${sum(plans.map(p=>`${coded(p)} * ${p.count}`))});
 --_gp-m-space:0;
 --_gp-m-thin:${eq(v('m-space'),2)};
 --_gp-m-geometry:calc(${sum(plans.map(p=>`${coded(p)} * min(${p.rects.map(r=>`clamp(0,${span(p,r)},1)`).join(',')})`))});
` + plans.map(p=>`
 &:where(:has(> :nth-child(${p.count})):not(:has(> :nth-child(${p.count+1})))) {
  --_gp-m-enabled:calc(${coded(p)} * ${v('m-geometry')} * clamp(0,${v('m-space')},1));
 }`).join('\n');}
export function mosaicChildDeclarations(){return `
 --_gp-m-active:0;
 --_gp-m-basis:1;
 --_gp-m-x:0; --_gp-m-end:1; --_gp-m-y:0; --_gp-m-last:1;
 --_gp-m-start:calc(${v('m-inset')} + ${round(v('m-x'),v('m-basis'))} + min(1,${v('m-x')}) * ${v('m-thin')});
 --_gp-m-span:calc(${round(v('m-end'),v('m-basis'))} - ${round(v('m-x'),v('m-basis'))} - min(1,${v('m-x')}) * ${v('m-thin')});
 --_gp-m-row:calc(1 + ${v('m-y')});
 --_gp-m-rowspan:calc(${v('m-last')} - ${v('m-y')});
`;}
export function mosaicRules(plans){
 // Mosaic rendering already requires style queries. Query the resolved layout
 // once per map and assign its fixed coordinates directly, rather than making
 // every participant evaluate a sum over all maps on each style invalidation.
 return `
 /* Query the selected layout parent; ordinary nested layouts reset the flag.
    Unsupported style queries retain m-active:0 and the normal stack fallback. */
 ${plans.map(p=>`@container style(--_gp-m-enabled:1) and style(--gp-layout:${p.code}) {
  & > :where(*) {
   --_gp-m-active:1;
   margin-block-start:calc(${v('m-thin')} * min(1,${v('m-y')}) * 100% / var(--_gp-tracks));
  }
  ${p.rects.map((r,i)=>`& > :where(:nth-child(${i+1})) {
   --_gp-m-basis:${p.basis};
   ${['x','end','y','last'].map((n,k)=>`--_gp-m-${n}:${r[k]};`).join(' ')}
  }`).join('\n')}
 }`).join('\n')}
`;
}

export const mosaicPlacement={active:v('m-active'),start:v('m-start'),span:v('m-span'),row:v('m-row'),rowspan:v('m-rowspan')};
