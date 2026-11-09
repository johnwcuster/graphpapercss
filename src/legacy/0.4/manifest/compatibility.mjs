const twoColumnFamilies = ["02", "02a", "02b"];
const threeColumnFamilies = ["03", "03a", "03b", "03c", "03d"];
const fourColumnFamilies = ["04", "04a", "04b", "04c", "04d"];

// Candidate flow ranges come from the selectors that explicitly implement a
// flow for a set/family combination. The migration script retains a candidate
// only when its captured placement differs from that combination's default.
export const legacyFlowCandidates = [
  { families: ["02a", "02b"], sets: [3, 4, 5, 6], flows: [1] },
  { families: twoColumnFamilies, sets: [3], flows: [2, 3, 4, 5] },
  { families: twoColumnFamilies, sets: [4], flows: [2] },
  { families: twoColumnFamilies, sets: [5], flows: [2, 3, 4, 5, 6, 7] },
  { families: threeColumnFamilies, sets: [3], flows: [1] },
  { families: threeColumnFamilies, sets: [4], flows: [1, 2, 3, 4, 5, 6] },
  { families: threeColumnFamilies, sets: [5, 6], flows: [1, 2, 3, 4] },
  { families: fourColumnFamilies, sets: [4], flows: [1] },
  { families: fourColumnFamilies, sets: [6], flows: [1, 2] }
];

export const legacyFamilies = [
  ...twoColumnFamilies,
  ...threeColumnFamilies,
  ...fourColumnFamilies
];

export function candidateFlows(family, itemCount) {
  return [...new Set(
    legacyFlowCandidates
      .filter((candidate) => candidate.families.includes(family) && candidate.sets.includes(itemCount))
      .flatMap((candidate) => candidate.flows)
  )].sort((a, b) => a - b);
}
