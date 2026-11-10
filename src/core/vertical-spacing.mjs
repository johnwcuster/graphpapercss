import {enhancementCondition} from './features.mjs';
import {hinges} from './catalogue.mjs';
export const verticalSpacingClass=(bits,prefix='')=>`gp_${prefix?`${prefix}-`:''}vertical-spacing--${bits}`;
const rules=prefix=>[0,1,2].map(bits=>`:where(.${verticalSpacingClass(bits,prefix)} > *) { margin-block-start:${bits?`calc(clamp(0,calc(var(--_gp-row) - 1),1) * ${bits*100}% / var(--_gp-tracks))`:'0'}; }`).join('\n');
// After default mosaic margins: explicit amounts override them at zero specificity.
// Omitted classes preserve ordinary host spacing and Neat/Thin mosaic defaults.
export const generateVerticalSpacingCSS=(steps=hinges)=>`/* Vertical item spacing; independent of field gutters and padding. */\n@supports ${enhancementCondition} {\n${rules('')}\n${steps.map(([rem,prefix])=>`@media(min-width:${rem}rem) {\n${rules(prefix)}\n}`).join('\n')}\n}\n`;
export const verticalSpacingCSS=generateVerticalSpacingCSS();
