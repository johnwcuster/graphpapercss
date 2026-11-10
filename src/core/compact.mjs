// Delivery-only names. Public inputs/tokens and shared ruler metadata stay
// verbatim. The mapping is build-specific, not author API. Browser-safe.
export const sharedRulerProperties=new Set(['--_gp-tracks','--_gp-measure-tracks','--_gp-measure-ready']);
export function compactPrivateProperties(css){
 if(/--_gp[0-9a-z]+\b/.test(css))throw Error('reserved compact-name namespace collision');
 const names=[...new Set(css.match(/--_gp-[a-z0-9-]+/g)??[])].filter(name=>!sharedRulerProperties.has(name)).sort();
 const properties=Object.fromEntries(names.map((name,i)=>[name,`--_gp${i.toString(36)}`]));
 const compact=css.replace(/--_gp-[a-z0-9-]+/g,name=>properties[name]??name);
 const inverse=Object.fromEntries(Object.entries(properties).map(([name,short])=>[short,name]));
 if(compact.replace(/--_gp[0-9a-z]+\b/g,name=>inverse[name])!==css)throw Error('private-name round trip');
 return {css:compact,properties};
}

// Conservative minification for generated CSS only. Preserve whitespace around
// calc + and - operators and selector combinators. No parsing/lowering or
// browser-specific rewrites; CLI distributions still use Lightning CSS.
export function minifyGeneratedCSS(css){
 if(css.includes('\0'))throw Error('Unexpected NUL in generated CSS');
 const strings=[];
 const protectedCSS=compactPrivateProperties(css).css.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,value=>{
  if(value.startsWith('/*'))return '';
  strings.push(value);return `\0${strings.length-1}\0`;
 });
 return protectedCSS.replace(/\s+/g,' ').replace(/\s*([{};,])\s*/g,'$1').replace(/:\s+/g,':').replace(/;}/g,'}').trim()
  .replace(/\0(\d+)\0/g,(_,i)=>strings[Number(i)]);
}
