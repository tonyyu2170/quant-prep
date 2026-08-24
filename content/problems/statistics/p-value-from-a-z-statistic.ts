import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

// The upper tail is derived and printed DIRECTLY rather than as 1 minus the CDF. Printing the
// CDF and building on it is the rounding trap this repo has hit twice: at z = 2.88 the CDF
// renders 0.9980, and 2*(1-0.9980) = 0.004 against a true p-value of 0.003977 — a chain that
// reconciles in floats and not on the page. Doubling a 4-figure tail is exact at display
// precision, so the tail is the quantity that gets printed.
//
// The critical value is derived FROM the level rather than being a param of its own, so a draw
// can never print a 5 percent level beside the 1 percent multiplier — the same reason
// sample-size-for-margin derives its multiplier.
const critOf = (par: { alphaPct: number }) =>
  par.alphaPct === 10 ? 1.645 : par.alphaPct === 5 ? 1.96 : 2.576;

export const pValueFromAZStatistic: ProblemTemplate = {
  id: "statistics/p-value-from-a-z-statistic",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the two-sided p-value of a z-statistic" },
  params: {
    zAbs: { choices: [1.05, 1.15, 1.28, 1.4, 1.55, 1.68, 1.82, 1.96, 2.05, 2.15, 2.28, 2.4, 2.55, 2.7, 2.88, 3.05] },
    alphaPct: { choices: [10, 5, 1] },
    nObs: { choices: [40, 60, 75, 90, 120, 150, 180, 240, 300, 400] },
  },
  // Below a p-value of 1e-4 the four-figure display starts losing the answer's own precision.
  constraint: (p) => 2 * (1 - normalCdf(p.zAbs)) >= 1e-4 && critOf(p as { alphaPct: number }) !== p.zAbs,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const tail = round(1 - normalCdf(p.zAbs));
    return {
      tail,
      crit: critOf(p as { alphaPct: number }),
      alphaFrac: round(p.alphaPct / 100),
      oneSided: tail,
      answer: round(2 * tail),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A researcher tests whether a signal's mean return differs from zero, using ${fmtNum(p.nObs)} independent observations, and the test statistic comes out at ${fmtNum(p.zAbs)} standard errors from zero. The alternative is two-sided: a mean either above or below zero would count. ` +
    `Treating the statistic as standard normal, what is the two-sided p-value?`,
  solution: (p, d) => [
    { title: "What a p-value is asking", body: `The p-value is the chance of seeing a statistic at least this extreme WHEN THE NULL IS TRUE. Because the alternative is two-sided, "this extreme" means far from zero in either direction, so the answer is $p=2\\times\\text{upper tail}(|z|)$ — one tail for each way the signal could have gone.` },
    { title: "The tail beyond the statistic", body: `From the standard normal, the area above ${fmtNum(p.zAbs)} is ${fmtNum(d.tail)}. That is the one-sided p-value already, and it is what a one-sided alternative would have reported.` },
    { title: "Double it for the second tail", body: `The lower tail below minus ${fmtNum(p.zAbs)} has the same area by symmetry, so the two together come to ${fmtNum(d.answer)}. Written as an equation this step would not reconcile on the page: the tail displays to four figures at ${fmtNum(d.tail)}, and twice that rendering is a digit short of the true total whenever the doubling crosses into the next decade.` },
    { title: "Answer", body: `The two-sided p-value is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The ${fmtNum(p.alphaPct)} percent level, or $${fmtNum(p.alphaPct)}/100=${fmtNum(d.alphaFrac)}$, has a two-sided critical value of ${fmtNum(d.crit)}. Here $${fmtNum(p.zAbs)}${p.zAbs > d.crit ? "\\geq" : "<"}${fmtNum(d.crit)}$, and correspondingly $${fmtNum(d.answer)}${d.answer < d.alphaFrac ? "<" : "\\geq"}${fmtNum(d.alphaFrac)}$ — comparing the statistic to the critical value and comparing the p-value to the level are the same test written two ways, so they can never disagree.` },
  ],
  keyInsight: "A p-value and a critical value are the same comparison read in opposite directions: one converts the statistic into a probability, the other converts the level into a statistic. Which one an interviewer wants is a matter of convention, but they always agree, and noticing that saves recomputing anything.",
  commonTrap: "Reporting the one-sided tail when the alternative is two-sided, which halves the p-value and doubles the apparent significance. The opposite slip is doubling a tail that was already two-sided, which is the same error with the sign flipped.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [2, 100],
};
