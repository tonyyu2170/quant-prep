import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Per item there are four equally likely (in A?, in B?) states and three of them avoid an
// overlap, so independence across items gives (3/4)^n. Printing 3^n and 4^n keeps the chain
// over exact integers rather than a rounded power.
export const disjointSubsets: ProblemTemplate = {
  id: "symmetry/disjoint-subsets",
  version: 1,
  firms: [{ firm: "optiver", weight: 0.4 }, { firm: "imc", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  topic: "probability/symmetry",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "two random subsets of an n-element set being disjoint" },
  params: {
    // Three axes: two would give 104 tuples, and consecutive-seed correlation means that is not
    // enough spread for draw-space.test.ts (see the note in ants-circle-directions).
    items: { range: { min: 4, max: 16, step: 1 } },
    bounty: { choices: [1, 2, 3, 4, 5, 10, 25, 50] },
    rounds: { choices: [2, 3, 5, 10] },
  },
  derived: (p) => {
    const favourable = Math.pow(3, p.items);
    const outcomes = Math.pow(4, p.items);
    const prob = favourable / outcomes;
    return { favourable, outcomes, prob, payout: p.bounty * p.rounds, ev: p.bounty * p.rounds * prob };
  },
  statement: (p) =>
    `A tasting menu lists ${fmtNum(p.items)} dishes. Two diners each mark the dishes they want, independently, and each dish is marked by each diner with probability one half. A round is called clean if no dish was marked by both diners. The restaurant pays ${fmtNum(p.bounty)} dollars for each clean round. Over ${fmtNum(p.rounds)} rounds, what total payment should the diners expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Work dish by dish", body: `Each dish falls into one of four equally likely states: neither diner marked it, only the first did, only the second did, or both did. The dishes are handled independently, so the round factorises over them.` },
    { title: "Three of the four states are fine", body: `A round is spoiled only by the both-marked state, so each dish survives with probability three quarters. Across ${fmtNum(p.items)} dishes that is $\\frac{${fmtNum(d.favourable)}}{${fmtNum(d.outcomes)}}=${fmtNum(d.prob)}$.` },
    { title: "Scale to the run", body: `Each clean round pays ${fmtNum(p.bounty)} dollars, and expectations add over the ${fmtNum(p.rounds)} rounds whether or not the rounds are related, giving ${fmtNum(d.ev)} dollars.` },
    { title: "Sanity check", body: `The clean chance falls by a factor of three quarters per extra dish, so a longer menu makes a clean round rapidly unlikely. The total also stays below ${fmtNum(d.payout)} dollars, the payment if every round came back clean.` },
  ],
  keyInsight: "Asking about the whole pair of subsets at once invites inclusion-exclusion; asking dish by dish turns it into independent four-way choices where exactly one of the four spoils the round.",
  commonTrap: "Treating the two marked sets as chosen uniformly among all subsets of a fixed size, or summing over the overlap size with inclusion-exclusion. Each dish is decided on its own, and that independence is what makes the answer a clean power.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
};
