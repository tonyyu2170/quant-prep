import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the standard deviation would
// be typed twice — once to pin the answer away from zero, once to derive it.
const sdOf = (p: Params) => Math.sqrt((p.scale * p.scale * (p.n * p.n - 1)) / 12);

// Affine scaling: a flat add-on that cannot touch the spread, and a multiplier that reaches
// the variance twice. The answer is a square root and is irrational on almost every draw, so
// every printed chain keeps its operands as exact integers and takes the root only at the
// very end — feeding a printed 4-significant-figure root into a further multiplication is the
// drift class content/problems/printed-precision.test.ts exists to catch.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const affineScalingSd: ProblemTemplate = {
  id: "ev-variance/affine-scaling-sd",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "standard deviation of a linear payoff on a uniform draw, where the flat term is a decoy" },
  params: {
    n: { range: { min: 4, max: 20, step: 1 } },      // balls numbered 1 through n
    scale: { range: { min: 2, max: 10, step: 1 } },  // dollars per point
    bonus: { range: { min: 5, max: 50, step: 5 } },  // the flat add-on, never zero: at zero
                                                     // the commonTrap would cost nothing
  },
  // Constraint 2's floor and ceiling, stated as the requirement. Neither binds on this space
  // — measured over all 1,530 legal draws the answer runs [2.236, 57.66] — but a wider scale
  // or a longer run of balls would reach the ceiling, so the rule travels with the template.
  constraint: (p) => sdOf(p) >= 0.01 && sdOf(p) <= 1e4,
  derived: (p) => {
    const spread = p.scale * (p.n - 1);
    return {
      varDraw: (p.n * p.n - 1) / 12,
      varPay: (p.scale * p.scale * (p.n * p.n - 1)) / 12,
      spread,
      halfSpread: spread / 2,
      quarterSpread: spread / 4,
      sd: sdOf(p),
    };
  },
  statement: (p) =>
    `A cage holds ${fmtNum(p.n)} balls numbered 1 through ${fmtNum(p.n)}, and one ball is drawn with every ball equally likely. ` +
    `A contract pays ${fmtNum(p.scale)} dollars for each point on the ball drawn, plus a flat ${fmtNum(p.bonus)} dollars on top. ` +
    `What is the standard deviation of the payout, in dollars?`,
  answerKey: "sd",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Two things are done to the drawn number before it becomes a payout: it is multiplied by ${fmtNum(p.scale)}, and ${fmtNum(p.bonus)} is added. Spread — variance, the average squared distance from the mean, written $\\sigma^2$ — reacts to those two very differently. Adding the same amount to every payout slides the whole picture along without changing a single distance inside it, so the flat ${fmtNum(p.bonus)} plays no part at all. Multiplying stretches every distance by the same factor, so it does reach the answer.` },
    { title: "Spread of the draw itself", body: `The ball drawn is uniform on the whole numbered run, and an evenly spread run of ${fmtNum(p.n)} consecutive numbers has variance $\\frac{${fmtNum(p.n)}\\times${fmtNum(p.n)}-1}{12}=${fmtNum(d.varDraw)}$ — set only by how long the run is, never by where it starts.` },
    // Both chains below are built from exact integers, and the root is taken once, at the end.
    // Printing the scaled variance and then rooting the printed decimal would put a rounded
    // operand into the last step, which is what drifts.
    { title: "Scale it", body: `Every distance from the mean is multiplied by ${fmtNum(p.scale)}, and variance is built from those distances squared, so the multiplier lands on it twice: $\\frac{${fmtNum(p.scale)}\\times${fmtNum(p.scale)}\\times(${fmtNum(p.n)}\\times${fmtNum(p.n)}-1)}{12}=${fmtNum(d.varPay)}$ in squared dollars. The standard deviation is the square root of that, $\\sqrt{\\frac{${fmtNum(p.scale)}\\times${fmtNum(p.scale)}\\times(${fmtNum(p.n)}\\times${fmtNum(p.n)}-1)}{12}}=${fmtNum(d.sd)}$ dollars, so it carries just one factor of ${fmtNum(p.scale)}.` },
    { title: "Sanity check", body: `Bracket the figure against the payouts' own range, which owes nothing to the variance formula. The lowest and highest payouts differ by $${fmtNum(p.scale)}\\times(${fmtNum(p.n)}-1)=${fmtNum(d.spread)}$ dollars — and notice the flat ${fmtNum(p.bonus)} cancels out of that difference, exactly as it cancels out of the spread. No spread of any shape can reach half the range, $\\frac{${fmtNum(d.spread)}}{2}=${fmtNum(d.halfSpread)}$, since that would need every payout piled on the two ends; and a draw laid evenly across the whole range must clear a quarter of it, $\\frac{${fmtNum(d.spread)}}{4}=${fmtNum(d.quarterSpread)}$. The answer sits between the two.` },
  ],
  keyInsight: "Adding a fixed amount to every outcome slides the whole distribution along without changing any distance inside it, so only the multiplier reaches the spread — and it reaches the variance twice over, once for each factor of a squared distance, which is why the standard deviation picks up exactly one factor of it.",
  commonTrap: "Letting the flat add-on inflate the answer, folding it into the spread the way it folds into the average. It moves every payout by the same amount, so every distance from the mean survives untouched and the standard deviation does not move at all.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  // 1 and 12 are the run's lowest label and the uniform-variance denominator; 2 and 4 are the
  // halving and quartering in the Sanity check, and 2 is also the exponent in the sigma-squared
  // notation, which is a bare digit the audit cannot trace to anything else.
  constants: [1, 2, 4, 12],
};
