import {variable as v,equal as eq,boundCount,positiveCounts} from './expressions.mjs';
// Count-independent implementation of the accepted physical ranking.
const t=n=>v(`t-${n}`);
export const threeScalars=['auto-l','auto-c','auto-r','exact-l','exact-c','exact-r','exact-positive','exact-total','exact-spread','exact-bad-lc','exact-bad-cr','exact-valid','q','r','r0','r1','r2','many','odd-q','l','c','r-count','outer-same','outer-even','outer-gcd','rows','rtl','first','second','after-first','after-second','g0','g1','g2','left','center','right','local','count','step','active','cut1','cut2','start','span'];
export function threeDeclarations(){return `
   /* For N mod 3 = 1/2, matching outer counts win. For multiples of
      three, use consecutive counts; a sparse center is valid when q is
      even. When q is odd the outer pair is even and must be separated
      by the intermediate center. Three singletons remain singletons. */
   --_gp-t-q:max(1,round(down,calc(${v('n')} / 3),1));
   --_gp-t-r:mod(${v('n')},3);
   --_gp-t-r0:${eq(t('r'),0)}; --_gp-t-r1:${eq(t('r'),1)}; --_gp-t-r2:${eq(t('r'),2)};
   --_gp-t-many:clamp(0,calc(${v('n')} - 3),1);
   --_gp-t-odd-q:mod(${t('q')},2);
   --_gp-t-auto-l:calc(${t('q')} + ${t('r2')} - ${t('r0')} * ${t('odd-q')} * ${t('many')});
   --_gp-t-auto-c:calc(${t('q')} + ${t('r1')} - ${t('r0')} * (1 - ${t('odd-q')}) * ${t('many')});
   --_gp-t-auto-r:calc(${t('q')} + ${t('r2')} + ${t('r0')} * ${t('many')});
   /* Typed non-inheriting inputs are captured on the layout. Bound requests
      before arithmetic so malformed/huge requests cannot poison automatic
      geometry. With all counts positive, a request above N cannot match N. */
   --_gp-t-exact-l:${boundCount(v('exact-l'),v('n'))};
   --_gp-t-exact-c:${boundCount(v('exact-c'),v('n'))};
   --_gp-t-exact-r:${boundCount(v('exact-r'),v('n'))};
   --_gp-t-exact-positive:${positiveCounts([t('exact-l'),t('exact-c'),t('exact-r')])};
   --_gp-t-exact-total:calc(${t('exact-l')} + ${t('exact-c')} + ${t('exact-r')});
   --_gp-t-exact-spread:clamp(0,calc(3 - max(${t('exact-l')},${t('exact-c')},${t('exact-r')}) + min(${t('exact-l')},${t('exact-c')},${t('exact-r')})),1);
   --_gp-t-exact-bad-lc:max(calc(${eq(t('exact-l'),t('exact-c'))} * clamp(0,calc(${t('exact-l')} - 1),1)),calc((1 - min(1,mod(${t('exact-l')},2))) * (1 - min(1,mod(${t('exact-c')},2)))));
   --_gp-t-exact-bad-cr:max(calc(${eq(t('exact-c'),t('exact-r'))} * clamp(0,calc(${t('exact-c')} - 1),1)),calc((1 - min(1,mod(${t('exact-c')},2))) * (1 - min(1,mod(${t('exact-r')},2)))));
   --_gp-t-exact-valid:calc(${t('active')} * ${t('exact-positive')} * ${eq(t('exact-total'),v('n'))} * ${t('exact-spread')} * (1 - ${t('exact-bad-lc')}) * (1 - ${t('exact-bad-cr')}));
   --_gp-t-l:calc((1 - ${t('exact-valid')}) * ${t('auto-l')} + ${t('exact-valid')} * ${t('exact-l')});
   --_gp-t-c:calc((1 - ${t('exact-valid')}) * ${t('auto-c')} + ${t('exact-valid')} * ${t('exact-c')});
   --_gp-t-r-count:calc((1 - ${t('exact-valid')}) * ${t('auto-r')} + ${t('exact-valid')} * ${t('exact-r')});
   /* Adjacent pairs are coprime. The outer GCD is their equal count,
      two when unequal outer counts are both even, otherwise one. */
   --_gp-t-outer-same:${eq(t('l'),t('r-count'))};
   --_gp-t-outer-even:calc((1 - min(1,mod(${t('l')},2))) * (1 - min(1,mod(${t('r-count')},2))));
   --_gp-t-outer-gcd:calc(${t('outer-same')} * ${t('l')} + (1 - ${t('outer-same')}) * (1 + ${t('outer-even')}));
   --_gp-t-rows:round(nearest,calc(${t('l')} * ${t('c')} * ${t('r-count')} / ${t('outer-gcd')}),1);
   --_gp-t-rtl:calc(${v('rtl')} * ${eq(v('n'),3)});
   --_gp-t-first:calc((1 - ${v('center-first')} - ${t('rtl')}) * ${t('l')} + ${v('center-first')} * ${t('c')} + ${t('rtl')} * ${t('r-count')});
   --_gp-t-second:calc((1 - ${v('center-first')}) * ${t('c')} + ${v('center-first')} * ${t('l')});
   --_gp-t-after-first:clamp(0,calc(${v('i')} - ${t('first')}),1);
   --_gp-t-after-second:clamp(0,calc(${v('i')} - ${t('first')} - ${t('second')}),1);
   --_gp-t-g0:calc(1 - ${t('after-first')});
   --_gp-t-g1:calc(${t('after-first')} - ${t('after-second')});
   --_gp-t-g2:${t('after-second')};
   --_gp-t-left:calc((1 - ${v('center-first')} - ${t('rtl')}) * ${t('g0')} + ${v('center-first')} * ${t('g1')} + ${t('rtl')} * ${t('g2')});
   --_gp-t-center:calc((1 - ${v('center-first')}) * ${t('g1')} + ${v('center-first')} * ${t('g0')});
   --_gp-t-right:calc((1 - ${t('rtl')}) * ${t('g2')} + ${t('rtl')} * ${t('g0')});
   --_gp-t-local:calc(${v('i')} - 1 - ${t('after-first')} * ${t('first')} - ${t('after-second')} * ${t('second')});
   --_gp-t-count:calc(${t('left')} * ${t('l')} + ${t('center')} * ${t('c')} + ${t('right')} * ${t('r-count')});
   --_gp-t-step:round(nearest,calc(${t('rows')} / ${t('count')}),1);
   --_gp-t-active:calc(${v('three')} * ${v('has-three')} * clamp(0,calc(${v('usable')} - 2),1));
   --_gp-t-cut1:clamp(1,round(nearest,calc(${v('content')} * ${v('weight')} / ${v('total')}),1),max(1,calc(${v('content')} - 2)));
   --_gp-t-cut2:clamp(calc(${t('cut1')} + 1),round(nearest,calc(${v('content')} * (${v('weight')} + ${v('weight1')}) / ${v('total')}),1),max(2,calc(${v('content')} - 1)));
   --_gp-t-start:calc(${v('inset')} + ${t('center')} * (${t('cut1')} + ${v('gap')}) + ${t('right')} * (${t('cut2')} + 2 * ${v('gap')}));
   --_gp-t-span:calc(${t('left')} * ${t('cut1')} + ${t('center')} * (${t('cut2')} - ${t('cut1')}) + ${t('right')} * (${v('content')} - ${t('cut2')}));
`;}

export const threePlacement={
 rows:t('rows'),
 active:t('active'),start:t('start'),span:t('span'),
 row:`(1 + ${t('local')} * ${t('step')})`,rowspan:t('step'),
};
