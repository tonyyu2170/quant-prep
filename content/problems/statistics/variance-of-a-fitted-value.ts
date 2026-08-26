import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The root is taken over the four EXACT integers, twice, and never over the two rounded labels
// that precede it. `leverage` does not terminate on most draws — 4/144 is 0.02777… and prints
// 0.02778 — so "\sqrt{${invN}+${leverage}}" would root a four-figure rendering and miss `root`
// in the fourth digit. The cost is that the Answer step repeats the whole root rather than
// reusing the label above it; that repetition is deliberate and is the only form that keeps
// every printed operand exact. (The plan sketched "${sigma}\times${root}=${answer}", which is
// the same defect one step later: `root` is irrational on every draw, so it may be a printed
// RESULT but never a printed operand.)
//
// `constraint` is two conjuncts, both measured against this template's own traps over all 1260
// tuples rather than assumed:
//
//  * The leverage ratio is capped so the fitted value stays inside the body of the data — a
//    standard error quoted four predictor standard deviations out is an extrapolation, not a
//    fit. The cap is 0.27 rather than the round 0.25 the plan asked for because 0.25 is
//    REACHABLE exactly (25/100, 36/144, 100/400) and `constraint` sees the raw float while
//    `derived` rounds at the ninth decimal, so a threshold on the grid decides those draws by
//    float dirt. The next ratio up is 64/225 = 0.2844, so 0.27 falls in the gap and the
//    quarter-leverage draws are deliberately kept IN.
//  * The answer is held clear of 1, because the standard error and the VARIANCE it is the root
//    of are the same number there: s^2*h is exactly the square of s*sqrt(h), so a candidate who
//    reports the variance grades correct wherever the answer is near one. Two draws did. The
//    guard is 0.052 and not 0.05 for the same reason as above — an answer of exactly 1.05 is
//    reachable (n=10, sigma=3, d=3, Sxx=400), which puts |answer-1| exactly ON a 0.05 floor,
//    while no draw puts |answer-1| between 0.050053 and 0.054117. At 0.052 the variance trap
//    misses by 10.8 tolerances at its closest.
//
// Every printed operand is a positive integer, so no parenthesising helper is needed here.
export const varianceOfAFittedValue: ProblemTemplate = {
  id: "statistics/variance-of-a-fitted-value",
  version: 1,
  topic: "statistics/regression",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "sig", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "why a fitted line is sharpest at the centre of its data and fans out from there" },
  params: {
    sigma: { choices: [2, 3, 4, 5, 6] },
    n: { choices: [10, 16, 20, 25, 40, 50] },
    d: { choices: [2, 3, 4, 5, 6, 8, 10] },
    sxx: { choices: [100, 144, 196, 225, 400, 625] },
  },
  constraint: (p) =>
    (p.d * p.d) / p.sxx < 0.27 &&
    Math.abs(p.sigma * Math.sqrt(1 / p.n + (p.d * p.d) / p.sxx) - 1) >= 0.052,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const h = 1 / p.n + (p.d * p.d) / p.sxx;
    return {
      invN: round(1 / p.n),
      leverage: round((p.d * p.d) / p.sxx),
      h: round(h),
      root: round(Math.sqrt(h)),
      centreSE: round(p.sigma / Math.sqrt(p.n)),
      answer: round(p.sigma * Math.sqrt(h)),   // from the exact operands, not from `root`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A volatility desk fits a least-squares line predicting a stock's realised volatility over the coming month, in percentage points, from the level of a broad implied-volatility index on the first day of that month, over ${fmtNum(p.n)} months. ` +
    `The fit leaves a residual standard deviation of ${fmtNum(p.sigma)} percentage points, and the index levels have a sum of squared deviations about their own mean, $S_{xx}$, of ${fmtNum(p.sxx)}. ` +
    `What is the standard error of the fitted value at an index level ${fmtNum(p.d)} points from the mean of the ${fmtNum(p.n)} levels the line was fitted to?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A fitted value inherits two uncertainties, not one", body: `The line gives a prediction $f=a+bx$ at each value of the predictor, and both of the numbers it is built from were estimated. The height of the line is uncertain, which moves every prediction up or down together; the tilt is uncertain, which pivots the line about the point of means and so moves predictions far from the centre much more than those near it. Because least squares makes the estimated height and tilt uncorrelated about that point, the two uncertainties add as VARIANCES, and the standard error of the fitted value is $s\\sqrt{\\dfrac{1}{n}+\\dfrac{(x-\\bar{x})^{2}}{S_{xx}}}$ — one term for the height, one for the tilt.` },
    { title: "The two terms", body: `The height term is the same wherever the prediction is made: $\\dfrac{1}{${fmtNum(p.n)}}=${fmtNum(d.invN)}$. The tilt term grows with the square of the distance from the mean of the predictor, measured against the spread the predictor actually had: $\\dfrac{${fmtNum(p.d)}^{2}}{${fmtNum(p.sxx)}}=${fmtNum(d.leverage)}$. Together they come to ${fmtNum(d.h)}.` },
    { title: "The root of the sum", body: `Rooting the sum turns the variance back into a standard error, still measured in units of the residual spread: $\\sqrt{\\dfrac{1}{${fmtNum(p.n)}}+\\dfrac{${fmtNum(p.d)}^{2}}{${fmtNum(p.sxx)}}}=${fmtNum(d.root)}$. That is the fraction of a residual's typical size that the fitted value is uncertain by.` },
    { title: "Answer", body: `Scaling by the residual standard deviation itself gives $${fmtNum(p.sigma)}\\times\\sqrt{\\dfrac{1}{${fmtNum(p.n)}}+\\dfrac{${fmtNum(p.d)}^{2}}{${fmtNum(p.sxx)}}}=${fmtNum(d.answer)}$ percentage points. It is a standard error, not a variance: the variance would be its square.` },
    { title: "Sanity check", body: `At the mean of the predictor the tilt term disappears and the standard error is just the residual spread over the root of the count, $\\dfrac{${fmtNum(p.sigma)}}{\\sqrt{${fmtNum(p.n)}}}=${fmtNum(d.centreSE)}$ — and $${fmtNum(d.centreSE)}<${fmtNum(d.answer)}$, as it must be. The line is most precise at the centre of its data and fans out on both sides, which is why a prediction quoted well outside the range the predictor covered is worth far less than one quoted inside it, even though the arithmetic looks identical.` },
  ],
  keyInsight: "A fitted line has a waist: it is pinned tightest at the point of means and widens on both sides, because the tilt contributes nothing to the variance at the centre and contributes in proportion to the SQUARE of the distance from it. That shape is the half of the argument against extrapolation that the arithmetic can see; the other half — that the straight line was only ever evidenced inside the range the predictor covered — the formula cannot see at all, and it keeps returning an answer long after the data has stopped supporting one.",
  commonTrap: "Dropping the tilt term and quoting the residual spread over the root of the sample size, which is the standard error of a fitted value only at the mean of the predictor and understates it everywhere else. The other two slips are dimensional: reporting the variance rather than its root, and reaching for the SLOPE's standard error, the residual spread over the root of the predictor's sum of squares — a different quantity in different units.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
