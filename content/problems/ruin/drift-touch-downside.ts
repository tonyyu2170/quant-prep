import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// One-sided downside touch under upward drift: P(ever touch -b | start s) = (q/p)^(s+b).
// The drift guard (winPct >= 55) keeps q/p <= 9/11, which is also what makes the Monte Carlo
// cutoff at +150 unbiased to < 1e-14 (plan constraint 5).
const touchOf = (p: Params) => {
  const prob = p.winPct / 100;
  return Math.pow((1 - prob) / prob, p.startLevel + p.depth);
};

export const driftTouchDownside: ProblemTemplate = {
  id: "ruin/drift-touch-downside",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "flow", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "original", inspiration: "one-barrier ruin probability for a drifted random walk" },
  params: {
    winPct: { range: { min: 55, max: 80, step: 1 } },
    startLevel: { range: { min: 0, max: 5, step: 1 } },
    depth: { range: { min: 1, max: 10, step: 1 } },
  },
  constraint: (p) => touchOf(p) >= 0.1 && touchOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const answer = Math.pow(ratio, p.startLevel + p.depth);
    const oneDeeper = Math.pow(ratio, p.startLevel + p.depth + 1);
    return { prob, q, ratio, answer, oneDeeper };
  },
  statement: (p) =>
    `An insurer's surplus in millions changes by exactly one unit per period: up with probability ${fmtNum(p.winPct)} percent (premiums outpace claims) and down otherwise. Reserves currently stand at ${fmtNum(p.startLevel)} and insolvency is declared the first time the surplus touches $-${fmtNum(p.depth)}$. What is the probability this ever happens?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $h(k)$ be the chance of ever touching $-${fmtNum(p.depth)}$ from level $k$, with $h(-${fmtNum(p.depth)})=1$. Far above zero the walk drifts away, so $h(k)$ must stay bounded as $k$ grows.` },
    { title: "Solve with a bounded exponential", body: `The recursion $h(k)=${fmtNum(d.prob)}\\,h(k+1)+${fmtNum(d.q)}\\,h(k-1)$ has solutions $1$ and $r^{k}$ with $r=q/p=${fmtNum(d.q)}/${fmtNum(d.prob)}=${fmtNum(d.ratio)}$; boundedness kills the constant branch's partner and leaves $h(k)=r^{k+${fmtNum(p.depth)}}$.` },
    { title: "Evaluate at today's reserve", body: `From the current level ${fmtNum(p.startLevel)}: $h(${fmtNum(p.startLevel)})=r^{${fmtNum(p.startLevel)}+${fmtNum(p.depth)}}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The probability of eventual insolvency is $${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `A hole one unit deeper would give ${fmtNum(d.oneDeeper)}, smaller than ${fmtNum(d.answer)} — each extra unit of adverse excursion compounds the odds ratio against you.` },
  ],
  keyInsight: "With upward drift the chance of ever dipping a fixed distance below the origin decays geometrically in that distance — the odds ratio raised to the depth.",
  commonTrap: "Answering that insolvency is certain because an infinite horizon allows every path — the positive drift makes deep excursions genuinely unlikely, not merely slow.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
