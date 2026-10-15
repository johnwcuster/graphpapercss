import { bands } from "../src/manifest/bands.mjs";
import { bandThresholds } from "../src/ruler/bands.mjs";
import { fields, recipes, layoutsFor, expandedPlacements, compactPlacements, sequentialPlacements } from "../src/ruler/geometry.mjs";

const failures = [];
let assertions = 0, combinations = 0;
const check = (condition, message) => { assertions++; if (!condition && failures.length < 30) failures.push(message); };
const near = (a, b) => Math.abs(a - b) < .9;
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

async function run() {
  const query=new URLSearchParams(location.search);
  if(query.has("minified"))for(const link of document.querySelectorAll('link[rel="stylesheet"]'))link.href=link.href.replace(/\.css$/, ".min.css");
  await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.sheet?.href===link.href ? null : new Promise((resolve, reject) => { link.onload=resolve; link.onerror=reject; })));
  const cases = [];
  for (const recipe of Object.values(recipes)) for (const field of Object.keys(fields)) for (const layout of [null, ...layoutsFor(recipe)]) for (const band of Object.keys(bands)) {
    if(query.has("minified") && !["grid_03","grid_04","grid_03a--07","grid_06"].includes(recipe.id))continue;
    const t = bandThresholds(recipe, field, layout, band);
    for (const width of new Set([t.compact * 16 - 1, t.compact * 16, t.expanded * 16 - 1, t.expanded * 16])) cases.push({ recipe, field, layout, band, t, width });
  }
  for (let offset = 0; offset < cases.length; offset += 100) {
    const batch = cases.slice(offset, offset + 100).map(c => {
      const root = document.createElement("div"); root.className = "gp_canvas fixture"; root.style.width = `${c.width}px`;
      const grid = document.createElement("section");
      grid.className = ["gp_field", `gp_field--${c.field}`, c.recipe.id, c.layout?.set, c.layout?.flow, `gp_band--${c.band}`].filter(Boolean).join(" ");
      const count = c.layout ? c.layout.items + 1 : c.recipe.columns * 2 + 1;
      for (let i=0; i<count; i++) {
        const child=document.createElement("article"); child.className="gp_rule--start gp_rule--end";
        if (!i) { child.classList.add("gp_subgrid"); child.append(document.createElement("span")); }
        grid.append(child);
      }
      root.append(grid); document.getElementById("fixtures").append(root);
      return { ...c, root, grid };
    });
    await frame();
    for (const c of batch) {
      combinations++;
      const state = c.width >= c.t.expanded * 16 ? "expanded" : c.width >= c.t.compact * 16 ? "compact" : "stacked";
      const placements = c.layout ? (state === "expanded" ? expandedPlacements(c.recipe,c.field,c.layout) : compactPlacements(c.field,c.layout)) : sequentialPlacements(c.recipe,c.field,c.grid.children.length,state);
      const bounds=c.root.getBoundingClientRect(), gridBounds=c.grid.getBoundingClientRect(), f=fields[c.field];
      const label=`${c.recipe.id}/${c.field}/${c.layout?.id ?? "bare"}/${c.band}/${c.width}/${state}`;
      check(getComputedStyle(c.grid).display === (state === "stacked" ? "block" : "grid"), `${label}: display`);
      check(getComputedStyle(c.grid.firstElementChild).display === (state === "stacked" ? "block" : "grid"), `${label}: semantic subgrid`);
      let bottom=-Infinity;
      [...c.grid.children].forEach((child,i)=>{
        const box=child.getBoundingClientRect(), p=placements.find(p=>p.item===i+1);
        const lines=state==="stacked" || !p ? [1,f.end-f.start+1] : p.lines;
        check(near(box.left,bounds.left+(f.start+lines[0]-1)*c.width/64) && near(box.right,bounds.left+(f.start+lines[1]-1)*c.width/64),`${label}/${i+1}: edges`);
        if(state==="stacked") { check(box.top>=bottom,`${label}/${i+1}: source order`); bottom=box.bottom; }
        else if(p) check(near(box.top,gridBounds.top+(p.row[0]-1)*20),`${label}/${i+1}: row`);
        if(c.field==="ruled") {
          for(const [pseudo,internal] of [["::before",lines[0]>1],["::after",lines[1]<f.end-f.start+1]]) {
            const content=getComputedStyle(child,pseudo).content;
            check((content!=="none" && content!=="normal") === (state!=="stacked" && internal),`${label}/${i+1}/${pseudo}: rule ownership`);
          }
        }
      });
      c.root.remove();
    }
  }
  // A band on an ancestor must not control a nested canvas's subgrid state.
  // Font changes must also move rem-based thresholds with the same geometry.
  for(const rootSize of [16,20])for(const band of ["01","03"]) {
    document.documentElement.style.fontSize=`${rootSize}px`;
    const outer=document.createElement("div");outer.className="gp_canvas";outer.style.width="700px";
    outer.innerHTML=`<section class="gp_field gp_field--wide grid_03 set_03 gp_band--${band}"><article class="gp_subgrid"><span>Outer</span></article><div class="gp_canvas" style="width:1000px"><section class="gp_field gp_field--wide grid_03 set_03"><article class="gp_subgrid"><span>Nested</span></article><article></article><article></article></section></div><article></article></section>`;
    document.getElementById("fixtures").append(outer);await frame();
    const parent=outer.firstElementChild, nested=parent.querySelector(".gp_canvas .gp_field");
    const t=bandThresholds(recipes.grid_03,"wide",layoutsFor(recipes.grid_03).find(l=>l.set==="set_03"&&!l.flow),band);
    check(getComputedStyle(parent).display===(700>=t.compact*rootSize?"grid":"block"),`root ${rootSize}/band ${band}: rem transition`);
    check(getComputedStyle(nested.firstElementChild).display==="grid",`root ${rootSize}/band ${band}: independent nested subgrid`);
    outer.remove();
  }
  document.documentElement.style.fontSize="";
  window.__bandResults={passed:failures.length===0, combinations, assertions, failures};
}
run().catch(error=>{window.__bandResults={passed:false,failures:[error.stack]};});
