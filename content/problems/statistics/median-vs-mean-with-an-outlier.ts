import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const medianVsMeanWithAnOutlier: ProblemTemplate = {
  id: "statistics/median-vs-mean-with-an-outlier",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "drw", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the breakdown point of the mean against the median" },
  params: {
    base: { choices: [20, 25, 30, 35, 40, 50, 60, 80] },
    step: { choices: [2, 3, 4, 5, 6, 8] },
    out: { choices: [40, 50, 60, 75, 90, 110, 130, 150, 180, 220] },
  },
  // The outlier has to clear the largest ordinary reading by enough that it is unambiguously the
  // maximum AND that the mean ends up strictly above the median — both follow from out > 7*step.
  constraint: (p) => p.out > 7 * p.step + 4,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const total = 5 * p.base + 8 * p.step + p.out;
    const mean = round(total / 5);
    const median = p.base + 3 * p.step;
    // The five quotes are printed twice over — as given and sorted — so each is a derived value
    // in its own right; verification/emit.ts traces every number in the text back to one.
    return {
      n: 5,
      total,
      mean,
      median,
      biggest: p.base + p.out,
      q1: p.base,
      q2: p.base + p.step,
      q3: p.base + 3 * p.step,
      q4: p.base + 4 * p.step,
      answer: round(mean - median),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) => {
    const shown = [p.base + 3 * p.step, p.base, p.base + p.out, p.base + 4 * p.step, p.base + p.step];
    return `Five brokers quote a commission for the same block, in dollars per lot: ${shown.map((v) => fmtNum(v)).join(", ")}. ` +
      `By how much does the mean of the five quotes exceed their median?`;
  },
  solution: (p, d) => {
    const sorted = [p.base, p.base + p.step, p.base + 3 * p.step, p.base + 4 * p.step, p.base + p.out];
    return [
      { title: "The median needs the quotes in order", body: `Sorted, the five quotes are ${sorted.map((v) => fmtNum(v)).join(", ")}. With an odd count the median is simply the middle one, so it is ${fmtNum(d.median)} — and note that only its POSITION mattered, not how far the largest quote sits above it.` },
      { title: "The mean needs all five", body: `The mean gives every quote a vote weighted by its size, $\\bar{x}=\\dfrac{x_1+\\cdots+x_n}{n}$, so all five have to be added. They add to ${fmtNum(d.total)}, so the mean is $${fmtNum(d.total)}/${fmtNum(d.n)}=${fmtNum(d.mean)}$.` },
      { title: "Take the difference", body: `The mean exceeds the median by $${fmtNum(d.mean)}-${fmtNum(d.median)}=${fmtNum(d.answer)}$ dollars per lot.` },
      { title: "Answer", body: `The mean is ${fmtNum(d.answer)} dollars per lot above the median.` },
      { title: "Sanity check", body: `Four of the five quotes sit at or below ${fmtNum(p.base + 4 * p.step)}, yet the mean is ${fmtNum(d.mean)} — the single quote of ${fmtNum(d.biggest)} has dragged it above four fifths of the sample. Push that one quote higher still and the mean follows it without limit, while the median does not move at all.` },
    ];
  },
  keyInsight: "The mean gives every reading a vote weighted by its size, so one extreme value can move it as far as you like. The median gives every reading a vote weighted by its rank, so no single value can move it past its neighbour. That difference is the whole reason a skewed sample gets reported two ways.",
  commonTrap: "Reading the median off the quotes in the order they were given rather than sorting them first, which returns whichever number happens to sit third. The other slip is treating a mean above the median as a mistake rather than as the signature of a right-skewed sample.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
