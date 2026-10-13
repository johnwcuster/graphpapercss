import { grids } from "../src/manifest/grids.mjs";
import { sets } from "../src/manifest/sets.mjs";

const parameters = new URLSearchParams(window.location.search);
const gridName = grids[parameters.get("grid")] ? parameters.get("grid") : "grid_03a--01";
const setName = sets[parameters.get("set")] ? parameters.get("set") : "set_06";
const requestedFlow = parameters.get("flow");
const flowName = /^flow_0[1-7]$/.test(requestedFlow ?? "") ? requestedFlow : null;
const requestedRhythm = parameters.get("rhythm");
const rhythmName = ["thin", "neat"].includes(requestedRhythm) ? `--${requestedRhythm}` : null;
const preview = document.querySelector("#legacy-preview-grid");

preview.className = [gridName, setName, flowName, rhythmName].filter(Boolean).join(" ");
[...preview.children].forEach((item, index) => {
  item.hidden = index >= sets[setName].items;
});

function reportHeight() {
  window.parent.postMessage({
    type: "graphpaper-legacy-height",
    height: document.documentElement.scrollHeight
  }, "*");
}

new ResizeObserver(reportHeight).observe(document.documentElement);
reportHeight();
