export const cases=[
 {key:'stack',label:'Stack · six records',id:'stack',count:6},
 {key:'peers',label:'Peers · three across, eight records',id:'peers-3',count:8},
 {key:'two',label:'Two regions · six records',id:'two-3-2',count:6,allocation:'stronger'},
 {key:'three',label:'Three regions · six records',id:'three-1-2-1',count:6},
 {key:'four',label:'Four regions · thirteen records',id:'four-6-5-4-3',count:13},
 {key:'first',label:'First above · six records',id:'two-3-2',count:6,arrangement:'first-above'},
 {key:'last',label:'Last below · six records',id:'two-3-2',count:6,arrangement:'last-below'},
 {key:'both',label:'First above and last below · seven records',id:'two-3-2',count:7,arrangement:'first-above-last-below'},
 {key:'mosaic6',label:'Mosaic · six records',id:'mosaic-6',count:6},
 {key:'mosaic13',label:'Mosaic · thirteen records',id:'mosaic-13',count:13},
];
export {verticalSpacingCSS as utilityCSS} from '../../../src/core/vertical-spacing.mjs';
export const hostCSS=`*{box-sizing:border-box}body{margin:0;font:16px/1.4 system-ui;color:#182e2b;background:#fff}:where(.record){margin:0}.record{min-width:0;overflow-wrap:anywhere;background:#deebe7}.record:nth-child(4n+2){background:#f0d3b5}.record:nth-child(4n+3){background:#d3ddf0}.record:nth-child(4n){background:#ebd3e2}.record h2{font-size:20px;line-height:1.2;margin:0}.record p{margin:0}.record a{color:inherit}.record figure{margin:0}.record img{display:block;width:100%;height:auto}.record figcaption{font-size:12px}.record footer{font-size:12px}.number{font-weight:700}.bounds .record{outline:1px solid #385b59;outline-offset:-1px}:focus-visible{outline:3px solid #a32a0d;outline-offset:-3px}`;
export function records(count,{padding=false,density='varied'}={}){return Array.from({length:count},(_,i)=>`<article class="record${padding?' gp_pad':''}"><h2><a href="#record-${i+1}">Record ${i+1}</a></h2><p>${'Content of differing lengths makes the shared row relationships visible. '.repeat(density==='equal'?2:1+i%3)}</p></article>`).join('');}
export function fixture(c,{width=1200,spacing='neat',context='standalone',amount=null,padding=false,content=null,classes='',key='one'}={}){
 const map=`<section data-map data-key="${key}" class="gp_layout--${c.id} gp_spacing--${spacing} gp_allocation--${c.allocation??'closest'} gp_arrangement--${c.arrangement??'across'} ${amount===null?'':`gp_vertical-spacing--${amount}`} ${classes}">${content??records(c.count,{padding})}</section>`;
 if(context==='standalone')return `<div class="gp_ruler" style="width:${width}px">${map}</div>`;
 return `<div class="gp_ruler" style="width:${width}px"><section class="gp_layout--two-1-1 gp_spacing--neat"><article class="gp_continue_tracks">${context==='rebased'?`<div class="gp_rebase_64">${map}</div>`:map}</article><aside></aside></section></div>`;
}
