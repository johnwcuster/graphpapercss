import { macroLines } from "../src/geometry/ruler.mjs";
import { compactPatterns } from "../src/manifest/compact.mjs";
import { grids } from "../src/manifest/grids.mjs";
import { layouts } from "../src/manifest/layouts.mjs";

const tolerance = 0.75;

function approximately(actual, expected) {
  return Math.abs(actual - expected) <= tolerance;
}

function measurements(caseName) {
  const canvas = document.querySelector(`[data-case="${caseName}"]`);
  const grid = canvas.firstElementChild;
  const items = [...grid.children].map((item) => item.getBoundingClientRect());
  const gridRect = grid.getBoundingClientRect();

  return {
    display: getComputedStyle(grid).display,
    gap: Number.parseFloat(getComputedStyle(grid).columnGap),
    grid: gridRect,
    items,
    inset: items[0].left - gridRect.left,
    trailingInset: gridRect.right - items.at(-1).right
  };
}

function actualPlacement(item) {
  const style = getComputedStyle(item);
  return {
    lines: [Number(style.gridColumnStart), Number(style.gridColumnEnd)],
    row: [Number(style.gridRowStart), Number(style.gridRowEnd)]
  };
}

function sameRange(actual, expected) {
  return actual[0] === expected[0] && actual[1] === expected[1];
}

function createManifestFixture({ gridName, layout, standalone = false, width }) {
  const canvas = document.createElement("div");
  canvas.className = "gp_canvas";
  canvas.style.width = `${width}px`;

  const grid = document.createElement("div");
  grid.className = [gridName, layout.set, layout.flow].filter(Boolean).join(" ");
  grid.style.gridAutoRows = "10px";

  for (let item = 0; item < layout.items; item += 1) {
    const child = document.createElement("i");
    child.className = "manifest-item";
    grid.append(child);
  }

  if (standalone) {
    grid.style.width = `${width}px`;
    document.querySelector(".fixtures").append(grid);
    return { root: grid, items: [...grid.children] };
  }

  canvas.append(grid);
  document.querySelector(".fixtures").append(canvas);
  return { root: canvas, items: [...grid.children] };
}

function expectedExpandedPlacement(grid, placement) {
  const lines = macroLines(grid.spans);
  return {
    lines: [lines[placement.column[0] - 1], lines[placement.column[1] - 1]],
    row: placement.row
  };
}

function placementFailures({ compact = false, standalone = false } = {}) {
  const failures = [];
  let combinations = 0;

  for (const layout of layouts) {
    const gridEntries = Object.entries(grids).filter(([, grid]) =>
      layout.families.includes(grid.family)
    );
    const entriesToCheck = compact || standalone
      ? gridEntries.filter(([, grid], index, entries) =>
        entries.findIndex(([, candidate]) => candidate.family === grid.family) === index
      )
      : gridEntries;

    for (const [gridName, grid] of entriesToCheck) {
      const fixture = createManifestFixture({
        gridName,
        layout,
        standalone,
        width: compact ? 640 : 960
      });
      const expectedPlacements = compact
        ? compactPatterns[layout.states.compact].map(({ lines, row }) => ({ lines, row }))
        : layout.states.expanded.placements.map((placement) =>
          expectedExpandedPlacement(grid, placement)
        );
      const actualPlacements = fixture.items.map(actualPlacement);

      actualPlacements.forEach((actual, index) => {
        const expected = expectedPlacements[index];
        if (!sameRange(actual.lines, expected.lines) || !sameRange(actual.row, expected.row)) {
          failures.push({
            id: `${gridName}/${layout.set}/${layout.flow ?? "default"}/item-${index + 1}`,
            actual,
            expected
          });
        }
      });

      combinations += 1;
      fixture.root.remove();
    }
  }

  return { combinations, failures };
}

function run() {
  const checks = [];
  const check = (name, condition, details) => checks.push({ name, pass: condition, details });

  const expanded02 = measurements("expanded-02");
  check("2-column expanded state uses grid", expanded02.display === "grid", expanded02.display);
  check("2-column outer inset is 3 bits", approximately(expanded02.inset, 45), expanded02.inset);
  check("2-column 16-span width matches legacy math", approximately(expanded02.items[0].width, 690), expanded02.items[0].width);
  check("2-column 4-span width matches legacy math", approximately(expanded02.items[1].width, 150), expanded02.items[1].width);

  const expanded24 = measurements("expanded-24");
  check("24-track expanded state uses grid", expanded24.display === "grid", expanded24.display);
  check("24-track outer inset is 3 bits", approximately(expanded24.inset, 45), expanded24.inset);
  check("24-track 10-span width matches legacy math", approximately(expanded24.items[0].width, 345), expanded24.items[0].width);
  check("24-track 8-span width matches legacy math", approximately(expanded24.items[1].width, 270), expanded24.items[1].width);
  check("24-track 6-span width matches legacy math", approximately(expanded24.items[5].width, 195), expanded24.items[5].width);

  const expanded20 = measurements("expanded-20");
  check("20-track expanded state uses grid", expanded20.display === "grid", expanded20.display);
  check("20-track outer inset is 3 bits", approximately(expanded20.inset, 45), expanded20.inset);
  check("20-track 12-span width matches legacy math", approximately(expanded20.items[0].width, 510), expanded20.items[0].width);
  check("20-track 4-span width matches legacy math", approximately(expanded20.items[1].width, 150), expanded20.items[1].width);

  const expanded04 = measurements("expanded-04");
  check("4-column expanded state uses grid", expanded04.display === "grid", expanded04.display);
  check("4-column outer inset is 3 bits", approximately(expanded04.inset, 45), expanded04.inset);
  check("4-column 3-span width matches legacy math", approximately(expanded04.items[0].width, 105), expanded04.items[0].width);
  check("4-column 6-span width matches legacy math", approximately(expanded04.items[1].width, 240), expanded04.items[1].width);
  check("4-column 8-span width matches legacy math", approximately(expanded04.items[2].width, 330), expanded04.items[2].width);

  const compact = measurements("compact");
  check("compact state uses grid", compact.display === "grid", compact.display);
  check("compact outer inset remains 3 bits", approximately(compact.inset, 30), compact.inset);
  check("compact half-row width is 28 bits", approximately(compact.items[1].width, 280), compact.items[1].width);
  check("compact third-row width is 18 bits", approximately(compact.items[3].width, 180), compact.items[3].width);

  const stacked = measurements("stacked");
  check("stacked state returns to block flow", stacked.display === "block", stacked.display);
  check("stacked state uses a 1.5rem inset", approximately(stacked.inset, 24), stacked.inset);
  check("stacked items fill the content box", approximately(stacked.items[0].width, 352), stacked.items[0].width);
  check("stacked items retain DOM order", stacked.items.every((item, index, items) => index === 0 || item.top >= items[index - 1].bottom), stacked.items.map(({ top }) => top));

  const thin20 = measurements("thin-20");
  check("thin rhythm uses a 1-bit gap", approximately(thin20.gap, 15), thin20.gap);
  check("thin rhythm starts at 2 bits", approximately(thin20.inset, 30), thin20.inset);
  check("thin rhythm preserves its 3-bit trailing inset", approximately(thin20.trailingInset, 45), thin20.trailingInset);
  check("thin 20-track 16-span width closes on the ruler", approximately(thin20.items[0].width, 705), thin20.items[0].width);

  const thin24 = measurements("thin-24");
  check("thin 24-track 10-span width closes on the ruler", approximately(thin24.items[0].width, 360), thin24.items[0].width);
  check("thin 24-track 6-span width closes on the ruler", approximately(thin24.items[2].width, 210), thin24.items[2].width);

  const neat20 = measurements("neat-20");
  check("neat rhythm removes the column gap", approximately(neat20.gap, 0), neat20.gap);
  check("neat rhythm uses symmetric 2-bit insets", approximately(neat20.inset, 30) && approximately(neat20.trailingInset, 30), [neat20.inset, neat20.trailingInset]);
  check("neat 20-track 16-span width closes on the ruler", approximately(neat20.items[0].width, 720), neat20.items[0].width);

  const neat24 = measurements("neat-24");
  check("neat 24-track 10-span width closes on the ruler", approximately(neat24.items[0].width, 375), neat24.items[0].width);
  check("neat 24-track 6-span width closes on the ruler", approximately(neat24.items[2].width, 225), neat24.items[2].width);

  const nestedOuter = document.querySelector('[data-nested-grid="outer"]');
  const nestedInner = document.querySelector('[data-nested-grid="inner"]');
  const nestedOuterStyle = getComputedStyle(nestedOuter);
  const nestedInnerStyle = getComputedStyle(nestedInner);
  const nestedOuterRect = nestedOuter.getBoundingClientRect();
  const nestedInnerRect = nestedInner.getBoundingClientRect();
  check("outer thin canvas retains its 1-bit gap", approximately(Number.parseFloat(nestedOuterStyle.columnGap), 15), nestedOuterStyle.columnGap);
  check("nested canvas rebases and resets to the wide 2-bit gap", approximately(Number.parseFloat(nestedInnerStyle.columnGap), 20), nestedInnerStyle.columnGap);
  check("outer thin canvas retains its 3-bit trailing inset", approximately(nestedOuterRect.right - nestedOuter.lastElementChild.getBoundingClientRect().right, 45), nestedOuterStyle.paddingRight);
  check("nested canvas resets to the wide 3-bit trailing inset", approximately(nestedInnerRect.right - nestedInner.lastElementChild.getBoundingClientRect().right, 30), nestedInnerStyle.paddingRight);

  const subgrid20 = document.querySelector('[data-subgrid="20"]');
  const subgrid20Children = [...subgrid20.children].map((child) => child.getBoundingClientRect());
  const subgrid20Rect = subgrid20.getBoundingClientRect();
  const subgrid20Columns = getComputedStyle(subgrid20).gridTemplateColumns;
  check("20-track semantic wrapper uses subgrid", subgrid20Columns.startsWith("subgrid") && (subgrid20Columns.match(/\[\]/g) ?? []).length === 13, subgrid20Columns);
  check("20-track subgrid starts on its parent edge", approximately(subgrid20Children[0].left, subgrid20Rect.left), [subgrid20Children[0].left, subgrid20Rect.left]);
  check("20-track subgrid descendants divide the inherited span at track 6", approximately(subgrid20Children[0].right + 30, subgrid20Children[1].left), [subgrid20Children[0].right, subgrid20Children[1].left]);
  check("20-track subgrid closes on its parent edge", approximately(subgrid20Children[1].right, subgrid20Rect.right), [subgrid20Children[1].right, subgrid20Rect.right]);

  const subgrid24 = document.querySelector('[data-subgrid="24"]');
  const subgrid24Children = [...subgrid24.children].map((child) => child.getBoundingClientRect());
  const subgrid24Rect = subgrid24.getBoundingClientRect();
  const subgrid24Columns = getComputedStyle(subgrid24).gridTemplateColumns;
  check("24-track semantic wrapper uses subgrid", subgrid24Columns.startsWith("subgrid") && (subgrid24Columns.match(/\[\]/g) ?? []).length === 11, subgrid24Columns);
  check("24-track subgrid starts on its parent edge", approximately(subgrid24Children[0].left, subgrid24Rect.left), [subgrid24Children[0].left, subgrid24Rect.left]);
  check("24-track subgrid descendants preserve the parent gap", approximately(subgrid24Children[0].right + 30, subgrid24Children[1].left), [subgrid24Children[0].right, subgrid24Children[1].left]);
  check("24-track subgrid closes on its parent edge", approximately(subgrid24Children[1].right, subgrid24Rect.right), [subgrid24Children[1].right, subgrid24Rect.right]);

  const ruleStartStyle = getComputedStyle(document.querySelector('[data-treatment="rule-start"]'));
  const ruleEndStyle = getComputedStyle(document.querySelector('[data-treatment="rule-end"]'));
  const ruleStartMarker = getComputedStyle(document.querySelector('[data-treatment="rule-start"]'), "::before");
  const ruleEndMarker = getComputedStyle(document.querySelector('[data-treatment="rule-end"]'), "::after");
  const insetStyle = getComputedStyle(document.querySelector('[data-treatment="inset"]'));
  check("rule treatment exposes a customizable one-pixel marker", ruleStartMarker.width === "1px" && ruleStartMarker.backgroundColor === "rgb(18, 52, 86)", [ruleStartMarker.width, ruleStartMarker.backgroundColor]);
  check("start rule bisects the active 2-bit gutter", approximately(Number.parseFloat(ruleStartMarker.insetInlineStart), -15), ruleStartMarker.insetInlineStart);
  check("end rule bisects the active 2-bit gutter", approximately(Number.parseFloat(ruleEndMarker.insetInlineEnd), -15), ruleEndMarker.insetInlineEnd);
  check("rule markers do not alter item padding", approximately(Number.parseFloat(ruleStartStyle.paddingInlineStart), 0) && approximately(Number.parseFloat(ruleEndStyle.paddingInlineEnd), 0), [ruleStartStyle.paddingInlineStart, ruleEndStyle.paddingInlineEnd]);
  check("one-bit inset resolves against the active canvas", approximately(Number.parseFloat(insetStyle.paddingInlineStart), 15) && approximately(Number.parseFloat(insetStyle.paddingInlineEnd), 15), [insetStyle.paddingInlineStart, insetStyle.paddingInlineEnd]);

  const overridePlacement = actualPlacement(document.querySelector('[data-treatment="placement"]'));
  check("advanced placement consumes explicit column custom properties", sameRange(overridePlacement.lines, [5, 13]), overridePlacement.lines);
  check("advanced placement consumes explicit row custom properties", sameRange(overridePlacement.row, [2, 3]), overridePlacement.row);

  const opticalStyle = getComputedStyle(document.querySelector('[data-treatment="optical-layout"] .gp_optical'));
  check("optical correction uses translate without changing placement properties", opticalStyle.translate !== "none" && opticalStyle.position === "static", [opticalStyle.translate, opticalStyle.position]);

  const expandedCompatibility = placementFailures();
  check(
    `all ${expandedCompatibility.combinations} supported expanded layout/grid combinations resolve`,
    expandedCompatibility.failures.length === 0,
    expandedCompatibility.failures.slice(0, 10)
  );

  const compactCompatibility = placementFailures({ compact: true });
  check(
    `all ${compactCompatibility.combinations} normalized compact family/layout combinations resolve`,
    compactCompatibility.failures.length === 0,
    compactCompatibility.failures.slice(0, 10)
  );

  const standaloneCompatibility = placementFailures({ standalone: true });
  check(
    `all ${standaloneCompatibility.combinations} standalone family/layout combinations resolve`,
    standaloneCompatibility.failures.length === 0,
    standaloneCompatibility.failures.slice(0, 10)
  );

  const failures = checks.filter((result) => !result.pass);
  const summary = document.querySelector("#summary");
  summary.textContent = failures.length === 0
    ? `${checks.length} browser geometry checks passed.`
    : `${failures.length} of ${checks.length} browser geometry checks failed.`;
  summary.className = failures.length === 0 ? "pass" : "fail";
  document.body.dataset.status = failures.length === 0 ? "pass" : "fail";
  document.querySelector("#results").textContent = JSON.stringify(checks, null, 2);
}

run();
