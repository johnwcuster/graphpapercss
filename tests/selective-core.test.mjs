import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileSelection,prunePrivateDeclarations,selectiveProfiles} from '../scripts/lib/selective-core.mjs';
import {layouts} from '../src/core/catalogue.mjs';
import {generateCSS} from '../src/core/compiler.mjs';

test('experimental selective compiler preserves the exact canonical full build and stable layout codes',()=>{
 const full=readFileSync(new URL('../css/main.css',import.meta.url),'utf8');
 assert.equal(generateCSS(),full);
 assert.equal(compileSelection().css,full);
 for(const options of Object.values(selectiveProfiles)){
  const {css,selection}=compileSelection(options);
  for(const id of selection.layouts){
   assert.ok(css.includes(`--gp-${id}:${layouts.find(p=>p.id===id).code};`),id);
  }
 }
});
test('selective builds omit whole unselected engines and viewport aliases without renumbering tokens',()=>{
 const {css}=compileSelection(selectiveProfiles['one-composition']);
 assert.ok(css.includes('.gp_md--two-3-2'));
 assert.ok(!css.includes('.gp_sm--'));
 assert.ok(!css.includes('.gp_spacing--wide'));
 assert.ok(!css.includes('--_gp-f-choice:'));
 assert.ok(!css.includes('@property --_gp-f-choice'));
 assert.ok(!css.includes('--_gp-m-x:'));
 assert.ok(!css.includes('.gp_rule--'));
 assert.ok(css.includes('--_gp-row-safe:'));
 assert.ok(css.includes('--_gp-t-exact-valid:'));
 const minimal=compileSelection({layouts:['peers-2'],hinges:[],padding:false,verticalSpacing:false}).css;
 assert.ok(!minimal.includes('.gp_pad'));
 assert.ok(!minimal.includes('.gp_vertical-spacing'));
 assert.ok(!minimal.includes('--_gp-p-exact-valid:'));
 assert.ok(!minimal.includes('--_gp-t-exact-valid:'));
});
test('selection input rejects unknown values and keeps the implicit stack safeguard',()=>{
 for(const options of [{layouts:['oops']},{hinges:[42]},{hinges:[48,48]},{spacing:['oops']},{padding:'yes'},{verticalSpacing:1}])assert.throws(()=>compileSelection(options));
 assert.deepEqual(compileSelection({layouts:['peers-2'],hinges:[]}).selection.layouts,['stack','peers-2']);
});
test('private dependency pruning retains scoped alternatives, fallbacks, style-query inputs and shared tracks',()=>{
 const css=`@property --_gp-dead { syntax:"<number>"; inherits:false; initial-value:0; }
 :where(.a){--_gp-dead:1;--_gp-a:var(--_gp-b, var(--_gp-c));--_gp-b:2;--_gp-c:3;width:calc(var(--_gp-a) * 1px);}
 @media(min-width:48rem){:where(.a){--_gp-b:var(--_gp-d);--_gp-d:4;}}
 @container style(--_gp-flag:1){:where(.a){--_gp-flag:1;}}
 :where(.a){--_gp-tracks:64;--gp-example:var(--_gp-public-dependency);--_gp-public-dependency:2;}`;
 const pruned=prunePrivateDeclarations(css);
 assert.ok(!pruned.includes('--_gp-dead'));
 for(const name of ['a','b','c','d','flag','tracks','public-dependency'])assert.ok(pruned.includes(`--_gp-${name}:`),name);
 assert.equal(prunePrivateDeclarations(pruned),pruned);
});
