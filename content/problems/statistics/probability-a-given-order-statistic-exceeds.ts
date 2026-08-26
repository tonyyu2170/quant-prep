import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// "At least k of n exceed the threshold" is the same event as "the k-th largest exceeds it", and
// the binomial tail is what makes it computable. `constraint` needs the count relation, and the
// binomial helper is reached through it.
const comb = (n: number, k: number): number =>
  k < 0 || k > n ? 0 : Math.round(Array.from({ length: Math.min(k, n - k) }, (_, i) => (n - i) / (i + 1)).reduce((a, b) => a * b, 1));
const tailOf = (par: { n: number; k: number; qPct: number }): number =>
  Array.from({ length: par.n - par.k + 1 }, (_, i) => par.k + i).reduce((s, j) => s + comb(par.n, j) * (par.qPct / 100) ** j * (1 - par.qPct / 100) ** (par.n - j), 0);

export const probabilityAGivenOrderStatisticExceeds: ProblemTemplate = {
  id: "statistics/probability-a-given-order-statistic-exceeds",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "an order statistic exceeding a threshold via the binomial tail" },
  params: {
    n: { choices: [4, 5, 6, 7, 8, 9, 10] },
    k: { choices: [1, 2, 3, 4] },
    qPct: { choices: [20, 25, 30, 40, 50, 60, 70, 75] },
    top: { choices: [20, 50, 100, 200] },
  },
  constraint: (p) => p.k < p.n && tailOf(p as { n: number; k: number; qPct: number }) >= 0.01 && !complementGrades(tailOf(p as { n: number; k: number; qPct: number })),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const q = round(p.qPct / 100);
    return {
      q,
      below: round(1 - q),
      threshold: round(p.top * (1 - q)),
      atLeastOne: round(1 - (1 - q) ** p.n),
      answer: round(tailOf(p as { n: number; k: number; qPct: number })),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `${fmtNum(p.n)} independent latency readings arrive, each equally likely to fall anywhere between 0 and ${fmtNum(p.top)} microseconds. A reading is called slow if it exceeds ${fmtNum(d.threshold)} microseconds. ` +
    `What is the probability that the ${fmtNum(p.k)}th LARGEST of the ${fmtNum(p.n)} readings is slow?`,
  solution: (p, d) => [
    { title: "Turn the order statistic into a count", body: `The ${fmtNum(p.k)}th largest reading exceeds the threshold precisely when AT LEAST ${fmtNum(p.k)} of the readings do. In symbols $P(X_{(k)}>t)=P(N\\geq k)$, where $N$ counts the slow readings. That swap is the whole trick: a statement about ranks becomes a statement about a count, and counts of independent trials are binomial.` },
    { title: "The per-reading chance", body: `A single reading exceeds ${fmtNum(d.threshold)} with probability $(${fmtNum(p.top)}-${fmtNum(d.threshold)})/${fmtNum(p.top)}=${fmtNum(d.q)}$, so the number of slow readings is binomial on ${fmtNum(p.n)} trials at that chance. The threshold itself is that same split of the range: $${fmtNum(p.top)}\\times${fmtNum(d.below)}=${fmtNum(d.threshold)}$.` },
    { title: "Sum the upper tail", body: `Adding the binomial probabilities from ${fmtNum(p.k)} slow readings up through all ${fmtNum(p.n)} gives ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The probability is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The chance that AT LEAST ONE reading is slow is ${fmtNum(d.atLeastOne)}, and the answer must sit at or below it: needing ${fmtNum(p.k)} slow readings is at least as demanding as needing one, so it can only be rarer. The larger ${fmtNum(p.k)} gets, the smaller the answer, which is the direction to check first.` },
  ],
  keyInsight: "Any question about an order statistic crossing a threshold is a question about how many observations cross it, and that count is binomial whenever the observations are independent. The rank disappears into the summation limit, which is why no density of the order statistic is ever needed.",
  commonTrap: "Computing the probability that exactly k readings are slow rather than at least k, which drops every term above the first. The other slip is inverting the rank, confusing the kth largest with the kth smallest and summing the wrong tail.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
