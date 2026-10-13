import { grids } from "../src/manifest/grids.mjs";

const catalog = document.querySelector("#grid-catalog");
const search = document.querySelector("#grid-search");
const latticeFilter = document.querySelector("#lattice-filter");
const resultCount = document.querySelector("#result-count");
const copyStatus = document.querySelector("#copy-status");

function recipeCard(gridName, grid) {
  const card = document.createElement("article");
  card.className = "grid-recipe-card";
  card.dataset.gridName = gridName.toLowerCase();
  card.dataset.lattice = String(grid.lattice);

  const frame = document.createElement("div");
  frame.className = "catalog-thumbnail-frame";
  frame.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("div");
  canvas.className = "catalog-thumbnail-canvas gp_canvas";

  const preview = document.createElement("div");
  preview.className = gridName;

  for (let index = 0; index < grid.columns; index += 1) {
    const item = document.createElement("i");
    item.textContent = String(index + 1);
    preview.append(item);
  }

  canvas.append(preview);
  frame.append(canvas);

  const details = document.createElement("div");
  details.className = "grid-recipe-details";
  details.innerHTML = `<code>${gridName}</code><small>${grid.lattice} tracks · ${grid.spans.join(" / ")}</small>`;

  const copy = document.createElement("button");
  copy.type = "button";
  copy.dataset.copyGrid = gridName;
  copy.textContent = "Copy class";

  details.append(copy);
  card.append(frame, details);
  return card;
}

function buildCatalog() {
  for (const columns of [2, 3, 4]) {
    const section = document.createElement("section");
    section.className = "catalog-group";

    const heading = document.createElement("h2");
    heading.textContent = `${columns}-column fields`;
    const cards = document.createElement("div");
    cards.className = "catalog-cards";

    for (const [gridName, grid] of Object.entries(grids)) {
      if (grid.columns === columns) cards.append(recipeCard(gridName, grid));
    }

    section.append(heading, cards);
    catalog.append(section);
  }
}

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  const lattice = latticeFilter.value;
  let visibleCount = 0;

  for (const card of document.querySelectorAll(".grid-recipe-card")) {
    const matchesQuery = card.dataset.gridName.includes(query);
    const matchesLattice = lattice === "all" || card.dataset.lattice === lattice;
    card.hidden = !(matchesQuery && matchesLattice);
    if (!card.hidden) visibleCount += 1;
  }

  for (const group of document.querySelectorAll(".catalog-group")) {
    group.hidden = !group.querySelector(".grid-recipe-card:not([hidden])");
  }

  resultCount.textContent = String(visibleCount);
}

catalog.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-grid]");
  if (!button) return;

  try {
    await navigator.clipboard.writeText(button.dataset.copyGrid);
    copyStatus.textContent = `${button.dataset.copyGrid} copied.`;
  } catch {
    copyStatus.textContent = "Copy failed. Select the displayed class manually.";
  }
});

search.addEventListener("input", applyFilters);
latticeFilter.addEventListener("change", applyFilters);

buildCatalog();
applyFilters();
