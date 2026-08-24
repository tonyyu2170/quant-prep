import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two families of deviation patterns, each summing to zero so both column means land exactly on
// their quoted centres and every printed deviation stays an integer. `constraint` rejects a draw
// whose readings would go non-positive or whose cross-product total is too small to read a sign
// off, and it needs the actual columns to do either, so the tables are licensed — reached
// through `xsOf`, `ysOf` and `crossOf`.
const PX: readonly (readonly number[])[] = [
  [-4, -1, 0, 2, 3], [-3, -2, 1, 1, 3], [-5, -2, 0, 3, 4], [-2, -2, -1, 2, 3], [-6, -1, 0, 3, 4],
];
const PY: readonly (readonly number[])[] = [
  [-3, -1, 0, 1, 3], [-4, -2, 1, 2, 3], [-2, -1, 0, 1, 2], [-5, -1, 0, 2, 4], [-3, -3, 1, 2, 3],
];
type Par = { xbase: number; ybase: number; yscale: number; px: number; py: number };
const xsOf = (p: Par) => PX[p.px].map((k) => p.xbase + k);
const ysOf = (p: Par) => PY[p.py].map((k) => p.ybase + p.yscale * k);
const crossOf = (p: Par) => PX[p.px].reduce((a, k, i) => a + k * p.yscale * PY[p.py][i], 0);

export const covarianceFromATable: ProblemTemplate = {
  id: "statistics/covariance-from-a-table",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "citadel", weight: 0.2 }, { firm: "two-sigma", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "sample covariance computed from paired readings" },
  params: {
    xbase: { choices: [12, 15, 18, 22, 26, 30] },
    ybase: { choices: [40, 50, 60, 70, 85, 100] },
    yscale: { choices: [1, 2, 3, 4, 5] },
    px: { choices: [0, 1, 2, 3, 4] },
    py: { choices: [0, 1, 2, 3, 4] },
  },
  constraint: (p) => Math.min(...xsOf(p as Par)) >= 2 && Math.min(...ysOf(p as Par)) >= 5 && Math.abs(crossOf(p as Par)) >= 8,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const xs = xsOf(p as Par), ys = ysOf(p as Par);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const meanX = round(sumX / n);
    const meanY = round(sumY / n);
    const cross = round(xs.reduce((a, x, i) => a + (x - meanX) * (ys[i] - meanY), 0));
    // Each printed reading and each printed deviation must be traceable on its own — see the
    // audit in verification/emit.ts, which rejects any number in the text it cannot account for.
    const out: Record<string, number> = { n, nLessOne: n - 1, sumX, sumY, meanX, meanY, cross, popCov: round(cross / n), answer: round(cross / (n - 1)) };
    xs.forEach((x, i) => { out[`x${i + 1}`] = x; out[`dx${i + 1}`] = round(x - meanX); });
    ys.forEach((y, i) => { out[`y${i + 1}`] = y; out[`dy${i + 1}`] = round(y - meanY); });
    return out;
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => {
    const xs = xsOf(p as Par), ys = ysOf(p as Par);
    const pairs = xs.map((x, i) => `(${fmtNum(x)}, ${fmtNum(ys[i])})`).join(", ");
    return `On each of ${fmtNum(xs.length)} trading sessions a desk records the number of quotes it had to widen and the number of tickets it lost to a competitor, as the pairs ${pairs}. ` +
      `Treating these ${fmtNum(xs.length)} sessions as a sample, what is the sample covariance between the two counts?`;
  },
  solution: (p, d) => {
    const xs = xsOf(p as Par), ys = ysOf(p as Par);
    const terms = xs.map((x, i) => `(${fmtNum(x - d.meanX)})\\times(${fmtNum(ys[i] - d.meanY)})`).join("+");
    return [
      { title: "Covariance measures whether the two move together", body: `The sample covariance multiplies each pair's two deviations and averages the products over $n-1$: $\\text{Cov}(x,y)=\\dfrac{(x_1-\\bar{x})(y_1-\\bar{y})+\\cdots+(x_n-\\bar{x})(y_n-\\bar{y})}{n-1}$. A session above average on both, or below average on both, contributes a positive product; one above on one and below on the other contributes a negative.` },
      { title: "Both column means", body: `The widened quotes total ${fmtNum(d.sumX)}, so their mean is $${fmtNum(d.sumX)}/${fmtNum(d.n)}=${fmtNum(d.meanX)}$. The lost tickets total ${fmtNum(d.sumY)}, so their mean is $${fmtNum(d.sumY)}/${fmtNum(d.n)}=${fmtNum(d.meanY)}$.` },
      { title: "Multiply the paired deviations and add", body: `Session by session that is $${terms}=${fmtNum(d.cross)}$.` },
      { title: "Divide by one less than the count", body: `The sample covariance is $${fmtNum(d.cross)}/${fmtNum(d.nLessOne)}=${fmtNum(d.answer)}$.` },
      { title: "Answer", body: `The sample covariance is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The sign is what carries the meaning here, and it comes straight from the total ${fmtNum(d.cross)} rather than from the division, which can only rescale it. Adding a constant to either column would shift its mean by the same amount, leave every deviation alone, and change nothing.` },
    ];
  },
  keyInsight: "Covariance is built entirely from deviations, never from levels, so the two columns' units and origins are irrelevant to whether the pair moves together. That is also its weakness: the magnitude carries the product of two units and means nothing until it is divided by both standard deviations.",
  commonTrap: "Multiplying the raw readings rather than their deviations from the two means, which produces a large positive number for any pair of positive columns whether they move together or not. The other slip is dividing by the number of sessions instead of one less.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1],
};
