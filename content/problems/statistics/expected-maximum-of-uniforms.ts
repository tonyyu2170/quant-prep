import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const expectedMaximumOfUniforms: ProblemTemplate = {
  id: "statistics/expected-maximum-of-uniforms",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the expected maximum of n independent uniforms" },
  params: {
    // Each count is one less than a number of the form 2^a 5^b, so n/(n+1) terminates and the
    // whole printed chain stays exact.
    n: { choices: [3, 4, 7, 9, 15, 19, 24, 31, 39, 49] },
    top: { choices: [10, 20, 25, 50, 60, 100, 120, 200] },
    sessions: { choices: [5, 10, 20, 30] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      nPlusOne: p.n + 1,
      fraction: round(p.n / (p.n + 1)),
      gapBelowTop: round(p.top / (p.n + 1)),
      answer: round((p.top * p.n) / (p.n + 1)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Over each of ${fmtNum(p.sessions)} trading sessions, ${fmtNum(p.n)} independent quotes arrive, each equally likely to be anywhere between 0 and ${fmtNum(p.top)} ticks wide. ` +
    `In a single session, what is the expected width of the WIDEST of the ${fmtNum(p.n)} quotes?`,
  solution: (p, d) => [
    { title: "All of them below x, or the maximum is above it", body: `The maximum is at most $x$ exactly when every one of the quotes is, and independence turns that into a product: the maximum's distribution function is $(x/L)^n$. Differentiating and integrating gives the expectation $L\\,\\dfrac{n}{n+1}$ — the same answer the survival integral produces without ever writing the density down.` },
    { title: "The fraction of the range", body: `With ${fmtNum(p.n)} quotes that fraction is $${fmtNum(p.n)}/${fmtNum(d.nPlusOne)}=${fmtNum(d.fraction)}$.` },
    { title: "Scale it to the range", body: `The expected maximum is $${fmtNum(p.top)}\\times${fmtNum(p.n)}/${fmtNum(d.nPlusOne)}=${fmtNum(d.answer)}$ ticks.` },
    { title: "Answer", body: `The widest quote averages ${fmtNum(d.answer)} ticks.` },
    { title: "Sanity check", body: `The gap left below the ceiling is $${fmtNum(p.top)}/${fmtNum(d.nPlusOne)}=${fmtNum(d.gapBelowTop)}$ ticks. The ${fmtNum(p.n)} quotes cut the range into ${fmtNum(d.nPlusOne)} gaps that are equal on average, and the maximum sits exactly one gap short of the top — which is why the answer never reaches ${fmtNum(p.top)} however many quotes arrive.` },
  ],
  keyInsight: "n points dropped uniformly on an interval cut it into n+1 gaps whose expected lengths are all equal, and every order statistic follows from that one fact. The maximum sits one gap below the ceiling, the minimum one gap above the floor, and no integration is needed to see either.",
  commonTrap: "Answering with the midpoint of the range, which is the expectation of a single quote rather than of the largest. The other slip is expecting the maximum to reach the ceiling for large n, when it always falls one average gap short.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
