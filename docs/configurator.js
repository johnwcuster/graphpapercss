import { fields, recipes, layoutsFor, resolveColumns, expandedPlacements, compactPlacements } from "../src/ruler/geometry.mjs";
import { responsive } from "../src/manifest/responsive.mjs";

const $ = id => document.getElementById(id);
const { records: audit } = await fetch("./geometry-changes.json").then(response => response.json());
const query = new URLSearchParams(location.search);
function options(select, entries, value) {
  select.replaceChildren(...entries.map(([id, label]) => new Option(label, id)));
  if (entries.some(([id]) => id === value)) select.value = value;
}
options($("grid"), Object.entries(recipes).map(([id, r]) => [id, `${id} · ${r.columns} columns`]), query.get("grid") ?? "grid_03a--01");
options($("field"), Object.entries(fields).map(([id, f]) => [id, `${id} · ${f.end - f.start} bits`]), query.get("field") ?? "wide");
$("width").value = Math.min(1200, Math.max(280, Number(query.get("width")) || 1024));
function refreshSets(value, flow) {
  const candidates = layoutsFor(recipes[$("grid").value]);
  const sets = [...new Set(candidates.map(l => l.set))];
  options($("set"), sets.map(s => [s, `${Number(s.slice(-2))} items · ${s}`]), value);
  refreshFlows(flow);
}
function refreshFlows(value) {
  const candidates = layoutsFor(recipes[$("grid").value]).filter(l => l.set === $("set").value);
  options($("flow"), candidates.map(l => [l.flow ?? "default", l.flow ?? "Default (no flow class)"]), value);
}
refreshSets(query.get("set") ?? "set_06", query.get("flow"));
$("grid").addEventListener("change", () => { refreshSets($("set").value, $("flow").value); render(); });
$("set").addEventListener("change", () => { refreshFlows($("flow").value); render(); });
for (const id of ["flow", "field", "width", "ruler-guide", "field-guide", "macro-guide", "source-guide", "compare"]) $(id).addEventListener("input", render);

function render() {
  const id = $("grid").value, fieldName = $("field").value, width = Number($("width").value);
  const recipe = recipes[id], field = fields[fieldName];
  const layout = layoutsFor(recipe).find(l => l.set === $("set").value && (l.flow ?? "default") === $("flow").value);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const state = width >= parseFloat(responsive.expanded) * rem ? "expanded" : width >= parseFloat(responsive.compact) * rem ? "compact" : "stacked";
  const placements = state === "expanded" ? expandedPlacements(recipe, fieldName, layout) : compactPlacements(fieldName, layout);
  const className = ["gp_field", `gp_field--${fieldName}`, id, layout.set, layout.flow].filter(Boolean).join(" ");
  $("composition").className = className;
  $("composition").replaceChildren(...Array.from({ length: layout.items }, (_, i) => {
    const article = document.createElement("article"); article.className = "tile";
    const placement = placements.find(p => p.item === i + 1);
    if (fieldName === "ruled" && placement.lines[1] < field.end - field.start + 1) article.classList.add("gp_rule--end");
    article.innerHTML = `<span class="source-number">Source ${i + 1}</span><h3>${["Lead story", "Perspective", "Dispatch", "Analysis", "Interview", "Field notes"][i]}</h3><p>Editorial content keeps its logical DOM position.</p>`;
    return article;
  }));
  $("preview").style.width = `${width}px`;
  $("preview").classList.toggle("show-ruler", $("ruler-guide").checked);
  $("preview").classList.toggle("show-field", $("field-guide").checked);
  $("preview").classList.toggle("hide-source", !$("source-guide").checked);
  const columns = resolveColumns(recipe, fieldName);
  $("macro-overlay").replaceChildren(...columns.map(c => {
    const span = document.createElement("span");
    span.style.left = `${c.start / 64 * 100}%`; span.style.width = `${(c.end - c.start) / 64 * 100}%`;
    return span;
  }));
  $("macro-overlay").classList.toggle("visible", $("macro-guide").checked && state === "expanded");
  $("width-label").textContent = `${width}px`;
  $("summary").textContent = `${state} · field [${field.start}, ${field.end}] · ${field.gutter}-bit gutters · ${state === "stacked" ? "source-order stack" : "whole-bit placement"}`;
  const record = audit.find(r => r.id === id && r.field === fieldName);
  $("geometry").textContent = JSON.stringify({ field, columns, placements: state === "stacked" ? "source order" : placements, migration: record ?? "New field or recipe: no exact legacy counterpart." }, null, 2);
  $("audit-summary").textContent = record ? `${record.classification}: maximum legacy edge displacement ${record.displacement} bit(s).` : "New field or recipe; review visually rather than claiming legacy parity.";
  const review = audit.filter(r => r.classification === "REVIEW");
  $("review-note").textContent = `${audit.filter(r => r.classification === "ACCEPTED").length} intentional 1.0 changes documented; ${review.length} unresolved geometry records. All 72 legacy recipes are migrated.`;
  const children = [...$("composition").children].map((c, i) => `    <article${c.classList.contains("gp_rule--end") ? ' class="gp_rule--end"' : ""}>Content ${i + 1}</article>`).join("\n");
  $("markup").textContent = `<div class="gp_canvas">\n  <section class="${className}">\n${children}\n  </section>\n</div>`;
  $("comparison").hidden = !$("compare").checked;
  if ($("compare").checked) {
    const params = new URLSearchParams({ grid: id, set: layout.set, flow: layout.flow ?? "", rhythm: ["neat", "thin"].includes(fieldName) ? fieldName : "wide", width });
    const src = `./legacy-reference.html?${params}`;
    if ($("reference").getAttribute("src") !== src) $("reference").src = src;
    $("reference").style.width = `${width}px`;
  }
  const params = new URLSearchParams({ grid: id, set: layout.set, flow: layout.flow ?? "default", field: fieldName, width });
  history.replaceState(null, "", `?${params}`);
}
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("markup").textContent); $("copy").textContent = "Copied"; }
  catch { $("copy").textContent = "Select and copy the markup below"; }
});
render();
