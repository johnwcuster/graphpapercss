// Selective compilation shared by build tooling and the configurator worker.
// Full distribution generation is unchanged.
import {layouts,hinges,spacingModes} from './catalogue.mjs';
import {generateCSS} from './compiler.mjs';
import {sharedRulerProperties} from './compact.mjs';

const privateName=/--_gp-[a-z0-9-]+/g;
const registration=/@property\s+(--[a-z0-9_-]+)\s*\{[^{}]*\}/g;
const declaration=/(--[a-z0-9_-]+)\s*:\s*([^;{}]+);/g;
// This pass accepts our generated dialect only, not arbitrary author CSS.
// Keep all public declarations and shared ruler metadata. Seed dependencies
// from real CSS declarations/selectors (including style queries), then follow
// every possible definition of each private property, across all scopes.
export function prunePrivateDeclarations(css){
 const body=css.replace(registration,'');
 const definitions=new Map(),live=new Set(sharedRulerProperties);
 const references=value=>value.match(privateName)??[];
 const uses=body.replace(declaration,(whole,name,value)=>{
  if(!name.startsWith('--_gp-'))return whole;
  definitions.set(name,[...(definitions.get(name)??[]),...references(value)]);
  return '';
 });
 references(uses).forEach(name=>live.add(name));
 const queue=[...live];
 for(let i=0;i<queue.length;i++)for(const dependency of definitions.get(queue[i])??[]){
  if(!live.has(dependency)){live.add(dependency);queue.push(dependency);}
 }
 return css.replace(registration,(whole,name)=>name.startsWith('--_gp-')&&!live.has(name)?'':whole)
  .replace(declaration,(whole,name)=>name.startsWith('--_gp-')&&!live.has(name)?'':whole);
}

function selected(values,available,label){
 if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length)throw Error(`Expected unique nonempty ${label}`);
 for(const value of values)if(!available.includes(value))throw Error(`Unknown ${label}: ${value}`);
 return new Set(values);
}
export function compileSelection(options={}){
 const ids=selected(options.layouts??layouts.map(p=>p.id),layouts.map(p=>p.id),'layouts');
 // Stack is the implicit initial value and is always available as a safeguard.
 ids.add('stack');
 const steps=options.hinges??hinges.map(([rem])=>rem);
 if(!Array.isArray(steps)||new Set(steps).size!==steps.length||steps.some(rem=>!hinges.some(([r])=>r===rem)))throw Error('Unknown or duplicate viewport hinges');
 const spaces=selected(options.spacing??Object.keys(spacingModes),Object.keys(spacingModes),'spacing modes');
 for(const key of ['padding','verticalSpacing'])if(options[key]!==undefined&&typeof options[key]!=='boolean')throw Error(`Expected boolean ${key}`);
 const normalized={layouts:layouts.filter(p=>ids.has(p.id)),hinges:hinges.filter(([rem])=>steps.includes(rem)),spacingModes:Object.fromEntries(Object.entries(spacingModes).filter(([name])=>spaces.has(name))),padding:options.padding??true,verticalSpacing:options.verticalSpacing??true};
 const generated=generateCSS(normalized);
 return {css:options.prune===false?generated:prunePrivateDeclarations(generated),
  selection:{layouts:normalized.layouts.map(p=>p.id),hinges:normalized.hinges.map(([rem])=>rem),spacing:Object.keys(normalized.spacingModes),padding:normalized.padding,verticalSpacing:normalized.verticalSpacing}};
}

