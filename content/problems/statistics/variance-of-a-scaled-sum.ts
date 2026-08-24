import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const varianceOfAScaledSum: ProblemTemplate = {
  id: "statistics/variance-of-a-scaled-sum",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the affine transformation rule for variance" },
  params: {
    mult: { choices: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15] },
    varX: { choices: [9, 16, 25, 36, 49, 64, 81, 100, 144, 196] },
    fee: { choices: [50, 75, 100, 120, 150, 200, 250, 300] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const answer = p.mult * p.mult * p.varX;
    return {
      multSquared: p.mult * p.mult,
      sdX: round(Math.sqrt(p.varX)),
      sd: round(Math.sqrt(answer)),
      naive: p.mult * p.varX,
      answer,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A single lot of a futures contract has a daily profit whose variance is ${fmtNum(p.varX)} dollars squared. A desk holds ${fmtNum(p.mult)} lots of it, and the clearing house charges the desk a flat ${fmtNum(p.fee)} dollars a day whatever the position does. ` +
    `What is the variance of the desk's daily profit?`,
  solution: (p, d) => [
    { title: "Only the multiplier survives", body: `A position of $a$ lots plus a fixed charge $b$ turns one lot's profit $X$ into $aX-b$, and the variance of that is $\\text{Var}(aX-b)=a^2\\text{Var}(X)$. The constant shifts every outcome by the same amount, so it moves the centre and leaves every distance from the centre untouched.` },
    { title: "Square the multiplier", body: `Holding ${fmtNum(p.mult)} lots squares into $${fmtNum(p.mult)}^2=${fmtNum(d.multSquared)}$ — variance is in squared dollars, so a multiplier of the profit enters it twice.` },
    { title: "Apply it to one lot's variance", body: `That gives $${fmtNum(d.multSquared)}\\times${fmtNum(p.varX)}=${fmtNum(d.answer)}$ dollars squared. The ${fmtNum(p.fee)} dollar charge contributes nothing at all.` },
    { title: "Answer", body: `The variance of the desk's daily profit is ${fmtNum(d.answer)} dollars squared.` },
    { title: "Sanity check", body: `In dollars rather than dollars squared: one lot has a standard deviation of $\\sqrt{${fmtNum(p.varX)}}=${fmtNum(d.sdX)}$, and the desk's is $\\sqrt{${fmtNum(d.answer)}}=${fmtNum(d.sd)}$ — exactly ${fmtNum(p.mult)} times as large, which is the multiplier entering the standard deviation once and the variance twice.` },
  ],
  keyInsight: "Variance measures squared distance from the centre, so anything that stretches the outcomes enters it squared and anything that merely slides them enters it not at all. Both halves of that come from the same fact, and the fixed fee is the half people forget to check.",
  commonTrap: "Multiplying the single-lot variance by the position size rather than by its square, which understates the risk of a large book badly. The second slip is adding the fixed charge into the variance, as though a cost known in advance carried any uncertainty.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
