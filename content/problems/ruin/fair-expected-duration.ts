import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Fair-game expected time to absorption: i(N - i). The band helper exists because
// `constraint` cannot see `derived` (packages/engine/src/problem.ts:24); durations are not
// probabilities but still obey the plan's practical cap for Monte Carlo sizing (constraint 4).
const durationOf = (p: Params) => p.stake * (p.target - p.stake);

export const fairExpectedDuration: ProblemTemplate = {
  id: "ruin/fair-expected-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected absorption time of the fair gambler's ruin chain" },
  params: {
    stake: { range: { min: 2, max: 16, step: 1 } },
    target: { range: { min: 17, max: 32, step: 1 } },
  },
  constraint: (p) => p.stake < p.target && durationOf(p) >= 1 && durationOf(p) <= 600,
  derived: (p) => {
    const duration = p.stake * (p.target - p.stake);
    const straightLoss = p.stake;
    const straightWin = p.target - p.stake;
    return { duration, straightLoss, straightWin };
  },
  statement: (p) =>
    `You flip a fair coin once per hand, winning one chip on heads and losing one chip on tails. You start with ${fmtNum(p.stake)} chips and will stop the moment you either hold ${fmtNum(p.target)} chips or go broke. On average, how many hands does the session last?`,
  answerKey: "duration",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $e(k)$ be the expected number of hands until the session ends from stack $k$. Each hand costs one unit of time and moves you up or down with equal odds: $e(k)=1+\\frac{e(k-1)+e(k+1)}{2}$, with $e(0)=e(${fmtNum(p.target)})=0$.` },
    { title: "Rearrange", body: `Move the neighbours over: $\\frac{e(k+1)-2e(k)+e(k-1)}{2}=-1$ — the second difference of $e$ is a constant $-2$, so $e$ is a downward-opening parabola in $k$.` },
    { title: "Fit the parabola to the boundaries", body: `The parabola vanishing at both ends has the form $e(k)=k\\,(${fmtNum(p.target)}-k)$, which at your stake gives $${fmtNum(p.stake)}\\times(${fmtNum(p.target)}-${fmtNum(p.stake)})=${fmtNum(p.stake)}\\times${fmtNum(d.straightWin)}=${fmtNum(d.duration)}$.` },
    { title: "Answer", body: `The session lasts ${fmtNum(d.duration)} hands on average.` },
    { title: "Sanity check", body: `Even the luckiest possible session needs at least ${fmtNum(d.straightWin)} straight wins and the unluckiest at least ${fmtNum(d.straightLoss)} straight losses, and the average must exceed both bounds — ${fmtNum(d.duration)} clears them comfortably.` },
  ],
  keyInsight: "Expected duration obeys a recursion whose second difference is constant, so it is a parabola over the stack — maximal halfway between the barriers and vanishing at both.",
  commonTrap: "Guessing the average from the two fastest exits — the walk usually dawdles far longer than either clean run, which is exactly why the parabola's peak sits mid-corridor.",
  expectedPaceS: 60,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
