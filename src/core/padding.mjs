import {hinges} from './catalogue.mjs';
// Content padding resolves against assigned tracks, without length capture.
export const paddingClasses = {0:'gp_pad--0',1:'gp_pad',2:'gp_pad--2'};
export const paddingClass = (bits,prefix='') => prefix ? `gp_${prefix}-pad--${bits}` : paddingClasses[bits];
const rules = prefix => Object.keys(paddingClasses).map(bits=>
  `:where(.${paddingClass(bits,prefix)}) { padding:${Number(bits) ? `calc(${Number(bits)*100}% / var(--_gp-tracks))` : '0'}; }`
).join('\n');
export const allPaddingClasses = ['',...hinges.map(([,prefix])=>prefix)].flatMap(prefix=>Object.keys(paddingClasses).map(bits=>paddingClass(bits,prefix)));
export const paddingCSS = [rules(''),...hinges.map(([rem,prefix])=>`@media(min-width:${rem}rem) {\n${rules(prefix)}\n}`)].join('\n');
