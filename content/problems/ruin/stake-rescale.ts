import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// Unit conversion leaves a fair-game absorption probability unchanged: success(k*i, k*N) =
// i/N. `constraint` cannot see `derived` (packages/engine/src/problem.ts:24), so the band is
// asked through this same helper.
const shareOf = (p: Params) => p.startChips / p.goalChips;

export const stakeRescale: ProblemTemplate = {
  id: "ruin/stake-rescale",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "scale-invariance of fair-game ruin probabilities" },
  params: {
    startChips: { range: { min: 20, max: 280, step: 20 } },
    goalChips: { range: { min: 320, max: 700, step: 20 } },
    scalePct: { choices: [200, 250, 300, 400, 500] },
  },
  constraint: (p) => shareOf(p) >= 0.01 && shareOf(p) <= 0.99 && !complementGrades(shareOf(p)),
  derived: (p) => {
    const scale = p.scalePct / 100;
    const bigStart = Math.round(p.startChips * scale);
    const bigGoal = Math.round(p.goalChips * scale);
    const frac = p.startChips / p.goalChips;
    const scaledFrac = bigStart / bigGoal;
    return { scale, bigStart, bigGoal, frac, scaledFrac, houseStack: p.goalChips - p.startChips };
  },
  statement: (p) =>
    `You sit down at a fair even-money table holding ${fmtNum(p.startChips)} chips against the house's ${fmtNum(p.goalChips - p.startChips)}, and you will play until one side holds all ${fmtNum(p.goalChips)}. The floor then announces a denomination change: every chip in play is exchanged for ${fmtNum(p.scalePct)} percent of its face value in house scrip — stacks and goals alike. In scrip units, what is the probability you end up holding everything?`,
  answerKey: "frac",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The denomination change rescales every stack by the same factor ${fmtNum(d.scale)}: your ${fmtNum(p.startChips)} become ${fmtNum(d.bigStart)}, the goal ${fmtNum(p.goalChips)} becomes ${fmtNum(d.bigGoal)}. The walk now moves one scrip unit per hand instead of one chip.` },
    { title: "Fair-game line", body: `A fair game's reach chance is the starting share of the total, in whatever units the walk is measured: $\\frac{${fmtNum(d.bigStart)}}{${fmtNum(d.bigGoal)}}=${fmtNum(d.scaledFrac)}$.` },
    { title: "Compare units", body: `That equals the original share exactly: $\\frac{${fmtNum(p.startChips)}}{${fmtNum(p.goalChips)}}=\\frac{${fmtNum(d.bigStart)}}{${fmtNum(d.bigGoal)}}=${fmtNum(d.frac)}$ — multiplying top and bottom by ${fmtNum(d.scale)} changes nothing.` },
    { title: "Answer", body: `In scrip units the probability is still $${fmtNum(d.frac)}$.` },
    { title: "Sanity check", body: `The odds never moved: no per-hand probability changed, only the label on each unit, so any formula worth its salt must return the identical number — and it does.` },
  ],
  keyInsight: "Fair-game ruin probabilities are scale-invariant: stretching every stack by the same factor stretches numerator and denominator together and leaves the ratio alone.",
  commonTrap: "Re-deriving everything from scratch after a unit change, or suspecting bigger numbers mean longer games change the odds — duration may stretch with the units, but the absorption probability cannot move.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
