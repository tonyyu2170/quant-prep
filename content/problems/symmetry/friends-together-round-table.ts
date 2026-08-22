import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(k named people adjacent at a round table of n) = k!(n-k)!/(n-1)!, which reduces to
// k! over the falling product (n-1)(n-2)...(n-k+1) — small integers, so the chain prints exactly.
export const friendsTogetherRoundTable: ProblemTemplate = {
  id: "symmetry/friends-together-round-table",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "akuna", weight: 0.3 }, { firm: "two-sigma", weight: 0.2 }],
  source: { kind: "original", inspiration: "block adjacency at a circular table, counted over sittings" },
  params: {
    seats: { range: { min: 7, max: 22, step: 1 } },
    friends: { choices: [2, 3, 4, 5] },
    parties: { choices: [40, 80, 120, 200, 300, 450, 600, 900] },
  },
  derived: (p) => {
    let blockWays = 1;
    for (let i = 2; i <= p.friends; i++) blockWays *= i;
    let falling = 1;
    for (let i = 1; i <= p.friends - 1; i++) falling *= p.seats - i;
    return { blockWays, falling, prob: blockWays / falling, answer: (p.parties * blockWays) / falling, gaps: p.seats - p.friends, others: p.seats - 1 };
  },
  statement: (p) =>
    `${fmtNum(p.seats)} people are seated uniformly at random around a circular table. ${fmtNum(p.friends)} of them are old friends and want to sit together in one unbroken block. Over ${fmtNum(p.parties)} such dinners, at how many should the friends expect to get their wish?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Fix one seat to kill the rotation", body: `At a round table only relative position matters, so pin one person down. The other ${fmtNum(d.others)} then fill distinguishable seats, and every arrangement of them is equally likely.` },
    { title: "Seat the friends one at a time", body: `Place the first friend anywhere. For the block to form, the second must take one of the seats beside them, the third must extend the block, and so on — each new friend has a shrinking set of seats that keeps the block unbroken.` },
    { title: "Count the orderings", body: `The ${fmtNum(p.friends)} friends can sit within their block in $${fmtNum(d.blockWays)}$ orders, against $${d.falling}$ ways the relevant seats could have been filled, giving $\\frac{${d.blockWays}}{${d.falling}}=${fmtNum(d.prob)}$.` },
    { title: "Count the dinners", body: `Across the ${fmtNum(p.parties)} dinners that is $\\frac{${p.parties}\\times${d.blockWays}}{${d.falling}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Adding a seat leaves ${fmtNum(d.gaps)} outsiders more room to break the block up, so the probability must fall as the table grows — and the denominator does grow with every extra seat.` },
  ],
  keyInsight: "Fixing one seat removes the rotational symmetry that makes circular counting error-prone; after that it is an ordinary ratio of arrangements.",
  commonTrap: "Using n! for the circular arrangements. Rotations of one seating are the same seating, so the count is (n-1)! and forgetting this inflates the answer by a factor of n.",
  expectedPaceS: 175,
  verify: { method: "brute-force" },
};
