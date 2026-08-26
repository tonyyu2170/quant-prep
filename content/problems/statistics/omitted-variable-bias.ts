import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Omitted-variable bias as arithmetic. `constraint` does four jobs, three of them found by
// grading this template's own traps against every legal draw rather than a seed sample:
//
//  * |delta| >= 0.2 is the floor that makes the bias term big enough to be worth computing.
//    With it, the two traps the prose names — reporting the long coefficient untouched, and
//    subtracting the bias rather than adding it — miss by 10.8 and 21.6 times the grading
//    tolerance at their closest, on all 927 draws.
//  * |delta| !== 1 removes the 104 draws where the bias term IS the dropped coefficient. There
//    the multiplication this template exists to teach is invisible: a student who adds b2 and
//    never multiplies at all grades correct. Task 2's `k !== ybarScale` is the same removal.
//  * b1 !== b2 removes the 18 draws where multiplying the KEPT coefficient by the slope — the
//    natural confusion about which coefficient the slope multiplies — lands on the answer.
//  * |answer| >= 0.25 keeps the short coefficient clear of zero, where a rel tolerance is exact
//    equality in disguise. Both Task 2 siblings carry the same guard. The floor is 0.25 rather
//    than a round 0.3 because every reachable answer is a multiple of 0.02: a threshold ON the
//    grid decides four draws by float dirt, since `constraint` sees the raw sum while `derived`
//    rounds it, and the two straddle 0.3 in opposite directions.
//
// Not removed: the 10 draws where the answer coincidentally equals b2, and the 3 where it
// equals b1*b2*delta. Neither is a method a solver could arrive at from the question, and
// neither is named in the prose — but they are the residue, and they are why the audit script
// prints a control row.
//
// Both operands of the printed product parenthesise: b2 and delta each draw negative, and the
// emit tokenizer is sign-blind.
//
// `exact4` is the guarantee, not the grid: two one-decimal factors happen to make the bias term
// exact today, and this fails loud if that changes.
export const omittedVariableBias: ProblemTemplate = {
  id: "statistics/omitted-variable-bias",
  version: 1,
  topic: "statistics/regression",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "what a dropped correlated regressor does to the coefficient that stays" },
  params: {
    b1: { range: { min: 0.4, max: 2.8, step: 0.2 } },
    b2: { choices: [-2.5, -1.8, -1.2, 0.8, 1.5, 2.2, 3, 3.5] },
    delta: { range: { min: -1.2, max: 1.2, step: 0.2 } },
  },
  constraint: (p) =>
    Math.abs(p.delta) >= 0.2 && Math.abs(p.delta) !== 1 && p.b1 !== p.b2 &&
    Math.abs(p.b1 + p.b2 * p.delta) >= 0.25 && exact4(p.b2 * p.delta),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      biasTerm: round(p.b2 * p.delta),
      answer: round(p.b1 + p.b2 * p.delta),   // from the exact operands, not from `biasTerm`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A researcher regresses a stock's next-day return, in basis points, on two standardised signals at once: a value score and a momentum score. The joint fit puts a coefficient of ${fmtNum(p.b1)} on value and ${fmtNum(p.b2)} on momentum. ` +
    `Over the same stocks, regressing the momentum score on the value score alone gives a slope of ${fmtNum(p.delta)}. A colleague who cannot get the momentum score reruns the return on value by itself. What coefficient on value does that shorter regression report?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "One regressor cannot tell two stories apart", body: `Write $b$ for the coefficient on the kept signal in the joint fit, $c$ for the coefficient on the dropped one, and $g$ for the slope from regressing the dropped signal on the kept one. The short regression sees only the kept signal, so it cannot separate what that signal does to the return directly from what it predicts about the signal that is missing — it credits the kept signal with both. Its coefficient is $b+cg$: the joint coefficient, plus the dropped signal's own coefficient carried across by the slope that links the two.` },
      { title: "What the missing signal hands over", body: `A stock one unit higher on value sits ${fmtNum(Math.abs(p.delta))} of a unit ${p.delta > 0 ? "higher" : "lower"} on momentum, and each unit of momentum is worth ${fmtNum(p.b2)} basis points of return. So dropping momentum hands value $${paren(p.b2)}\\times${paren(p.delta)}=${fmtNum(d.biasTerm)}$ basis points per unit that momentum was earning.` },
      { title: "Answer", body: `Adding that to what value does on its own account, the shorter regression reports $${fmtNum(p.b1)}+${paren(d.biasTerm)}=${fmtNum(d.answer)}$ basis points per unit of value. It ${d.answer > p.b1 ? "overstates" : "understates"} the joint fit's coefficient of ${fmtNum(p.b1)}, and it is not a mistake in the arithmetic — it is the honest answer to a different question.` },
      { title: "Sanity check", body: `The bias is a product, so it dies if either factor does. Give the dropped signal no effect on the return and there is nothing to hand over; make the two signals uncorrelated in the sample, so the slope linking them is zero, and there is no channel to hand it over through. Only both together produce a clean short regression. Note also that nothing here depends on the sample size: more data would estimate ${fmtNum(d.answer)} more precisely, not move it toward ${fmtNum(p.b1)}.` },
    ];
  },
  keyInsight: "Dropping a regressor does not delete its contribution; it reassigns it. Whatever the dropped signal was doing to the response gets posted to the signals that remain, in proportion to how well each of them predicts the dropped one — which is why a coefficient means nothing without the list of what else was in the regression.",
  commonTrap: "Reporting the joint fit's coefficient unchanged, as though a regression's coefficients belonged to their variables rather than to the specification they were fitted in. The other slip is subtracting the bias term instead of adding it, reading \"remove the variable\" as \"remove its effect\" — the effect stays in the data and the short regression has nowhere to put it but the variable that is left.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
