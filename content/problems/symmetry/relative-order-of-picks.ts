import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Any k named items land in a specified relative order with probability 1/k!, whatever n is —
// the other n-k items are irrelevant, which is the whole point.
export const relativeOrderOfPicks: ProblemTemplate = {
  id: "symmetry/relative-order-of-picks",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.3 }, { firm: "optiver", weight: 0.3 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "original", inspiration: "relative order of a named subset is uniform" },
  params: {
    picked: { choices: [3, 4, 5, 6, 7] },
    rounds: { range: { min: 120, max: 3600, step: 40 } },
  },
  derived: (p) => {
    let orders = 1;
    for (let i = 2; i <= p.picked; i++) orders *= i;
    return { orders, prob: 1 / orders, answer: p.rounds / orders, wrongOrders: orders - 1, watchedPlusOne: p.picked + 1 };
  },
  statement: (p) =>
    `A trading floor runs a daily draw that puts all its desks in a uniformly random queue. You are watching ${fmtNum(p.picked)} particular desks and have written down, in advance, the exact order you expect them to appear in relative to one another. Over ${fmtNum(p.rounds)} draws, how many times should your predicted relative order come up?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "The other desks do not matter", body: `Delete every desk you are not watching. The remaining ${fmtNum(p.picked)} keep the relative order they had, so the size of the floor is irrelevant to the question.` },
    { title: "All relative orders are equally likely", body: `A uniformly random queue induces a uniformly random ordering on any named subset — no ordering of your ${fmtNum(p.picked)} desks is favoured over another.` },
    { title: "Count them", body: `There are $${p.picked}!=${fmtNum(d.orders)}$ orderings and you named one, so each draw matches with probability $\\frac{1}{${d.orders}}=${fmtNum(d.prob)}$.` },
    { title: "Scale to the draws", body: `Expected matches: $\\frac{${p.rounds}}{${d.orders}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The other ${fmtNum(d.wrongOrders)} orderings share the remaining draws equally, and one more watched desk multiplies the orderings by ${fmtNum(d.watchedPlusOne)} — so the count drops sharply as you watch more desks.` },
  ],
  keyInsight: "A named subset of a uniformly random permutation is itself uniformly ordered, so the population size drops out of the problem entirely.",
  commonTrap: "Trying to involve the total number of desks. It cancels — the answer is 1/k! whether the floor holds ten desks or ten thousand.",
  expectedPaceS: 105,
  constants: [1],
  verify: { method: "brute-force" },
};
