import { ALLOWED_LATTICES, RULER_BITS, macroLines } from "./geometry/ruler.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function intervalsOverlap([aStart, aEnd], [bStart, bEnd]) {
  return aStart < bEnd && bStart < aEnd;
}

function assertPlacements({ id, itemCount, lattice, placements }) {
  assert(
    placements.length === itemCount,
    `${id}: expected ${itemCount} placements, received ${placements.length}`
  );

  const itemIndexes = placements.map(({ item }) => item).sort((a, b) => a - b);
  assert(
    itemIndexes.every((item, index) => item === index + 1),
    `${id}: every source item must be assigned exactly once`
  );

  for (const placement of placements) {
    assert(
      placement.lines[0] >= 1 && placement.lines[1] <= lattice + 1,
      `${id}: item ${placement.item} extends outside the ${lattice}-track lattice`
    );
    assert(
      placement.lines[0] < placement.lines[1],
      `${id}: item ${placement.item} has invalid column lines`
    );
    assert(
      placement.row[0] < placement.row[1],
      `${id}: item ${placement.item} has invalid row lines`
    );
  }

  for (let a = 0; a < placements.length; a += 1) {
    for (let b = a + 1; b < placements.length; b += 1) {
      const first = placements[a];
      const second = placements[b];
      const columnsOverlap = intervalsOverlap(first.lines, second.lines);
      const rowsOverlap = intervalsOverlap(first.row, second.row);

      assert(
        !(columnsOverlap && rowsOverlap),
        `${id}: items ${first.item} and ${second.item} overlap`
      );
    }
  }
}

export function resolvedPlacements(grid, state) {
  const lines = macroLines(grid.spans);

  return state.placements.map((placement) => {
    if (placement.lines) {
      return placement;
    }

    const macroRange = Array.isArray(placement.column)
      ? placement.column
      : [placement.column, placement.column + 1];

    return {
      ...placement,
      lines: [lines[macroRange[0] - 1], lines[macroRange[1] - 1]]
    };
  });
}

export function validateManifest({ compactPatterns, grids, layouts, rhythms, sets }) {
  for (const [name, grid] of Object.entries(grids)) {
    assert(ALLOWED_LATTICES.has(grid.lattice), `${name}: unsupported lattice`);
    assert(grid.columns === grid.spans.length, `${name}: columns do not match spans`);
    assert(grid.spans.every(Number.isInteger), `${name}: spans must be integers`);
    assert(grid.spans.every((span) => span > 0), `${name}: spans must be positive`);
    assert(
      grid.spans.reduce((sum, span) => sum + span, 0) === grid.lattice,
      `${name}: spans must sum to the lattice`
    );
  }

  for (const [name, set] of Object.entries(sets)) {
    assert(Number.isInteger(set.items) && set.items > 0, `${name}: invalid item count`);
  }

  for (const [name, rhythm] of Object.entries(rhythms)) {
    for (const [latticeText, track] of Object.entries(rhythm.tracks)) {
      const lattice = Number(latticeText);
      const total =
        rhythm.paddingStart +
        rhythm.paddingEnd +
        (lattice - 1) * rhythm.gap +
        lattice * track;

      assert(Math.abs(total - RULER_BITS) < 1e-9, `${name}/${lattice}: ruler does not close`);
      assert(track > 0, `${name}/${lattice}: track width must be positive`);
    }
  }

  const knownFamilies = new Set(Object.values(grids).map(({ family }) => family));
  const compatibilityKeys = new Set();

  for (const layout of layouts) {
    assert(sets[layout.set], `${layout.id}: unknown set ${layout.set}`);
    assert(sets[layout.set].items === layout.items, `${layout.id}: set count mismatch`);
    assert(layout.states.stacked?.sourceOrder, `${layout.id}: stacked state must use source order`);
    assert(compactPatterns[layout.states.compact], `${layout.id}: unknown compact pattern`);
    assert(layout.families.length > 0, `${layout.id}: no grid families`);

    for (const family of layout.families) {
      assert(knownFamilies.has(family), `${layout.id}: unknown family ${family}`);
      const compatibilityKey = `${family}|${layout.set}|${layout.flow ?? "default"}`;
      assert(!compatibilityKeys.has(compatibilityKey), `${layout.id}: duplicate compatibility entry`);
      compatibilityKeys.add(compatibilityKey);

      for (const [gridName, grid] of Object.entries(grids)) {
        if (grid.family !== family) continue;

        const expanded = resolvedPlacements(grid, layout.states.expanded);
        assertPlacements({
          id: `${layout.id}/${gridName}/expanded`,
          itemCount: layout.items,
          lattice: grid.lattice,
          placements: expanded
        });
      }
    }

    const compact = resolvedPlacements(
      { spans: [24] },
      { placements: compactPatterns[layout.states.compact] }
    );
    assertPlacements({
      id: `${layout.id}/compact`,
      itemCount: layout.items,
      lattice: 24,
      placements: compact
    });
  }

  for (const family of knownFamilies) {
    for (const setName of Object.keys(sets)) {
      assert(
        compatibilityKeys.has(`${family}|${setName}|default`),
        `${family}/${setName}: missing default layout`
      );
    }
  }
}

export function validateGeneratedCss(css) {
  assert(css.includes("box-sizing: border-box"), "generated CSS must define its box model");
  assert(css.includes("container-name: gp-canvas"), "generated CSS must name its query container");
  assert(!css.includes("!important"), "generated CSS must not contain !important");

  const forbiddenGlobals = ["body", "h1", "h2", "p", "a", "header", "footer", "form", "main", "article"];
  const selectorBlocks = css.match(/[^{}]+(?=\s*\{)/g) ?? [];

  for (const block of selectorBlocks) {
    const selector = block.trim();
    if (selector.startsWith("@") || selector.startsWith("/*")) continue;

    for (const element of forbiddenGlobals) {
      const globalPattern = new RegExp(`(^|,)\\s*${element}(?=\\s|,|\\{|$)`);
      assert(!globalPattern.test(selector), `generated CSS contains global ${element} selector`);
    }
  }
}

export function validateLegacyGridCoverage(grids, legacyGeometry) {
  const manifestNames = Object.keys(grids).sort();
  const legacyNames = Object.keys(legacyGeometry).sort();

  assert(
    JSON.stringify(manifestNames) === JSON.stringify(legacyNames),
    "grid manifest must cover exactly the concrete legacy grid recipes"
  );

  for (const gridName of manifestNames) {
    const actual = grids[gridName];
    const legacy = legacyGeometry[gridName];
    assert(actual.lattice === legacy.lattice, `${gridName}: lattice differs from legacy CSS`);
    assert(
      JSON.stringify(actual.spans) === JSON.stringify(legacy.spans),
      `${gridName}: spans differ from legacy CSS`
    );
  }
}
