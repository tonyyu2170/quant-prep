import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const pooledMeanOfTwoGroups: ProblemTemplate = {
  id: "statistics/pooled-mean-of-two-groups",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.2 }, { firm: "imc", weight: 0.2 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the pooled mean of two unequal groups" },
  params: {
    nA: { choices: [5, 10, 15, 20, 25, 30, 40, 60, 75] },
    nB: { choices: [5, 10, 15, 20, 25, 30, 40, 60, 75] },
    mA: { choices: [12, 18, 24, 30, 36, 45, 52, 60] },
    mB: { choices: [15, 20, 28, 35, 42, 50, 58, 66] },
  },
  // The permitted totals are the ones that divide an integer into a terminating decimal, so the
  // pooled mean prints exactly rather than as a rounded repeating tail. Equal group sizes are
  // rejected because they make the pooled mean and the average-of-averages coincide, which is
  // the one case where the whole point of the problem disappears.
  constraint: (p) => [20, 25, 40, 50, 80, 100].includes(p.nA + p.nB) && p.nA !== p.nB,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const total = p.nA + p.nB;
    const sumA = p.nA * p.mA;
    const sumB = p.nB * p.mB;
    return {
      total,
      sumA,
      sumB,
      grand: sumA + sumB,
      naive: round((p.mA + p.mB) / 2),
      answer: round((sumA + sumB) / total),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A clearing desk handles two books. The first settled ${fmtNum(p.nA)} trades at an average size of ${fmtNum(p.mA)} lots; the second settled ${fmtNum(p.nB)} trades at an average size of ${fmtNum(p.mB)} lots. ` +
    `Across both books together, what is the average size of a settled trade?`,
  solution: (p, d) => [
    { title: "An average of averages is not the average", body: `The overall mean is total lots over total trades, $\\bar{x}=\\dfrac{n_A\\bar{x}_A+n_B\\bar{x}_B}{n_A+n_B}$, so each book's average has to be weighted by how many trades stand behind it. Averaging the two averages weights them equally, which is only correct when the books are the same size.` },
    { title: "Recover each book's total", body: `The first book settled $${fmtNum(p.nA)}\\times${fmtNum(p.mA)}=${fmtNum(d.sumA)}$ lots, the second $${fmtNum(p.nB)}\\times${fmtNum(p.mB)}=${fmtNum(d.sumB)}$ lots.` },
    { title: "Divide the grand total by the trade count", body: `Together that is ${fmtNum(d.grand)} lots across $${fmtNum(p.nA)}+${fmtNum(p.nB)}=${fmtNum(d.total)}$ trades, so the pooled average is $\\dfrac{${fmtNum(d.grand)}}{${fmtNum(d.total)}}=${fmtNum(d.answer)}$ lots.` },
    { title: "Answer", body: `The average settled trade is ${fmtNum(d.answer)} lots.` },
    { title: "Sanity check", body: `Averaging the two averages would have given $\\dfrac{${fmtNum(p.mA)}+${fmtNum(p.mB)}}{2}=${fmtNum(d.naive)}$, a different number. The true figure sits between ${fmtNum(p.mA)} and ${fmtNum(p.mB)} but nearer the book with more trades in it, which is the check worth doing on any weighted average.` },
  ],
  keyInsight: "A mean is a total divided by a count, so combining two of them means recovering both totals first. The weights are the counts, and the pooled figure always lands between the two group means, pulled toward whichever group is larger.",
  commonTrap: "Averaging the two group averages directly, which silently assumes the groups are the same size and can be badly wrong when they are not. The reverse slip is weighting by the group means instead of the group counts.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [2],
};
