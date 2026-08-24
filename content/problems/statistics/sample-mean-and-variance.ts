import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Five deviation patterns, each summing to zero so the sample mean lands exactly on the quoted
// centre and every printed term stays an integer. Each pattern's sum of squares divides by
// n - 1 into a terminating decimal, which is what keeps the printed variance exact rather than
// a repeating tail the display would have to round. `constraint` rejects a draw whose smallest
// reading would fall below one ticket, and it needs the actual readings to do that, so both
// helpers are licensed — the table is reached through `valuesOf`.
const PATTERNS: readonly (readonly number[])[] = [
  [-4, -1, 0, 2, 3],    // SS=30, /4 = 7.5
  [-3, -2, 1, 1, 3],    // SS=24, /4 = 6
  [-5, -2, 0, 3, 4],    // SS=54, /4 = 13.5
  [-2, -2, -1, 2, 3],   // SS=22, /4 = 5.5
  [-6, -1, 0, 3, 4],    // SS=62, /4 = 15.5
];
const valuesOf = (p: { base: number; spread: number; pat: number }) =>
  PATTERNS[p.pat].map((k) => p.base + p.spread * k);

export const sampleMeanAndVariance: ProblemTemplate = {
  id: "statistics/sample-mean-and-variance",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "optiver", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the sample variance with the Bessel-corrected denominator" },
  params: {
    base: { choices: [24, 30, 36, 42, 48, 55, 60, 72, 84, 96] },
    spread: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    pat: { choices: [0, 1, 2, 3, 4] },
  },
  constraint: (p) => Math.min(...valuesOf(p as { base: number; spread: number; pat: number })) >= 3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const values = valuesOf(p as { base: number; spread: number; pat: number });
    const n = values.length;
    const total = values.reduce((a, b) => a + b, 0);
    const mean = round(total / n);
    const ss = round(values.reduce((a, v) => a + (v - mean) * (v - mean), 0));
    // Every reading and every deviation is printed, so each has to be a derived value in its
    // own right: verification/emit.ts rejects any number in the text that it cannot trace back
    // to a param, a derived value or a declared constant.
    const out: Record<string, number> = {
      n,
      nLessOne: n - 1,
      total,
      mean,
      ss,
      largestDev: Math.max(...values.map((v) => Math.abs(v - mean))),
      popVar: round(ss / n),
      answer: round(ss / (n - 1)),
    };
    values.forEach((v, i) => { out[`v${i + 1}`] = v; out[`dev${i + 1}`] = round(v - mean); });
    return out;
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => {
    const values = valuesOf(p as { base: number; spread: number; pat: number });
    return `A market-making desk logs the number of client tickets it filled on each of ${fmtNum(values.length)} consecutive days: ${values.map((v) => fmtNum(v)).join(", ")}. ` +
      `These ${fmtNum(values.length)} days are a sample of the desk's activity rather than its entire history. What is the sample variance of the daily ticket count?`;
  },
  solution: (p, d) => {
    const values = valuesOf(p as { base: number; spread: number; pat: number });
    const devs = values.map((v) => v - d.mean);
    return [
      { title: "What the sample variance asks for", body: `The sample variance is the average squared distance from the centre, but averaged over $n-1$ rather than $n$: $s^2=\\dfrac{(x_1-\\bar{x})^2+\\cdots+(x_n-\\bar{x})^2}{n-1}$. So the mean has to be found first, because every deviation is measured from it.` },
      { title: "The mean", body: `The ${fmtNum(d.n)} readings total ${fmtNum(d.total)}, so the sample mean is $${fmtNum(d.total)}/${fmtNum(d.n)}=${fmtNum(d.mean)}$ tickets a day.` },
      { title: "Square the deviations and add them", body: `Measured from ${fmtNum(d.mean)}, the deviations are ${devs.map((x) => fmtNum(x)).join(", ")}. Squaring each and adding gives $${devs.map((x) => `(${fmtNum(x)})^2`).join("+")}=${fmtNum(d.ss)}$. The signs disappear in the squaring, which is exactly why the deviations summing to zero costs nothing here.` },
      { title: "Divide by one less than the count", body: `Dividing that total by ${fmtNum(d.n)} - 1 gives $${fmtNum(d.ss)}/${fmtNum(d.nLessOne)}=${fmtNum(d.answer)}$.` },
      { title: "Answer", body: `The sample variance is ${fmtNum(d.answer)} tickets squared.` },
      { title: "Sanity check", body: `Dividing by ${fmtNum(d.n)} instead would have given $${fmtNum(d.ss)}/${fmtNum(d.n)}=${fmtNum(d.popVar)}$, which is smaller. That gap is the Bessel correction, and it is always in that direction: the same sum of squares over a smaller denominator can only be larger.` },
    ];
  },
  keyInsight: "The mean is estimated from the very sample whose spread is being measured, so the deviations are measured from a centre that has already been pulled toward them. Dividing by one less than the count is the exact compensation for that, and it is why the sample variance always exceeds the plug-in figure rather than sometimes exceeding it.",
  commonTrap: "Dividing the sum of squared deviations by the number of readings, which is the population formula and understates the spread of a sample. The other slip is forgetting to square before adding, which makes the deviations cancel to zero and reports no spread at all.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
