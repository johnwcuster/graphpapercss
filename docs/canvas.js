import { responsive } from "../src/manifest/responsive.mjs";

function remToPixels(remValue) {
  return Number.parseFloat(remValue) * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function stateForWidth(width) {
  if (width < remToPixels(responsive.compact)) return "stacked";
  if (width < remToPixels(responsive.expanded)) return "compact";
  return "expanded";
}

for (const guide of document.querySelectorAll("[data-lattice-guide]")) {
  const lattice = Number(guide.dataset.latticeGuide);
  guide.style.setProperty("--guide-lattice", lattice);
  guide.replaceChildren(...Array.from({ length: lattice }, () => document.createElement("i")));
}

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const width = entry.contentRect.width;
    const output = entry.target.querySelector(":scope > [data-canvas-measurement]");
    output.textContent = `${Math.round(width)}px canvas · ${stateForWidth(width)}`;
  }
});

for (const canvas of document.querySelectorAll("[data-measure-canvas]")) observer.observe(canvas);
