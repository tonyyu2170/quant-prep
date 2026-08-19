import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

function poissonPmf(lam: number, k: number): number {
  let r = Math.exp(-lam);
  for (let i = 1; i <= k; i++) r = (r * lam) / i;
  return r;
}
function poissonCdf(lam: number, k: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPmf(lam, i);
  return s;
}

const cdfOf = (par: Params) => poissonCdf(par.lam, par.k);
const pmfAtKOf = (par: Params) => poissonPmf(par.lam, par.k);

export const poissonAtMost: ProblemTemplate = {
  id: "distributions/poisson-at-most",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "flow-traders", weight: 0.3 }],
  source: { kind: "original", inspiration: "Poisson CDF as a running sum, checked against its own last increment" },
  params: {
    lam: { range: { min: 0.5, max: 15, step: 0.5 } },
    k: { range: { min: 0, max: 20, step: 1 } },
  },
  constraint: (p) => cdfOf(p) >= 0.01 && cdfOf(p) <= 0.95 && pmfAtKOf(p) >= 1e-4,
  derived: (p) => {
    const cdfPrev = p.k >= 1 ? poissonCdf(p.lam, p.k - 1) : 0;
    const pmfAtK = poissonPmf(p.lam, p.k);
    const cdf = cdfPrev + pmfAtK;
    return { cdfPrev, pmfAtK, cdf };
  },
  statement: (p) =>
    `A dark-pool matching engine records fill events at an average rate of ${fmtNum(p.lam)} per second, following a Poisson process. What is the probability that at most ${fmtNum(p.k)} fills occur in a given second?`,
  answerKey: "cdf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `With rate $\\lambda$ equal to ${fmtNum(p.lam)} per second, "at most ${fmtNum(p.k)}" covers every fill count from $0$ through $${fmtNum(p.k)}$, so add the Poisson PMF $\\frac{e^{-\\lambda}\\lambda^i}{i!}$ for each count $i$ in that range.` },
    { title: "Compute", body: `Carrying out that sum gives $P(\\text{at most }${fmtNum(p.k)}\\text{ fills})=${fmtNum(d.cdf)}$.` },
    { title: "Sanity check", body: `The running sum up through the previous count equals the full sum minus this count's own term: $P(\\text{at most }${fmtNum(p.k)}\\text{ fills})-P(X=${fmtNum(p.k)})\\approx${fmtNum(d.cdfPrev)}$, matching a fresh sum over the PMF up through ${fmtNum(p.k)} minus one.` },
  ],
  keyInsight: "A Poisson CDF is a running sum of PMF terms, and each new term is exactly the gap between consecutive cumulative probabilities — a clean way to double-check a summed cumulative value.",
  commonTrap: "Reporting the PMF at the stated count as if it were the cumulative probability, which discards every smaller count \"at most\" also includes.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0],
};
