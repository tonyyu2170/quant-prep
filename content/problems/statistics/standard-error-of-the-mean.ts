import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const standardErrorOfTheMean: ProblemTemplate = {
  id: "statistics/standard-error-of-the-mean",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "hrt", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the standard error of a sample mean under independent sampling" },
  params: {
    sd: { choices: [6, 8, 12, 15, 18, 20, 24, 30, 36, 45] },
    n: { choices: [4, 9, 16, 25, 36, 49, 64, 100, 144, 225] },
    mean: { choices: [40, 55, 70, 85, 100, 120, 150, 180] },
  },
  constraint: (p) => p.sd / Math.sqrt(p.n) >= 0.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    return {
      root,
      quadN: 4 * p.n,
      quadRoot: round(2 * root),
      quadSe: round(p.sd / (2 * root)),
      answer: round(p.sd / root),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A research desk measures the fill latency of ${fmtNum(p.n)} independent orders. Across the whole venue, latency has a standard deviation of ${fmtNum(p.sd)} microseconds, and this sample's average came out at ${fmtNum(p.mean)} microseconds. ` +
    `What is the standard error of that sample average?`,
  solution: (p, d) => [
    { title: "The mean of many is steadier than any one of them", body: `The standard error is the standard deviation of the sample MEAN, not of a single reading: $\\text{SE}=\\dfrac{\\sigma}{\\sqrt{n}}$. Averaging independent readings lets their errors cancel, and the square root is how fast that cancellation accrues.` },
    { title: "Take the root of the sample size", body: `With ${fmtNum(p.n)} orders, $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$.` },
    { title: "Divide the venue's standard deviation by it", body: `That gives $\\dfrac{${fmtNum(p.sd)}}{${fmtNum(d.root)}}=${fmtNum(d.answer)}$ microseconds. Note the sample's own average of ${fmtNum(p.mean)} plays no part — the standard error depends on how variable single orders are and how many were taken, never on where the average happened to land.` },
    { title: "Answer", body: `The standard error of the sample average is ${fmtNum(d.answer)} microseconds.` },
    { title: "Sanity check", body: `Quadrupling the sample to ${fmtNum(d.quadN)} orders would give $\\dfrac{${fmtNum(p.sd)}}{${fmtNum(d.quadRoot)}}=${fmtNum(d.quadSe)}$ — exactly half. Four times the data buys twice the precision, which is the square root rule read backwards and the reason precision gets expensive.` },
  ],
  keyInsight: "Independent errors add in quadrature rather than linearly, so a sample of n averages down by the square root of n and not by n. Every claim about how much data is enough rests on that square root, and it is why the last decimal place costs a hundred times the first.",
  commonTrap: "Dividing the standard deviation by the sample size rather than by its square root, which overstates the precision of the average dramatically. The other slip is quoting the population standard deviation itself, which describes a single reading and not the average of many.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
