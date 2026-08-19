import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

function poissonPmf(lam: number, k: number): number {
  let r = Math.exp(-lam);
  for (let i = 1; i <= k; i++) r = (r * lam) / i;
  return r;
}

const pmfOf = (par: Params) => poissonPmf(par.lam, par.k);

export const poissonExactCount: ProblemTemplate = {
  id: "distributions/poisson-exact-count",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "Poisson PMF read directly off a stated rate and count" },
  params: {
    lam: { range: { min: 0.5, max: 15, step: 0.5 } },
    k: { range: { min: 1, max: 20, step: 1 } },
  },
  constraint: (p) => pmfOf(p) >= 0.01,
  derived: (p) => {
    const kMinus1 = p.k - 1;
    const pPrev = poissonPmf(p.lam, kMinus1);
    const pmf = (pPrev * p.lam) / p.k;
    return { kMinus1, pPrev, pmf };
  },
  statement: (p) =>
    `A market-data feed drops packets at an average rate of ${fmtNum(p.lam)} per minute, following a Poisson process. What is the probability that exactly ${fmtNum(p.k)} packets are dropped in a given minute?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `A Poisson process with rate $\\lambda$ equal to ${fmtNum(p.lam)} per minute gives $P(X=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}$ for the count $X$ of drops in one minute.` },
    { title: "Compute", body: `Plugging in $k=${fmtNum(p.k)}$: $P(X=${fmtNum(p.k)})=\\frac{e^{-${fmtNum(p.lam)}}${fmtNum(p.lam)}^{${fmtNum(p.k)}}}{${fmtNum(p.k)}!}=${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: `The Poisson PMF obeys the recurrence $P(X=k)=P(X=k-1)\\times\\frac{\\lambda}{k}$. Here $P(X=${fmtNum(d.kMinus1)})=${fmtNum(d.pPrev)}$, and applying the recurrence with $\\frac{\\lambda}{k}=\\frac{${fmtNum(p.lam)}}{${fmtNum(p.k)}}$ reproduces $P(X=${fmtNum(p.k)})=${fmtNum(d.pmf)}$, confirming the two independently-stated relationships agree.` },
  ],
  keyInsight: "The Poisson PMF at one count is pinned by the rate and that count alone, and it obeys a clean ratio recurrence to its neighboring count — a useful cross-check independent of recomputing the closed form from scratch.",
  commonTrap: "Using the rate itself as the probability of exactly that many events, or forgetting the factorial in the denominator, both of which stop producing a valid probability once the count grows.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};
