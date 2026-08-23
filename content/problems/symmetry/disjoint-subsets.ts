import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Each menu item is circled by both diners with probability 1/4, so it is "clean" with
// probability 3/4 — and independence across items multiplies the chances to (3/4)^n. Printing
// 3^n and 4^n keeps the chain over exact integers rather than over a rounded power.
//
// Three axes, and the third is not padding: items and bounty alone give 104 tuples, which serve
// 62 distinct texts per 100 against a floor of 70, because consecutive seeds are correlated in
// their first draw. A run of rounds is the cheapest honest third axis.
export const disjointSubsets: ProblemTemplate = {
  id: "symmetry/disjoint-subsets",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.4 }, { firm: "optiver", weight: 0.35 }, { firm: "jane-street", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "probability two independently chosen subsets are disjoint, item by item" },
  params: {
    items: { range: { min: 4, max: 16, step: 1 } },
    bounty: { choices: [1, 2, 3, 4, 5, 10, 25, 50] },
    rounds: { choices: [2, 3, 5, 10] },
  },
  derived: (p) => {
    const p3n = Math.pow(3, p.items);
    const p4n = Math.pow(4, p.items);
    const prob = p3n / p4n;
    return { p3n, p4n, prob, payout: p.bounty * p.rounds, ev: p.bounty * p.rounds * prob };
  },
  statement: (p) =>
    `Two colleagues each fill out an ordering card for a tasting menu of ${fmtNum(p.items)} dishes: for every dish they independently toss a fair coin to decide whether to circle it, so each card is a uniformly random subset of the menu. The round is called clash-free if no dish gets circled on both cards. A team lunch pays ${fmtNum(p.bounty)} dollars into the coffee fund whenever a round is clash-free. Over ${fmtNum(p.rounds)} such rounds, what total contribution should they expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Zoom in on one dish", body: `Fix any single dish. Each colleague circles it or not, independently, giving four equally likely joint outcomes. Exactly ${fmtNum(3)} of them are harmless (circled by nobody, or by just one of the two), so this dish stays out of trouble with probability $\\frac{${fmtNum(3)}}{${fmtNum(4)}}$.` },
    { title: "Multiply across dishes", body: `The cards treat every dish independently, so the round is clash-free exactly when all ${fmtNum(p.items)} dishes are individually harmless: $\\frac{${fmtNum(d.p3n)}}{${fmtNum(d.p4n)}}=${fmtNum(d.prob)}$ — three to the power ${fmtNum(p.items)} over four to the power ${fmtNum(p.items)}.` },
    // Stated, not chained: the clash-free chance is a long decimal, and multiplying by its
    // four-figure rendering drifts off the answer — 12 times 0.04224 renders 0.5069 against an
    // answer of 0.5068. The exact 3^n over 4^n form is one step above for anyone checking it.
    { title: "Price the fund", body: `Each clash-free round pays ${fmtNum(p.bounty)} dollars, and expectations add over the ${fmtNum(p.rounds)} rounds whether or not the rounds are related, giving ${fmtNum(d.ev)} dollars in total.` },
    { title: "Sanity check", body: `Every extra dish multiplies the clash-free chance by three quarters, so the answer decays toward zero as the menu grows, starting from the full ${fmtNum(d.payout)} dollars a menu with nothing on it would pay. The total stays under that ceiling here, as it must.` },
  ],
  keyInsight: "A question about two whole subsets decomposes into identical per-item questions: each item independently survives its four-way coin toss with chance three quarters, and the product does the rest.",
  commonTrap: "Opening an inclusion-exclusion campaign over shared dishes, or computing the chance both circle a dish as one half instead of one quarter before multiplying.",
  expectedPaceS: 85,
  constants: [1, 3, 4],
  verify: { method: "brute-force" },
};
