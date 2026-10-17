import { fields, recipes, layoutsFor, resolveColumns, expandedPlacements, compactPlacements, sequentialPlacements } from "./assets/graph-paper/src/ruler/geometry.mjs";
import { recipeDescription, compositionDescription } from "./assets/graph-paper/src/ruler/discovery.mjs";
import { responsive } from "./assets/graph-paper/src/manifest/responsive.mjs";
import { bands } from "./assets/graph-paper/src/manifest/bands.mjs";
import { bandThresholds } from "./assets/graph-paper/src/ruler/bands.mjs";
import { mountShell } from "./workbench/shell.js";
import { createInspector } from "./workbench/inspector.js";
import { syncExampleItems } from "./workbench/content.js";
import { renderChoices, renderBands, renderGutters, renderBoundaries } from "./workbench/controls.js";
import { recipeSelection } from "./workbench/model.mjs";
import { thresholdNotice, responseExplanation, responseFor } from "./workbench/response.mjs";
import { clampSourceCount, createSourceControls } from "./workbench/source.mjs";

const $ = id => document.getElementById(id);
const { records: audit } = await fetch("./geometry-changes.json").then(response => response.json());
const query = new URLSearchParams(location.search);
let selectedGrid = recipes[query.get("grid")] ? query.get("grid") : "grid_03a--07";
let selectedSet, selectedFlow;
let selectedField = Object.hasOwn(fields, query.get("field")) ? query.get("field") : "wide";
let selectedBand = Object.hasOwn(bands, query.get("band")) ? query.get("band") : "";
const initialWidth = Math.min(8192, Math.max(280, Number(query.get("width")) || 1024));
$("width").max = Math.max(3200, initialWidth);
$("width").value = initialWidth;
let sourceCount = clampSourceCount(query.get("items"), Number(query.get("set")?.slice(-2)) || 6);
let selectedSource = 1;
function refreshSets(set, flow = "default") {
  const next = recipeSelection(selectedGrid, set, flow);
  selectedSet = next.set; selectedFlow = next.flow;
}
refreshSets(query.get("set") ?? "set_06", query.get("flow") ?? "default");
mountShell({ root: $("workbench"), launcher: $("workbench-launcher"), workspace: $("workspace") });
const inspector = createInspector({ canvas: $("preview"), field: $("composition"), overlay: $("inspection-overlay"), summary: $("inspection-summary") });
const sourceControls = createSourceControls({ remove: $("source-remove"), add: $("source-add"), output: $("source-count"),
  onCount(count) { commit(() => { sourceCount = clampSourceCount(count); selectedSource = sourceCount; }); }
});
function readSelection() {
  return { grid: selectedGrid, set: selectedSet, flow: selectedFlow,
    items: sourceCount,
    field: selectedField, band: selectedBand, width: Number($("width").value) };
}
let currentSelection = readSelection();
function commit(action) {
  const before = currentSelection;
  action();
  const after = readSelection();
  if (Object.keys(after).some(key => after[key] !== before[key])) {
    const notice = thresholdNotice(before, after, parseFloat(getComputedStyle(document.documentElement).fontSize));
    $("threshold-change").textContent = notice || (before.width !== after.width ? `Preview width: ${before.width}px → ${after.width}px. Later settings changes do not resize the preview.` : `Preview width stays ${after.width}px.`);
  }
  currentSelection = after;
  render();
  const changes = ['set', 'flow'].filter(key => before[key] !== after[key]);
  const messages = changes.map(key => `${key === 'set' ? 'Positions' : 'Flow'}: ${after[key] === 'none' || after[key] === 'default' ? 'Default' : after[key]}`);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  if (responseFor(before, rem).state !== responseFor(after, rem).state) messages.push(`Layout: ${responseFor(after, rem).state}`);
  if (messages.length) $("control-announcement").textContent = messages.join('. ') + '.';
}
function chooseGrid(id) {
  const before = currentSelection;
  const nextSelection = recipeSelection(id, before.set, before.flow);
  commit(() => { selectedGrid = id; refreshSets(nextSelection.set, nextSelection.flow); });
}
function chooseWidth(width) {
  commit(() => {
    $("width").max = Math.max(3200, Number($("width").max), width);
    $("width").value = Math.max(280, width);
  });
}
$("width").addEventListener("input", () => commit(() => {}));
for (const [id, target, label] of [
  ["illustration-toggle", "macro-region-panel", "macro-region and variant"],
  ["gutter-options-toggle", "field-choices", "gutter"],
  ["set-options-toggle", "set-panel", "flow"],
  ["band-options-toggle", "band-choices", "responsive band"]
]) {
  const button = $(id);
  button.classList.add("options-toggle");
  function updateDisclosure() {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.textContent = expanded ? "Hide options" : "Show options";
    button.setAttribute("aria-label", `${button.textContent}: ${label}`);
    $(target).classList.toggle("selected-only", !expanded);
    button.closest(".options-panel").dataset.expanded = String(expanded);
  }
  button.addEventListener("click", () => {
    button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    updateDisclosure();
  });
  updateDisclosure();
}
for (const id of ["ruler-guide", "field-guide", "macro-guide", "source-guide", "breakpoint-guide", "band-guide", "layout-guide"]) $(id).addEventListener("input", render);
function render() {
  const id = selectedGrid, fieldName = selectedField, width = Number($("width").value);
  const count = sourceCount;
  selectedSource = Math.min(count, selectedSource);
  sourceControls.update(count);
  const recipe = recipes[id], field = fields[fieldName];
  const layout = layoutsFor(recipe).find(l => l.set === selectedSet && (l.flow ?? "default") === selectedFlow);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const thresholds = selectedBand ? bandThresholds(recipe, fieldName, layout, selectedBand) : { expanded: parseFloat(responsive.expanded), compact: parseFloat(responsive.compact) };
  const state = width >= thresholds.expanded * rem ? "expanded" : width >= thresholds.compact * rem ? "compact" : "stacked";
  const placements = layout ? (state === "expanded" ? expandedPlacements(recipe, fieldName, layout) : compactPlacements(fieldName, layout)) : sequentialPlacements(recipe, fieldName, count, state);
  const className = ["gp_field", "doc-composition", `gp_field--${fieldName}`, id, layout?.set, layout?.flow, selectedBand && `gp_band--${selectedBand}`].filter(Boolean).join(" ");
  $("composition").className = className;
  $("composition").classList.toggle("is-stacked", state === "stacked");
  syncExampleItems($("composition"), count);
  [...$("composition").children].forEach((article, i) => {
    const placement = placements.find(p => p.item === i + 1);
    article.classList.toggle("gp_rule--end", Boolean(fieldName === "ruled" && placement && placement.lines[1] < field.end - field.start + 1));
  });
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
  $("width").setAttribute("aria-valuetext", `${width} pixels`);
  $("active-classes").textContent = className.replace("doc-composition ", "");
  $("panel-field-classes").textContent = $("active-classes").textContent;
  $("copy-field-classes").textContent = "Copy field classes";
  renderGutters({ field: fieldName, onField(value) { commit(() => { selectedField = value; }); } });
  $("rule-customization").hidden = fieldName !== "ruled";
  $("copy-rule-css").textContent = "Copy rule CSS";
  renderChoices({ id, set: selectedSet, flow: selectedFlow, count, field: fieldName, band: selectedBand, width, rem,
    onGrid: chooseGrid, onSet(value) { commit(() => refreshSets(value, selectedFlow)); }, onFlow(value) { commit(() => { selectedFlow = value; }); } });
  renderBands(readSelection(), rem, value => commit(() => { selectedBand = value; }));
  renderBoundaries({ thresholds, defaults: { compact: parseFloat(responsive.compact), expanded: parseFloat(responsive.expanded) }, rem, width,
    enabled: $("breakpoint-guide").checked, stage: $("preview-stage"), scale: $("width-scale"), steps: $("boundary-steps"), onWidth: chooseWidth });
  inspector.update({ fieldGeometry: field, placements, thresholds, state, rem, selectedSource,
    flags: { ruler: $("ruler-guide").checked, source: $("source-guide").checked, layout: $("layout-guide").checked, band: $("band-guide").checked } });
  $("summary").textContent = `${state} · preview width ${width}px · field boundaries at bits ${field.start}–${field.end} · ${field.gutter}-bit gutters`;
  const explanation = responseExplanation(readSelection(), rem);
  $("response-calculation").textContent = explanation.calculation;
  $("design-description").textContent = recipeDescription(id).description + " " + compositionDescription(id, layout?.set, layout?.flow);
  const record = audit.find(r => r.id === id && r.field === fieldName);
  $("geometry").textContent = JSON.stringify({ field, columns, placements: state === "stacked" ? "source order" : placements, migration: record ?? "No 0.2.3 comparison for this field and recipe." }, null, 2);
  const children = [...$("composition").children].map((c, i) => `    <article${c.classList.contains("gp_rule--end") ? ' class="gp_rule--end"' : ""}>Content ${i + 1}</article>`).join("\n");
  $("markup").textContent = `${selectedBand ? '<!-- Load bands.css after main.css for experimental gp_band--0* support. -->\n' : ''}<!-- Your project supplies component styling and vertical spacing. -->\n<div class="gp_canvas">\n  <section class="${className.replace("doc-composition ", "")}">\n${children}\n  </section>\n</div>`;
  const params = new URLSearchParams({ grid: id, set: layout?.set ?? "none", flow: layout?.flow ?? "default", items: count, field: fieldName, width });
  if (selectedBand) params.set("band", selectedBand);
  history.replaceState(null, "", `?${params}`);
}
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("markup").textContent); $("copy").textContent = "Copied"; }
  catch { $("copy").textContent = "Select and copy the markup below"; }
  $("control-announcement").textContent = $("copy").textContent;
});
$("copy-field-classes").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("panel-field-classes").textContent); $("copy-field-classes").textContent = "Copied field classes"; }
  catch { $("copy-field-classes").textContent = "Select and copy the field classes above"; }
  $("control-announcement").textContent = $("copy-field-classes").textContent;
});
$("copy-rule-css").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("rule-css").textContent); $("copy-rule-css").textContent = "Copied rule CSS"; }
  catch { $("copy-rule-css").textContent = "Select and copy the CSS above"; }
  $("control-announcement").textContent = $("copy-rule-css").textContent;
});
render();
