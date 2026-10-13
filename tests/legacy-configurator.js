import { grids } from "../src/manifest/grids.mjs";
import { responsive } from "../src/manifest/responsive.mjs";
import { sets } from "../src/manifest/sets.mjs";

const captureResponse = await fetch("./fixtures/legacy-layout-capture.json");
if (!captureResponse.ok) throw new Error("Could not load the legacy layout capture");
const capture = await captureResponse.json();

const setSelect = document.querySelector("#legacy-set-select");
const gridSelect = document.querySelector("#legacy-grid-select");
const rhythmSelect = document.querySelector("#legacy-rhythm-select");
const gridSummary = document.querySelector("#legacy-grid-summary");
const flowOptions = document.querySelector("#legacy-flow-options");
const widthInput = document.querySelector("#legacy-preview-width");
const widthOutput = document.querySelector("#legacy-width-output");
const stateOutput = document.querySelector("#legacy-state-output");
const equivalenceOutput = document.querySelector("#legacy-equivalence-output");
const frame = document.querySelector("#legacy-frame");
const openCurrent = document.querySelector("#open-current");
const markupOutput = document.querySelector("#legacy-markup-output");
const copyButton = document.querySelector("#legacy-copy-markup");
const copyStatus = document.querySelector("#legacy-copy-status");

const parameters = new URLSearchParams(window.location.search);
const requestedGrid = parameters.get("grid");
let selectedGrid = grids[requestedGrid] ? requestedGrid : "grid_03a--01";
const requestedSet = parameters.get("set");
let selectedSet = sets[requestedSet] ? requestedSet : "set_06";
const requestedFlow = parameters.get("flow");
let selectedFlow = /^flow_0[1-7]$/.test(requestedFlow ?? "") ? requestedFlow : null;
const requestedRhythm = parameters.get("rhythm");
let selectedRhythm = ["wide", "thin", "neat"].includes(requestedRhythm) ? requestedRhythm : "wide";
const requestedWidth = Number.parseInt(parameters.get("width") ?? "960", 10);
widthInput.value = String(Math.min(1200, Math.max(280, requestedWidth || 960)));

const legacyFlows = [null, 1, 2, 3, 4, 5, 6, 7].map((flow) =>
  flow === null ? null : `flow_${String(flow).padStart(2, "0")}`
);

function remToPixels(remValue) {
  return Number.parseFloat(remValue) * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function currentState(width) {
  if (width < remToPixels(responsive.compact)) return "stacked";
  if (width < remToPixels(responsive.expanded)) return "compact";
  return "expanded";
}

function flowLabel(flow) {
  return flow ?? "default";
}

function itemCount() {
  return sets[selectedSet].items;
}

function captureKey(flow) {
  const family = grids[selectedGrid].family;
  const flowValue = flow ? Number(flow.slice(-2)) : "default";
  return `${family}|${itemCount()}|${flowValue}`;
}

function placementSignature(flow) {
  return JSON.stringify(capture.configurations[captureKey(flow)].placements);
}

function equivalentFlows(flow) {
  const signature = placementSignature(flow);
  return legacyFlows.filter((candidate) => placementSignature(candidate) === signature);
}

function flowDescription(flow) {
  const equivalents = equivalentFlows(flow);
  const canonical = equivalents[0];

  if (canonical !== flow) return `Same measured placement as ${flowLabel(canonical)}`;
  if (equivalents.length > 1) {
    return `Also matches ${equivalents.slice(1).map(flowLabel).join(", ")}`;
  }
  return "Distinct measured placement";
}

function createFlowOption(flow) {
  const button = document.createElement("button");
  button.className = "legacy-flow-option";
  button.type = "button";
  button.dataset.flow = flow ?? "";
  button.setAttribute("aria-pressed", String(flow === selectedFlow));

  const label = document.createElement("code");
  label.textContent = flowLabel(flow);
  const detail = document.createElement("small");
  detail.textContent = flowDescription(flow);
  button.append(label, detail);
  return button;
}

function buildGridOptions() {
  const groups = new Map();

  for (const [gridName, grid] of Object.entries(grids)) {
    const group = groups.get(grid.columns) ?? document.createElement("optgroup");
    group.label = `${grid.columns}-column fields`;

    const option = document.createElement("option");
    option.value = gridName;
    option.textContent = `${gridName} · ${grid.lattice} tracks · ${grid.spans.join(" / ")}`;
    group.append(option);
    groups.set(grid.columns, group);
  }

  gridSelect.replaceChildren(...groups.values());
}

function selectionParameters() {
  const query = new URLSearchParams({
    grid: selectedGrid,
    set: selectedSet,
    rhythm: selectedRhythm,
    width: widthInput.value
  });
  if (selectedFlow) query.set("flow", selectedFlow);
  return query;
}

function classString() {
  const legacyRhythm = selectedRhythm === "wide" ? null : `--${selectedRhythm}`;
  return [selectedGrid, selectedSet, selectedFlow, legacyRhythm].filter(Boolean).join(" ");
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.search = selectionParameters();
  window.history.replaceState(null, "", url);
}

function renderWidth() {
  const width = Number(widthInput.value);
  frame.style.setProperty("--legacy-preview-width", `${width}px`);
  widthOutput.value = `${width}px`;
  stateOutput.textContent = currentState(width);
  openCurrent.href = `../docs/configurator.html?${selectionParameters()}`;
  updateUrl();
}

function renderSelection() {
  const grid = grids[selectedGrid];
  setSelect.value = selectedSet;
  gridSelect.value = selectedGrid;
  rhythmSelect.value = selectedRhythm;
  gridSummary.textContent = `${grid.columns} macro columns · ${grid.lattice}-track legacy recipe · spans ${grid.spans.join(" / ")}`;
  flowOptions.replaceChildren(...legacyFlows.map(createFlowOption));
  equivalenceOutput.textContent = flowDescription(selectedFlow);

  const query = selectionParameters();
  frame.src = `./legacy-preview.html?${query}`;

  const items = Array.from(
    { length: itemCount() },
    (_, index) => `  <article>Item ${index + 1}</article>`
  ).join("\n");
  markupOutput.textContent = `<section class="${classString()}">\n${items}\n</section>`;
  renderWidth();
}

setSelect.addEventListener("change", () => {
  selectedSet = setSelect.value;
  selectedFlow = null;
  renderSelection();
});

gridSelect.addEventListener("change", () => {
  selectedGrid = gridSelect.value;
  selectedFlow = null;
  renderSelection();
});

rhythmSelect.addEventListener("change", () => {
  selectedRhythm = rhythmSelect.value;
  renderSelection();
});

flowOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-flow]");
  if (!button) return;
  selectedFlow = button.dataset.flow || null;
  renderSelection();
});

widthInput.addEventListener("input", renderWidth);

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(markupOutput.textContent);
    copyStatus.textContent = "Markup copied.";
  } catch {
    copyStatus.textContent = "Copy failed. Select the displayed markup manually.";
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== frame.contentWindow || event.data?.type !== "graphpaper-legacy-height") return;
  frame.style.height = `${Math.max(320, event.data.height)}px`;
});

buildGridOptions();
renderSelection();
