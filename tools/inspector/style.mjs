// Optional authoring UI, isolated from the host page in a shadow root.
export const styles = `
:host { all:initial; position:fixed!important; inset:0!important; z-index:2147483000!important; pointer-events:none!important; color-scheme:light; }
*,*::before,*::after { box-sizing:border-box; }
.panel,.launcher { pointer-events:auto; position:fixed; right:12px; bottom:12px; font:14px/1.45 system-ui,sans-serif; color:#253238; background:#fffefa; border:1px solid #82938b; border-radius:8px; box-shadow:0 3px 20px #0003; }
.panel { width:360px; top:12px; max-height:calc(100dvh - 24px); overflow:auto; padding:16px; }
.panel[data-side=left],.launcher[data-side=left] { right:auto; left:12px; }
@media(max-width:799px) { .panel,.panel[data-side=left] { left:12px; right:12px; top:auto; width:auto; height:min(45dvh,400px); } }
[hidden] { display:none!important; }
h2 { font-size:18px; margin:0; } h3 { font-size:14px; margin:14px 0 6px; } p { margin:8px 0; }
label { display:block; margin:10px 0; } select,textarea { display:block; width:100%; margin-top:4px; font:inherit; color:inherit; background:#fff; border:1px solid #82938b; border-radius:3px; padding:7px; }
button { font:inherit; color:inherit; background:#fff; border:1px solid #82938b; padding:7px 10px; border-radius:4px; cursor:pointer; min-height:36px; }
button:hover { background:#d2e7df; } :focus-visible { outline:3px solid #a94f24; outline-offset:3px; } button:disabled { opacity:.6; cursor:default; }
.actions { display:flex; flex-wrap:wrap; gap:6px; margin-block:10px; } .checks { display:flex; flex-wrap:wrap; gap:8px 14px; } .checks label { margin:0; }
.note { color:#52625f; font-size:12px; } .warning { color:#763813; } textarea { font:12px/1.5 ui-monospace,monospace; min-height:70px; } summary { cursor:pointer; }
.sequence { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; } .sequence svg { display:block; width:100%; height:56px; background:#f0f2ef; } .sequence figure { margin:0; } .sequence figcaption { font-size:12px; }
.overlay { position:fixed; inset:0; overflow:hidden; pointer-events:none; } .box { position:absolute; border:1px solid #135968; box-shadow:0 0 0 1px #fff9; } .item { border-style:dashed; } .ruler { background:repeating-linear-gradient(to right,#13596880 0 1px,#fff8 1px 2px,transparent 2px calc(100% / 64)); border:1px solid #13596880; }
.macro { background:#13596809; border-inline:1px dashed #135968; border-block:0; } .badge { position:absolute; background:#253238; color:#fff; padding:2px 5px; border-radius:2px; font:12px/1.4 system-ui,sans-serif; }
.pick-preview { border:3px solid #a94f24; background:#a94f2414; }
.pressure { border:2px solid #a94f24; border-top:0; height:8px; } .threshold { border-left:1px dashed #a94f24; border-block:0; border-right:0; }
@media (forced-colors:active) { .box { border-color:Highlight; } .badge { background:Canvas; color:CanvasText; border:1px solid CanvasText; } }
`;
