import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {catalogue,layouts,spacingModes,hinges,controlPolicies,exactCountRegions} from '../src/core/catalogue.mjs';
import {placements,allocationCounts,threeRegionCounts,exactCountsEligible,pairExactCountsEligible} from '../src/core/geometry.mjs';
import {generateCSS} from '../src/core/compiler.mjs';
import {dormantExactCancellationRules,exactValidationScalars} from '../src/core/family-optimization.mjs';
import {rankedAllocations} from './oracles/three-allocation.mjs';
import {twoAllocation} from './oracles/allocation.mjs';
import {editorial,threeEditorial} from './oracles/catalogue.mjs';
import {positions as fourPositions} from './oracles/four-proportions.mjs';
import {search as fourStudy,exactAllocations as fourStudyExact} from './oracles/four-allocation.mjs';
import {fourCounts,fourExactCountsEligible,fourExactAllocations} from '../src/core/four-geometry.mjs';
import {plans as four} from './oracles/four-proportions.mjs';
import {mosaics} from './oracles/catalogue.mjs';
import {compactPrivateProperties} from '../scripts/lib/compact-core.mjs';
import {transform} from 'lightningcss';
import {createHash} from 'node:crypto';
import {fourSearchTables,fourSearchPeriod,fourSearchSmallLimit,validateFourSearchPools,fourSearchRootScalars,fourSearchCoefficientScalars,fourSearchRootDeclarations} from '../src/core/four-search.mjs';
import {candidates,pools} from '../src/core/four-allocation.mjs';
import {fourScalars,fourDeclarations} from '../src/core/four-compiler.mjs';
import {layoutMembership,groupedLayoutTerms} from '../src/core/metadata.mjs';

// Evaluate only these generated arithmetic expressions, independently of the
// compiler's grouping/range decisions. Browser tests cover CSS computation.
const metadataValue=(expression,code)=>Function('calc','min','max','abs','clamp',`return (${expression.replaceAll('var(--gp-layout)',String(code))});`)(x=>x,Math.min,Math.max,Math.abs,(lo,x,hi)=>Math.max(lo,Math.min(x,hi)))+0; // Normalize JS signed zero.

test('layout membership preserves dense, sparse, empty and reordered catalogues without admitting gaps',()=>{
 for(const family of ['two','three','four']){
  const plans=layouts.filter(p=>p.family===family);
  for(const subset of [plans,[...plans].reverse(),plans.filter((_,i)=>i%2===0),plans.slice(0,1),[]]){
   const expression=layoutMembership(subset);
   for(const code of [-100,-1,...Array.from({length:104},(_,i)=>i),10003])assert.equal(metadataValue(expression,code),Number(subset.some(p=>p.code===code)),`${family}/${subset.length}/${code}`);
  }
 }
});

test('grouped layout coefficients preserve weighted lookup including zero and negative terms',()=>{
 for(const family of ['two','three','four']){
  const plans=layouts.filter(p=>p.family===family);
  for(const coefficient of [p=>p.weights[0]-1,p=>p.weights[1]-1,p=>p.weights.reduce((a,b)=>a+b,0)-p.weights.length,p=>p.weights[0]-4,p=>(p.wideWeights?.[0]??p.weights[0])-p.weights[0]]){
   const expression=groupedLayoutTerms(plans,coefficient);
   for(const code of [-1,...layouts.map(p=>p.code),10003])assert.equal(metadataValue(expression,code),plans.filter(p=>p.code===code).reduce((total,p)=>total+coefficient(p),0));
  }
 }
 assert.equal(metadataValue(groupedLayoutTerms([],()=>1),0),0);
});

test('periodic Four selection preserves independent allocations without imposing a count cutoff',()=>{
 assert.equal(fourSearchPeriod,24);assert.equal(fourSearchSmallLimit,16);
 assert.equal(fourScalars.length,129);
 assert.ok(!fourScalars.some(n=>/^c\d+(p\d|bad\d)$|^valid\d+$/.test(n)));
 for(const {order,policies} of fourSearchTables)for(const policy of ['closest','stronger']){
  const {regular,correction}=policies[policy],weights=order.map(group=>4-group);
  for(let count=0;count<=8192;count++){
   const phase=count%fourSearchPeriod,choice=regular[phase]+(count<fourSearchSmallLimit?correction[phase]:0);
   const expected=fourCounts(count,{weights,allocation:policy,traversal:'widest-first'});
   assert.deepEqual(choice?candidates(count,policy)[choice-1]:null,expected?.groups??null,`${count}/${policy}/${order}`);
  }
 }
 assert.doesNotThrow(()=>validateFourSearchPools(pools));
 const bad=structuredClone(pools);bad[0][0]=[-3,0,1,2];
 assert.throws(()=>validateFourSearchPools(bad),/proof assumptions/);
});

test('Four pair-only row identity preserves the independent LCM across accepted allocations',()=>{
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 const groups=['a','b','c','d'],pairs=[];
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)pairs.push([a,b]);
 const verify=ns=>{
  for(let omit=0;omit<4;omit++)assert.equal(ns.filter((_,i)=>i!==omit).reduce(gcd),1,`triple GCD: ${ns}`);
  const rows=ns.reduce((a,b)=>a*b,1)/pairs.reduce((out,[a,b])=>out*gcd(ns[a],ns[b]),1);
  assert.equal(Math.round(rows),ns.reduce((a,b)=>a*b/gcd(a,b),1),`LCM: ${ns}`);
 };
 verify([1,1,1,1]);
 for(let n=4;n<=512;n++)for(const exact of fourExactAllocations(n))verify(exact);
 for(const plan of layouts.filter(p=>p.family==='four'))for(const allocation of ['closest','stronger'])for(const traversal of ['left-to-right','widest-first'])for(let n=4;n<=2048;n++){
  const result=fourCounts(n,{weights:plan.weights,allocation,traversal});if(result)verify(result.groups);
 }
 const v=n=>`var(--_gp-f-${n})`,css=fourDeclarations();
 assert.ok(css.includes(`--_gp-f-rows:round(nearest,calc((${groups.map(v).join(' * ')}) / (${pairs.map(([a,b])=>v('g'+groups[a]+groups[b])).join(' * ')})),1);`));
 assert.equal(fourScalars.filter(n=>/^g[a-d]{2}(?:equal)?$/.test(n)).length,12);
 assert.ok(!fourScalars.some(n=>/^g[a-d]{3,4}(?:equal)?$/.test(n)));
});

test('Four parent caches are count-independent, non-inheriting metadata transferred only to participants',()=>{
 const css=generateCSS(),roots=fourSearchRootDeclarations();
 assert.equal(fourSearchCoefficientScalars.length,19);
 assert.ok(!/--_gp-(?:n|i)\b|sibling-(?:count|index)/.test(roots));
 for(const name of [...fourSearchRootScalars,...fourSearchCoefficientScalars])assert.ok(css.includes(`@property --_gp-f-${name} { syntax:"<number>"; inherits:false; initial-value:0; }`));
 for(const name of fourSearchRootScalars)assert.ok(!fourScalars.includes(name));
 for(const name of fourSearchCoefficientScalars){assert.ok(fourScalars.includes(name));assert.ok(css.includes(`--_gp-f-${name}:inherit;`));}
});

test('delivery compaction preserves public vocabulary and round-trips registrations, queries and values',async()=>{
 const source=generateCSS(),compact=compactPrivateProperties(source);
 assert.deepEqual(compact,compactPrivateProperties(source),'deterministic mapping');
 const inverse=Object.fromEntries(Object.entries(compact.properties).map(([name,short])=>[short,name]));
 assert.equal(new Set(Object.values(compact.properties)).size,Object.keys(compact.properties).length);
 assert.equal(compact.css.replace(/--_gp[0-9a-z]+\b/g,name=>inverse[name]),source);
 for(const pattern of [/--gp-[a-z0-9-]+/g,/--_gp-(?:tracks|measure-tracks|measure-ready)\b/g,/\.gp_[a-z0-9_-]+/g])assert.deepEqual(compact.css.match(pattern),source.match(pattern));
 assert.ok((compact.css.match(/--_gp-[a-z0-9-]+/g)??[]).every(name=>['--_gp-tracks','--_gp-measure-tracks','--_gp-measure-ready'].includes(name)));
 assert.throws(()=>compactPrivateProperties('--_gp0:0;--_gp-a:1;'),/collision/);
 const min=await readFile(new URL('../css/main.min.css',import.meta.url));
 assert.equal(min.toString().replace(/--_gp[0-9a-z]+\b/g,name=>inverse[name]),transform({filename:'next.css',code:Buffer.from(source),minify:true}).code.toString());
 const map=JSON.parse(await readFile(new URL('../css/private-names.json',import.meta.url),'utf8'));
 assert.deepEqual(map.properties,compact.properties);
 assert.equal(map.cssSha256,createHash('sha256').update(min).digest('hex'));
});

test('core inventory compiles all 102 reviewed selections',()=>{
 assert.equal(catalogue.length,102);assert.equal(layouts.length,102);
 assert.equal(new Set(catalogue.map(p=>p.id)).size,catalogue.length);
 assert.deepEqual(catalogue.filter(p=>p.family==='two').map(p=>p.weights),editorial.map(p=>p.weights));
 assert.deepEqual(catalogue.filter(p=>p.family==='three').map(p=>p.weights),threeEditorial.map(p=>p.weights));
 assert.deepEqual(catalogue.filter(p=>p.family==='four').map(p=>p.weights),four.map(p=>p.weights));
 assert.deepEqual(catalogue.filter(p=>p.family==='mosaic').map(p=>p.rects),mosaics.map(p=>p.rects));
 const css=generateCSS();
 for(const p of layouts){assert.ok(css.includes(`--gp-${p.id}:`));assert.ok(css.includes(`.gp_layout--${p.id}`));}
 assert.ok(catalogue.every(p=>p.status==='implemented')); 
});

test('core source compiler has no dependency on design experiments',async()=>{
 for(const name of (await readdir(new URL('../src/core/',import.meta.url))).filter(name=>name.endsWith('.mjs')))assert.ok(!(await readFile(new URL(`../src/core/${name}`,import.meta.url),'utf8')).match(/(?:from|import\()[^\n]*design\//));
});

test('filtered allocation matches the reviewed choices and removes shared internal boundaries',()=>{
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 for(const allocation of ['closest','stronger'])for(const fewer of ['left','right'])for(let count=2;count<=2048;count++){
  const counts=allocationCounts(count,{allocation,fewer});
  assert.deepEqual(counts,twoAllocation(count,{intent:allocation,fewer:fewer==='left'?'start':'end'}));
  assert.equal(gcd(...counts),1);
  for(const traversal of ['left-to-right','right-to-left']){
   const p=placements({id:'two-3-2',count,spacing:'neat',allocation,fewer,traversal});
   if(counts[0]*counts[1]>9998){assert.deepEqual(p,placements({id:'stack',count,spacing:'neat'}));continue;}
   assert.equal(p.filter(p=>p.start===2).length,counts[0]);
   const first=traversal==='left-to-right'?counts[0]:counts[1],firstStart=traversal==='left-to-right'?2:38;
   assert.ok(p.slice(0,first).every(p=>p.start===firstStart));assert.ok(p.slice(first).every(p=>p.start!==firstStart));
   assert.equal(p[0].row,1);assert.equal(p[first].row,1);
   assert.equal(p[first-1].row+p[first-1].rowspan,p.at(-1).row+p.at(-1).rowspan);
  }
 }
 assert.throws(()=>allocationCounts(6,{allocation:'balanced'}));
 assert.throws(()=>allocationCounts(6,{allocation:'moderate'}));
 assert.throws(()=>allocationCounts(6,{allocation:'strong'}));
});

test('automatic three-region allocation matches the accepted ranking independently of proportions and traversal',()=>{
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 for(let count=3;count<=2048;count++){
  const counts=threeRegionCounts(count);
  assert.deepEqual(counts,rankedAllocations(count)[0].counts);
  assert.equal(counts.reduce((a,b)=>a+b),count);assert.equal(gcd(counts[0],counts[1]),1);assert.equal(gcd(counts[1],counts[2]),1);
 }
 assert.deepEqual(threeRegionCounts(11),[4,3,4]);
 for(const count of [3,6,9,12,13,41])for(const traversal of ['left-to-right','center-first','right-to-left']){
  const p=placements({id:'three-1-2-1',count,spacing:'neat',traversal});
  const counts=threeRegionCounts(count),starts=[2,17,47];
  for(let slot=0;slot<3;slot++)assert.equal(p.filter(p=>p.start===starts[slot]).length,counts[slot]);
  const order=traversal==='center-first'?[1,0,2]:traversal==='right-to-left'&&count===3?[2,1,0]:[0,1,2];
  assert.deepEqual(p.map(p=>p.start),order.flatMap(slot=>Array(counts[slot]).fill(starts[slot])));
  assert.deepEqual(p,placements({id:'three-1-2-1',count,spacing:'neat',traversal,allocation:'stronger',fewer:'right'}));
 }
});

test('exact allocation accepts the valid pool and otherwise restores the automatic result',()=>{
 for(let count=3;count<=128;count++)for(const p of rankedAllocations(count)){
  const exact=p.counts;
  assert.equal(exactCountsEligible(count,exact),true);assert.deepEqual(threeRegionCounts(count,{exact}),exact);
  for(const mismatch of [count-1,count+1])if(mismatch>=3)assert.deepEqual(threeRegionCounts(mismatch,{exact}),threeRegionCounts(mismatch));
 }
 for(const exact of [null,[],[5,3],[5,3,0],[5,3,-1],[5,3,4.5],[2,4,6],[1,5,6],[1e20,3,4],[NaN,3,4],[Infinity,3,4]]){
  assert.equal(exactCountsEligible(12,exact),false);
  assert.deepEqual(threeRegionCounts(12,{exact}),threeRegionCounts(12));
 }
 assert.equal(exactCountsEligible(5,[1,1,3]),true);
 for(const traversal of ['left-to-right','center-first','right-to-left'])for(const spacing of Object.keys(spacingModes)){
  const exact=[5,3,4],p=placements({id:'three-1-2-1',count:12,spacing,traversal,exact});
  const starts=[...new Set(p.map(p=>p.start))].sort((a,b)=>a-b);
  assert.deepEqual(starts.map(start=>p.filter(p=>p.start===start).length),exact);
  assert.deepEqual(placements({id:'two-3-2',count:12,spacing,traversal,exact}),placements({id:'two-3-2',count:12,spacing,traversal}));
 }
});

test('three-region underfilled and feature-off sources retain the conservative full-field stack',()=>{
 for(const count of [0,1,2])assert.deepEqual(placements({id:'three-1-2-1',count,spacing:'neat'}),Array.from({length:count},(_,i)=>({start:2,span:60,row:i+1,rowspan:1})));
 assert.deepEqual(placements({id:'three-1-2-1',count:3,spacing:'thin',enhanced:false}),Array.from({length:3},(_,i)=>({start:2,span:59,row:i+1,rowspan:1})));
});

test('all implemented plans close fields and provide nonempty metadata on narrow rulers',()=>{
 for(const plan of layouts)for(const spacing of Object.keys(spacingModes))for(const tracks of [1,2,3,4,14,36,64])for(const count of [0,1,2,3,13]){
  const p=placements({id:plan.id,count,spacing,tracks});
  assert.equal(p.length,count);
  for(const r of p){assert.ok(r.start>=0&&r.start+r.span<=tracks);assert.ok(Number.isInteger(r.span)&&r.span>0);assert.ok(Number.isInteger(r.rowspan)&&r.rowspan>0);}
 }
});

test('approved two-region fallback is equal repeating pairs, with full-width singletons',()=>{
 assert.deepEqual(placements({id:'two-1-5',count:1,spacing:'neat',enhanced:false}),[{start:2,span:60,row:1,rowspan:1}]);
 assert.deepEqual(placements({id:'two-1-5',count:3,spacing:'neat',traversal:'right-to-left',enhanced:false}),[
  {start:2,span:30,row:1,rowspan:1},{start:32,span:30,row:1,rowspan:1},{start:2,span:30,row:2,rowspan:1},
 ]);
 assert.deepEqual(placements({id:'two-1-5',count:3,spacing:'wide',tracks:3,enhanced:false}).map(p=>p.span),[1,1,1]);
});

test('spanning arrangements exclude one item and reuse the two-region allocation with closed rows',()=>{
 for(const arrangement of ['first-above','last-below'])for(const allocation of ['closest','stronger'])for(const fewer of ['left','right'])for(const traversal of ['left-to-right','right-to-left'])for(let count=0;count<=128;count++){
  const state={id:'two-3-2',count,spacing:'neat',arrangement,allocation,fewer,traversal},p=placements(state);
  assert.equal(p.length,count);
  if(count<3){assert.ok(p.every(r=>r.start===2&&r.span===60));assert.deepEqual(p.map(r=>r.row),Array.from({length:count},(_,i)=>i+1));continue;}
  const above=arrangement==='first-above',span=above?p[0]:p.at(-1),supports=above?p.slice(1):p.slice(0,-1);
  const baseline=placements({...state,count:count-1,arrangement:'across'});
  assert.deepEqual(supports,baseline.map(r=>({...r,row:r.row+Number(above)})));
  assert.equal(span.start,2);assert.equal(span.span,60);assert.equal(span.rowspan,1);
  assert.equal(span.row,above?1:Math.max(...supports.map(r=>r.row+r.rowspan)));
 }
});

test('spanning supporting-pair exact requests validate N-1 and preserve source endpoints',()=>{
 assert.equal(pairExactCountsEligible(5,[1,4]),true);assert.equal(pairExactCountsEligible(5,[1,0,4]),true);
 for(const exact of [[2,4],[3,3],[1,7],[0,5],[1.5,3.5],[1,1,4],[1,0,3],[1e20,3]])assert.equal(pairExactCountsEligible(5,exact),false);
 for(const arrangement of ['first-above','last-below'])for(const traversal of ['left-to-right','right-to-left']){
  const state={id:'two-3-2',count:6,spacing:'neat',arrangement,traversal,exact:[1,4]},p=placements(state);
  const pair=arrangement==='first-above'?p.slice(1):p.slice(0,-1);
  assert.equal(pair.filter(r=>r.start===2).length,1);assert.equal(pair.filter(r=>r.start===38).length,4);
  assert.deepEqual(placements({...state,count:7}),placements({...state,count:7,exact:null}));
  assert.deepEqual(placements({...state,exact:[2,3]}),placements({...state,exact:null}));
  assert.deepEqual(placements({...state,arrangement:'across'}),placements({...state,arrangement:'across',exact:null}));
 }
});

test('spanning compatibility preserves the endpoint and uses source-order repeating supports',()=>{
 for(const arrangement of ['first-above','last-below']){
  const p=placements({id:'two-3-2',count:6,spacing:'neat',arrangement,traversal:'right-to-left',exact:[1,4],enhanced:false});
  const above=arrangement==='first-above',span=above?p[0]:p.at(-1),pair=above?p.slice(1):p.slice(0,-1);
  assert.deepEqual(pair.map(r=>r.start),[2,32,2,32,2]);
  assert.deepEqual(pair.map(r=>r.row),[1,1,2,2,3].map(n=>n+Number(above)));
  assert.deepEqual(span,{start:2,span:60,row:above?1:4,rowspan:1});
 }
});

test('both endpoints span while the N-2 middle items reuse pair geometry',()=>{
 for(const enhanced of [true,false])for(const traversal of ['left-to-right','right-to-left'])for(const allocation of ['closest','stronger'])for(const fewer of ['left','right'])for(let count=0;count<=128;count++){
  const state={id:'two-3-2',count,spacing:'neat',arrangement:'first-above-last-below',traversal,allocation,fewer,enhanced},p=placements(state);
  assert.equal(p.length,count);
  if(count<4){assert.deepEqual(p,placements({...state,id:'stack'}));continue;}
  const supports=p.slice(1,-1),baseline=placements({...state,count:count-2,arrangement:'across'});
  assert.deepEqual(supports,baseline.map(r=>({...r,row:r.row+1})));
  assert.deepEqual(p[0],{start:2,span:60,row:1,rowspan:1});
  assert.deepEqual(p.at(-1),{start:2,span:60,row:Math.max(...supports.map(r=>r.row+r.rowspan)),rowspan:1});
 }
 const state={id:'two-3-2',count:7,spacing:'neat',arrangement:'first-above-last-below',exact:[1,4]};
 const supports=placements(state).slice(1,-1);
 assert.equal(supports.filter(r=>r.start===2).length,1);
 assert.equal(supports.filter(r=>r.start===38).length,4);
 assert.deepEqual(placements({...state,count:6}),placements({...state,count:6,exact:null}));
});

test('candidate aliases select one typed property and keep activation out of geometry',()=>{
 const css=generateCSS();
 assert.match(css,/@property --gp-layout \{ syntax:"<integer>"; inherits:false/);
 for(const p of layouts)assert.ok(css.includes(`:where(.gp_md--${p.id}) { --gp-layout:var(--gp-${p.id}); }`));
 for(const property of ['--gp-arrangement','--gp-allocation','--gp-fewer','--gp-traversal','--gp-exact-count-left','--gp-exact-count-center','--gp-exact-count-center-left','--gp-exact-count-center-right','--gp-exact-count-right'])assert.ok(css.includes(`@property ${property} { syntax:"<integer>"; inherits:false`));
 for(const token of ['closest','stronger','left-to-right','right-to-left','center-first'])assert.ok(css.includes(`--gp-${token}:`));
 for(const old of ['balanced','moderate','strong'])assert.ok(!css.includes(`gp_allocation--${old})`));
 assert.ok(css.includes('@container style(--_gp-m-enabled:1)'));assert.ok(!css.includes('@container (')); assert.ok(!css.includes('1rem'));assert.ok(!css.includes('font-'));
});

test('core artifacts use canonical package paths while legacy stays explicit',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
 assert.equal(pkg.style,'css/main.css');
 assert.equal(pkg.exports['.'],'./css/main.css');
 assert.equal(pkg.exports['./css/main.layer.min.css'],'./css/main.layer.min.css');
 assert.ok(!Object.keys(pkg.exports).some(key=>key.includes('next')||key==='./inspector'||key==='./css/bands.css'));
 assert.equal(await readFile(new URL('../css/main.css',import.meta.url),'utf8'),generateCSS());
});

test('four-region library inventory, allocation and traversal match the independent enumeration oracle',()=>{
 for(const plan of layouts.filter(p=>p.family==='four'))for(const traversal of ['left-to-right','widest-first'])for(const allocation of ['closest','stronger'])for(let n=4;n<=100;n++){
  const id=plan.id==='four-1-1-1-1'?plan.id:plan.id.replace('four-','graded-');
  const expected=fourStudy(n,{plan:id,traversal,policy:allocation==='closest'?'balanced':'graduated'}),actual=fourCounts(n,{weights:plan.weights,traversal,allocation});
  assert.deepEqual(actual.groups,expected.groups);assert.equal(actual.rows,expected.rows);
  assert.ok(actual.physical.slice(1).every((n,i)=>{const gcd=(a,b)=>b?gcd(b,a%b):a;return gcd(actual.physical[i],n)===1;}));
 }
});

test('four-region exact requests are physical, complete, bounded and independent of traversal preference',()=>{
 for(let n=4;n<=13;n++){
  assert.deepEqual(fourExactAllocations(n),fourStudyExact(n));
  for(const exact of fourExactAllocations(n))for(const plan of layouts.filter(p=>p.family==='four'))for(const traversal of ['left-to-right','widest-first']){
   const result=fourCounts(n,{weights:plan.weights,traversal,exact});assert.deepEqual(result.physical,exact);assert.equal(result.exact,true);
   assert.deepEqual(fourCounts(n,{weights:plan.weights,traversal,exact,allocation:'stronger'}),result);
  }
 }
 for(const exact of [[2,2,3,5],[3,3,3,3],[1,1,1,9],[0,3,4,5],[1.5,2.5,3,5],[1e20,1,1,1],[2,3,null,3],[2,3,4,4]])assert.equal(fourExactCountsEligible(12,exact),false);
});

test('four-region geometry closes inherited rulers, retains wide adjustment and stacks conservatively',()=>{
 for(const plan of layouts.filter(p=>p.family==='four'))for(const count of [0,1,2,3,4,7,12,13])for(const spacing of Object.keys(spacingModes))for(const tracks of [1,3,4,14,36,64])for(const traversal of ['left-to-right','widest-first']){
  const state={id:plan.id,count,spacing,tracks,traversal},p=placements(state),mode=spacingModes[spacing],inset=Math.min(mode[0],tracks-1),tail=Math.min(mode[1],tracks-inset-1),usable=tracks-inset-tail;
  assert.equal(p.length,count);assert.ok(p.every(r=>r.span>=1&&r.start>=inset&&r.start+r.span<=tracks-tail&&r.row>=1&&r.rowspan>=1));
  if(count<4||usable<4){assert.deepEqual(p.map(r=>r.span),Array(count).fill(usable));continue;}
  assert.ok(placements({...state,enhanced:false}).every(r=>r.span===usable));
  // Ruled field rounding has dedicated assertions below.
  if(spacing==='ruled')continue;
  const id=plan.id==='four-1-1-1-1'?plan.id:plan.id.replace('four-','graded-'),regions=fourPositions(id,{tracks,spacing,traversal}),counts=fourStudy(count,{plan:id,traversal});let i=0;
  for(let g=0;g<4;g++)for(let k=0;k<counts.groups[g];k++)assert.deepEqual(p[i++],{start:regions[g].start,span:regions[g].span,row:1+k*counts.rows/counts.groups[g],rowspan:counts.rows/counts.groups[g]});
  assert.ok(placements({...state,enhanced:false}).every(r=>r.span===usable));
 }
});

test('mosaic maps retain reviewed fields, rows and exact count/spacing safeguards',()=>{
 for(const plan of layouts.filter(p=>p.family==='mosaic'))for(const spacing of ['neat','thin']){
  const expected=mosaics.find(p=>p.count===plan.count);
  const items=placements({id:plan.id,count:plan.count,spacing});
  items.forEach((item,i)=>{
   const [a,b,y,end]=expected.rects[i],field=spacing==='thin'?59:60,start=2+Math.round(a*field/plan.basis)+(spacing==='thin'&&a>0?1:0);
   assert.deepEqual(item,{start,span:2+Math.round(b*field/plan.basis)-start,row:y+1,rowspan:end-y,gutterBits:spacing==='thin'&&y>0?1:0});
  });
  assert.deepEqual(placements({id:plan.id,count:plan.count,spacing,measured:false}),items,'measurement does not affect map eligibility');
  for(const count of [0,plan.count-1,plan.count+1])assert.deepEqual(placements({id:plan.id,count,spacing}),placements({id:'stack',count,spacing}));
  for(const changed of [{spacing:'full'},{spacing:'wide'},{spacing:'ruled'},{enhanced:false}]){
   const state={id:plan.id,count:plan.count,spacing,...changed};assert.deepEqual(placements(state),placements({...state,id:'stack'}));
  }
  for(const tracks of [1,3,8,14,24,30,36,64]){
   const p=placements({id:plan.id,count:plan.count,spacing,tracks});assert.ok(p.every(r=>r.span>=1&&r.start>=0&&r.start+r.span<=tracks));
  }
 }
});

test('captured lengths remain opt-in while mosaics add no width floors or root row defaults',()=>{
 assert.ok(catalogue.filter(p=>p.family==='mosaic').every(p=>!('minRem' in p)));
 const css=generateCSS();
 assert.match(css,/@property --gp-ruler-bit \{ syntax:"<length>"; inherits:true/);
 assert.ok(css.includes('.gp_ruler.gp_ruler--measure'));
 assert.ok(css.includes('--gp-ruler-bit:calc(100cqi / var(--_gp-measure-tracks))'));
 assert.ok(!css.includes('grid-template-rows:'));assert.ok(!css.includes('grid-auto-rows:'));assert.ok(!css.includes('row-gap:'));
 assert.ok(!css.includes('min-width:64rem) {\n:where(.gp_layout--mosaic'));
});

test('hybrid controls share the layout hinge scale and preserve non-inheriting exact inputs',()=>{
 const css=generateCSS();
 for(const [,prefix] of hinges) {
  for(const [family,options] of Object.entries(controlPolicies))for(const [name,code] of Object.entries(options))assert.ok(css.includes(`:where(.gp_${prefix}-${family}--${name}) { --gp-${family}:${code}; }`));
  for(const region of exactCountRegions)assert.ok(css.includes(`@property --gp-${prefix}-exact-count-${region} { syntax:"*"; inherits:false; }`));
 }
 assert.ok(css.includes('var(--gp-md-exact-count-left,var(--gp-sm-exact-count-left,var(--gp-xs-exact-count-left,var(--gp-exact-count-left))))'));
 assert.ok(!css.includes('!important'));
});

test('viewport spacing aliases select all spacing metadata together at the shared hinges',()=>{
 const css=generateCSS();
 for(const [,prefix] of hinges)for(const [name,[a,b,gap]] of Object.entries(spacingModes))assert.ok(css.includes(`:where(.gp_${prefix}-spacing--${name}) { --_gp-inset-start:${a}; --_gp-inset-end:${b}; --_gp-gutter:${gap}; --_gp-f-wide:${['wide','ruled'].includes(name)?1:0}; --_gp-m-space:${name==='neat'?1:name==='thin'?2:0}; --_gp-ruled:${name==='ruled'?1:0}; }`));
});

test('Ruled fields use 56 whole bits and preserve wide-family rounding without enabling mosaics',()=>{
 assert.deepEqual(spacingModes.ruled,[4,4,2]);
 assert.deepEqual(placements({id:'two-1-1',count:2,spacing:'ruled'}).map(({start,span})=>({start,span})),[{start:4,span:27},{start:33,span:27}]);
 assert.deepEqual(placements({id:'four-9-8-7-6',count:4,spacing:'ruled'}).map(({start,span})=>({start,span})),[{start:4,span:15},{start:21,span:14},{start:37,span:11},{start:50,span:10}]);
 for(const plan of layouts.filter(p=>p.family==='mosaic'))assert.deepEqual(placements({id:plan.id,count:plan.count,spacing:'ruled'}),placements({id:'stack',count:plan.count,spacing:'ruled'}));
});

test('column rules use explicit measured ownership and non-inheriting conditional metadata',()=>{
 const css=generateCSS();
 for(const name of ['rule-position','rule-start-visible','rule-end-visible'])assert.ok(css.includes(`@property --_gp-${name} { syntax:"<number>"; inherits:false; initial-value:0; }`));
 assert.ok(css.includes('@container style(--_gp-ruled:1) and style(--_gp-measure-ready:1)'));
 assert.ok(css.includes('clamp(0,calc(var(--_gp-gap) - 1),1)'));
 assert.ok(css.includes('var(--gp-rule-color,currentColor)'));assert.ok(css.includes('var(--gp-rule-width,1px)'));
 assert.ok(css.indexOf('content:none; position:absolute')<css.indexOf('@container style(--_gp-rule-start-visible:1)'));
});

test('Stack/Peers fast path cancels unused arithmetic without replacing the compatibility path',()=>{
 const css=generateCSS(),gate=css.indexOf('@container style(--_gp-simple:1)');
 assert.ok(gate>css.indexOf('--_gp-f-q:round('));
 assert.ok(css.includes('@property --_gp-simple { syntax:"<number>"; inherits:false; initial-value:0; }'));
 assert.match(css.slice(gate),/--_gp-f-q:initial;/);assert.match(css.slice(gate),/--_gp-t-rows:initial;/);assert.match(css.slice(gate),/--_gp-p-exact-valid:initial;/);
 assert.ok(css.includes('--_gp-simple:calc(1 - min(1,calc(var(--_gp-two) + var(--_gp-three) + var(--_gp-four) + var(--_gp-m-count))))'));
});

test('dormant exact bypass cancels validation only and preserves its compatibility expressions',()=>{
 const css=generateCSS(),rule=dormantExactCancellationRules();
 assert.equal(exactValidationScalars.length,26);
 assert.ok(css.indexOf(rule)>css.indexOf('--_gp-f-exact-valid:calc('));
 for(const name of exactValidationScalars){
  assert.ok(css.includes(`@property --_gp-${name} { syntax:"<number>"; inherits:false; initial-value:0; }`));
  assert.ok(rule.includes(`--_gp-${name}:initial;`));
 }
 for(const name of ['f-q','f-rows','f-a','p-a','t-a'])assert.ok(!rule.includes(`--_gp-${name}:`));
 assert.ok(css.includes('--_gp-exact-l:var(--_gp-selected-exact-left)'));
});

test('mosaic dispatch selects fixed maps through the resolved public token without unrelated allocation work',()=>{
 const css=generateCSS();
 for(const plan of layouts.filter(p=>p.family==='mosaic'))assert.ok(css.includes(`@container style(--_gp-m-enabled:1) and style(--gp-layout:${plan.code})`));
 assert.ok(css.includes('--_gp-m-basis:10;'));assert.ok(css.includes('--_gp-m-basis:12;'));
 const at=css.lastIndexOf('@container style(--_gp-m-enabled:1)');
 assert.match(css.slice(at),/--_gp-f-q:initial;/);assert.match(css.slice(at),/--_gp-t-rows:initial;/);
 assert.ok(!css.includes('--_gp-m-margin'));
 assert.ok(css.includes('margin-block-start:calc(var(--_gp-m-thin) * min(1,var(--_gp-m-y)) * 100% / var(--_gp-tracks));'));
 assert.ok(!css.includes("var(--_gp-m-thin) * var(--_gp-measure-ready)"));
});


test('vertical spacing amounts and viewport overrides follow mosaic defaults at zero specificity',()=>{
 const css=generateCSS();
 assert.ok(css.lastIndexOf('/* Vertical item spacing;')>css.lastIndexOf('@container style(--_gp-m-enabled:1)'));
 for(const prefix of ['',...hinges.map(([,p])=>p)])for(const bits of [0,1,2]){
  assert.ok(css.includes(`:where(.gp_${prefix?prefix+'-':''}vertical-spacing--${bits} > *) { margin-block-start:`));
 }
 assert.ok(css.includes('* 200% / var(--_gp-tracks)'));
 assert.ok(!css.includes('@property --gp-vertical-spacing'));
});
