import {variable as shared,equal as eq,sum} from './expressions.mjs';
import {candidates,candidateSlots} from './four-allocation.mjs';
import {compileFourSearch} from './four-search.mjs';
const groups=['a','b','c','d'];
const common=new Set(['n','i','inset','tail','usable','gap','content','four','exact-l','exact-cl','exact-cr','exact-r']);
const v=name=>common.has(name)?shared(name):shared(`f-${name}`);
const product=values=>values.join(' * ');
function compileFour(){
 const scalars=new Set(),lines=[];
 const set=(name,value)=>{scalars.add(name);lines.push(`   --_gp-f-${name}:${value};`);};
  set('q',`round(down,calc(${v('n')} / 4),1)`);set('r',`mod(${v('n')},4)`);
  for(let r=0;r<4;r++)set(`r${r}`,eq(v('r'),r));
  for(let k=0;k<candidateSlots;k++) {
    for(let g=0;g<4;g++) {
      const offsets=policy=>sum([0,1,2,3].map(r=>({r,c:candidates(8+r,policy)[k][g]-2})).filter(p=>p.c).map(p=>`${p.c} * ${v(`r${p.r}`)}`));
      set(`c${k}${groups[g]}`,`calc(${v('q')} + (1 - var(--_gp-stronger)) * (${offsets('closest')}) + var(--_gp-stronger) * (${offsets('stronger')}))`);
    }
  }
  compileFourSearch(set);
  // Bounds protect fallback arithmetic from malformed or enormous requests.
  for(let i=0;i<4;i++)set(`e${i}`,`clamp(0,${v(['exact-l','exact-cl','exact-cr','exact-r'][i])},${v('n')})`);
  set('exact-total',`calc(${sum([0,1,2,3].map(i=>v(`e${i}`)))})`);
  set('exact-spread',`clamp(0,calc(5 - max(${[0,1,2,3].map(i=>v(`e${i}`)).join(',')}) + min(${[0,1,2,3].map(i=>v(`e${i}`)).join(',')})),1)`);
  for(let i=0;i<3;i++){
    const a=v(`e${i}`),b=v(`e${i+1}`);
    const both=p=>`(1 - min(1,mod(${a},${p}))) * (1 - min(1,mod(${b},${p})))`;
    set(`exact-bad${i}`,`max(calc(${eq(a,b)} * clamp(0,calc(${a} - 1),1)),calc(${both(2)}),calc(${both(3)}))`);
  }
  set('exact-valid',`calc(${v('four')} * clamp(0,calc(${v('n')} - 3),1) * clamp(0,calc(${v('usable')} - 3),1) * ${product([0,1,2,3].map(i=>`clamp(0,${v(`e${i}`)},1)`))} * ${eq(v('exact-total'),v('n'))} * ${v('exact-spread')} * ${product([0,1,2].map(i=>`(1 - ${v(`exact-bad${i}`)})`))})`);
  set('resolved',`max(${v('found')},${v('exact-valid')})`);
  for(const [i,g] of groups.entries())set(g,`calc((1 - ${v('exact-valid')}) * (1 - ${v('found')} + ${sum(Array.from({length:candidateSlots},(_,k)=>`${v(`take${k}`)} * ${v(`c${k}${g}`)}`))}) + ${v('exact-valid')} * (${sum([0,1,2,3].map(slot=>`${eq(`var(--_gp-f-slot${i})`,slot)} * ${v(`e${slot}`)}`))}))`);
  // Accepted physical neighbors are coprime. Every triple contains a physical
  // neighbor pair, so triple/quartet GCDs are one, in any traversal order.
  // Thus LCM needs only pair GCDs. Revisit if allocation eligibility changes.
  // Counts have range <=4; unequal pair common divisors are only 2/3/4.
  const pairs=[];
  for(let mask=1;mask<16;mask++) {
    const subset=groups.filter((_,i)=>mask&(1<<i));if(subset.length!==2)continue;
    const name=`g${subset.join('')}`,allEqual=product(subset.slice(1).map(g=>eq(v(subset[0]),v(g))));
    set(`${name}equal`,`calc(${allEqual})`);
    const all=p=>product(subset.map(g=>`(1 - min(1,mod(${v(g)},${p})))`));
    set(name,`calc(${v(`${name}equal`)} * ${v(subset[0])} + (1 - ${v(`${name}equal`)}) * (1 + ${all(2)} + 2 * ${all(3)} + 2 * ${all(4)}))`);
    pairs.push(name);
  }
  set('rows',`round(nearest,calc((${product(groups.map(v))}) / (${product(pairs.sort().map(v))})),1)`);
  set('after-a',`clamp(0,calc(${v('i')} - ${v('a')}),1)`);set('after-b',`clamp(0,calc(${v('i')} - ${v('a')} - ${v('b')}),1)`);set('after-c',`clamp(0,calc(${v('i')} - ${v('a')} - ${v('b')} - ${v('c')}),1)`);
  const flags=[`(1 - ${v('after-a')})`,`(${v('after-a')} - ${v('after-b')})`,`(${v('after-b')} - ${v('after-c')})`,v('after-c')];
  set('slot',`calc(${sum(flags.map((f,i)=>`${f} * var(--_gp-f-slot${i})`))})`);
  set('local',`calc(${v('i')} - 1 - ${v('after-a')} * ${v('a')} - ${v('after-b')} * ${v('b')} - ${v('after-c')} * ${v('c')})`);
  set('step',`round(nearest,calc(${v('rows')} / (${sum(flags.map((f,i)=>`${f} * ${v(groups[i])}`))})),1)`);
  set('active',`calc(${v('four')} * ${v('resolved')} * clamp(0,calc(${v('n')} - 3),1) * clamp(0,calc(${v('usable')} - 3),1))`);
  const weights=sum([0,1,2,3].map(i=>`var(--_gp-f-w${i})`));
  for(let i=1;i<=3;i++)set(`b${i}`,`clamp(${i===1?'1':`calc(${v(`b${i-1}`)} + 1)`},round(nearest,calc(${v('content')} * (${sum(Array.from({length:i},(_,j)=>`var(--_gp-f-w${j})`))}) / (${weights})),1),max(${i},calc(${v('content')} - ${4-i})))`);
  const starts=['0',`(${v('b1')} + ${v('gap')})`,`(${v('b2')} + 2 * ${v('gap')})`,`(${v('b3')} + 3 * ${v('gap')})`];
  const spans=[v('b1'),`(${v('b2')} - ${v('b1')})`,`(${v('b3')} - ${v('b2')})`,`(${v('content')} - ${v('b3')})`];
  set('start',`calc(${v('inset')} + ${sum(starts.map((x,i)=>`${eq(v('slot'),i)} * ${x}`))})`);
  set('span',`calc(${sum(spans.map((s,i)=>`${eq(v('slot'),i)} * ${s}`))})`);
  set('row',`calc(1 + ${v('local')} * ${v('step')})`);
 return {scalars:[...scalars],css:lines.join('\n')};
}
const compiled=compileFour();
export const fourScalars=compiled.scalars;
export const fourDeclarations=()=>compiled.css;
export const fourPlacement={rows:v('rows'),active:v('active'),start:v('start'),span:v('span'),row:v('row'),rowspan:v('step')};
