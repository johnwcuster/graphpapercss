export {compileSelection,prunePrivateDeclarations} from '../../src/core/selection.mjs';
import {layouts} from '../../src/core/catalogue.mjs';

export const selectiveProfiles={
 'one-composition':{layouts:['stack','two-3-2','three-1-2-1'],hinges:[48,64],spacing:['neat'],padding:true,verticalSpacing:true},
 'small-site':{layouts:['stack','peers-2','peers-3','two-1-3','two-3-2','three-1-2-1','three-2-1-1'],hinges:[40,48,64,80],spacing:['neat','thin','wide'],padding:true,verticalSpacing:true},
 'without-four-mosaic':{layouts:layouts.filter(p=>!['four','mosaic'].includes(p.family)).map(p=>p.id)},
 'repeating':{layouts:layouts.filter(p=>['stack','peers'].includes(p.family)).map(p=>p.id)},
 'four-and-mosaic':{layouts:['stack','four-6-5-4-3','mosaic-8','mosaic-13'],hinges:[64,80],spacing:['neat','thin']},
 'full':{},
};
