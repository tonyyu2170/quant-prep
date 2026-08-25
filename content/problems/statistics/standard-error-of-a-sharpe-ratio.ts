import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Lo (2002)'s iid standard error, with the observation frequency as a real axis. The statement
// gives the per-period form, so the work is the conversion to and from periods; the solution
// derives the annual form symbolically and then evaluates it ONCE over exact literals — the
// frequency term SR²/(2q) is a repeating decimal on most draws and must never stand as a printed
// operand. `constraint` demands at least a year of monthly data: an annual Sharpe estimated from
// two annual returns is not a thing the formula describes.
export const standardErrorOfASharpeRatio: ProblemTemplate = {
  id: "statistics/standard-error-of-a-sharpe-ratio",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "Lo's standard error of a Sharpe ratio estimate under iid returns" },
  params: {
    sr: { choices: [0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2, 2.5, 3] },
    years: { choices: [1, 2, 3, 4, 5, 8, 10, 16, 20, 25] },
    q: { choices: [1, 4, 12, 52, 252] },
  },
  constraint: (p) => p.q * p.years >= 12 && Math.sqrt((1 + (p.sr * p.sr) / (2 * p.q)) / p.years) >= 0.05,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const srSq = round(p.sr * p.sr);
    const term = round(srSq / (2 * p.q));
    const inner = round(1 + srSq / (2 * p.q));
    const answer = round(Math.sqrt((1 + srSq / (2 * p.q)) / p.years));
    return {
      srSq,
      term,
      inner,
      periods: p.q * p.years,
      srPeriod: round(p.sr / Math.sqrt(p.q)),
      annualOnlySe: round(Math.sqrt((1 + srSq / 2) / p.years)),
      tStat: round(p.sr / answer),
      answer,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) => {
    const freq = p.q === 1 ? "annual" : p.q === 4 ? "quarterly" : p.q === 12 ? "monthly" : p.q === 52 ? "weekly" : "daily";
    return `A strategy reports an annual Sharpe ratio of ${fmtNum(p.sr)}, estimated from ${fmtNum(p.years)} years of ${freq} returns — ${fmtNum(p.q)} observations a year, ${fmtNum(d.periods)} in all. Under the iid approximation, a Sharpe ratio estimated from $T$ per-period returns has standard error $\\sqrt{(1+s^{2}/2)/T}$, where $s$ is the per-period Sharpe ratio. ` +
      `What is the standard error of the ANNUAL Sharpe estimate?`;
  },
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Convert to periods and back", body: `With $q$ observations a year over $Y$ years there are $T=qY$ periods, and the per-period Sharpe is the annual one scaled down by the root of the frequency, $s=S/\\sqrt{q}$. The annual estimate is $\\sqrt{q}$ times the per-period estimate, so its error is $\\sqrt{q}$ times the per-period error: $\\text{SE}(S)=\\sqrt{q}\\sqrt{\\dfrac{1+S^{2}/(2q)}{qY}}=\\sqrt{\\dfrac{1+S^{2}/(2q)}{Y}}$. The frequency survives only inside the small correction term.` },
    { title: "The Sharpe squared", body: `$${fmtNum(p.sr)}^{2}=${fmtNum(d.srSq)}$, and per period the Sharpe is about ${fmtNum(d.srPeriod)}.` },
    { title: "The frequency term", body: `Half the squared Sharpe, spread over the observations in a year: $\\dfrac{${fmtNum(d.srSq)}}{2\\times${fmtNum(p.q)}}=${fmtNum(d.term)}$, so the numerator is about ${fmtNum(d.inner)}.` },
    { title: "Answer", body: `Over the original figures, so that nothing rounded is re-used: $\\sqrt{\\dfrac{1+${fmtNum(d.srSq)}/(2\\times${fmtNum(p.q)})}{${fmtNum(p.years)}}}=${fmtNum(d.answer)}$. The reported Sharpe of ${fmtNum(p.sr)} sits about ${fmtNum(d.tStat)} standard errors from zero.` },
    { title: "Sanity check", body: `${p.q === 1 ? `With annual observations the correction term is at its largest, and even so the error is dominated by the years: it can never fall below one over the root of ${fmtNum(p.years)}.` : `Had the same ${fmtNum(p.years)} years been observed only annually the error would be ${fmtNum(d.annualOnlySe)} — barely different. Sampling more often pins the volatility down, but the Sharpe's error is dominated by the uncertainty in the MEAN, and only years reduce that: it can never fall below one over the root of ${fmtNum(p.years)}.`} The rule of thumb on the desk is that a Sharpe's standard error is about one over the root of the years of history, whatever the data frequency.` },
  ],
  keyInsight: "A Sharpe ratio's standard error is roughly one over the root of the years of history, and the frequency of the data barely moves it: high-frequency returns pin the volatility, but the mean return is learned only from calendar time. The correction term for the Sharpe itself matters only when the ratio is large.",
  commonTrap: "Using the number of observations as the horizon without converting the Sharpe to the same period, which understates the error by the root of the frequency. The other slip is believing daily data makes a three-year Sharpe precise; it does not.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
