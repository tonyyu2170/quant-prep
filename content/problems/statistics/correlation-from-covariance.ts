import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const correlationFromCovariance: ProblemTemplate = {
  id: "statistics/correlation-from-covariance",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "correlation as covariance normalised by the two standard deviations" },
  params: {
    varX: { choices: [16, 25, 36, 49, 64, 81, 100, 144] },
    varY: { choices: [9, 16, 25, 36, 49, 64, 100, 121] },
    cov: { choices: [-40, -28, -18, -12, -6, 6, 12, 18, 24, 30, 40, 54] },
  },
  constraint: (p) => Math.abs(p.cov) <= 0.85 * Math.sqrt(p.varX * p.varY) && Math.abs(p.cov) >= 0.12 * Math.sqrt(p.varX * p.varY),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sdX = round(Math.sqrt(p.varX));
    const sdY = round(Math.sqrt(p.varY));
    return {
      sdX,
      sdY,
      sdProduct: round(sdX * sdY),
      answer: round(p.cov / (sdX * sdY)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two strategies have daily returns whose variances are ${fmtNum(p.varX)} and ${fmtNum(p.varY)} basis points squared, and whose covariance is ${fmtNum(p.cov)} basis points squared. ` +
    `What is the correlation between the two strategies' daily returns?`,
  solution: (p, d) => [
    { title: "Correlation is covariance stripped of its units", body: `The definition is $\\text{Corr}(X,Y)=\\dfrac{\\text{Cov}(X,Y)}{\\sigma_X\\,\\sigma_Y}$. Covariance carries the units of both variables multiplied together, and dividing by both standard deviations cancels them, which is what leaves a pure number that can be compared across any pair.` },
    { title: "Take the two standard deviations", body: `They are the square roots of the variances: $\\sqrt{${fmtNum(p.varX)}}=${fmtNum(d.sdX)}$ and $\\sqrt{${fmtNum(p.varY)}}=${fmtNum(d.sdY)}$ basis points.` },
    { title: "Divide the covariance by their product", body: `That product is $${fmtNum(d.sdX)}\\times${fmtNum(d.sdY)}=${fmtNum(d.sdProduct)}$, so the correlation is $\\dfrac{${fmtNum(p.cov)}}{${fmtNum(d.sdProduct)}}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The correlation is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `That product ${fmtNum(d.sdProduct)} is also the largest covariance this pair could possibly have, which is why a correlation can never leave the range from minus one to one. The quoted covariance of ${fmtNum(p.cov)} sits inside it, so the figure is legal.` },
  ],
  keyInsight: "The product of the two standard deviations is the largest covariance a pair can have, reached only when one variable is an exact multiple of the other. Correlation is just the covariance measured as a fraction of that ceiling, which is what makes it comparable across pairs with wildly different units.",
  commonTrap: "Dividing by the product of the two variances rather than of the two standard deviations, which produces a number far too small and no longer bounded by one. The other slip is dividing by only one of them, which leaves a figure that still carries units.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [],
};
