import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The correlation is one of ±0.28, ±0.6, ±0.8, ±0.96 — Pythagorean pairs, so 1 − r² is the
// square of a two-decimal number and its root is exact. The two variances are perfect squares,
// the covariance is derived from them and the drawn correlation (licensed exact by `constraint`),
// and n − 2 is a perfect square, so every operand in every chain is exact. The sign is a drawn
// axis, so the statistic is signed and spread about zero.
const covOf = (par: { varX: number; varY: number; rAbs: number; sign: number }) => par.sign * par.rAbs * Math.sqrt(par.varX * par.varY);
const tOf = (par: { rAbs: number; nMinus2: number }) => (par.rAbs * Math.sqrt(par.nMinus2)) / Math.sqrt(1 - par.rAbs * par.rAbs);

export const correlationSignificanceTStatistic: ProblemTemplate = {
  id: "statistics/correlation-significance-t-statistic",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the t-test for a zero correlation" },
  params: {
    varX: { choices: [4, 9, 16, 25, 36, 64, 100] },
    varY: { choices: [4, 9, 16, 25, 36, 64, 100] },
    rAbs: { choices: [0.28, 0.6, 0.8, 0.96] },
    sign: { choices: [-1, 1] },
    nMinus2: { choices: [4, 9, 16, 25, 36, 49, 64, 100, 144, 196, 225, 400, 900] },
  },
  constraint: (p) => exact4(covOf(p as { varX: number; varY: number; rAbs: number; sign: number })) && tOf(p as { rAbs: number; nMinus2: number }) >= 0.5 && tOf(p as { rAbs: number; nMinus2: number }) <= 25,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sx = Math.sqrt(p.varX);
    const sy = Math.sqrt(p.varY);
    const cov = round(p.sign * p.rAbs * sx * sy);
    const r = round(cov / (sx * sy));
    const rSq = round(r * r);
    const oneMinusRSq = round(1 - rSq);
    const rootOneMinus = round(Math.sqrt(oneMinusRSq));
    const rootDf = Math.sqrt(p.nMinus2);
    return {
      sx,
      sy,
      sxsy: sx * sy,
      cov,
      r,
      rSq,
      oneMinusRSq,
      rootOneMinus,
      n: p.nMinus2 + 2,
      rootDf,
      answer: round((r * rootDf) / rootOneMinus),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `Over ${fmtNum(d.n)} trading days two daily signals are recorded. The first has a sample variance of ${fmtNum(p.varX)} and the second of ${fmtNum(p.varY)}, and their sample covariance is ${fmtNum(d.cov)}. To test whether the signals are really uncorrelated, the statistic $t=\\dfrac{r\\sqrt{n-2}}{\\sqrt{1-r^{2}}}$ is referred to a t distribution on $n-2$ degrees of freedom. ` +
    `What is the t-statistic?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "First the correlation", body: `The statistic is built from the sample correlation, which is the covariance scaled by both standard deviations: $r=\\dfrac{\\text{Cov}(X,Y)}{\\sigma_X\\,\\sigma_Y}$. Everything else in the formula is bookkeeping for how much of one signal the other leaves unexplained, and how many days stand behind the estimate.` },
      { title: "The correlation", body: `The two standard deviations multiply to $\\sqrt{${fmtNum(p.varX)}\\times${fmtNum(p.varY)}}=${fmtNum(d.sxsy)}$, so $r=\\dfrac{${paren(d.cov)}}{${fmtNum(d.sxsy)}}=${fmtNum(d.r)}$.` },
      { title: "The unexplained share", body: `One less the squared correlation is $1-${paren(d.r)}^{2}=${fmtNum(d.oneMinusRSq)}$, and its root is $\\sqrt{${fmtNum(d.oneMinusRSq)}}=${fmtNum(d.rootOneMinus)}$ — the residual spread of one signal after the other has explained what it can.` },
      { title: "The degrees of freedom", body: `Two parameters are fitted, so $\\sqrt{${fmtNum(d.n)}-2}=${fmtNum(d.rootDf)}$ is the root that scales the evidence.` },
      { title: "Answer", body: `Put together, $\\dfrac{${paren(d.r)}\\times${fmtNum(d.rootDf)}}{${fmtNum(d.rootOneMinus)}}=${fmtNum(d.answer)}$. The sign is the sign of the correlation; the size is what the t table judges.` },
      { title: "Sanity check", body: `The denominator is below one, so the statistic is always at least the correlation times the root of the degrees of freedom — and it grows with the root of the days, so four times the data doubles it. As the correlation approaches plus or minus one the denominator collapses and the statistic runs away, which is the formula's way of saying a near-perfect correlation on any reasonable sample cannot be luck.` },
    ];
  },
  keyInsight: "A correlation's significance depends on two things only: how far from zero it is, and how many observations it rests on. The test statistic is the correlation times the root of the degrees of freedom, inflated by the residual spread, so a small correlation on a long history can be as significant as a large one on a short history.",
  commonTrap: "Judging the correlation by its size alone, without the sample behind it, or using n rather than n minus two under the root. The other slip is forgetting the denominator, which matters little for weak correlations and enormously for strong ones.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
