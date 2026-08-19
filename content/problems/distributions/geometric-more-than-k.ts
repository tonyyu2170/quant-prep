import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const tailOf = (par: Params) => (1 - par.succPct / 100) ** par.k;

export const geometricMoreThanK: ProblemTemplate = {
  id: "distributions/geometric-more-than-k",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "geometric tail probability as a power of the failure rate" },
  params: {
    succPct: { range: { min: 10, max: 60, step: 2 } },
    k: { range: { min: 1, max: 20, step: 1 } },
  },
  constraint: (p) => tailOf(p) >= 0.01 && tailOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.succPct / 100;
    const q = 1 - prob;
    // Truncation cap for the independent Python check's brute-force sum, not used in this
    // template's own closed form. q's worst case in this batch is 0.9 (succPct floor 10%), and
    // 0.9^300 measures ~1.9e-14 — comfortably under constraint 6's 1e-12 tail bound.
    const truncCap = p.k + 300;
    const tailProb = q ** p.k;
    return { prob, q, truncCap, tailProb };
  },
  statement: (p) =>
    `A market maker waits for a favorable fill; each tick independently produces a fill with probability ${fmtNum(p.succPct)} percent. What is the probability that more than ${fmtNum(p.k)} ticks are needed before the first fill?`,
  answerKey: "tailProb",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the fill rate as a probability: $\\frac{${fmtNum(p.succPct)}}{100}=${fmtNum(d.prob)}$, so a tick fails to fill with probability ${fmtNum(d.q)}.` },
    { title: "Formula", body: `"More than $k$ ticks needed" means the first ${fmtNum(p.k)} ticks all fail: $P(X>k)=q^k$.` },
    { title: "Compute", body: `$P(X>${fmtNum(p.k)})\\approx${fmtNum(d.q)}^{${fmtNum(p.k)}}\\approx${fmtNum(d.tailProb)}$.` },
    { title: "Sanity check", body: `Each additional required tick multiplies the tail probability by another factor of $q\\approx${fmtNum(d.q)}$, so the tail only ever shrinks as the required count grows — the computed ${fmtNum(d.tailProb)} is consistent with that monotone decay from $q^1$ down through $q^{${fmtNum(p.k)}}$.` },
  ],
  keyInsight: "The geometric tail P(X>k) is just the failure rate raised to the k, since \"more than k needed\" is exactly \"the first k all failed\" — no PMF sum required.",
  commonTrap: "Summing PMF terms one at a time up to some cutoff instead of recognizing the tail collapses to a single power of the failure rate.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
