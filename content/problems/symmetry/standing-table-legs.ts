import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// n uniform points on a circle contain the centre in their convex hull with probability
// 1 - n/2^(n-1). Written over integers as (2^(n-1) - n)/2^(n-1) so the printed chain is exact.
export const standingTableLegs: ProblemTemplate = {
  id: "symmetry/standing-table-legs",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "citadel", weight: 0.25 }, { firm: "jump", weight: 0.2 }],
  source: { kind: "original", inspiration: "centre-in-hull for uniform points on a circle" },
  params: {
    legs: { choices: [3, 4, 5, 6, 7, 8, 9, 10] },
    tables: { range: { min: 20, max: 400, step: 10 } },
  },
  derived: (p) => {
    let half = 1;
    for (let i = 1; i < p.legs; i++) half *= 2;
    const stands = (half - p.legs) / half;
    return { half, stands, falls: p.legs / half, answer: p.tables * stands, perCase: 1 / half, otherLegs: p.legs - 1 };
  },
  statement: (p) =>
    `A circular table has ${fmtNum(p.legs)} legs attached at points chosen independently and uniformly at random around its rim. It stands only if its centre of gravity — the centre of the circle — lies inside the convex hull of the legs. A workshop builds ${fmtNum(p.tables)} such tables. How many should stand?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Ask when it FALLS instead", body: `The centre is outside the hull exactly when every leg lies within one half of the rim — that is, when some semicircle contains all ${fmtNum(p.legs)} of them. That event is much easier to count than its complement.` },
    { title: "Anchor the semicircle", body: `If all legs fit in a semicircle, exactly one leg is the clockwise-most of the group, and it determines that semicircle. So the failures split into ${fmtNum(p.legs)} disjoint cases, one per leg that could be the anchor.` },
    { title: "Count one case", body: `Given the anchor, each of the other ${fmtNum(d.otherLegs)} legs must land in that specific half, each independently with probability one half. That is $\\frac{1}{${d.half}}=${fmtNum(d.perCase)}$ per case.` },
    { title: "Combine and complement", body: `The table falls with probability $\\frac{${p.legs}}{${d.half}}=${fmtNum(d.falls)}$, so it stands with $\\frac{${d.half}-${p.legs}}{${d.half}}=${fmtNum(d.stands)}$. Across the batch that is $\\frac{${p.tables}\\times(${d.half}-${p.legs})}{${d.half}}=${fmtNum(d.answer)}$ tables.` },
    { title: "Sanity check", body: `More legs make a fall harder to arrange: the failing probability carries ${fmtNum(p.legs)} on top but doubles its denominator with each extra leg, so it shrinks fast and $${fmtNum(d.stands)}$ climbs toward 1.` },
  ],
  keyInsight: "Count the complement when it has more structure: 'all points in some semicircle' decomposes into disjoint anchored cases, while 'centre inside the hull' does not.",
  commonTrap: "Forgetting that the anchoring leg makes the cases disjoint, and either double-counting the semicircles or treating them as overlapping and reaching for inclusion-exclusion.",
  expectedPaceS: 180,
  constants: [1],
  verify: { method: "montecarlo" },
};
