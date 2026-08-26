import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The slope of a line fitted with the intercept forced to zero. `constraint` needs the answer
// twice over: the band keeps the hedge ratio plausible, and `sumXY !== sumX2` removes the two
// (sumXY, sumX2) pairs — (240, 240) and (480, 480), ten draws once `n` is counted — where the
// ratio is exactly 1 and this template's own commonTrap, inverting it, grades as CORRECT.
// Nothing wider is needed: the nearest
// off-diagonal ratio to 1 is 420/400, whose inverse sits nine percent away, three orders
// outside the grading tolerance.
//
// `n` is printed and never used. With the line pinned at the origin the slope is the ratio of
// the two raw sums and the number of observations does not enter it at all — that is the
// template's point, not an oversight, and the third section says so.
//
// No `exact4` here: every printed operand is an integer param and only the result rounds.
export const slopeThroughTheOrigin: ProblemTemplate = {
  id: "statistics/slope-through-the-origin",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "least squares with no intercept: the normal equation over the raw sums" },
  params: {
    sumXY: { choices: [180, 240, 300, 360, 420, 480, 560, 640, 720, 840, 960] },
    sumX2: { choices: [120, 160, 200, 240, 320, 400, 480, 600] },
    n: { choices: [8, 10, 12, 15, 20] },
  },
  constraint: (p) => p.sumXY !== p.sumX2 && p.sumXY / p.sumX2 >= 0.4 && p.sumXY / p.sumX2 <= 5,
  derived: (p) => ({
    answer: Math.round((p.sumXY / p.sumX2) * 1e9) / 1e9,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `An airline's fuel desk hedges its jet-fuel bill with crude futures. Over ${fmtNum(p.n)} trading days it regresses the day's change in the fuel bill on the day's change in the futures price, forcing the line through the origin: a day on which the futures did not move should call for no hedge at all. ` +
    `Over those days the sum of the products of the two daily changes, $T_{xy}$, came to ${fmtNum(p.sumXY)}, and the sum of the squared futures changes, $T_{xx}$, came to ${fmtNum(p.sumX2)}, both in matching units. What hedge ratio does the fit report?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "One parameter, one normal equation", body: `Least squares with an intercept has two normal equations, one setting the height and one setting the tilt. Pinning the line at the origin deletes the first and leaves a single condition: minimising the summed squares of $y-bx$ over $b$ gives $bT_{xx}=T_{xy}$, where $T_{xy}$ is the sum of the products and $T_{xx}$ the sum of the squared predictors. Both are RAW sums, not sums about the means — with no intercept there is no mean to subtract, because the fit is not free to move the line up or down to meet one. So $b=\\dfrac{T_{xy}}{T_{xx}}$.` },
    { title: "Answer", body: `Dividing: $\\dfrac{${fmtNum(p.sumXY)}}{${fmtNum(p.sumX2)}}=${fmtNum(d.answer)}$ units of fuel-bill change per unit of futures change, which is what the desk hedges at.` },
    { title: "The day count never enters", body: `Both sums run over the same ${fmtNum(p.n)} days, and neither the normal equation nor its solution mentions how many days that is — the count is in the data, not in the formula. What more days buy is precision in the estimate, which is a separate question from the estimate itself. A slope fitted WITH an intercept would need the two means, and those do depend on the count.` },
    { title: "Sanity check", body: `Fitted with an intercept the slope would be $\\dfrac{S_{xy}}{S_{xx}}$ over the sums taken about the two means, which is a different number in general. Forcing the origin is a modelling claim — that a zero move in the futures implies a zero move in the bill — and for a hedge ratio it is the right claim: the hedge is a position in the futures, not a forecast with a standing constant bolted onto it.` },
  ],
  keyInsight: "Forcing a line through the origin removes a parameter, and with it the centring: the slope becomes a ratio of raw sums rather than of sums about the means, and the sample size drops out of the point estimate entirely. Choosing the constrained fit is a claim about the world, not a convenience.",
  commonTrap: "Inverting the ratio and dividing the cross-product into the sum of squares, which is the fit of the futures move on the fuel bill rather than the other way round. The other slip is reaching for the centred sums out of habit — with no intercept there is no mean to subtract, and subtracting one anyway answers a regression nobody ran.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [0],
};
