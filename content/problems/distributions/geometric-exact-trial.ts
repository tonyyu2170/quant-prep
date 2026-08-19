import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const pmfOf = (par: Params) => (1 - par.succPct / 100) ** (par.k - 1) * (par.succPct / 100);

export const geometricExactTrial: ProblemTemplate = {
  id: "distributions/geometric-exact-trial",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "citadel", weight: 0.3 }],
  source: { kind: "original", inspiration: "geometric PMF as k-1 failures followed by one success" },
  params: {
    succPct: { range: { min: 10, max: 60, step: 2 } },
    k: { range: { min: 2, max: 15, step: 1 } },
  },
  constraint: (p) => pmfOf(p) >= 0.01,
  derived: (p) => {
    const prob = p.succPct / 100;
    const q = 1 - prob;
    const kMinus1 = p.k - 1;
    const tailAtKMinus1 = q ** kMinus1;
    const tailAtK = tailAtKMinus1 * q;
    const pmf = tailAtKMinus1 * prob;
    return { prob, q, kMinus1, tailAtKMinus1, tailAtK, pmf };
  },
  statement: (p) =>
    `A sales rep cold-calls potential clients, each independently converting to a signed contract with probability ${fmtNum(p.succPct)} percent. What is the probability that the first signed contract comes on exactly the ${fmtNum(p.k)}th call?`,
  answerKey: "pmf",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the conversion rate as a probability: $\\frac{${fmtNum(p.succPct)}}{100}=${fmtNum(d.prob)}$, so a call fails to convert with probability ${fmtNum(d.q)}.` },
    { title: "Formula", body: `The first success lands exactly on call $k$ when the first $k-1$ calls all fail and the $k$th converts: $P(X=k)=q^{k-1}p$.` },
    { title: "Compute", body: `With ${fmtNum(d.kMinus1)} failures before the conversion: $P(X=${fmtNum(p.k)})\\approx${fmtNum(d.pmf)}$.` },
    { title: "Sanity check", body: `"No conversion in the first ${fmtNum(d.kMinus1)} calls" ($q^{k-1}\\approx${fmtNum(d.tailAtKMinus1)}$) splits into two disjoint outcomes: converting on call ${fmtNum(p.k)} itself, or still not converting after it ($q^k\\approx${fmtNum(d.tailAtK)}$) — the two pieces recombine to the same $${fmtNum(d.tailAtKMinus1)}$.` },
  ],
  keyInsight: "A geometric \"exactly on trial k\" probability is a product of k-1 failure factors and one success factor, not the success rate alone — the trial number matters exactly as much as the rate does.",
  commonTrap: "Reporting the success rate itself as the answer, which ignores that every trial before the stated one had to fail first.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
