import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Minimum capital for a stated reach chance in a fair game: i = ceil(cN). `constraint`
// cannot see `derived` (packages/engine/src/problem.ts:24), so the sanity band on the
// achieved probability is asked through this helper.
const achievedOf = (p: Params) => Math.ceil((p.targetPct / 100) * p.goalChips) / p.goalChips;

export const fitCapitalFair: ProblemTemplate = {
  id: "ruin/fit-capital-fair",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "inverting the fair-game share for required capital" },
  params: {
    targetPct: { range: { min: 5, max: 60, step: 1 } },
    goalChips: { range: { min: 200, max: 600, step: 50 } },
  },
  constraint: (p) => achievedOf(p) >= 0.01 && achievedOf(p) <= 0.99,
  derived: (p) => {
    const need = (p.targetPct / 100) * p.goalChips;
    const capital = Math.ceil(need);
    const achieved = capital / p.goalChips;
    const below = (capital - 1) / p.goalChips;
    return { need, capital, achieved, below, oneLess: capital - 1 };
  },
  statement: (p) =>
    `At a fair even-money table you want at least a ${fmtNum(p.targetPct)} percent chance of turning your buy-in into ${fmtNum(p.goalChips)} chips before going broke, and every chip you hold buys an equal slice of that chance. What is the smallest number of chips you can buy in for and still have your target probability?`,
  answerKey: "capital",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `In a fair game the reach chance from a stack of $k$ against a goal of $${fmtNum(p.goalChips)}$ is exactly your share of the table's total — the fair-game straight line again.` },
    { title: "Set the share to the target", body: `${fmtNum(p.targetPct)} percent of the goal is the stake you must match: $\\frac{${fmtNum(p.targetPct)}}{100}\\times${fmtNum(p.goalChips)}=${fmtNum(d.need)}$ chips.` },
    { title: "Round up to whole chips", body: `Chips come in whole units, so buy ${fmtNum(d.capital)}. That holds ${fmtNum(d.achieved)} of the goal — at or above target — while one chip less would hold only ${fmtNum(d.below)}, short of it.` },
    { title: "Answer", body: `Buy in for at least ${fmtNum(d.capital)} chips.` },
    { title: "Sanity check", body: `The crossing point is exact: ${fmtNum(d.oneLess)} chips sit below ${fmtNum(p.targetPct)} percent (${fmtNum(d.below)}) and ${fmtNum(d.capital)} sit above (${fmtNum(d.achieved)}), so no smaller buy-in keeps the promise.` },
  ],
  keyInsight: "A fair table prices reach probability linearly in capital, so a target probability converts straight into a required stake — rounded up to the next whole unit.",
  commonTrap: "Rounding to the nearest whole chip instead of up — rounding down silently drops you under the promised probability, which is the one direction a requirement cannot bend.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [0, 1, 100],
};
