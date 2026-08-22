import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Primary ask is the complement: P(ruin before goal) = 1 - (1 - r^i)/(1 - r^N), r = q/p.
// Powers stay module-LOCAL (plan constraint 8). `constraint` asks through this same helper
// because it cannot see `derived` (packages/engine/src/problem.ts:24).
const ruinOf = (p: Params) => {
  const prob = p.winPct / 100;
  const r = (1 - prob) / prob;
  const ri = Math.pow(r, p.startChips);
  const rn = Math.pow(r, p.goalChips);
  return 1 - (1 - ri) / (1 - rn);
};

export const complementRuinFirst: ProblemTemplate = {
  id: "ruin/complement-ruin-first",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.35 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "original", inspiration: "blowup-side reading of the unfair ruin formula" },
  params: {
    winPct: { range: { min: 42, max: 58, step: 1 } },
    startChips: { range: { min: 5, max: 30, step: 5 } },
    goalChips: { range: { min: 36, max: 90, step: 6 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && ruinOf(p) >= 0.01 && ruinOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const ri = Math.pow(ratio, p.startChips);
    const rn = Math.pow(ratio, p.goalChips);
    const success = (1 - ri) / (1 - rn);
    const ruinProb = 1 - success;
    const nextRuin = 1 - (1 - Math.pow(ratio, p.startChips - 1)) / (1 - rn);
    return { prob, q, ratio, success, ruinProb, nextRuin, prevStack: p.startChips - 1 };
  },
  statement: (p) =>
    `At an even-payout table your single-hand win chance is only ${fmtNum(p.winPct)} percent. You buy in for ${fmtNum(p.startChips)} chips and will keep playing — one chip riding on each hand — until you either go broke or build your stack to ${fmtNum(p.goalChips)} chips. What is the probability you go broke first?`,
  answerKey: "ruinProb",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Your stack walks between $0$ (broke) and $${fmtNum(p.goalChips)}$ (walk-away), one chip per hand, winning with probability ${fmtNum(d.prob)}. Broke-first is the complement of reaching the top.` },
    { title: "Reach chance", body: `With $r$ the odds ratio $q/p=${fmtNum(d.q)}/${fmtNum(d.prob)}=${fmtNum(d.ratio)}$, the exponential ruin form gives the chance of climbing from ${fmtNum(p.startChips)} to ${fmtNum(p.goalChips)} before hitting zero: ${fmtNum(d.success)}.` },
    { title: "Take the complement", body: `Going broke first is every other ending: with the reach side priced at ${fmtNum(d.success)}, the cliff takes the rest — about ${fmtNum(d.ruinProb)}.` },
    { title: "Answer", body: `The probability you bust before walking away is ${fmtNum(d.ruinProb)}.` },
    { title: "Sanity check", body: `Buying in one chip deeper moves you toward the cliff: the same computation from ${fmtNum(d.prevStack)} chips gives bust probability ${fmtNum(d.nextRuin)}, above ${fmtNum(d.ruinProb)}.` },
  ],
  keyInsight: "When the ask is the failure side of a ruin question, compute the success side once and subtract from one — the exponential form belongs to whichever barrier you call the goal.",
  commonTrap: "Rebuilding the recursion with the absorbing boundaries swapped — the odds ratio r is defined off the per-trade win chance, not off which ending you care about, and mixing the two inverts the answer.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
