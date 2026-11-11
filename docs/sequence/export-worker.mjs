import {compileSelection} from '../assets/graph-paper/src/core/selection.mjs';
import {minifyGeneratedCSS} from '../assets/graph-paper/src/core/compact.mjs';
import {version} from '../assets/graph-paper/build-info.mjs';

self.onmessage=({data})=>{
 const {request,key,options}=data??{};
 try{
  const {css,selection}=compileSelection(options);
  const banner=`/* Graph Paper CSS ${version} — custom build. MIT license.\n * Layouts: ${selection.layouts.join(', ')}.\n * Viewport steps: ${selection.hinges.length?selection.hinges.map(n=>`${n}rem`).join(', '):'base only'}.\n * Gutters: ${selection.spacing.join(', ')}. Padding: ${selection.padding?'included':'omitted'}. Vertical spacing: ${selection.verticalSpacing?'included':'layout defaults'}. Column rules: ${selection.columnRules?'bundled':'omitted'}.\n * Load this stylesheet on its own; rebuild when adding selections.\n */\n`;
  self.postMessage({request,key,ok:true,version,selection,readable:banner+css,minified:banner+minifyGeneratedCSS(css)+'\n'});
 }catch{
  self.postMessage({request,key,ok:false});
 }
};
