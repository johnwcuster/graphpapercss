import {geometry} from './catalogue-data.mjs';
export const hinges=[[30,'xs'],[40,'sm'],[48,'md'],[64,'lg'],[80,'xl'],[96,'2xl']];
export const spacingModes={full:[0,0,0],neat:[2,2,0],thin:[2,3,1],wide:[3,3,2],ruled:[4,4,2]};
// Only implemented entries receive codes, tokens, and responsive aliases.
// Staged inventory is review data, never a silently stacking public selection.
export const catalogue=[
 {id:'stack',family:'stack',status:'implemented'},
 ...[2,3,4,5,6].map(columns=>({id:`peers-${columns}`,family:'peers',columns,status:'implemented'})),
 ...geometry.two.map(p=>({...p,family:'two',status:'implemented',arrangements:['across','first-above','last-below','first-above-last-below']})),
 ...geometry.three.map(p=>({...p,family:'three',status:'implemented',arrangements:['across'],gate:'Release and compatibility validation.'})),
 ...geometry.four.map(p=>({...p,family:'four',status:'implemented',allocationModes:['automatic','exact-physical'],arrangements:['across'],gate:'Release, browser, and performance validation.'})),
 ...geometry.mosaics.map(p=>({...p,family:'mosaic',status:'implemented',rowTracks:12,supportedSpacing:['neat','thin'],arrangements:['mapped'],thinVerticalGutter:'one assigned-track ruler bit on placements below the top row; no measurement required',gate:'Release, browser, seam, and performance validation; width policy deferred.'})),
];
export const layouts=catalogue.filter(p=>p.status==='implemented').map((p,code)=>({...p,code}));
export const allocationPolicies={closest:0,stronger:1};
export const directionPolicies={left:0,right:1};
export const traversalPolicies={'left-to-right':0,'right-to-left':1,'center-first':2,'widest-first':3};

export const arrangementPolicies={across:0,'first-above':1,'last-below':2,'first-above-last-below':3};

// Shared by compiler and authoring tools; these names select existing mechanics.
export const controlPolicies={allocation:allocationPolicies,fewer:directionPolicies,traversal:traversalPolicies,arrangement:arrangementPolicies};
export const exactCountRegions=['left','center','center-left','center-right','right'];
