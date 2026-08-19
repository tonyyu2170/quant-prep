import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Birthday-style collision through the all-different complement. The Sanity check
// adds up the per-pair collision chances, an upper bound that double counts
// assignments where two pairs collide at once — so the answer must sit strictly
// under it, and an answer computed without the complement typically will not.
export const birthdayCollision: ProblemTemplate = {
  id: "counting/birthday-collision",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "birthday-problem collision probability on a small calendar of slots" },
  params: {
    slots: { choices: [7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 30] },
    hires: { range: { min: 3, max: 4, step: 1 } },
  },
  // More slots than pairs of analysts keeps the pair bound below certainty, so the
  // Sanity check reads as a real bound rather than a vacuous one; the size cap keeps
  // the Python enumeration of every assignment under a hundred thousand.
  constraint: (p) => (p.hires * (p.hires - 1)) / 2 < p.slots && Math.pow(p.slots, p.hires) < 1e5,
  derived: (p) => {
    const outcomes = Math.pow(p.slots, p.hires);
    let distinctWays = 1;
    for (let i = 0; i < p.hires; i++) distinctWays *= p.slots - i;
    const allDistinct = distinctWays / outcomes;
    const pairs = (p.hires * (p.hires - 1)) / 2;
    return {
      outcomes,
      distinctWays,
      allDistinct,
      prob: 1 - allDistinct,
      lastFactor: p.slots - p.hires + 1,
      pairs,
      pairChance: 1 / p.slots,
      pairBound: pairs / p.slots,
    };
  },
  statement: (p) =>
    `A firm books ${fmtNum(p.slots)} orientation sessions and assigns each of its ${fmtNum(p.hires)} new analysts to one of them, picking every analyst's session at random and independently of the others. ` +
    `Sessions have no capacity limit, so any number of analysts can land in the same one. What is the probability that at least two analysts share a session?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Each analyst is assigned independently, so there are $${fmtNum(p.slots)}^{${fmtNum(p.hires)}}=${fmtNum(d.outcomes)}$ equally likely assignments. "At least two share" lumps together several patterns of sharing; its opposite, "every analyst in a different session", is one clean pattern.` },
    { title: "Count the assignments with no sharing", body: `Seat the analysts one at a time: the first has all ${fmtNum(p.slots)} sessions open, the second must avoid one, the next must avoid two, and so on down to ${fmtNum(d.lastFactor)} open sessions for the last. That gives $${fmtNum(d.distinctWays)}$ assignments with no two analysts together, a probability of $${fmtNum(d.distinctWays)}/${fmtNum(d.outcomes)}=${fmtNum(d.allDistinct)}$.` },
    { title: "Take the complement", body: `Every other assignment has at least one shared session, so the answer is $1-\\frac{${fmtNum(d.distinctWays)}}{${fmtNum(d.outcomes)}}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Bound it a different way. There are ${fmtNum(d.pairs)} pairs of analysts, and a given pair lands in the same session with probability $1/${fmtNum(p.slots)}=${fmtNum(d.pairChance)}$, so adding across pairs gives ${fmtNum(d.pairBound)}. An assignment where two different pairs collide is counted twice in that sum, so it can only overshoot — the answer must sit strictly below it, and $${fmtNum(d.prob)} < ${fmtNum(d.pairBound)}$.` },
  ],
  keyInsight: "Collision questions are easier from the other side: the no-collision count is a plain falling product because each new arrival simply has fewer free slots, while the collision event itself splits into many overlapping patterns.",
  commonTrap: "Adding up the per-pair collision chances and calling that the answer, which counts assignments with several colliding pairs more than once and, with enough people, would exceed certainty.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
