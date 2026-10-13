import { grids } from "../src/manifest/grids.mjs";
import { rhythms } from "../src/geometry/rhythms.mjs";
import { layouts } from "../src/manifest/layouts.mjs";
import { responsive } from "../src/manifest/responsive.mjs";
import { sets } from "../src/manifest/sets.mjs";

const setSelect = document.querySelector("#set-select");
const gridSelect = document.querySelector("#grid-select");
const rhythmSelect = document.querySelector("#rhythm-select");
const treatmentSelect = document.querySelector("#treatment-select");
const gridSummary = document.querySelector("#grid-summary");
const flowOptions = document.querySelector("#flow-options");
const previewGrid = document.querySelector("#preview-grid");
const previewCanvas = document.querySelector("#preview-canvas");
const previewShell = document.querySelector("#preview-shell");
const widthInput = document.querySelector("#preview-width");
const widthOutput = document.querySelector("#width-output");
const stateOutput = document.querySelector("#state-output");
const metadataOutput = document.querySelector("#metadata-output");
const markupOutput = document.querySelector("#markup-output");
const openLegacy = document.querySelector("#open-legacy");
const copyButton = document.querySelector("#copy-markup");
const copyStatus = document.querySelector("#copy-status");
const guideToggles = [...document.querySelectorAll("[data-guide]")];
const latticeGuide = document.querySelector("#lattice-guide");
const macroGuide = document.querySelector("#macro-guide");

const parameters = new URLSearchParams(window.location.search);
const requestedGrid = parameters.get("grid");
let selectedGrid = grids[requestedGrid] ? requestedGrid : "grid_03a--01";
const requestedSet = parameters.get("set");
let selectedSet = sets[requestedSet] ? requestedSet : "set_06";
let selectedFlow = parameters.get("flow");
const requestedRhythm = parameters.get("rhythm");
let selectedRhythm = rhythms[requestedRhythm] ? requestedRhythm : "wide";
let selectedTreatment = parameters.get("treatment") === "rule" ? "rule" : "none";
const requestedWidth = Number.parseInt(parameters.get("width") ?? "960", 10);
widthInput.value = String(Math.min(1200, Math.max(280, requestedWidth || 960)));
const requestedGuides = parameters.get("guides");
if (requestedGuides !== null) {
  const visibleGuides = new Set(requestedGuides.split(",").filter(Boolean));
  for (const toggle of guideToggles) toggle.checked = visibleGuides.has(toggle.dataset.guide);
}

function remToPixels(remValue) {
  return Number.parseFloat(remValue) * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function currentState(width) {
  if (width < remToPixels(responsive.compact)) return "stacked";
  if (width < remToPixels(responsive.expanded)) return "compact";
  return "expanded";
}

function updateUrl() {
  const next = new URL(window.location.href);
  next.searchParams.set("grid", selectedGrid);
  next.searchParams.set("set", selectedSet);
  if (selectedFlow) next.searchParams.set("flow", selectedFlow);
  else next.searchParams.delete("flow");
  next.searchParams.set("rhythm", selectedRhythm);
  if (selectedTreatment === "rule") next.searchParams.set("treatment", "rule");
  else next.searchParams.delete("treatment");
  next.searchParams.set("width", widthInput.value);
  next.searchParams.set("guides", guideToggles.filter(({ checked }) => checked).map(({ dataset }) => dataset.guide).join(","));
  window.history.replaceState(null, "", next);
  openLegacy.href = `../tests/legacy-configurator.html?${next.searchParams}`;
}

function compatibleLayouts() {
  const family = grids[selectedGrid].family;
  return layouts.filter((layout) =>
    layout.set === selectedSet && layout.families.includes(family)
  );
}

function ensureCompatibleFlow() {
  if (!compatibleLayouts().some((layout) => layout.flow === selectedFlow)) {
    selectedFlow = null;
  }
}

function flowLabel(flow) {
  return flow ?? "default";
}

function expandedPlacementSignature(layout) {
  return JSON.stringify(layout.states.expanded.placements);
}

function flowDescription(layout) {
  const equivalentLayouts = compatibleLayouts().filter((candidate) =>
    expandedPlacementSignature(candidate) === expandedPlacementSignature(layout)
  );
  const canonical = equivalentLayouts[0];

  if (canonical !== layout) {
    return `Expanded alias of ${flowLabel(canonical.flow)}`;
  }

  if (equivalentLayouts.length > 1) {
    const aliases = equivalentLayouts.slice(1).map(({ flow }) => flowLabel(flow)).join(", ");
    return `Also used by ${aliases}`;
  }

  return layout.flow ? `${layout.items}-item recipe` : "No flow class";
}

function createFlowOption(layout) {
  const button = document.createElement("button");
  button.className = "recipe-option flow-option";
  button.type = "button";
  button.dataset.flow = layout.flow ?? "";
  button.setAttribute("aria-pressed", String(layout.flow === selectedFlow));

  const frame = document.createElement("span");
  frame.className = "thumbnail-frame";
  frame.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("span");
  canvas.className = `thumbnail-canvas ${canvasClassString()}`;
  const preview = document.createElement("span");
  preview.className = [selectedGrid, selectedSet, layout.flow].filter(Boolean).join(" ");

  for (let item = 1; item <= layout.items; item += 1) {
    const block = document.createElement("i");
    block.className = treatmentClassForItem(item - 1, layout.items);
    block.textContent = String(item);
    preview.append(block);
  }

  const label = document.createElement("code");
  label.textContent = flowLabel(layout.flow);
  const detail = document.createElement("small");
  detail.textContent = flowDescription(layout);

  canvas.append(preview);
  frame.append(canvas);
  button.append(frame, label, detail);
  return button;
}

function renderFlowOptions() {
  flowOptions.replaceChildren(...compatibleLayouts().map(createFlowOption));
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

function classString() {
  return [
    selectedGrid,
    selectedSet,
    selectedFlow,
    selectedTreatment === "rule" ? "gp_treatment--rule" : null
  ].filter(Boolean).join(" ");
}

function treatmentClassForItem(index, itemCount) {
  if (selectedTreatment !== "rule") return "";
  if (index === 0) return "gp_rule--end";
  if (index === itemCount - 1) return "gp_rule--start";
  return "";
}

function canvasClassString() {
  return selectedRhythm === "wide"
    ? "gp_canvas"
    : `gp_canvas gp_rhythm--${selectedRhythm}`;
}

function renderGuides() {
  const grid = grids[selectedGrid];
  const state = currentState(previewShell.getBoundingClientRect().width);
  const activeLattice = state === "compact" ? 24 : grid.lattice;
  const layers = new Map(
    [...document.querySelectorAll("[data-guide-layer]")].map((layer) => [layer.dataset.guideLayer, layer])
  );

  for (const toggle of guideToggles) {
    if (toggle.dataset.guide === "source") {
      previewCanvas.dataset.sourceLabels = String(toggle.checked);
    } else {
      const unavailable =
        (toggle.dataset.guide === "lattice" && state === "stacked") ||
        (toggle.dataset.guide === "macro" && state !== "expanded");
      layers.get(toggle.dataset.guide).hidden = !toggle.checked || unavailable;
    }
  }

  latticeGuide.style.setProperty("--guide-lattice", activeLattice);
  latticeGuide.replaceChildren(...Array.from({ length: activeLattice }, () => document.createElement("i")));

  macroGuide.style.setProperty("--guide-lattice", grid.lattice);
  let start = 1;
  const macroColumns = grid.spans.map((span, index) => {
    const column = document.createElement("i");
    column.style.gridColumn = `${start} / span ${span}`;
    column.textContent = `${index + 1} · ${span}`;
    start += span;
    return column;
  });
  macroGuide.replaceChildren(...macroColumns);
}

function renderPreview() {
  const grid = grids[selectedGrid];
  const width = Number.parseInt(widthInput.value, 10);
  const itemCount = sets[selectedSet].items;

  previewCanvas.className = canvasClassString();
  previewGrid.className = classString();
  previewShell.style.setProperty("--preview-width", `${width}px`);
  widthOutput.value = `${width}px`;
  gridSummary.textContent = `${grid.columns} macro columns · ${grid.lattice}-track lattice · spans ${grid.spans.join(" / ")}`;
  metadataOutput.textContent = `${grid.lattice}-track lattice · ${selectedRhythm} rhythm · ${selectedTreatment} treatment · ${flowLabel(selectedFlow)}`;

  [...previewGrid.children].forEach((item, index) => {
    item.hidden = index >= itemCount;
    item.classList.toggle("gp_rule--end", treatmentClassForItem(index, itemCount) === "gp_rule--end");
    item.classList.toggle("gp_rule--start", treatmentClassForItem(index, itemCount) === "gp_rule--start");
  });

  const itemMarkup = Array.from(
    { length: itemCount },
    (_, index) => {
      const treatmentClass = treatmentClassForItem(index, itemCount);
      const classAttribute = treatmentClass ? ` class="${treatmentClass}"` : "";
      return `    <article${classAttribute}>Item ${index + 1}</article>`;
    }
  ).join("\n");
  markupOutput.textContent = `<main class="${canvasClassString()}">\n  <section class="${classString()}">\n${itemMarkup}\n  </section>\n</main>`;

  renderGuides();
  updateUrl();
}

function renderSelection() {
  ensureCompatibleFlow();
  setSelect.value = selectedSet;
  gridSelect.value = selectedGrid;
  rhythmSelect.value = selectedRhythm;
  treatmentSelect.value = selectedTreatment;
  renderFlowOptions();
  renderPreview();
}

new ResizeObserver(([entry]) => {
  stateOutput.textContent = currentState(entry.contentRect.width);
  renderGuides();
}).observe(previewShell);

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

treatmentSelect.addEventListener("change", () => {
  selectedTreatment = treatmentSelect.value;
  renderSelection();
});

flowOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-flow]");
  if (!button) return;
  selectedFlow = button.dataset.flow || null;
  renderSelection();
});

widthInput.addEventListener("input", renderPreview);

for (const toggle of guideToggles) toggle.addEventListener("change", renderPreview);

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(markupOutput.textContent);
    copyStatus.textContent = "Markup copied.";
  } catch {
    copyStatus.textContent = "Copy failed. Select the displayed markup manually.";
  }
});

buildGridOptions();
ensureCompatibleFlow();
renderSelection();
