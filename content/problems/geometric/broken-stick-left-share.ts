import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// One uniform break on a stick of length L: P(left piece longer than cL) = 1 - c.
// Parameterized form of the classic — the answer varies with the drawn share.
const leftOf = (p: Params) => 1 - p.sharePct / 100;

export const brokenStickLeftShare: ProblemTemplate = {
  id: "geometric/broken-stick-left-share",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "single-break stick, length-share probability" },
  params: {
    stickCm: { range: { min: 30, max: 90, step: 5 } },
    sharePct: { range: { min: 10, max: 90, step: 5 } },
  },
  constraint: (p) => leftOf(p) >= 0.1 && leftOf(p) <= 0.99,
  derived: (p) => {
    const threshold = (p.sharePct / 100) * p.stickCm;
    const answer = 1 - p.sharePct / 100;
    const qualifying = p.stickCm - threshold;
    const shareFrac = p.sharePct / 100;
    return { threshold, answer, qualifying, shareFrac };
  },
  statement: (p) =>
    `A stick ${fmtNum(p.stickCm)} centimeters long is snapped once at a uniformly random point along its length. What is the probability the left piece is longer than ${fmtNum(p.sharePct)} percent of the whole stick?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The break point is uniform on the stick, so the chance of landing in any stretch is that stretch's fraction of the length.` },
    { title: "Locate the qualifying stretch", body: `The left piece beats ${fmtNum(p.sharePct)} percent exactly when the break lands past the ${fmtNum(d.threshold)}-centimeter mark — a stretch of ${fmtNum(d.qualifying)} centimeters at the stick's right end.` },
    { title: "Answer", body: `That stretch covers $1-${fmtNum(d.shareFrac)}=${fmtNum(d.answer)}$ of the stick, so the probability is $${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The threshold sits at the ${fmtNum(p.sharePct)} percent mark and the qualifying stretch is everything beyond it — together they reassemble the whole stick, which is why the answer reads straight off one hundred minus the demand.` },
  ],
  keyInsight: "One uniform break makes the left-piece length itself a uniform draw, so any length-share question is a straight subtraction from one.",
  commonTrap: "Treating both pieces as random separately — there is a single random break point, and the right piece is determined, not drawn.",
  expectedPaceS: 25,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
