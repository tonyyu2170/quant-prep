import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

const pmfOf = (par: Params) => {
  const tot = comb(par.N, par.n);
  return tot === 0 ? 0 : comb(par.N - par.K, par.n) / tot;
};

export const hypergeomZeroSuccesses: ProblemTemplate = {
  id: "distributions/hypergeom-zero-successes",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "flow-traders", weight: 0.3 }],
  source: { kind: "original", inspiration: "the hypergeometric boundary case of drawing none of the marked items" },
  params: {
    N: { range: { min: 10, max: 20, step: 1 } },
    K: { range: { min: 2, max: 10, step: 1 } },
    n: { range: { min: 2, max: 6, step: 1 } },
  },
  constraint: (p) => p.K <= p.N && p.n <= p.N && p.N - p.K >= p.n && pmfOf(p) >= 0.01,
  derived: (p) => {
    const NMinusK = p.N - p.K;
    const combZero = comb(NMinusK, p.n);
    const combTotal = comb(p.N, p.n);
    const pmf = combZero / combTotal;
    return { NMinusK, combZero, combTotal, pmf };
  },
  statement: (p) =>
    `A hiring pool has ${fmtNum(p.N)} candidates, ${fmtNum(p.K)} of whom are qualified. A manager selects ${fmtNum(p.n)} candidates uniformly at random, without replacement. What is the probability that none of the selected candidates are qualified?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count the all-unqualified selections", body: `Selecting zero qualified candidates means all ${fmtNum(p.n)} spots come from the ${fmtNum(d.NMinusK)} unqualified candidates: $\\binom{N-K}{n}=${fmtNum(d.combZero)}$.` },
    { title: "Count every selection", body: `The total number of ways to select ${fmtNum(p.n)} candidates from all ${fmtNum(p.N)} is $\\binom{N}{n}=${fmtNum(d.combTotal)}$.` },
    { title: "Combine", body: `$P(X=0)\\approx${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: `A larger qualified pool ${fmtNum(p.K)} should make an all-unqualified selection less likely, since it shrinks the ${fmtNum(d.NMinusK)} unqualified candidates the selection must be drawn entirely from — this problem's own draw fits that pattern.` },
  ],
  keyInsight: "P(X=0) is the special case where every drawn candidate comes from the unqualified pool alone — the qualified count never enters the favorable-count formula directly, only through how much room it leaves in the unqualified pool.",
  commonTrap: "Computing (1 - K/N) raised to the n-th power, which treats the draws as independent and ignores that sampling without replacement shrinks the unqualified pool too.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0],
};
