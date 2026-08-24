import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject coin pairs sharing a factor (for which
// no largest unpayable amount exists at all) and pin a floor on the answer. It never sees
// `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));

export const frobeniusLargestUnpayable: ProblemTemplate = {
  id: "number-theory/frobenius-largest-unpayable",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the Frobenius number of two coprime denominations" },
  params: {
    coinA: { choices: [3, 4, 5, 6, 7, 8, 9, 11] },
    coinB: { choices: [5, 7, 8, 9, 10, 11, 13, 14, 17, 19] },
    extra: { choices: [2, 3, 4, 5, 6, 7, 8, 9] },
  },
  constraint: (p) => p.coinA < p.coinB && gcdOf(p.coinA, p.coinB) === 1 && p.coinA * p.coinB - p.coinA - p.coinB >= 10,
  derived: (p) => ({
    redundant: p.coinA * p.extra,
    product: p.coinA * p.coinB,
    sum: p.coinA + p.coinB,
    answer: p.coinA * p.coinB - p.coinA - p.coinB,
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A vending machine accepts tokens worth ${fmtNum(p.coinA)}, ${fmtNum(p.coinB)} and ` +
    `${fmtNum(d.redundant)} units, and gives no change. Any total you like can be assembled from ` +
    `as many tokens of each kind as you please. What is the LARGEST total that cannot be assembled at all?`,
  solution: (p, d) => [
    { title: "One token is doing no work", body: `The ${fmtNum(d.redundant)} token is already a whole number of ${fmtNum(p.coinA)} tokens, so it can be assembled from them and adds nothing that was not reachable before. A generator that its companions already reach may be discarded without changing a single total — and that leaves two denominations.` },
    { title: "Why the two remaining leave anything out", body: `The two share no factor above one. If they did, every reachable total would be a multiple of that factor and infinitely many totals would be unreachable — there would be no largest. Sharing nothing is exactly what makes the answer finite.` },
    { title: "The largest gap", body: `For two such denominations the largest unreachable total is their product less each of them: $${fmtNum(p.coinA)}\\times${fmtNum(p.coinB)}=${fmtNum(d.product)}$, and $${fmtNum(p.coinA)}+${fmtNum(p.coinB)}=${fmtNum(d.sum)}$, so the answer is $${fmtNum(d.product)}-${fmtNum(d.sum)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The largest total that cannot be assembled is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The answer sits below the product ${fmtNum(d.product)}, as it must: $${fmtNum(d.answer)}<${fmtNum(d.product)}$. And every total ABOVE it is reachable — that is what makes it the largest rather than merely one of the gaps. Adding ${fmtNum(p.coinA)} to any reachable total keeps it reachable, so once ${fmtNum(p.coinA)} totals in a row are reachable, everything after them is too.` },
  ],
  keyInsight: "Two denominations sharing no factor eventually reach every total, and the point where the gaps stop is fixed by the pair alone. The moment they share a factor the question changes completely — nothing off that factor is ever reachable, and there is no largest gap to find.",
  commonTrap: "Taking a redundant denomination at face value and hunting for a three-coin formula, when the third is already reachable and changes nothing. The other slip is subtracting only one of the two coins from the product.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [1],
};
