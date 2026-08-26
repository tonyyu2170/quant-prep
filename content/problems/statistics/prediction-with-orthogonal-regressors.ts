import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The zero SAMPLE correlation is the licence for everything this template does, so the
// statement says it in those words rather than leaving it to be inferred from the design. A
// randomised trial gives zero correlation in expectation; only a balanced grid gives it
// exactly, and "exactly" is what makes each simple slope equal to its multiple-regression
// coefficient. Without that clause the question has no answer from the numbers given.
//
// `constraint` is five conjuncts, all of them measured against this template's own traps over
// all 7560 tuples:
//
//  * Each adjustment must be worth at least 3.25, so dropping either signal — the trap the
//    prose names first — misses by at least 5.0 tolerances rather than by the 1.29 the raw
//    grid allows at its worst.
//  * The two adjustments together must be worth at least 4.25, which is what stops them
//    cancelling: at t1 = -t2 the answer IS the mean, and both "no adjustment at all" and
//    "average the two single-signal fits" grade correct.
//  * The SWAP GAP |(b-c)(u-v)| is the distance between the right answer and the one got by
//    pairing each slope with the other signal's deviation. It is zero whenever the two slopes
//    coincide, which the grid reaches at 1.5 and at 2, and small whenever they nearly do: 331
//    draws graded that mistake correct before this conjunct.
//  * The prediction floor keeps the answer away from zero, where a rel tolerance is exact
//    equality in disguise, and keeps it a plausible ratio: the raw grid reaches -2, and a
//    negative message-to-fill ratio is not a quantity.
//
// No threshold is landable. Every |t1|, |t2| and |t1+t2| is a multiple of 0.5 and every answer
// is too, so the quarter-values 3.25, 4.25, 2.25 and 15.25 fall strictly between reachable
// neighbours; `constraint` sees the raw float while `derived` rounds, and a threshold ON the
// grid would decide those draws by float dirt rather than by the rule.
//
// b2, d1 and d2 all draw negative, so every printed product parenthesises its operands.
export const predictionWithOrthogonalRegressors: ProblemTemplate = {
  id: "statistics/prediction-with-orthogonal-regressors",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "zero sample correlation decouples a multiple regression into two simple ones" },
  params: {
    ybar: { choices: [40, 55, 70, 85, 100, 120] },
    b1: { range: { min: 0.5, max: 2.5, step: 0.5 } },
    b2: { choices: [-3, -2, -1.5, 1.5, 2, 3, 4] },
    d1: { choices: [-6, -4, -2, 3, 5, 8] },
    d2: { choices: [-5, -3, 2, 4, 6, 9] },
  },
  constraint: (p) => {
    const t1 = p.b1 * p.d1, t2 = p.b2 * p.d2;
    return Math.abs(t1) >= 3.25 && Math.abs(t2) >= 3.25 && Math.abs(t1 + t2) >= 4.25 &&
      Math.abs((p.b1 - p.b2) * (p.d1 - p.d2)) >= 2.25 &&
      Math.round((p.ybar + t1 + t2) * 1e9) / 1e9 >= 15.25;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      t1: round(p.b1 * p.d1),
      t2: round(p.b2 * p.d2),
      answer: round(p.ybar + p.b1 * p.d1 + p.b2 * p.d2),   // from the exact operands, not from t1 and t2
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `An exchange trials two changes to its matching engine over the same run of days: the batching interval, in microseconds, and the width of the price band, in ticks. The two settings are stepped on a balanced grid, so across the trial days they come out EXACTLY uncorrelated in the sample. ` +
    `Over those days the venue's message-to-fill ratio averaged ${fmtNum(p.ybar)}. Regressing that ratio on the batching interval alone gives a slope of ${fmtNum(p.b1)} per microsecond; regressing it on the band width alone gives a slope of ${fmtNum(p.b2)} per tick. ` +
    `On one day the batching interval sat ${fmtNum(Math.abs(p.d1))} microseconds ${p.d1 > 0 ? "above" : "below"} its trial mean and the band width ${fmtNum(Math.abs(p.d2))} ticks ${p.d2 > 0 ? "above" : "below"} its. What does the regression on BOTH settings at once predict for the ratio that day?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "With no correlation, the two fits do not interfere", body: `Write $b$ for the slope from regressing the response on the first setting by itself, $c$ for the slope from the second by itself, and $u$, $v$ for the day's distances from the two settings' own means. In general a joint fit's coefficients are NOT the two simple slopes: each simple slope is inflated or deflated by whatever the other predictor was doing alongside it. What removes that is zero correlation in the sample — neither setting then carries any information about the other that a linear fit can use, so neither can borrow credit from it, and each keeps in the joint fit exactly the slope it had alone. The joint prediction is then the mean with both adjustments laid on top of it, $\\bar{y}+bu+cv$.` },
      { title: "What the batching interval contributes", body: `The day sat ${fmtNum(Math.abs(p.d1))} microseconds ${p.d1 > 0 ? "above" : "below"} the trial mean of that setting, and each microsecond is worth ${fmtNum(p.b1)} on the ratio: $${fmtNum(p.b1)}\\times${paren(p.d1)}=${fmtNum(d.t1)}$.` },
      { title: "What the band width contributes", body: `The band sat ${fmtNum(Math.abs(p.d2))} ticks ${p.d2 > 0 ? "above" : "below"} its own trial mean, at ${fmtNum(p.b2)} per tick: $${paren(p.b2)}\\times${paren(p.d2)}=${fmtNum(d.t2)}$. Nothing here refers to the other setting, which is the whole content of the orthogonality.` },
      { title: "Answer", body: `Laying both adjustments on the average day gives $${fmtNum(p.ybar)}+${paren(d.t1)}+${paren(d.t2)}=${fmtNum(d.answer)}$ messages per fill. The two are ADDED, not averaged: each is the full effect of its own setting, already net of the other.` },
      { title: "Sanity check", body: `This is the one case where dropping a regressor costs nothing. The bias a dropped variable leaves behind is its own coefficient times the slope of regressing it on the variable that stays — and with the two settings uncorrelated in the sample that second factor is exactly zero, so the surviving coefficient does not move. Run the trial with the two settings stepped together instead of on a grid and none of this survives: the simple slopes would each be carrying part of the other's effect, adding them would double-count it, and the joint fit would have to be computed from the data rather than assembled from two separate ones.` },
    ];
  },
  keyInsight: "Orthogonal predictors make a multiple regression separable: each coefficient can be read off its own simple regression, and the joint prediction is the mean plus one independent adjustment per predictor. That is why designed experiments are balanced on purpose — balance is what buys the right to interpret each effect on its own, and it is what observational data, short of coincidence, does not have.",
  commonTrap: "Applying only one of the two adjustments, or averaging them, on the intuition that two overlapping explanations must be sharing the work — they overlap only when the predictors are correlated, and here they are not. The mirror error is assuming the simple slopes can never be the joint ones and refusing to answer; that is right in general and wrong as soon as the sample correlation is zero, which is what the question hands over.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [],
};
