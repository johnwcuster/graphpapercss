const families = [
  ["02", "grid_02"],
  ["02a", "grid_02a"],
  ["02b", "grid_02b"],
  ["03", "grid_03"],
  ["03a", "grid_03a"],
  ["03b", "grid_03b"],
  ["03c", "grid_03c"],
  ["03d", "grid_03d"],
  ["04", "grid_04"],
  ["04a", "grid_04a"],
  ["04b", "grid_04b"],
  ["04c", "grid_04c"],
  ["04d", "grid_04d--01"]
];
const sets = [3, 4, 5, 6];
const flows = [null, 1, 2, 3, 4, 5, 6, 7];
const root = document.querySelector("#capture-root");

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function createFixtures() {
  for (const [family, gridClass] of families) {
    for (const itemCount of sets) {
      for (const flow of flows) {
        const grid = document.createElement("div");
        grid.className = [
          "capture-grid",
          gridClass,
          `set_${twoDigits(itemCount)}`,
          flow ? `flow_${twoDigits(flow)}` : ""
        ].filter(Boolean).join(" ");
        grid.dataset.key = `${family}|${itemCount}|${flow ?? "default"}`;

        for (let item = 1; item <= itemCount; item += 1) {
          grid.append(document.createElement("i"));
        }

        root.append(grid);
      }
    }
  }
}

function closestLine(position, lines) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  lines.forEach((line, index) => {
    const distance = Math.abs(position - line);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });

  if (bestDistance > 1) throw new Error(`Could not resolve grid line: ${bestDistance}px away`);
  return bestIndex + 1;
}

function measureGrid(grid) {
  const style = getComputedStyle(grid);
  const gridRect = grid.getBoundingClientRect();
  const paddingLeft = Number.parseFloat(style.paddingLeft);
  const paddingTop = Number.parseFloat(style.paddingTop);
  const gap = Number.parseFloat(style.columnGap);
  const columnWidths = style.gridTemplateColumns
    .split(" ")
    .map(Number.parseFloat)
    .filter(Number.isFinite);
  const columnStarts = [gridRect.left + paddingLeft];
  const columnEnds = [];

  for (const width of columnWidths) {
    const start = columnStarts.at(-1);
    columnEnds.push(start + width);
    columnStarts.push(start + width + gap);
  }
  columnStarts.pop();

  const contentTop = gridRect.top + paddingTop;
  const placements = [...grid.children].map((item, index) => {
    const rect = item.getBoundingClientRect();
    return {
      item: index + 1,
      column: [
        closestLine(rect.left, columnStarts),
        closestLine(rect.right, columnEnds) + 1
      ],
      row: [
        Math.round((rect.top - contentTop) / 10) + 1,
        Math.round((rect.bottom - contentTop) / 10) + 1
      ]
    };
  });

  return {
    columns: columnWidths.length,
    placements
  };
}

async function capture() {
  createFixtures();

  const inventoryResponse = await fetch("./fixtures/legacy-inventory.json");
  if (!inventoryResponse.ok) throw new Error("Could not read the legacy CSS inventory");
  const inventory = await inventoryResponse.json();

  const configurations = {};
  for (const grid of root.children) {
    configurations[grid.dataset.key] = measureGrid(grid);
  }

  const payload = {
    schemaVersion: 1,
    source: {
      path: "tests/fixtures/legacy-main.css",
      sha256: inventory.source.sha256
    },
    viewport: { width: innerWidth, height: innerHeight },
    state: innerWidth >= 960 ? "expanded" : innerWidth >= 480 ? "compact" : "stacked",
    configurations
  };

  const response = await fetch("/__graphpaper_capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Capture failed: ${response.status}`);
  document.body.dataset.status = "pass";
  document.querySelector("#status").textContent = `${Object.keys(configurations).length} configurations captured.`;
}

capture().catch((error) => {
  document.body.dataset.status = "fail";
  document.querySelector("#status").textContent = error.stack;
});
