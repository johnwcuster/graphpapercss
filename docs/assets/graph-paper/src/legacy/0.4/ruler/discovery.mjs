import { recipes, layoutsFor } from "./geometry.mjs";

const numbers = ["first", "second", "third", "fourth", "fifth", "sixth"];
const position = (index, count) => count === 2 ? ["left", "right"][index]
  : count === 3 ? ["left", "center", "right"][index] : `${numbers[index]} region`;
const list = values => values.length < 2 ? String(values[0]) : `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;

// Design vocabulary is derived from actual widths, never from numeric suffixes.
// Percentages describe design weights, not quantized field coordinates.
export function recipeDescription(id) {
  const recipe = recipes[id];
  if (!recipe) throw new Error(`Unknown recipe ${id}`);
  const { weights, columns } = recipe;
  const max = Math.max(...weights), min = Math.min(...weights), total = weights.reduce((a, b) => a + b);
  const dominant = weights.map((w, i) => w === max ? i : -1).filter(i => i >= 0);
  const emphasis = max === min ? "even" : dominant[0] === 0 ? "left" : dominant[0] === columns - 1 ? "right" : "center";
  const contrast = max / min <= 1.05 ? "equal" : max / min <= 1.5 ? "gentle" : "strong";
  const regions = weights.map((w, i) => `${position(i, columns)} ${Math.round(w / total * 1000) / 10}%`).join("; ");
  const title = emphasis === "even" ? `${columns} equal regions` : `${contrast === "gentle" ? "Gentle" : "Strong"} ${position(dominant[0], columns)} emphasis`;
  const supports = columns < 3 ? "pair" : new Set(weights.filter((_, i) => i !== dominant[0])).size === 1 ? "equal" : "varied";
  return { id, columns, emphasis, contrast, supports, title, description: `${title}. Left-to-right design proportions: ${regions}.`, weights: [...weights] };
}

export function suggestComposition(id, count) {
  const recipe = recipes[id], candidates = layoutsFor(recipe).filter(layout => layout.items === count);
  const dominant = recipe.weights.indexOf(Math.max(...recipe.weights));
  const ordinary = candidates.find(layout => !layout.flow);
  if (recipe.weights.every(w => w === recipe.weights[0])) return ordinary ?? candidates[0] ?? null;
  return candidates.find(layout => layout.states.expanded.placements.some(p => p.item === 1 && p.column[0] === dominant + 1 && p.column[1] === dominant + 2)) ?? ordinary ?? candidates[0] ?? null;
}

export function compositionDescription(id, set = null, flow = null) {
  const recipe = recipes[id];
  if (!recipe) throw new Error(`Unknown recipe ${id}`);
  if (!set) {
    if (flow && flow !== "default") throw new Error("Flow requires a named set");
    return "Items occupy macro regions from left to right in source order, continuing into later rows. Compact uses equal pairs; stacked uses full-width source order.";
  }
  const layout = layoutsFor(recipe).find(l => l.set === set && (l.flow ?? "default") === (flow ?? "default"));
  if (!layout) throw new Error(`Unsupported composition ${id}/${set}/${flow}`);
  const groups = new Map();
  for (const p of layout.states.expanded.placements) {
    const key = p.column.join(":");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return [...groups.values()].sort((a, b) => a[0].column[0] - b[0].column[0] || a[0].row[0] - b[0].row[0]).map(group => {
    group.sort((a, b) => a.row[0] - b.row[0]);
    const [start, end] = group[0].column;
    const region = end - start === recipe.columns ? "full width" : end - start === 1 ? position(start - 1, recipe.columns) : `regions ${start}–${end - 1}`;
    return `${group.length === 1 ? "Item" : "Items"} ${list(group.map(p => p.item))} ${group.length === 1 ? "occupies" : "stack in"} ${region}${group.length === 1 && group[0].row[1] - group[0].row[0] > 1 ? ` across ${group[0].row[1] - group[0].row[0]} grid rows` : ""}`;
  }).join(". ") + ". Heights remain content-driven.";
}

export const startingPoints = [
  { label: "Lead with supporting groups", grid: "grid_03a--07", set: "set_06", flow: null },
  { label: "Move the lead to the center", grid: "grid_03c--07", set: "set_06", flow: "flow_01" },
  { label: "Give six items equal width", grid: "grid_06", set: "set_06", flow: null }
];
