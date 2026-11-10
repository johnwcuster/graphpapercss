import {variable as v,sum} from './expressions.mjs';
import {constructionRowBudget} from './row-budget.mjs';

// Each family supplies mutually exclusive active/start/span/row/rowspan
// expressions. Family modules own eligibility and safe inactive arithmetic.
export const placementScalars=['construction-rows','row-safe','active','start','span','row','rowspan'];
export function placementDeclarations(families){
 const fallback={
  start:`(${v('inset')} + ${v('repeat-active')} * (${v('repeat-start')} + ${v('slot')} * ${v('gap')}))`,
  span:`((1 - ${v('repeat-active')}) * ${v('usable')} + ${v('repeat-active')} * ${v('repeat-span')})`,
  row:v('fallback-row'),rowspan:'1',
 };
 const stack={start:v('inset'),span:v('usable'),row:v('i'),rowspan:'1'};
 const result=key=>`calc((1 - ${v('row-safe')}) * ${stack[key]} + ${v('row-safe')} * ((1 - ${v('active')}) * ${fallback[key]} + ${sum(families.map(f=>`${f.active} * ${f[key]}`))}))`;
 return `
   --_gp-construction-rows:calc(${sum(families.filter(f=>f.rows).map(f=>`${f.active} * ${f.rows}`))});
   --_gp-row-safe:clamp(0,calc(${constructionRowBudget+1} - ${v('construction-rows')}),1);
   --_gp-active:calc(${sum(families.map(f=>f.active))});
   --_gp-start:${result('start')};
   --_gp-span:${result('span')};
   --_gp-row:${result('row')};
   --_gp-rowspan:${result('rowspan')};
   grid-column:calc(1 + ${v('start')}) / span ${v('span')};
   grid-row:${v('row')} / span ${v('rowspan')};
   --_gp-tracks:${v('span')};
`;
}
