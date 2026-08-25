import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Both per-flip factors 2p and 2(1-p) are exact two-decimal numbers, so the likelihood ratio is
// ONE chain of two exact bases raised to whole-number powers, evaluated once. The head count is
// the drawn offset from half the flips, so the ratio ranges across four decades either side of
// one; `constraint` keeps it inside [1e-3, 1e5] — readable, and inside fmtNum's window. The
// crossover fraction where the ratio is one is a logarithm and prints as a label only.
const lrOf = (par: { p1Pct: number; n: number; off: number }) =>
  Math.pow((2 * par.p1Pct) / 100, par.n / 2 + par.off) * Math.pow(2 * (1 - par.p1Pct / 100), par.n / 2 - par.off);

export const likelihoodRatioForABiasedCoin: ProblemTemplate = {
  id: "statistics/likelihood-ratio-for-a-biased-coin",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the likelihood ratio of two simple hypotheses about a coin" },
  params: {
    p1Pct: { choices: [55, 60, 65, 70, 75, 80] },
    n: { choices: [8, 10, 12, 16, 20, 24, 30, 40] },
    off: { choices: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 8, 10] },
  },
  constraint: (p) => p.n / 2 + p.off >= 1 && p.n / 2 + p.off <= p.n - 1 && lrOf(p as { p1Pct: number; n: number; off: number }) >= 1e-3 && lrOf(p as { p1Pct: number; n: number; off: number }) <= 1e5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const p1 = round(p.p1Pct / 100);
    const q1 = round(1 - p1);
    const headsFactor = round(2 * p1);
    const tailsFactor = round(2 * q1);
    const k = p.n / 2 + p.off;
    return {
      p1,
      q1,
      headsFactor,
      tailsFactor,
      k,
      tails: p.n - k,
      pHat: round(k / p.n),
      crossover: round(Math.log(1 / tailsFactor) / Math.log(headsFactor / tailsFactor)),
      answer: round(Math.pow(headsFactor, k) * Math.pow(tailsFactor, p.n - k)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A coin is one of two kinds: fair, or biased to land heads with probability ${fmtNum(d.p1)}. It is flipped ${fmtNum(p.n)} times and shows ${fmtNum(d.k)} heads. ` +
    `What is the likelihood ratio of the biased hypothesis to the fair one — the probability of this outcome if the coin is biased, divided by its probability if the coin is fair?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Two simple hypotheses, one ratio", body: `Each hypothesis gives the outcome a definite probability, and the binomial coefficient counting the orderings is the same under both, so it cancels: $L=\\dfrac{p_1^{k}(1-p_1)^{n-k}}{(1/2)^{n}}$. The ratio is the whole of the evidence the flips carry between these two coins — Neyman and Pearson's point is that no other summary of the data does better.` },
    { title: "Per flip", body: `Distribute the fair coin's $(1/2)^{n}$ across the flips, one half per flip. Each head then multiplies the ratio by $2\\times${fmtNum(d.p1)}=${fmtNum(d.headsFactor)}$ and each tail by $2\\times${fmtNum(d.q1)}=${fmtNum(d.tailsFactor)}$: heads are evidence for the bias, tails against it.` },
    { title: "Answer", body: `With ${fmtNum(d.k)} heads and ${fmtNum(d.tails)} tails, $${fmtNum(d.headsFactor)}^{${fmtNum(d.k)}}\\times${fmtNum(d.tailsFactor)}^{${fmtNum(d.tails)}}=${fmtNum(d.answer)}$. ${d.answer > 1 ? "The outcome is that many times more probable under the bias than under fairness." : "The outcome is more probable under fairness: the ratio is below one."}` },
    { title: "Sanity check", body: `The ratio crosses one at a heads fraction of about ${fmtNum(d.crossover)}, above which the evidence favours the bias. Here the observed fraction is $\\dfrac{${fmtNum(d.k)}}{${fmtNum(p.n)}}=${fmtNum(d.pHat)}$, ${d.pHat > d.crossover ? "above the crossover, and the ratio is above one" : "below the crossover, and the ratio is below one"}. With even prior odds on the two coins, the posterior odds ARE this ratio — Bayes' rule with the same two likelihoods.` },
  ],
  keyInsight: "Between two fully specified hypotheses the likelihood ratio is the complete evidence, built one observation at a time as a product of per-observation factors. Heads that are likelier under the bias push it up, tails push it down, and the crossover fraction is where the two pulls balance — not at one half, because the two hypotheses are not symmetric about it.",
  commonTrap: "Comparing the observed fraction to one half rather than to the crossover, or multiplying in a binomial coefficient that cancels. The other slip is inverting the ratio — reporting the fair coin's odds when the biased coin's were asked for.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
