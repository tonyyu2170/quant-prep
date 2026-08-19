import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Hypergeometric "all of one kind" via a ratio of subset counts. The Sanity check
// prices the same event with replacement — a genuinely different model — and the
// without-replacement answer must come in strictly under it.
export const allOneTypeDraw: ProblemTemplate = {
  id: "counting/all-one-type-draw",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "citadel-securities", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic without-replacement draw: probability every item taken is of one kind" },
  params: {
    ripe: { range: { min: 4, max: 9, step: 1 } },
    hard: { range: { min: 3, max: 6, step: 1 } },
    grab: { range: { min: 2, max: 4, step: 1 } },
  },
  // grab <= ripe-2 leaves at least two ripe avocados behind, so the favourable
  // count is a real choice rather than the single "take every ripe one" outcome.
  constraint: (p) => p.grab <= p.ripe - 2,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const total = p.ripe + p.hard;
    const waysRipe = choose(p.ripe, p.grab);
    const waysAny = choose(total, p.grab);
    const ripeShare = p.ripe / total;
    return {
      total,
      waysRipe,
      waysAny,
      prob: waysRipe / waysAny,
      ripeShare,
      withRepl: Math.pow(ripeShare, p.grab),
    };
  },
  statement: (p, d) =>
    `A restaurant kitchen keeps a crate of ${fmtNum(d.total)} avocados: ${fmtNum(p.ripe)} are ripe and the other ${fmtNum(p.hard)} are still hard. ` +
    `The chef reaches in without looking and lifts out ${fmtNum(p.grab)} of them in one handful. What is the probability that every avocado in that handful is ripe?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `One handful of ${fmtNum(p.grab)} is an unordered group, and reaching in without looking makes every such group equally likely. So the probability is just the share of groups that happen to be all ripe.` },
    { title: "Count the handfuls that win", body: `An all-ripe handful draws its ${fmtNum(p.grab)} avocados entirely from the ${fmtNum(p.ripe)} ripe ones, and there are $\\binom{${fmtNum(p.ripe)}}{${fmtNum(p.grab)}}=${fmtNum(d.waysRipe)}$ ways to do that.` },
    { title: "Count all handfuls and divide", body: `Ignoring ripeness, the handful is any ${fmtNum(p.grab)} of the ${fmtNum(d.total)} avocados: $\\binom{${fmtNum(d.total)}}{${fmtNum(p.grab)}}=${fmtNum(d.waysAny)}$ of them. The probability is $${fmtNum(d.waysRipe)}/${fmtNum(d.waysAny)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Price a different experiment: the chef takes one avocado, looks at it, drops it back, and repeats. Each look is ripe with probability $${fmtNum(p.ripe)}/${fmtNum(d.total)}=${fmtNum(d.ripeShare)}$, so that experiment would answer $\\left(\\frac{${fmtNum(p.ripe)}}{${fmtNum(d.total)}}\\right)^{${fmtNum(p.grab)}}=${fmtNum(d.withRepl)}$. In the real crate nothing goes back, so each ripe avocado already taken leaves the crate slightly less ripe and every later pick is harder — the true answer must land strictly under the replacement figure, and $${fmtNum(d.prob)} < ${fmtNum(d.withRepl)}$.` },
  ],
  keyInsight: "When items are taken all at once, the outcome is a subset rather than a sequence, so both the favourable and the total tallies are plain subset counts and the probability is the ratio of the two with no ordering correction anywhere.",
  commonTrap: "Raising the ripe fraction to the size of the handful, which quietly assumes each avocado is put back before the next is taken; every ripe one removed depletes the crate, so the real chance is strictly lower than that.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [],
};
