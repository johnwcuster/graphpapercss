import {enhancementCondition} from './features.mjs';
import {variable as v} from './expressions.mjs';

// Non-inheriting owner metadata. Ordinary content does not acquire rule work.
export const ruleScalars=['rule-position','rule-start-visible','rule-end-visible'];
export function ruleDeclarations(enhancementCondition){return `
 @container style(--_gp-ruled:1) and style(--_gp-measure-ready:1) {
  :where(.gp_rule--start,.gp_rule--end) {
   --_gp-rule-position:calc(${v('inset')} + ${v('repeat-active')} * (${v('repeat-start')} + ${v('slot')} * ${v('gap')}));
   @supports ${enhancementCondition} { --_gp-rule-position:${v('start')}; }
   --_gp-rule-start-visible:calc(clamp(0,calc(${v('gap')} - 1),1) * clamp(0,calc(${v('rule-position')} - ${v('inset')}),1));
   --_gp-rule-end-visible:calc(clamp(0,calc(${v('gap')} - 1),1) * clamp(0,calc(${v('inset')} + ${v('usable')} - ${v('rule-position')} - var(--_gp-tracks)),1));
  }
 }
 @container style(--_gp-rule-start-visible:1) {
  :where(.gp_rule--start)::before { content:""; }
 }
 @container style(--_gp-rule-end-visible:1) {
  :where(.gp_rule--end)::after { content:""; }
 }
`;}

export function ruleDecoration(){return `
:where(.gp_rule--start,.gp_rule--end) { position:relative; }
:where(.gp_rule--start)::before, :where(.gp_rule--end)::after {
 content:none; position:absolute; inset-block:0; width:0; padding:0;
 border:0 solid transparent; pointer-events:none;
 background-image:linear-gradient(var(--gp-rule-color,currentColor),var(--gp-rule-color,currentColor));
 background-size:var(--gp-rule-width,1px) 100%; background-repeat:no-repeat;
 background-origin:border-box; background-clip:border-box;
}
/* Transparent inherited side borders let translation cancel the owner's
   border offset. Padding supplies the painted width under either box sizing. */
:where(.gp_rule--start)::before {
 border-left-width:inherit; border-left-style:inherit; padding-left:var(--gp-rule-width,1px);
 left:calc(-1 * var(--gp-ruler-bit));
 background-position:left top; translate:calc(-100% + var(--gp-rule-width,1px) / 2) 0;
}
:where(.gp_rule--end)::after {
 border-right-width:inherit; border-right-style:inherit; padding-right:var(--gp-rule-width,1px);
 right:calc(-1 * var(--gp-ruler-bit));
 background-position:right top; translate:calc(100% - var(--gp-rule-width,1px) / 2) 0;
}
`;}

// Standalone extension: consumes the stable rule-interface metadata from core.
// No generated layout selectors or build-specific compact property names.
export function generateColumnRulesCSS(){
 return '/* Graph Paper column-rules extension. MIT license. Requires a matching-version Graph Paper core build. */\n'
  +ruleScalars.map(n=>`@property --_gp-${n} { syntax:"<number>"; inherits:false; initial-value:0; }`).join('\n')
  +ruleDecoration()+ruleDeclarations(enhancementCondition);
}
