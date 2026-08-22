import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Buffon's needle, short-needle regime L <= T: P(cross) = 2L/(pi T). pi enters via
// Math.PI only (authoring contract). Band asked through this helper (constraint cannot
// see `derived`, packages/engine/src/problem.ts:24).
const crossOf = (p: Params) => (2 * p.needleCm) / (Math.PI * p.boardCm);

export const buffonShortNeedle: ProblemTemplate = {
  id: "geometric/buffon-short-needle",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "two-sigma", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "Buffon's needle experiment, short-needle form" },
  params: {
    needleCm: { range: { min: 4, max: 16, step: 1 } },
    // surface-only: floor spacing label varies prose without touching the ratio
    lineCount: { range: { min: 6, max: 40, step: 2 } },
    boardCm: { range: { min: 5, max: 20, step: 1 } },
  },
  constraint: (p) => p.needleCm <= p.boardCm && crossOf(p) >= 0.1 && crossOf(p) <= 0.99,
  derived: (p) => {
    const answer = (2 * p.needleCm) / (Math.PI * p.boardCm);
    const ratio = p.needleCm / p.boardCm;
    return { answer, ratio };
  },
  statement: (p) =>
    `A floor is ruled with ${fmtNum(p.lineCount)} parallel lines ${fmtNum(p.boardCm)} centimeters apart. A needle ${fmtNum(p.needleCm)} centimeters long is dropped at random — its center uniformly between the lines, its angle uniform — and it never spans far enough to touch two lines at once. What is the probability the needle crosses a line?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Only two random ingredients matter: the needle center's distance to the nearer line, and the tilt. A tilt of angle off the floor lines puts the needle's half-reach perpendicular to them at its half-length times that angle's sine.` },
    { title: "Average over the tilt", body: `Averaging the sine of a uniform angle gives two-over-pi, so the crossing chance works out to twice the length-to-spacing ratio divided by pi — about ${fmtNum(d.answer)} here for a ratio of ${fmtNum(d.ratio)}.` },
    { title: "Answer", body: `The needle crosses a line with probability about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The answer stays below one exactly while the needle runs no longer than the spacing — this draw respects that — and it grows linearly in the ratio until the long-needle regime takes over.` },
  ],
  keyInsight: "Buffon's short needle trades one geometric average — the mean height of a tilted tip — for a probability carrying pi in the denominator.",
  commonTrap: "Using the full needle length where the perpendicular reach belongs, or forgetting that the average of sine is not the sine of the average.",
  expectedPaceS: 60,
  verify: { method: "montecarlo" },
  constants: [Math.PI],
};
