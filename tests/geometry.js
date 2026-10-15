import { fields, recipes, layoutsFor, expandedPlacements, compactPlacements, sequentialPlacements } from "../src/ruler/geometry.mjs";

const failures = [];
let assertions = 0, combinations = 0;
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
function check(condition, message) { assertions++; if (!condition) failures.push(message); }
const near = (a, b) => Math.abs(a - b) < .8;
function fixture(id, field, layout, width) {
  const root = document.createElement("div"); root.className = "gp_canvas fixture"; root.style.width = `${width}px`;
  const grid = document.createElement("section"); grid.className = ["gp_field", `gp_field--${field}`, id, layout.set, layout.flow].filter(Boolean).join(" ");
  grid.style.gridAutoRows = "20px";
  for (let i = 0; i < layout.items; i++) {
    const article = document.createElement("article");
    if (field === "ruled") article.className = "gp_rule--start gp_rule--end";
    grid.append(article);
  }
  root.append(grid); document.getElementById("fixtures").append(root);
  return { root, grid };
}

async function run() {
  // Query-selected stylesheets can finish after module evaluation in Firefox.
  // Measure only after the actual requested build has loaded.
  const stylesheet = document.querySelector('link[rel="stylesheet"]');
  if (!stylesheet.sheet || stylesheet.sheet.href !== stylesheet.href) {
    await new Promise((resolve, reject) => {
      stylesheet.addEventListener("load", resolve, { once: true });
      stylesheet.addEventListener("error", () => reject(new Error("Structural test stylesheet failed to load")), { once: true });
    });
  }
  check(CSS.supports("grid-template-columns", "subgrid"), "browser must support subgrid");
  check(CSS.supports("container-type", "inline-size"), "browser must support container queries");
  check(CSS.supports("width", "1cqi"), "browser must support cqi");
  const cases = [];
  for (const [id, recipe] of Object.entries(recipes)) for (const field of Object.keys(fields)) {
    for (const layout of layoutsFor(recipe)) for (const width of [1024, 640, 320]) cases.push({ id, recipe, field, layout, width });
  }
  // Batch layout work to keep this fixture usable without thousands of frames.
  for (let offset = 0; offset < cases.length; offset += 80) {
    const batch = cases.slice(offset, offset + 80).map(c => ({ ...c, ...fixture(c.id, c.field, c.layout, c.width) }));
    await frame();
    for (const c of batch) {
      combinations++;
      const f = fields[c.field], rect = c.root.getBoundingClientRect(), gridRect = c.grid.getBoundingClientRect();
      const label = `${c.id}/${c.field}/${c.layout.id}/${c.width}`;
      check(getComputedStyle(c.root).gridTemplateColumns.split(" ").length === 64, `${label}: 64 tracks`);
      check(["normal", "0px"].includes(getComputedStyle(c.grid).rowGap), `${label}: host-controlled row gap`);
      check(near(gridRect.left, rect.left + f.start * c.width / 64) && near(gridRect.right, rect.left + f.end * c.width / 64), `${label}: field edges`);
      const expected = c.width >= 960 ? expandedPlacements(c.recipe, c.field, c.layout) : compactPlacements(c.field, c.layout);
      let bottom = -Infinity;
      [...c.grid.children].forEach((child, i) => {
        const box = child.getBoundingClientRect(), p = expected.find(p => p.item === i + 1);
        if (c.field === "ruled") {
          const start = getComputedStyle(child, "::before"), end = getComputedStyle(child, "::after");
          check((start.content !== "none") === (c.width >= 480 && p.lines[0] > 1), `${label}/${i + 1}: start rule ownership`);
          check((end.content !== "none") === (c.width >= 480 && p.lines[1] < f.end - f.start + 1), `${label}/${i + 1}: end rule ownership`);
          if (start.content !== "none") check(near(parseFloat(start.left), -c.width / 64), `${label}/${i + 1}: start rule bit offset`);
          if (end.content !== "none") check(near(parseFloat(end.right), -c.width / 64), `${label}/${i + 1}: end rule bit offset`);
        }
        if (c.width < 480) {
          check(box.top >= bottom && near(box.left, gridRect.left) && near(box.right, gridRect.right), `${label}/${i + 1}: source-order stack`);
          check(getComputedStyle(child).marginBlockStart === "0px", `${label}/${i + 1}: no stacked spacing default`);
          bottom = box.bottom;
        } else {
          check(near(box.left, rect.left + (f.start + p.lines[0] - 1) * c.width / 64) && near(box.right, rect.left + (f.start + p.lines[1] - 1) * c.width / 64), `${label}/${i + 1}: integer edges`);
          const style = getComputedStyle(child);
          check(Number(style.gridRowStart) === p.row[0] && Number(style.gridRowEnd) === p.row[1], `${label}/${i + 1}: rows`);
        }
      });
      c.root.remove();
    }
  }

  // Every grid-only recipe, field and state; more than two complete macro rows.
  for (const [id, recipe] of Object.entries(recipes)) for (const field of Object.keys(fields)) {
    for (const width of [1024, 640, 320]) {
      const c = fixture(id, field, { items: recipe.columns * 2 + 1 }, width);
      const state = width >= 960 ? "expanded" : width >= 480 ? "compact" : "stacked";
      const expected = sequentialPlacements(recipe, field, c.grid.children.length, state);
      const bounds = c.root.getBoundingClientRect(), gridBounds = c.grid.getBoundingClientRect();
      [...c.grid.children].forEach((child, i) => {
        const box = child.getBoundingClientRect(), p = expected[i];
        check(near(box.left, bounds.left + (fields[field].start + p.lines[0] - 1) * width / 64)
          && near(box.right, bounds.left + (fields[field].start + p.lines[1] - 1) * width / 64), `${id}/${field}/${state}/${i}: sequential boundaries`);
        check(near(box.top, gridBounds.top + (p.row[0] - 1) * 20), `${id}/${field}/${state}/${i}: source-order rows`);
      });
      combinations++; c.root.remove();
    }
  }

  const layout = layoutsFor(recipes.grid_03).find(l => l.set === "set_03" && !l.flow);
  // Selector factoring must preserve equal-specificity source order and the
  // higher specificity of an explicit flow, in every generated build.
  const cascadeRecipe = recipes["grid_03a--07"];
  const cascadeDefault = layoutsFor(cascadeRecipe).find(l => l.set === "set_06" && !l.flow);
  const cascadeFlow = layoutsFor(cascadeRecipe).find(l => l.set === "set_06" && l.flow === "flow_04");
  for (const width of [640, 1024]) for (const position of ["before", "after"]) {
    const c = fixture("grid_03a--07", "wide", cascadeDefault, width);
    const style = document.createElement("style");
    const layered = new URL(stylesheet.href).pathname.includes(".layer.");
    const declarations = ".gp_field.grid_03a--07.set_06 { --gp-e-1-column: 1 / 5; --gp-c-1-column: 1 / 6; }";
    style.textContent = layered ? `@layer graph-paper { ${declarations} }` : declarations;
    if (position === "before") stylesheet.before(style); else stylesheet.after(style);
    await frame();
    const expected = width >= 960 ? expandedPlacements(cascadeRecipe, "wide", cascadeDefault) : compactPlacements("wide", cascadeDefault);
    check(Number(getComputedStyle(c.grid.firstElementChild).gridColumnEnd) === (position === "after" ? width >= 960 ? 5 : 6 : expected[0].lines[1]), `${width}/${position}: default specificity/source order`);
    c.grid.classList.add("flow_04"); await frame();
    const explicit = width >= 960 ? expandedPlacements(cascadeRecipe, "wide", cascadeFlow) : compactPlacements("wide", cascadeFlow);
    check(Number(getComputedStyle(c.grid.firstElementChild).gridColumnEnd) === explicit[0].lines[1], `${width}/${position}: explicit flow retains higher specificity`);
    style.remove(); c.root.remove();
  }
  for (const width of [1024, 640, 320]) {
    const mismatch = fixture("grid_03", "wide", { ...layout, items: 8 }, width);
    mismatch.root.style.setProperty("--gp-e-4-column", "1 / 2");
    mismatch.root.style.setProperty("--gp-c-4-column", "1 / 2");
    await frame();
    const fieldBounds = mismatch.grid.getBoundingClientRect();
    [...mismatch.grid.children].slice(3).forEach((child, i) => {
      const box = child.getBoundingClientRect();
      check(near(box.left, fieldBounds.left) && near(box.right, fieldBounds.right), `mismatched set/${width}/${i}: full-width fallback isolates inherited variables`);
    });
    mismatch.root.remove();
  }
  const inherited = fixture("grid_03", "wide", layout, 1024);
  const article = inherited.grid.firstElementChild; article.className = "gp_subgrid";
  const inset = document.createElement("div"); inset.style.gridColumn = "3 / -3"; article.append(inset);
  await frame();
  check(getComputedStyle(article).containerType === "normal", "subgrid creates no query context");
  check(near(inset.getBoundingClientRect().left - article.getBoundingClientRect().left, 32), "semantic subgrid inherits outer bit size");
  const override = inherited.grid.children[2]; override.className = "gp_place";
  override.style.setProperty("--gp-column-start", "1"); override.style.setProperty("--gp-column-end", "5");
  override.style.setProperty("--gp-row-start", "4"); override.style.setProperty("--gp-row-end", "5");
  await frame();
  check(getComputedStyle(override).gridColumnStart === "1" && getComputedStyle(override).gridColumnEnd === "5", "explicit placement overrides generated consumers");

  const local = document.createElement("div"); local.className = "gp_canvas";
  const localGrid = document.createElement("section"); localGrid.className = "gp_field gp_field--thin grid_02 set_03";
  for (let i = 0; i < 3; i++) localGrid.append(document.createElement("article"));
  local.append(localGrid); inherited.grid.children[1].append(local);
  await frame();
  check(getComputedStyle(localGrid).display === "block", "nested canvas responds to its own width");
  check(near(localGrid.getBoundingClientRect().left - local.getBoundingClientRect().left, local.getBoundingClientRect().width * 2 / 64), "nested canvas rebases bits");
  inherited.root.remove();

  const ruled = fixture("grid_03", "ruled", layout, 1024);
  ruled.grid.firstElementChild.className = "gp_rule--end";
  await frame();
  const marker = getComputedStyle(ruled.grid.firstElementChild, "::after");
  check(marker.content !== "none" && near(parseFloat(marker.right), -16), "rule center offset uses one canvas bit");
  const edge = ruled.grid.firstElementChild.getBoundingClientRect().right - ruled.root.getBoundingClientRect().left;
  check(near((edge + 16) / 16, Math.round((edge + 16) / 16)), "principal rule center lands on whole bit");
  ruled.grid.lastElementChild.className = "gp_rule--end";
  await frame();
  check(getComputedStyle(ruled.grid.lastElementChild, "::after").content === "none", "outer field edge never owns a gutter rule");
  ruled.root.style.width = "640px";
  await frame();
  check(getComputedStyle(ruled.grid.firstElementChild, "::after").content === "none", "compact full-span item suppresses its end rule");
  ruled.root.style.width = "320px";
  await frame();
  check(getComputedStyle(ruled.grid.firstElementChild, "::after").content === "none", "stacked state suppresses rules");
  ruled.root.remove();

  for (const [width, expected] of [[479, "block"], [480, "grid"], [959, "grid"], [960, "grid"]]) {
    const boundary = fixture("grid_03", "wide", layout, width); await frame();
    check(getComputedStyle(boundary.grid).display === expected, `responsive boundary ${width}`);
    if (width >= 480) {
      const expectedPlacement = width >= 960 ? expandedPlacements(recipes.grid_03, "wide", layout) : compactPlacements("wide", layout);
      check(Number(getComputedStyle(boundary.grid.firstElementChild).gridColumnEnd) === expectedPlacement[0].lines[1], `responsive placement boundary ${width}`);
    }
    boundary.root.remove();
  }

  const overlay = document.createElement("div"); overlay.className = "gp_canvas fixture"; overlay.style.width = "1024px";
  for (const name of ["full", "neat", "ruled"]) {
    const layer = document.createElement("div"); layer.className = `gp_field gp_field--${name}`; layer.style.gridRow = "1"; layer.style.minHeight = "100px"; overlay.append(layer);
  }
  document.getElementById("fixtures").append(overlay); await frame();
  [...overlay.children].forEach((layer, i) => {
    const f = fields[["full", "neat", "ruled"][i]], box = layer.getBoundingClientRect();
    check(near(box.left, f.start * 16) && near(box.right, f.end * 16), `overlay ${i}: shared ruler edges`);
    check(near(box.top, overlay.firstElementChild.getBoundingClientRect().top), `overlay ${i}: shared row`);
  });
  overlay.remove();
  const result = { passed: failures.length === 0, assertions, combinations, failures };
  window.__geometryResults = result;
  document.getElementById("results").textContent = JSON.stringify(result, null, 2);
}
run().catch(error => {
  window.__geometryResults = { passed: false, failures: [error.stack] };
  document.getElementById("results").textContent = error.stack;
});
