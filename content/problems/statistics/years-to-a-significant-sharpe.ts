import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The Sharpe ratio is DRAWN from a set whose quotients into the target statistic square to four
// significant figures, and the mean return is derived from it — drawing the mean and the
// volatility separately and hoping their ratio came out exact left too thin a legal space to
// draw from. Elapsed years are subtracted, so the answer is a distance rather than the level
// (t/S)^2 itself, and every chain runs over exact operands licensed in `constraint`.
export const yearsToASignificantSharpe: ProblemTemplate = {
  id: "statistics/years-to-a-significant-sharpe",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the t-statistic of a track record as Sharpe times the root of the years" },
  params: {
    sr: { choices: [0.25, 0.4, 0.5, 0.625, 0.8, 1, 1.25, 2] },
    volPct: { choices: [4, 5, 8, 10, 12, 15, 16, 20, 25] },
    t: { choices: [2, 2.5, 3] },
    elapsed: { choices: [1, 2, 3, 4, 5] },
  },
  constraint: (p) => Math.abs(p.sr * p.volPct * 10 - Math.round(p.sr * p.volPct * 10)) < 1e-9 && exact4(p.t / p.sr) && exact4((p.t / p.sr) ** 2) && (p.t / p.sr) ** 2 - p.elapsed >= 0.5 && (p.t / p.sr) ** 2 <= 100,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const ratio = round(p.t / p.sr);
    const years = round(ratio * ratio);
    return {
      meanPct: round(p.sr * p.volPct),
      ratio,
      years,
      answer: round(years - p.elapsed),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A strategy has been live for ${fmtNum(p.elapsed)} years, earning an annual excess return of ${fmtNum(d.meanPct)} percent on an annualised volatility of ${fmtNum(p.volPct)} percent. The desk will allocate once the t-statistic of its mean return reaches ${fmtNum(p.t)}; treating years as independent, that statistic is the annual Sharpe ratio times the square root of the number of years. ` +
    `If the record continues at the same rate, how many more years must it run?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A track record's t-statistic", body: `The mean of $T$ independent annual returns has standard error equal to the volatility over $\\sqrt{T}$, so the mean over its standard error is $t=S\\sqrt{T}$ with $S$ the annual Sharpe ratio. Inverting for the years needed to reach a bar $t$: $T=\\left(\\dfrac{t}{S}\\right)^{2}$.` },
    { title: "The Sharpe ratio", body: `Excess return over volatility: $\\dfrac{${fmtNum(d.meanPct)}}{${fmtNum(p.volPct)}}=${fmtNum(p.sr)}$ a year.` },
    { title: "Years to reach the bar", body: `The statistic must grow from ${fmtNum(p.sr)} per root-year to ${fmtNum(p.t)}, a factor of $\\dfrac{${fmtNum(p.t)}}{${fmtNum(p.sr)}}=${fmtNum(d.ratio)}$ in the root, so $${fmtNum(d.ratio)}^{2}=${fmtNum(d.years)}$ years in all.` },
    { title: "Answer", body: `${fmtNum(p.elapsed)} of those years are already banked, leaving $${fmtNum(d.years)}-${fmtNum(p.elapsed)}=${fmtNum(d.answer)}$ more years of the same performance before the desk's bar is reached.` },
    { title: "Sanity check", body: `After ${fmtNum(d.years)} years the statistic would stand at $${fmtNum(p.sr)}\\times\\sqrt{${fmtNum(d.years)}}=${fmtNum(p.t)}$, exactly the bar. The square is the whole lesson: a strategy with half this Sharpe would need four times the years, which is why a mediocre Sharpe can never prove itself in a career.` },
  ],
  keyInsight: "Evidence about a mean accumulates with the square root of time, so the years needed to reach any fixed t-statistic scale with the inverse SQUARE of the Sharpe ratio. A Sharpe of one needs about four years to be two standard errors from zero; a Sharpe of half needs sixteen.",
  commonTrap: "Scaling the years linearly with the Sharpe, or forgetting that the years already elapsed count toward the total. The other slip is quoting the total years rather than the additional ones the question asks for.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [2],
};
