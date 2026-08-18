import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-set inclusion–exclusion. The Sanity check rebuilds the workforce out of the
// four disjoint commuting groups: a sign slip in the union shows up there as a
// headcount that misses the surveyed total, so the check is not self-confirming.
export const inclusionExclusionTwoSets: ProblemTemplate = {
  id: "counting/inclusion-exclusion-two-sets",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "flow", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic two-set inclusion–exclusion survey with an overlap reported separately" },
  params: {
    total: { range: { min: 24, max: 40, step: 1 } },
    bike: { range: { min: 10, max: 20, step: 1 } },
    train: { range: { min: 8, max: 18, step: 1 } },
    both: { range: { min: 3, max: 9, step: 1 } },
  },
  // both < min(bike, train) keeps each mode with a non-empty "only" group, so the
  // overlap is a genuine intersection rather than one group swallowing the other.
  // The headroom of two keeps the answer away from zero, which would read as a
  // trick rather than a count.
  constraint: (p) => p.both < Math.min(p.bike, p.train) && p.bike + p.train - p.both + 2 <= p.total,
  derived: (p) => {
    const bikeOnly = p.bike - p.both;
    const trainOnly = p.train - p.both;
    const either = p.bike + p.train - p.both;
    return {
      bikeOnly,
      trainOnly,
      either,
      neither: p.total - either,
      naiveSum: p.bike + p.train,
    };
  },
  statement: (p) =>
    `A company surveys all ${fmtNum(p.total)} of its employees about the commute. ${fmtNum(p.bike)} say they sometimes cycle in and ${fmtNum(p.train)} say they sometimes take the train — ` +
    `and ${fmtNum(p.both)} employees appear in both of those counts, because they cycle on some days and take the train on others. ` +
    `How many employees do neither: never cycle in and never take the train?`,
  answerKey: "neither",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `The two reported groups are not separate piles of people. Anyone who does both was counted once by the cyclists and once by the train takers, so the groups cannot simply be added.` },
    { title: "Count the employees who use at least one", body: `Adding gives $${fmtNum(p.bike)}+${fmtNum(p.train)}=${fmtNum(d.naiveSum)}$, which counts each of the ${fmtNum(p.both)} people who do both twice. Removing one copy of each leaves $${fmtNum(d.naiveSum)}-${fmtNum(p.both)}=${fmtNum(d.either)}$ employees who use at least one of the two.` },
    { title: "Everyone else does neither", body: `The workforce splits into those who use at least one mode and those who use neither, so the answer is $${fmtNum(p.total)}-${fmtNum(d.either)}=${fmtNum(d.neither)}$.` },
    { title: "Sanity check", body: `Rebuild the company from groups that cannot overlap: cycle only, $${fmtNum(p.bike)}-${fmtNum(p.both)}=${fmtNum(d.bikeOnly)}$; train only, $${fmtNum(p.train)}-${fmtNum(p.both)}=${fmtNum(d.trainOnly)}$; both, ${fmtNum(p.both)}; neither, ${fmtNum(d.neither)}. Nobody sits in two of those four groups and nobody sits outside all of them, so they must add back to the surveyed headcount: $${fmtNum(d.bikeOnly)}+${fmtNum(d.trainOnly)}+${fmtNum(p.both)}+${fmtNum(d.neither)}=${fmtNum(p.total)}$. Had the overlap been added instead of removed, this total would land short by twice the overlap.` },
  ],
  keyInsight: "Reported group sizes overlap, so the union is the sum minus the overlap; once the union is right, the outsiders are just the headcount minus it, and the whole population splits into disjoint blocks that must add back to the total.",
  commonTrap: "Treating the two reported counts as separate groups and subtracting their raw sum from the headcount, which removes everyone who does both a second time and understates the people who do neither.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [],
};
