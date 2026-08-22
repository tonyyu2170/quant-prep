import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-stage doubling plan: stage one inverts a stated session-ruin probability for the
// per-hand loss rate (q = c^(1/n)); stage two prices the expected number of hands the grind
// lasts, (1 - q^n)/p. One walk throughout — p and q stay consistent by construction.
// `constraint` cannot see `derived` (packages/engine/src/problem.ts:24), so it asks here.
const impliedLoss = (p: Params) => Math.pow(p.streakPct / 100, 1 / p.rounds);
const expectedHandsOf = (p: Params) => {
  const q = impliedLoss(p);
  return (1 - Math.pow(q, p.rounds)) / (1 - q);
};

export const doublingFitThenDuration: ProblemTemplate = {
  id: "ruin/doubling-fit-then-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 3,
  firms: [{ firm: "akuna", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "fit a losing streak rate, then price how long the plan grinds" },
  params: {
    streakPct: { range: { min: 1.5, max: 20, step: 0.5 } },
    rounds: { range: { min: 3, max: 12, step: 1 } },
  },
  constraint: (p) => impliedLoss(p) >= 0.3 && impliedLoss(p) <= 0.7 && expectedHandsOf(p) >= 1 && expectedHandsOf(p) <= 600,
  derived: (p) => {
    const q = impliedLoss(p);
    const prob = 1 - q;
    const streakProb = Math.pow(q, p.rounds);
    const duration = (1 - streakProb) / prob;
    const winSession = 1 - streakProb;
    return { q, prob, streakProb, winSession, duration };
  },
  statement: (p) =>
    `A friend runs the classic doubling plan and can survive exactly ${fmtNum(p.rounds)} bets in a losing streak. They keep quiet about their win rate but admit one number: the chance that the whole plan collapses — every one of those ${fmtNum(p.rounds)} bets losing — is ${fmtNum(p.streakPct)} percent. First recover the per-hand loss probability; then tell them how many bets the session lasts on average, counting every bet until the first win or until the streak ruins them.`,
  answerKey: "duration",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: invert the collapse chance", body: `Ruin needs all ${fmtNum(p.rounds)} bets to lose, so $q^{${fmtNum(p.rounds)}}=${fmtNum(d.streakProb)}$ and the per-hand loss probability is the ${fmtNum(p.rounds)}-th root: $q=${fmtNum(d.q)}$ — hands therefore win with probability ${fmtNum(d.prob)}.` },
    { title: "Stage two: price the grind", body: `The session ends at the first win or at bet ${fmtNum(p.rounds)}, whichever comes first. Summing each capped ending weighted by its length collapses to the win-side share divided by the per-hand win rate: about ${fmtNum(d.duration)} bets.` },
    { title: "Answer", body: `Expect about ${fmtNum(d.duration)} bets per session.` },
    { title: "Sanity check", body: `The answer sits between the two forced endings: an instant win is ${fmtNum(1)} bet and full collapse is ${fmtNum(p.rounds)}, and ${fmtNum(d.duration)} lies inside — dominated by the frequent quick wins yet stretched by the occasional full streak.` },
  ],
  keyInsight: "A stated ruin probability fixes the per-hand odds through one root, and with the odds known the capped waiting time has its own closed form — two stages, one consistent walk.",
  commonTrap: "Reading the stated percentage as a per-hand rate instead of a streak probability — the root comes before any per-hand reasoning, and skipping it poisons every later number.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
