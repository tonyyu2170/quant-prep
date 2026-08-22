import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Inverse of buffon-short-needle: find the needle length with P(cross) = c, L = cT(pi/2).
// `constraint` cannot see `derived` (packages/engine/src/problem.ts:24), so it asks here.
const impliedNeedle = (p: Params) => (p.targetPct / 100) * p.boardCm * (Math.PI / 2);

export const buffonFitLengthInverse: ProblemTemplate = {
  id: "geometric/buffon-fit-length-inverse",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "susquehanna", weight: 0.3 }],
  source: { kind: "original", inspiration: "inverting Buffon for a target crossing probability" },
  params: {
    targetPct: { range: { min: 10, max: 60, step: 5 } },
    boardCm: { range: { min: 6, max: 20, step: 1 } },
  },
  constraint: (p) => impliedNeedle(p) <= p.boardCm && impliedNeedle(p) >= 0.1,
  derived: (p) => {
    const needle = impliedNeedle(p);
    const ratio = needle / p.boardCm;
    return { needle, ratio };
  },
  statement: (p) =>
    `You are designing the toss for a Buffon-style demonstration on a floor ruled with parallel lines ${fmtNum(p.boardCm)} centimeters apart. The needle must be short enough to stay in the short-needle regime yet give a crossing chance of exactly ${fmtNum(p.targetPct)} percent. How long should the needle be?`,
  answerKey: "needle",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The short-needle crossing chance is twice the length-to-spacing ratio divided by pi — linear in the length, which makes the inversion painless.` },
    { title: "Solve for the length", body: `Setting that form to ${fmtNum(p.targetPct)} percent and multiplying through gives a needle of about ${fmtNum(d.needle)} centimeters — a length-to-spacing ratio of ${fmtNum(d.ratio)}.` },
    { title: "Answer", body: `Cut the needle to about ${fmtNum(d.needle)} centimeters.` },
    { title: "Sanity check", body: `The ratio ${fmtNum(d.ratio)} sits below one, so the needle respects its own regime; and feeding it back into the forward formula returns the demanded ${fmtNum(p.targetPct)} percent by construction.` },
  ],
  keyInsight: "Buffon's short-needle formula is linear in the length, so demanding a crossing probability is one multiplication away from the required design.",
  commonTrap: "Forgetting the factor of two-over-pi when going backwards — the target is not the ratio itself, only after scaling by pi halves.",
  expectedPaceS: 55,
  verify: { method: "montecarlo" },
  constants: [Math.PI],
};
