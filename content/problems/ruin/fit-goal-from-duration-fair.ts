import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Fair-game goal from an observed average session length. Parametrized by the hidden gap
// (target minus stake) so the inverted goal is always a whole number of chips.
const gapOf = (p: Params) => p.gap;

export const fitGoalFromDurationFair: ProblemTemplate = {
  id: "ruin/fit-goal-from-duration-fair",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.3 }, { firm: "jane-street", weight: 0.35 }],
  source: { kind: "original", inspiration: "inverting fair-game expected duration for the barrier" },
  params: {
    stake: { range: { min: 4, max: 20, step: 1 } },
    gap: { range: { min: 3, max: 24, step: 1 } },
  },
  constraint: (p) => gapOf(p) >= 2 && p.stake + p.gap <= 600,
  derived: (p) => {
    const avgSession = p.stake * p.gap;
    const goalFit = p.stake + p.gap;
    const straightLoss = p.stake;
    const straightWin = p.gap;
    return { avgSession, goalFit, straightLoss, straightWin };
  },
  statement: (p) =>
    `A friend plays a fair even-money coin-flip game, one chip per hand, starting every session with ${fmtNum(p.stake)} chips and stopping only at bust or at some fixed target stack they keep to themselves. Across many sessions you measure an average length of ${fmtNum(p.stake * p.gap)} hands. What is their target stack?`,
  answerKey: "goalFit",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `For a fair game the expected session from stake $i$ against target $N$ is the parabola $i(N-i)$ — maximal mid-corridor and vanishing at the ends.` },
    { title: "Invert the parabola", body: `You know $i$ and the product: $${fmtNum(d.avgSession)}=${fmtNum(p.stake)}\\times(N-${fmtNum(p.stake)})$, so $N-${fmtNum(p.stake)}=${fmtNum(d.avgSession / p.stake)}$ and $N=${fmtNum(p.stake)}+${fmtNum(d.avgSession / p.stake)}=${fmtNum(d.goalFit)}$.` },
    { title: "Answer", body: `The hidden target is a stack of ${fmtNum(d.goalFit)} chips.` },
    { title: "Sanity check", body: `Both clean exits are shorter than the measured average — ${fmtNum(d.straightWin)} straight wins or ${fmtNum(d.straightLoss)} straight losses — and reading the parabola back at ${fmtNum(d.goalFit)} reproduces ${fmtNum(d.avgSession)} exactly.` },
  ],
  keyInsight: "Expected duration pins down the far barrier linearly: divide the observed average by the known stake and add the stake back.",
  commonTrap: "Reaching for a quadratic-formula ritual — with the start fixed, i(N-i) is linear in N, so one division recovers the target.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
