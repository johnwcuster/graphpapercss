import {variable as v,equal as eq,boundCount,positiveCounts} from './expressions.mjs';
// Two-region allocation, traversal, geometry, and optional endpoint bookkeeping.
const p=n=>v(`p-${n}`);
export const pairScalars=['n','i','exact-l','exact-r','exact-positive','exact-total','exact-range','exact-bad','exact-valid','span-native'];
export const pairGeometryScalars=['small','a','b','half','odd','first-count','after-first','group','local','step','two-active','cut','two-start','two-span','auto-a','auto-b'];
export function pairDeclarations(){return `
   --_gp-p-n:max(0,calc(${v('n')} - ${v('above')} - ${v('below')}));
   --_gp-p-i:max(1,calc(${v('i')} - ${v('above')}));
   --_gp-p-exact-l:${boundCount(v('exact-l'),p('n'))};
   --_gp-p-exact-r:${boundCount(v('exact-r'),p('n'))};
   --_gp-p-exact-positive:${positiveCounts([p('exact-l'),p('exact-r')])};
   --_gp-p-exact-total:calc(${p('exact-l')} + ${p('exact-r')});
   --_gp-p-exact-range:clamp(0,calc(5 - abs(${p('exact-l')} - ${p('exact-r')})),1);
   --_gp-p-exact-bad:max(calc(${eq(p('exact-l'),p('exact-r'))} * clamp(0,calc(${p('exact-l')} - 1),1)),calc((1 - min(1,mod(${p('exact-l')},2))) * (1 - min(1,mod(${p('exact-r')},2)))),calc((1 - min(1,mod(${p('exact-l')},3))) * (1 - min(1,mod(${p('exact-r')},3)))));
   --_gp-p-exact-valid:calc(${v('span-mode')} * clamp(0,calc(${p('n')} - 1),1) * clamp(0,calc(${v('usable')} - 1),1) * ${p('exact-positive')} * ${eq(p('exact-total'),p('n'))} * ${p('exact-range')} * (1 - ${p('exact-bad')}) * ${eq(v('exact-c'),0)});
   --_gp-p-span-native:calc(${v('spanning')} * clamp(0,calc(${p('n')} - 1),1) * clamp(0,calc(${v('usable')} - 1),1));
   /* Within a difference of four, even totals have exactly one coprime
      split. Odd totals admit the closest pair and sometimes a stronger pair.
      This parity/remainder rule has no source-count table or search cutoff. */
   --_gp-half:round(down,calc(${v('p-n')} / 2),1);
   --_gp-odd:mod(${v('p-n')},2);
   --_gp-small:max(1,calc(${v('half')} - (1 - ${v('odd')}) * (1 + min(1,mod(${v('p-n')},4))) - ${v('stronger')} * ${v('odd')} * min(1,mod(${v('p-n')},3))));
   --_gp-auto-a:calc((1 - ${v('reverse')}) * ${v('small')} + ${v('reverse')} * max(1,calc(${v('p-n')} - ${v('small')})));
   --_gp-auto-b:max(1,calc(${v('p-n')} - ${v('auto-a')}));
   --_gp-a:calc((1 - ${v('p-exact-valid')}) * ${v('auto-a')} + ${v('p-exact-valid')} * ${v('p-exact-l')});
   --_gp-b:calc((1 - ${v('p-exact-valid')}) * ${v('auto-b')} + ${v('p-exact-valid')} * ${v('p-exact-r')});
   --_gp-first-count:calc((1 - ${v('rtl')}) * ${v('a')} + ${v('rtl')} * ${v('b')});
   --_gp-after-first:clamp(0,calc(${v('p-i')} - ${v('first-count')}),1);
   --_gp-group:calc((1 - ${v('rtl')}) * ${v('after-first')} + ${v('rtl')} * (1 - ${v('after-first')}));
   --_gp-local:calc(${v('p-i')} - 1 - ${v('after-first')} * ${v('first-count')});
   /* Selected group counts are coprime: LCM is A*B, so each span is
      simply the neighboring region's item count. */
   --_gp-step:calc((1 - ${v('group')}) * ${v('b')} + ${v('group')} * ${v('a')});
   --_gp-two-active:calc(${v('two')} * (1 - ${v('spanning')}) * clamp(0,calc(${v('p-n')} - 1),1) * clamp(0,calc(${v('usable')} - 1),1));
   --_gp-cut:clamp(1,round(nearest,calc((${v('usable')} - ${v('gap')}) * ${v('weight')} / ${v('total')}),1),max(1,calc(${v('usable')} - ${v('gap')} - 1)));
   --_gp-two-start:calc(${v('inset')} + ${v('group')} * (${v('cut')} + ${v('gap')}));
   --_gp-two-span:calc((1 - ${v('group')}) * ${v('cut')} + ${v('group')} * (${v('usable')} - ${v('gap')} - ${v('cut')}));
`;}

// Build-time placement descriptors; these are not public CSS outputs.
export const pairPlacement={
 rows:`(${v('a')} * ${v('b')} + ${v('above')} + ${v('below')})`,
 active:v('two-active'),start:v('two-start'),span:v('two-span'),
 row:`(1 + ${v('above')} + ${v('local')} * ${v('step')})`,rowspan:v('step'),
};
export const endpointPlacement={
 rows:pairPlacement.rows,
 active:v('p-span-native'),start:v('inset'),span:v('usable'),
 row:`(1 + ${v('below')} * ${v('last')} * (${v('above')} + ${v('a')} * ${v('b')}))`,rowspan:'1',
};
