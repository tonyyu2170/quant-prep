import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two eggs, worst-case optimal: the first egg's drop gaps must shrink by one each time, so the
// smallest k with k(k+1)/2 >= floors is the answer.
export const eggDropMinTrials: ProblemTemplate = {
  id: "brainteasers/egg-drop-min-trials",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.3 }, { firm: "two-sigma", weight: 0.3 }, { firm: "optiver", weight: 0.25 }],
  source: { kind: "textbook", inspiration: "the two-egg building problem" },
  params: {
    floors: { range: { min: 30, max: 600, step: 1 } },
  },
  derived: (p) => {
    const k = Math.ceil((Math.sqrt(8 * p.floors + 1) - 1) / 2);
    return { answer: k, reach: (k * (k + 1)) / 2, shortOf: ((k - 1) * k) / 2, firstDrop: k, dropPlusOne: k + 1, oneFewer: k - 1 };
  },
  statement: (p) =>
    `You have two identical eggs and a building of ${fmtNum(p.floors)} floors. An egg dropped from at or above some unknown critical floor breaks; below it, it survives and can be reused. A broken egg is gone. Playing optimally against the worst case, how many drops do you need to guarantee you find the critical floor?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "The second egg has no choices", body: `Once the first egg breaks you must walk the second egg upward one floor at a time from just above the last safe height — anything else risks losing it without an answer.` },
    { title: "So the gaps must shrink", body: `If the first drop is from floor $k$ and it breaks, that costs $k-1$ more drops, for $k$ total. To keep the worst case at $k$, the next first-egg drop can only climb $k-1$ floors, then $k-2$, and so on.` },
    { title: "Total reach", body: `Those shrinking steps add to $\\frac{${d.firstDrop}\\times${d.dropPlusOne}}{2}=${fmtNum(d.reach)}$ floors covered with $${fmtNum(d.answer)}$ drops.` },
    { title: "Take the smallest that fits", body: `One drop fewer would reach only $\\frac{${d.oneFewer}\\times${d.answer}}{2}=${fmtNum(d.shortOf)}$ floors, short of ${fmtNum(p.floors)}. So ${fmtNum(d.answer)} drops are needed and enough.` },
    { title: "Sanity check", body: `The answer grows like the square root of the building: $${fmtNum(d.shortOf)} < ${p.floors}$ and $${p.floors} \\leq ${fmtNum(d.reach)}$ bracket it exactly.` },
  ],
  keyInsight: "Fix the worst case first and let it dictate the strategy: every first-egg drop must leave exactly enough budget for the linear search that follows, so the gaps shrink by one each time.",
  commonTrap: "Splitting the building in half. Binary search needs an egg per level of the search, and two eggs cannot pay for it.",
  expectedPaceS: 200,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
