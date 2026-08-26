import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

const pmfOf = (par: Params) => {
  const tot = comb(par.N, par.n);
  return tot === 0 ? 0 : (comb(par.K, par.k) * comb(par.N - par.K, par.n - par.k)) / tot;
};

// L2 since 2026-08-23, on a second read that COVERAGE.md's scope did not have. Its own sibling
// `hypergeom-zero-successes` is L2 at 55s, and that one is the DEGENERATE case of this formula:
// at k=0 the first coefficient collapses to 1 and only one product survives. A family's general
// case cannot rank below its own special case. The earlier read compared it to
// `binomial-exact-count` (L1, one coefficient and a power) rather than to the three coefficients
// and the ratio it actually asks for, and it was the slowest L1 in the topic at 65s against a
// 49s tier mean. It is NOT L3: distributions' L3 is uniformly two-stage — fit-then-pmf,
// quantile-then-range — and this is one stage. Its pace matching that band's floor is a
// coincidence of an L2 band that runs 40 to 110.
export const hypergeomExactDraw: ProblemTemplate = {
  id: "distributions/hypergeom-exact-draw",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "hypergeometric PMF as a ratio of favorable to total sampling arrangements" },
  params: {
    N: { range: { min: 10, max: 20, step: 1 } },
    K: { range: { min: 2, max: 10, step: 1 } },
    n: { range: { min: 2, max: 6, step: 1 } },
    k: { range: { min: 0, max: 6, step: 1 } },
  },
  constraint: (p) => p.K <= p.N && p.n <= p.N && p.k <= p.K && p.k <= p.n && p.n - p.k <= p.N - p.K && pmfOf(p) >= 0.01 && pmfOf(p) <= 0.95 && !complementGrades(pmfOf(p)),
  derived: (p) => {
    const nMinusK = p.n - p.k;
    const NMinusK = p.N - p.K;
    const combKk = comb(p.K, p.k);
    const combRest = comb(NMinusK, nMinusK);
    const combTotal = comb(p.N, p.n);
    const pmf = (combKk * combRest) / combTotal;
    return { nMinusK, NMinusK, combKk, combRest, combTotal, pmf };
  },
  statement: (p) =>
    `A hiring pool has ${fmtNum(p.N)} candidates, ${fmtNum(p.K)} of whom are qualified. A manager selects ${fmtNum(p.n)} candidates uniformly at random, without replacement. What is the probability that exactly ${fmtNum(p.k)} of the selected candidates are qualified?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count the favorable selections", body: `Choose ${fmtNum(p.k)} of the ${fmtNum(p.K)} qualified candidates and the remaining ${fmtNum(d.nMinusK)} spots from the ${fmtNum(d.NMinusK)} unqualified ones: $\\binom{K}{k}\\binom{N-K}{n-k}=${fmtNum(d.combKk)}\\times${fmtNum(d.combRest)}$.` },
    { title: "Count every selection", body: `The total number of ways to select ${fmtNum(p.n)} candidates from all ${fmtNum(p.N)}, ignoring qualification, is $\\binom{N}{n}=${fmtNum(d.combTotal)}$.` },
    { title: "Combine", body: `$P(X=${fmtNum(p.k)})\\approx${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: `The favorable count can never exceed the total count, since every favorable selection is also counted among all selections — ${fmtNum(d.combKk)} times ${fmtNum(d.combRest)} sits at or below ${fmtNum(d.combTotal)}, consistent with a valid probability.` },
  ],
  keyInsight: "Sampling without replacement means the qualification counts among the unselected pool shrink together with the selected pool — the hypergeometric PMF counts favorable subsets against all subsets, unlike the binomial's independent-trial product.",
  commonTrap: "Applying the binomial PMF with a fixed per-draw probability K/N, which ignores that each draw changes the remaining pool's composition.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [],
};
