import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Doubling strategy against a bankroll that backs n doublings: ruin requires n consecutive
// losses, probability q^n. The ask is the failure side — the tail IS the lesson. Powers stay
// inside one helper that `constraint` calls directly (it cannot see `derived`,
// packages/engine/src/problem.ts:24); the band is the plain [0.01, 0.99].
const streakOf = (p: Params) => Math.pow(1 - p.winPct / 100, p.rounds);

export const doublingStrategy: ProblemTemplate = {
  id: "ruin/doubling-strategy",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "akuna", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "the martingale doubling plan capped by bankroll" },
  params: {
    winPct: { range: { min: 34, max: 66, step: 0.5 } },
    rounds: { range: { min: 4, max: 10, step: 1 } },
  },
  constraint: (p) => streakOf(p) >= 0.01 && streakOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const streakProb = Math.pow(q, p.rounds);
    const winSession = 1 - streakProb;
    const nextStreak = Math.pow(q, p.rounds + 1);
    return { prob, q, streakProb, winSession, nextStreak };
  },
  statement: (p) =>
    `You try the classic doubling plan at an even-money game: bet one chip, and after every loss double the previous bet, so the first win recovers everything plus one chip. Your bankroll — or the table's maximum — lets you survive only ${fmtNum(p.rounds)} bets in a losing streak before you cannot double again. Each hand wins with probability ${fmtNum(p.winPct)} percent. What is the probability the plan ruins you instead — that every hand inside your streak limit loses?`,
  answerKey: "streakProb",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The plan's payout schedule is a distraction: the session ends in success exactly when the first win arrives on or before hand ${fmtNum(p.rounds)}, and in ruin only if every one of those ${fmtNum(p.rounds)} hands loses.` },
    { title: "Count the ruin path", body: `Ruin needs a streak of ${fmtNum(p.rounds)} straight losses, which has probability $${fmtNum(d.q)}^{${fmtNum(p.rounds)}}=${fmtNum(d.streakProb)}$ — every other sequence of outcomes contains a win somewhere.` },
    { title: "Answer", body: `The plan ruins you with probability $${fmtNum(d.streakProb)}$.` },
    { title: "Success side", body: `The session therefore succeeds with the complement, $${fmtNum(d.winSession)}$ — which is exactly why the plan feels safe right up until the tail arrives.` },
    { title: "Sanity check", body: `One extra doubling round would cut the ruin chance to ${fmtNum(d.nextStreak)} — each additional bet divides the catastrophic tail by the same odds ratio while the payout doubles, which is the trap in numbers.` },
  ],
  keyInsight: "A capped doubling plan is just the complement of a losing streak — the strategy changes the payout sizes, never the per-hand odds, so the success probability reads off one power of q.",
  commonTrap: "Concluding the plan almost surely wins from its high success rate while ignoring that the single losing streak loses far more than all the small wins combined.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
