import { fields, recipes, layoutsFor, resolveColumns, expandedPlacements, compactPlacements, sequentialPlacements } from "./assets/graph-paper/src/ruler/geometry.mjs";
import { recipeDescription, compositionDescription, suggestComposition, startingPoints } from "./assets/graph-paper/src/ruler/discovery.mjs";
import { responsive } from "./assets/graph-paper/src/manifest/responsive.mjs";
import { bands } from "./assets/graph-paper/src/manifest/bands.mjs";
import { bandThresholds } from "./assets/graph-paper/src/ruler/bands.mjs";

const $ = id => document.getElementById(id);
const { records: audit } = await fetch("./geometry-changes.json").then(response => response.json());
const query = new URLSearchParams(location.search);
function options(select, entries, value) {
  select.replaceChildren(...entries.map(([id, label]) => new Option(label, id)));
  if (entries.some(([id]) => id === value)) select.value = value;
}
options($("grid"), Object.keys(recipes).map(id => [id, `${id} · ${recipeDescription(id).title}`]), query.get("grid") ?? "grid_03a--07");
options($("field"), Object.entries(fields).map(([id, f]) => [id, `${id} · ${f.end - f.start} bits`]), query.get("field") ?? "wide");
options($("band"), [["", "Default · 30 / 60rem"], ...Object.entries(bands).map(([id, min]) => [id, `gp_band--${id} · ${min}rem minimum`])], query.get("band") ?? "");
const bandCss = document.createElement("link"); bandCss.rel = "stylesheet"; bandCss.href = "./assets/graph-paper/bands.css"; document.head.append(bandCss);
$("width").value = Math.min(3200, Math.max(280, Number(query.get("width")) || 1024));
$("item-count").value = Math.min(12, Math.max(1, Number(query.get("items")) || Number(query.get("set")?.slice(-2)) || 6));
function refreshSets(value, flow) {
  const sets = [...new Set(layoutsFor(recipes[$("grid").value]).map(l => l.set))];
  options($("set"), [["none", "Grid only · sequential placement"], ...sets.map(s => [s, `${Number(s.slice(-2))} positions · ${s}`])], value ?? "none");
  refreshFlows(flow);
}
function refreshFlows(value) {
  const candidates = layoutsFor(recipes[$("grid").value]).filter(l => l.set === $("set").value);
  options($("flow"), candidates.length ? candidates.map(l => [l.flow ?? "default", l.flow ?? "Default (intentional; no flow class)"]) : [["default", "No flow · grid-only placement"]], value);
  $("flow").disabled = $("set").value === "none";
}
refreshSets(query.get("set") ?? "set_06", query.get("flow"));
$("grid").addEventListener("change", () => { refreshSets($("set").value, $("flow").value); render(); });
$("set").addEventListener("change", () => { refreshFlows($("flow").value); render(); });
$("item-count").addEventListener("input", () => {
  const matching = layoutsFor(recipes[$("grid").value]).find(l => l.items === Number($("item-count").value) && !l.flow);
  refreshSets(matching?.set ?? "none"); render();
});
for (const id of ["flow", "field", "band", "width", "ruler-guide", "field-guide", "macro-guide", "source-guide", "compare"]) $(id).addEventListener("input", render);
for (const id of ["emphasis", "contrast", "supports"]) $(id).addEventListener("change", renderCandidates);

function renderCandidates() {
  const count = Number($("item-count").value);
  const candidates = Object.keys(recipes).filter(id => {
    const d = recipeDescription(id);
    return (!$("emphasis").value || d.emphasis === $("emphasis").value) && (!$("contrast").value || d.contrast === $("contrast").value) && (!$("supports").value || d.supports === $("supports").value);
  });
  $("candidate-note").textContent = `${candidates.length} structures match. Showing up to six varied structures; the complete grid menu remains available. Width emphasis is not automatically item-1 prominence.`;
  const unique = new Set();
  const chosen = candidates.filter(id => { const key = recipes[id].weights.join(":"); if (unique.has(key)) return false; unique.add(key); return true; }).slice(0, 6);
  $("candidates").replaceChildren(...chosen.map(id => {
    const button = document.createElement("button"); button.type = "button";
    const layout = suggestComposition(id, count);
    const title = document.createElement("strong"), description = document.createElement("span");
    title.textContent = `${recipeDescription(id).title} · ${[id, layout?.set, layout?.flow].filter(Boolean).join(" ")}`;
    description.textContent = compositionDescription(id, layout?.set, layout?.flow);
    button.append(title, description);
    button.addEventListener("click", () => {
      $("grid").value = id;
      refreshSets(layout?.set ?? "none", layout?.flow ?? "default"); render();
    }); return button;
  }));
}
$("starting-points").replaceChildren(...startingPoints.map(point => {
  const button = document.createElement("button"); button.type = "button"; button.textContent = point.label;
  button.addEventListener("click", () => { $("grid").value = point.grid; $("item-count").value = 6; refreshSets(point.set, point.flow ?? "default"); render(); });
  return button;
}));

function render() {
  const id = $("grid").value, fieldName = $("field").value, width = Number($("width").value);
  const count = Math.min(12, Math.max(1, Number($("item-count").value) || 1));
  const recipe = recipes[id], field = fields[fieldName];
  const layout = layoutsFor(recipe).find(l => l.set === $("set").value && (l.flow ?? "default") === $("flow").value);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const thresholds = $("band").value ? bandThresholds(recipe, fieldName, layout, $("band").value) : { expanded: parseFloat(responsive.expanded), compact: parseFloat(responsive.compact) };
  const state = width >= thresholds.expanded * rem ? "expanded" : width >= thresholds.compact * rem ? "compact" : "stacked";
  const placements = layout ? (state === "expanded" ? expandedPlacements(recipe, fieldName, layout) : compactPlacements(fieldName, layout)) : sequentialPlacements(recipe, fieldName, count, state);
  const className = ["gp_field", "doc-composition", `gp_field--${fieldName}`, id, layout?.set, layout?.flow, $("band").value && `gp_band--${$("band").value}`].filter(Boolean).join(" ");
  $("composition").className = className;
  $("composition").replaceChildren(...Array.from({ length: count }, (_, i) => {
    const article = document.createElement("article"); article.className = "tile";
    const placement = placements.find(p => p.item === i + 1);
    if (fieldName === "ruled" && placement && placement.lines[1] < field.end - field.start + 1) article.classList.add("gp_rule--end");
    article.innerHTML = `<span class="source-number">Source ${i + 1}</span><h3>${["Lead story", "Perspective", "Dispatch", "Analysis", "Interview", "Field notes"][i % 6]}</h3><p>Content keeps its logical DOM position.</p>`;
    return article;
  }));
  $("preview").style.width = `${width}px`;
  $("preview").classList.toggle("show-ruler", $("ruler-guide").checked);
  $("preview").classList.toggle("show-field", $("field-guide").checked);
  $("preview").classList.toggle("hide-source", !$("source-guide").checked);
  const columns = resolveColumns(recipe, fieldName);
  $("macro-overlay").replaceChildren(...columns.map(c => {
    const span = document.createElement("span");
    span.style.left = `${c.start / 64 * 100}%`; span.style.width = `${(c.end - c.start) / 64 * 100}%`; return span;
  }));
  $("macro-overlay").classList.toggle("visible", $("macro-guide").checked && state === "expanded");
  $("width-label").textContent = `${width}px`;
  $("summary").textContent = `${state} · canvas ${width}px · field [${field.start}, ${field.end}] · ${field.gutter}-bit gutters`;
  $("band-pressure").textContent = thresholds.minimum ? `Minimum ${thresholds.minimum}rem · expanded limiting slot ${thresholds.expandedBits} bits; compact ${thresholds.compactBits} bits · expanded ≥ ${thresholds.expanded}rem (${thresholds.expanded * rem}px), compact ≥ ${thresholds.compact}rem (${thresholds.compact * rem}px). At this canvas width, those slots have ${(width * thresholds.expandedBits / 64 / rem).toFixed(1)}rem / ${(width * thresholds.compactBits / 64 / rem).toFixed(1)}rem respectively. All recipe positions are protected; inner padding and actual content are not measured. Stacking cannot guarantee the minimum on a narrower screen.` : "Default response: canvas thresholds of 30rem and 60rem. Select a band to derive thresholds from the limiting slot instead.";
  $("design-description").textContent = recipeDescription(id).description + " " + compositionDescription(id, layout?.set, layout?.flow);
  $("count-warning").hidden = !layout || count === layout.items;
  $("count-warning").textContent = layout && count !== layout.items ? `Selected: ${layout.items} positions. Detected: ${count} composed items. ${count < layout.items ? `${layout.items - count} position(s) unoccupied.` : "Additional items use conservative full-width fallback."} Review whether the mismatch is intentional; the selected recipe is unchanged.` : "";
  $("occupancy").textContent = layout ? `Occupied recipe positions: ${Math.min(count, layout.items)} of ${layout.items}. ${Math.max(0, count - layout.items)} fallback items. Compact pattern: ${layout.states.compact}.` : `${count} items occupy macro regions sequentially; unused regions remain empty. Compact uses equal pairs.`;
  const equivalents = layout ? layoutsFor(recipe).filter(l => l.set === layout.set && l.id !== layout.id && JSON.stringify(l.states) === JSON.stringify(layout.states)).map(l => l.flow ?? "default") : [];
  $("equivalents").textContent = equivalents.length ? `Same expanded/compact placement also available as: ${equivalents.join(", ")}. IDs are retained; these are not distinct visual alternatives.` : "";
  const record = audit.find(r => r.id === id && r.field === fieldName);
  $("geometry").textContent = JSON.stringify({ field, columns, placements: state === "stacked" ? "source order" : placements, migration: record ?? "New field or recipe." }, null, 2);
  $("audit-summary").textContent = record ? `${record.classification}: maximum legacy edge displacement ${record.displacement} bit(s).` : "New field or recipe; no claim of legacy parity.";
  $("review-note").textContent = "Twelve intentional whole-bit adjustments from 0.2.3 are documented in the migration record.";
  const children = [...$("composition").children].map((c, i) => `    <article${c.classList.contains("gp_rule--end") ? ' class="gp_rule--end"' : ""}>Content ${i + 1}</article>`).join("\n");
  $("markup").textContent = `${$("band").value ? '<!-- Load bands.css after main.css for experimental gp_band--0* support. -->\n' : ''}<!-- Your project supplies component styling and vertical spacing. -->\n<div class="gp_canvas">\n  <section class="${className.replace("doc-composition ", "")}">\n${children}\n  </section>\n</div>`;
  $("compare").disabled = !layout;
  $("comparison").hidden = !$("compare").checked || !layout;
  if ($("compare").checked && layout) {
    const params = new URLSearchParams({ grid: id, set: layout.set, flow: layout.flow ?? "", rhythm: ["neat", "thin"].includes(fieldName) ? fieldName : "wide", width });
    const src = `./legacy-reference.html?${params}`;
    if ($("reference").getAttribute("src") !== src) $("reference").src = src;
    $("reference").style.width = `${width}px`;
  }
  const params = new URLSearchParams({ grid: id, set: layout?.set ?? "none", flow: layout?.flow ?? "default", items: count, field: fieldName, width });
  if ($("band").value) params.set("band", $("band").value);
  history.replaceState(null, "", `?${params}`);
  renderCandidates();
}
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("markup").textContent); $("copy").textContent = "Copied"; }
  catch { $("copy").textContent = "Select and copy the markup below"; }
});
render();
