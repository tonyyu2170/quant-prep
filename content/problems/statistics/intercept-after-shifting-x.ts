import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The intercept under a shift of the predictor's origin. `constraint` needs the answer: an
// intercept of exactly 0 grades at rel 0.005 of nothing, which is exact equality in disguise,
// and this grid reaches it — (a=-12, b=1.2, c=10) and (a=-20, b=1, c=20) among others. The
// floor of 1 is the one regression-intercept-from-means uses, for the same reason.
//
// The negative intercepts stay: they are what stops the answer being read off the statement,
// and the response is a deviation from a seasonal norm, so a negative load is a real reading
// rather than a nonsense one. The only chain that prints a negative prints it LEADING, where
// a minus is unambiguous both to a reader and to the printed-precision reader — the hazard
// non-negotiable 4 guards is a doubled sign or a juxtaposition, neither of which occurs here.
//
// `exact4` is the guarantee, not the grid: a slope stepping in fifths against an integer
// reference happens to make the shift term exact today, and this fails loud if that changes.
export const interceptAfterShiftingX: ProblemTemplate = {
  id: "statistics/intercept-after-shifting-x",
  version: 1,
  topic: "statistics/regression",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "millennium", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "re-parameterising a fitted line by shifting the predictor's origin" },
  params: {
    a: { choices: [-20, -12, -6, 4, 9, 14, 22, 30] },
    b: { range: { min: 0.6, max: 3.4, step: 0.2 } },
    c: { choices: [5, 8, 10, 12, 15, 18, 20, 25, 30] },
  },
  constraint: (p) => Math.abs(p.a + p.b * p.c) >= 1 && exact4(p.b * p.c),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      shiftTerm: round(p.b * p.c),
      answer: round(p.a + p.b * p.c),   // from the exact operands, not from `shiftTerm`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A power desk fits a least-squares line predicting a region's daily electricity load ABOVE its seasonal norm, in gigawatt-hours, from the day's average temperature in degrees Celsius. The fitted line has intercept ${fmtNum(p.a)} and slope ${fmtNum(p.b)}. ` +
    `The contract the desk trades quotes temperature not in degrees but as degrees above ${fmtNum(p.c)}, so the desk rewrites the same fitted line to take that as its predictor. What is the intercept of the rewritten line?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Substitute, do not refit", body: `Write $x$ for the temperature, $c$ for the reference the contract quotes against, and $g$ for the day's degrees above it, so that $x=g+c$. Putting that into $y=a+bx$ gives $y=(a+bc)+bg$. The coefficient multiplying the predictor is untouched and the intercept absorbs the slope times the shift. Nothing was refitted: the line has not moved, only the label on the horizontal axis has, and a rate is indifferent to where its axis starts counting.` },
    { title: "What the slope used to account for", body: `The old intercept is the load the line predicts at a temperature of zero. Moving the origin up to the contract's reference hands the intercept everything the slope accounted for along the way: $${fmtNum(p.b)}\\times${fmtNum(p.c)}=${fmtNum(d.shiftTerm)}$ gigawatt-hours.` },
    { title: "Answer", body: `Adding that to the old intercept, the rewritten line's intercept is $${fmtNum(p.a)}+${fmtNum(d.shiftTerm)}=${fmtNum(d.answer)}$ gigawatt-hours. It is exactly what the old line predicts at ${fmtNum(p.c)} degrees, because that is where the new predictor reads zero.` },
    { title: "Sanity check", body: `Centring a predictor is this same operation with the reference set to the sample's own mean, $\\bar{x}$, and there the new intercept comes out as the mean response $\\bar{y}$, because the least-squares line passes through the point of means. That is the usual reason to do it: it converts an intercept describing a day nobody trades into one describing the average day.` },
  ],
  keyInsight: "Shifting a predictor's origin leaves the slope alone and moves the intercept by the slope times the shift, because the intercept is never more than the fitted value at wherever the predictor happens to read zero. Every re-parameterisation therefore hands the intercept a different meaning while the line itself stays put.",
  commonTrap: "Subtracting the shift instead of adding it, reading \"degrees above the reference\" as something to take off the intercept when it is the slope's work below the new origin that the intercept has to absorb. The other slip is expecting the slope to change too: a shift of origin cannot change a rate.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
