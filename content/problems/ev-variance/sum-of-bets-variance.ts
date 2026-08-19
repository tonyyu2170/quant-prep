import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the total variance would be
// typed twice — once to pin the answer away from zero, once to derive it.
const varLeg = (pct: number, gap: number) => (pct * (100 - pct) * gap * gap) / 10000;
const totalVarOf = (p: Params) =>
  varLeg(p.pct1, p.w1 + p.l1) + varLeg(p.pct2, p.w2 + p.l2);

// Additivity of variance across independent bets, and the trap of adding standard deviations
// instead. Payoffs are capped at ten so each leg's variance stays under a hundred and prints
// to its last digit — that is what lets the two legs be added, and rooted, as exact operands.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const sumOfBetsVariance: ProblemTemplate = {
  id: "ev-variance/sum-of-bets-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "combining two independent positions, where the risks add in squares rather than in dollars" },
  params: {
    pct1: { range: { min: 10, max: 90, step: 10 } },
    pct2: { range: { min: 10, max: 90, step: 10 } },
    w1: { range: { min: 2, max: 10, step: 1 } },
    l1: { range: { min: 2, max: 10, step: 1 } },
    w2: { range: { min: 2, max: 10, step: 1 } },
    l2: { range: { min: 2, max: 10, step: 1 } },
  },
  // Constraint 2's floor and ceiling, stated as the requirement. Neither binds: measured over
  // the whole legal space the total runs [2.88, 200]. The ten-dollar payoff cap is what holds
  // the ceiling — variance grows as the square of a payoff, so it is the binding sizing rule
  // on this template rather than a style preference.
  constraint: (p) => totalVarOf(p) >= 0.01 && totalVarOf(p) <= 1e4,
  derived: (p) => {
    const gap1 = p.w1 + p.l1;
    const gap2 = p.w2 + p.l2;
    const var1 = varLeg(p.pct1, gap1);
    const var2 = varLeg(p.pct2, gap2);
    return {
      q1: 100 - p.pct1,
      q2: 100 - p.pct2,
      gap1, gap2, var1, var2,
      sd1: Math.sqrt(var1),
      sd2: Math.sqrt(var2),
      sdSum: Math.sqrt(var1) + Math.sqrt(var2),
      sdTotal: Math.sqrt(var1 + var2),
      varTotal: var1 + var2,
    };
  },
  statement: (p) =>
    `Two bets settle independently of one another. The first pays ${fmtNum(p.w1)} dollars with probability ${fmtNum(p.pct1)} percent ` +
    `and otherwise loses ${fmtNum(p.l1)} dollars. The second pays ${fmtNum(p.w2)} dollars with probability ${fmtNum(p.pct2)} percent ` +
    `and otherwise loses ${fmtNum(p.l2)} dollars. You take both. What is the variance of your total profit, in squared dollars?`,
  answerKey: "varTotal",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Because the two bets settle independently, their variances — each written $\\sigma^2$ — simply add. Standard deviations do not, and that is the whole point of the question. So price each bet's spread on its own first.` },
    // Each leg keeps its probabilities as integers over a hundred, so both legs print to their
    // last digit and can be added, and rooted, without a rounded operand entering the chain.
    { title: "Spread of the first bet", body: `A payoff with two outcomes contains a single distance: the two land $${fmtNum(p.w1)}+${fmtNum(p.l1)}=${fmtNum(d.gap1)}$ dollars apart. Its variance is that gap squared, discounted by how lopsided the branches are: $\\frac{${fmtNum(p.pct1)}\\times${fmtNum(d.q1)}\\times${fmtNum(d.gap1)}\\times${fmtNum(d.gap1)}}{100\\times100}=${fmtNum(d.var1)}$.` },
    { title: "Spread of the second bet", body: `The same reading of the second bet: its outcomes are $${fmtNum(p.w2)}+${fmtNum(p.l2)}=${fmtNum(d.gap2)}$ dollars apart, giving $\\frac{${fmtNum(p.pct2)}\\times${fmtNum(d.q2)}\\times${fmtNum(d.gap2)}\\times${fmtNum(d.gap2)}}{100\\times100}=${fmtNum(d.var2)}$.` },
    { title: "Add the variances", body: `Independence is what licenses the addition — neither bet tells you anything about the other, so neither can amplify or damp the other's swings. The total profit therefore has variance $${fmtNum(d.var1)}+${fmtNum(d.var2)}=${fmtNum(d.varTotal)}$ squared dollars.` },
    { title: "Sanity check", body: `Test the addition against the wrong one. Read each bet in dollars rather than squared dollars and add those: $\\sqrt{${fmtNum(d.var1)}}+\\sqrt{${fmtNum(d.var2)}}=${fmtNum(d.sdSum)}$ dollars. The answer above says the combined spread is really $\\sqrt{${fmtNum(d.var1)}+${fmtNum(d.var2)}}=${fmtNum(d.sdTotal)}$ dollars, which is the smaller of the two — as it has to be, since the two bets can land on opposite sides and partly cancel, something adding the dollar spreads never allows for.` },
  ],
  keyInsight: "Independent risks add in squares, not in dollars: variance is the quantity that is additive, so the standard deviation of the total lands strictly below the sum of the two separate standard deviations, which is exactly why spreading a stake across unrelated bets damps the swings rather than compounding them.",
  commonTrap: "Adding the two standard deviations, which quietly assumes the bets always swing the same way. Independent bets frequently land on opposite sides and offset each other, so the true spread of the total is strictly less than the sum of the separate spreads.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  // 100 is the percentage denominator; 2 is the exponent in the sigma-squared notation, a bare
  // digit the audit can trace to nothing else.
  constants: [2, 100],
};
