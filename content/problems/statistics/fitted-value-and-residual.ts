import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The residual is the answer and it is NOT a drawn axis: y0 is drawn independently of the line and
// `constraint` keeps the gap in a readable band, so the answer is signed and spread rather than
// readable off the statement. The negative INTERCEPT stays — it is what stops a student reading
// the answer straight off the two printed numbers — but the fitted VALUE is pinned positive: a
// prediction of -3.5 thousand shares is not a volume, and it also renders the answer step as
// "10--3.5", which the printed-precision reader cannot parse at all. Pinning it here is what lets
// that step print bare, with no parenthesising helper.
//
// The band's lower end is self-evident (a miss under 1.5 rounds away against volumes this size);
// the upper end at 14 keeps the miss comparable to the volumes themselves — a third of the
// largest volume drawn — so the day reads as one the line missed rather than as a bad print.
//
// `exact4` is the guarantee, not the grid: the slope stepping in halves against an integer
// predictor happens to make every fitted value exact today, and this fails loud if that changes.
export const fittedValueAndResidual: ProblemTemplate = {
  id: "statistics/fitted-value-and-residual",
  version: 1,
  topic: "statistics/regression",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the residual as the observed value less the fitted one" },
  params: {
    a: { choices: [-8, -5, -2, 3, 6, 10, 12, 15] },
    b: { range: { min: 0.5, max: 3, step: 0.5 } },
    x0: { choices: [4, 6, 7, 9, 11, 12, 14, 16] },
    y0: { choices: [10, 14, 18, 22, 26, 30, 34, 38, 42] },
  },
  constraint: (p) => {
    const fitted = p.a + p.b * p.x0;
    const r = p.y0 - fitted;
    return fitted > 0 && exact4(fitted) && Math.abs(r) >= 1.5 && Math.abs(r) <= 14;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      slopeTerm: round(p.b * p.x0),
      fitted: round(p.a + p.b * p.x0),
      answer: round(p.y0 - (p.a + p.b * p.x0)),   // from the exact operands, not from `fitted`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk fits a least-squares line predicting a stock's daily volume in thousands of shares from the number of news items about it that morning. The fitted line has intercept ${fmtNum(p.a)} and slope ${fmtNum(p.b)}. ` +
    `On a day with ${fmtNum(p.x0)} news items the volume actually came in at ${fmtNum(p.y0)} thousand shares. What is that day's residual?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A residual is what the line missed by", body: `The fitted line gives a prediction $f=a+bx$ at each value of the predictor. The residual is the observed value less that prediction, $e=y-f$. It is not the error term of the model: the error is the distance from the true line, which nobody observes, while the residual is the distance from the line that was actually fitted to this sample.` },
    { title: "The prediction on the day", body: `At ${fmtNum(p.x0)} news items the slope contributes $${fmtNum(p.b)}\\times${fmtNum(p.x0)}=${fmtNum(d.slopeTerm)}$, and adding the intercept gives a prediction of $${fmtNum(p.a)}+${fmtNum(d.slopeTerm)}=${fmtNum(d.fitted)}$ thousand shares.` },
    { title: "Answer", body: `The observed volume was ${fmtNum(p.y0)}, so the residual is $${fmtNum(p.y0)}-${fmtNum(d.fitted)}=${fmtNum(d.answer)}$ thousand shares. The sign matters: it says the day came in ${d.answer > 0 ? "above" : "below"} what the line predicted.` },
    { title: "Sanity check", body: `Residuals from a fitted line with an intercept sum to zero across the whole sample, so a single one of ${fmtNum(d.answer)} says nothing on its own about whether the line is any good — only that this day sat that far off it.` },
  ],
  keyInsight: "A residual is a distance from the line that was fitted, not from the true relationship, and the two are different objects: one is observed, the other never is. Least squares chooses the line that makes the squared residuals as small as possible, which is why they carry the sign of the miss and sum to zero.",
  commonTrap: "Subtracting the other way round and reporting the prediction less the observation, which flips the sign of every residual. The deeper slip is calling the residual the error — the error is measured from the unobservable true line.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
