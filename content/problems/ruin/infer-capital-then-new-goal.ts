import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// Fair-only two-stage: from a stated reach share, infer the stake; then price the climb
// toward a DIFFERENT goal. The unfair version would need a forbidden root-finder (spec §2,
// §8 #18). `constraint` cannot see `derived` (packages/engine/src/problem.ts:24).
const impliedStake = (p: Params) => (p.firstSharePct / 100) * p.firstGoal;

export const inferCapitalThenNewGoal: ProblemTemplate = {
  id: "ruin/infer-capital-then-new-goal",
  version: 1,
  topic: "probability/ruin",
  difficulty: 3,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "carry a fair-game stake across two different targets" },
  params: {
    firstSharePct: { range: { min: 5, max: 60, step: 1 } },
    firstGoal: { range: { min: 200, max: 600, step: 50 } },
    secondGoalPct: { choices: [120, 140, 150, 160, 180, 200] },
  },
  constraint: (p) => impliedStake(p) >= 2 && impliedStake(p) === Math.round(impliedStake(p)) && impliedStake(p) < Math.round((p.secondGoalPct / 100) * p.firstGoal) && !complementGrades(impliedStake(p) / Math.round((p.secondGoalPct / 100) * p.firstGoal)),
  derived: (p) => {
    const stake = Math.round(impliedStake(p));
    const secondGoal = Math.round((p.secondGoalPct / 100) * p.firstGoal);
    const newChance = stake / secondGoal;
    const oldChance = stake / p.firstGoal;
    return { stake, secondGoal, newChance, oldChance, raisePct: p.secondGoalPct - 100 };
  },
  statement: (p, d) =>
    `At a fair even-money table your friend's buy-in is secret, but they reveal one fact: against today's table goal of ${fmtNum(p.firstGoal)} chips, their chance of getting there before busting is ${fmtNum(p.firstSharePct)} percent — and at this table your chance is simply your share of the total. Tomorrow the same friend sits down with the same buy-in at a tougher table where the goal is raised by ${fmtNum(d.raisePct)} percent, to ${fmtNum(d.secondGoal)} chips. What is their chance of reaching that higher goal before busting?`,
  answerKey: "newChance",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: recover the buy-in", body: `Fair shares are linear in capital: ${fmtNum(p.firstSharePct)} percent of ${fmtNum(p.firstGoal)} chips is the stack — $\\frac{${fmtNum(p.firstSharePct)}}{100}\\times${fmtNum(p.firstGoal)}=${fmtNum(d.stake)}$ chips.` },
    { title: "Stage two: reprice at the new table", body: `The same stack against the bigger goal holds the share $\\frac{${fmtNum(d.stake)}}{${fmtNum(d.secondGoal)}}=${fmtNum(d.newChance)}$.` },
    { title: "Answer", body: `Against the raised goal, the chance drops to $${fmtNum(d.newChance)}$.` },
    { title: "Sanity check", body: `The old chance reads back as ${fmtNum(d.oldChance)} — exactly the stated ${fmtNum(p.firstSharePct)} percent — and raising the barrier while holding capital fixed must lower any fair share, as ${fmtNum(d.newChance)} < ${fmtNum(d.oldChance)} confirms.` },
  ],
  keyInsight: "A recovered stake is portable: once stage one prices the capital, every other fair-table question about it is one more share ratio away.",
  commonTrap: "Scaling the probability by the goal change instead of recomputing the share — doubling the target does not halve the chance, because the stake stays fixed in the numerator.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [0, 1, 100],
};
