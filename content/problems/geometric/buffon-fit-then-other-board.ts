import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-stage Buffon: stage one sizes the needle from a stated crossing chance on the wide
// board; stage two reprices that needle on a narrower ruling (still short-needle).
const impliedNeedle = (p: Params) => (p.targetPct / 100) * p.firstBoardCm * (Math.PI / 2);

export const buffonFitThenOtherBoard: ProblemTemplate = {
  id: "geometric/buffon-fit-then-other-board",
  version: 1,
  topic: "probability/geometric",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "hrt", weight: 0.35 }],
  source: { kind: "original", inspiration: "carry one needle across two ruled floors" },
  params: {
    targetPct: { range: { min: 10, max: 50, step: 5 } },
    firstBoardCm: { range: { min: 40, max: 100, step: 10 } },
    secondBoardPct: { choices: [40, 50, 60, 70, 80] },
  },
  constraint: (p) => impliedNeedle(p) >= 0.1 && impliedNeedle(p) <= Math.round((p.secondBoardPct / 100) * p.firstBoardCm) && (2 * impliedNeedle(p)) / (Math.PI * Math.round((p.secondBoardPct / 100) * p.firstBoardCm)) >= 0.1 && (2 * impliedNeedle(p)) / (Math.PI * Math.round((p.secondBoardPct / 100) * p.firstBoardCm)) <= 0.99,
  derived: (p) => {
    const needle = impliedNeedle(p);
    const secondBoard = Math.round((p.secondBoardPct / 100) * p.firstBoardCm);
    const answer = (2 * needle) / (Math.PI * secondBoard);
    return { needle, secondBoard, answer };
  },
  statement: (p) =>
    `A demonstration floor has parallel lines ${fmtNum(p.firstBoardCm)} centimeters apart, and its short needle was sized to cross a line exactly ${fmtNum(p.targetPct)} percent of the time. The show moves to a tighter floor with lines ${fmtNum(Math.round((p.secondBoardPct / 100) * p.firstBoardCm))} centimeters apart — the same needle goes along. What is the new crossing probability?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: recover the needle", body: `The short-needle chance is linear in length, so ${fmtNum(p.targetPct)} percent of the crossing law pins the needle at about ${fmtNum(d.needle)} centimeters.` },
    { title: "Stage two: reprice on the tighter floor", body: `Twice the needle over pi times the new spacing of ${fmtNum(d.secondBoard)} centimeters gives a crossing chance of about ${fmtNum(d.answer)} — the ratio to the spacing is all that ever mattered.` },
    { title: "Answer", body: `The crossing probability rises to about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Tighter lines give any fixed needle more chances to touch one, so the chance must rise from ${fmtNum(p.targetPct)} percent — and it stays in the short-needle regime because the needle still fits between the new lines.` },
  ],
  keyInsight: "One needle, two floors: the fitted length is portable, and only its ratio to whatever spacing it meets decides the crossing chance.",
  commonTrap: "Rescaling the probability by the spacing change instead of rebuilding the ratio — the needle stays put while the denominator shrinks.",
  expectedPaceS: 75,
  verify: { method: "montecarlo" },
  constants: [Math.PI],
};
