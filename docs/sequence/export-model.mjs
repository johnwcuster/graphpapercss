import {resolvedSteps,sequenceClasses,itemSpacingClasses,candidateInlineStyle,candidateMarkup,thresholds,arrangements} from './model.mjs';
import {spacingModes} from '../assets/graph-paper/src/core/catalogue.mjs';

// Derive the compiler requirements from the same classes and properties used
// by HTML export. An inherited transition with no emitted override costs no CSS.
export function exportSelection(state){
 const steps=resolvedSteps(state),classes=[...sequenceClasses(state),...itemSpacingClasses(state)],inline=candidateInlineStyle(state);
 const ids=new Set(['stack',...steps.map(s=>s.layout)]),spaces=new Set(steps.map(s=>s.spacing));
 return {
  layouts:arrangements.filter(p=>ids.has(p.id)).map(p=>p.id),
  hinges:thresholds.filter(({prefix})=>classes.some(c=>c.startsWith(`gp_${prefix}--`)||c.startsWith(`gp_${prefix}-`))||inline.includes(`--gp-${prefix}-`)).map(t=>t.rem),
  spacing:Object.keys(spacingModes).filter(name=>spaces.has(name)),
  padding:itemSpacingClasses(state).length>0,
  verticalSpacing:classes.some(c=>c.includes('vertical-spacing--')),
 };
}
export const exportKey=state=>JSON.stringify(exportSelection(state));
export const cssFilename=format=>format==='minified'?'graph-paper-custom.min.css':'graph-paper-custom.css';
export function downloadableHTML(state,format='readable'){
 return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Graph Paper composition</title>\n  <link rel="stylesheet" href="./${cssFilename(format)}">\n</head>\n<body>\n${candidateMarkup(state)}\n</body>\n</html>\n`;
}
