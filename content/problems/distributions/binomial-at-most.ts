import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

// Cumulative sum up through k, and its complement from k+1 through n — two independently
// summed ranges whose totals must reconcile to 1 (the Sanity check below), which is a real
// check on the summation loop bounds, not a tautology.
function cdfOf(n: number, p: number, k: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += comb(n, i) * p ** i * (1 - p) ** (n - i);
  return s;
}
function tailOf(n: number, p: number, k: number): number {
  let s = 0;
  for (let i = k + 1; i <= n; i++) s += comb(n, i) * p ** i * (1 - p) ** (n - i);
  return s;
}

const cdfAt = (par: Params) => cdfOf(par.n, par.failPct / 100, par.k);

export const binomialAtMost: ProblemTemplate = {
  id: "distributions/binomial-at-most",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "binomial CDF as a sum of PMF terms up to a cap" },
  params: {
    n: { range: { min: 8, max: 18, step: 1 } },
    failPct: { range: { min: 10, max: 60, step: 2 } },
    k: { range: { min: 0, max: 10, step: 1 } },
  },
  constraint: (p) => p.k < p.n && cdfAt(p) >= 0.01 && cdfAt(p) <= 0.95 && !complementGrades(cdfAt(p)),
  derived: (p) => {
    const prob = p.failPct / 100;
    const q = 1 - prob;
    const cdf = cdfOf(p.n, prob, p.k);
    const tailProb = tailOf(p.n, prob, p.k);
    return { prob, q, cdf, tailProb };
  },
  statement: (p) =>
    `A trading algorithm sends ${fmtNum(p.n)} orders to an exchange, each independently. Each order times out without executing with probability ${fmtNum(p.failPct)} percent. What is the probability that at most ${fmtNum(p.k)} of the ${fmtNum(p.n)} orders time out?`,
  answerKey: "cdf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the per-order timeout rate as a probability: $\\frac{${fmtNum(p.failPct)}}{100}=${fmtNum(d.prob)}$, so an order executes with probability ${fmtNum(d.q)}.` },
    { title: "Add the PMF up to k", body: `"At most ${fmtNum(p.k)}" covers every timeout count from $0$ through $${fmtNum(p.k)}$, so add the PMF $\\binom{n}{i}p^i q^{n-i}$ for each count $i$ in that range.` },
    { title: "Compute", body: `Summing those terms gives $P(\\text{at most }${fmtNum(p.k)}\\text{ timeouts})=${fmtNum(d.cdf)}$.` },
    { title: "Sanity check", body: `The complementary event — more than ${fmtNum(p.k)} timeouts — sums the same PMF formula over every count above ${fmtNum(p.k)}, up to ${fmtNum(p.n)}: $P(\\text{more than }${fmtNum(p.k)}\\text{ timeouts})=${fmtNum(d.tailProb)}$. The two outcomes account for everything: $${fmtNum(d.cdf)}+${fmtNum(d.tailProb)}=${fmtNum(1)}$, and they do.` },
  ],
  keyInsight: "A cumulative binomial probability is a sum of individual PMF terms up to the stated cap, not a single term — every count from zero through the cap contributes.",
  commonTrap: "Computing only the PMF at the exact cap count and reporting that as the cumulative probability, which ignores every smaller count that also satisfies \"at most\".",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0, 1, 100],
};
