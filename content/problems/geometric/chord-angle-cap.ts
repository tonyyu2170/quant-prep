import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// Two points land independently and uniformly on a circle's circumference; the minor
// central angle between them is uniform on [0, pi], so P(angle < a) = a/pi. The cap is
// drawn as a percentage of pi. Band asked through this helper (constraint cannot see
// `derived`, packages/engine/src/problem.ts:24).
const angleOf = (p: Params) => p.capPct / 100;

export const chordAngleCap: ProblemTemplate = {
  id: "geometric/chord-angle-cap",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "de-shaw", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "minor central angle of two random rim points, unambiguous form" },
  params: {
    capPct: { range: { min: 12, max: 98, step: 2 } },
    // Scale never touches a ratio answer; it varies the surface only.
    pondR: { range: { min: 10, max: 120, step: 5 } },
  },
  constraint: (p) => angleOf(p) >= 0.1 && angleOf(p) <= 0.99 && !complementGrades(angleOf(p)),
  derived: (p) => {
    const answer = p.capPct / 100;
    const complement = 1 - answer;
    return { answer, complement };
  },
  statement: (p) =>
    `Two ants land independently at uniformly random points on the rim of a circular pond ${fmtNum(p.pondR)} meters across at half its width. Viewed from the pond's center, what is the probability the angle between them is smaller than ${fmtNum(p.capPct)} percent of a full turn?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Fix the first ant anywhere by symmetry; the second ant's position is then uniform around the rim, so the clockwise angle to it is uniform over one full turn.` },
    { title: "Fold to the minor angle", body: `The angle at the center has two readings — clockwise and counter-clockwise — that sum to a full turn, so the smaller of the two runs uniformly from zero up to a half turn.` },
    { title: "Answer", body: `A cap of ${fmtNum(p.capPct)} percent of a turn sits inside that half-turn range, and the minor angle falls below it with probability $\\frac{${fmtNum(p.capPct)}}{100}=${fmtNum(d.answer)}$ — the cap itself.` },
    { title: "Sanity check", body: `The complementary chance that the ants sit farther apart than the cap is ${fmtNum(d.complement)}, and together the two cover all pairings.` },
  ],
  keyInsight: "Symmetry plus folding turns two random rim points into one uniform angle on a half-turn, making any cap its own probability.",
  commonTrap: "Working with full turns instead of the folded minor angle — probabilities past a half turn are unreachable, and caps beyond it silently saturate.",
  expectedPaceS: 40,
  verify: { method: "montecarlo" },
  constants: [0, 1, 100],
};
