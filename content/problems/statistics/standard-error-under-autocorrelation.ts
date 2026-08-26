import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

/** Var(mean) = (sd^2/n^2) * [n + 2*sum_{k=1}^{n-1} (n-k) phi^k], the finite-sample truth. */
function exactSeOf(sd: number, phi: number, n: number): number {
  let cross = 0;
  for (let k = 1; k < n; k++) cross += (n - k) * Math.pow(phi, k);
  return (sd / n) * Math.sqrt(n + 2 * cross);
}

export const standardErrorUnderAutocorrelation: ProblemTemplate = {
  id: "statistics/standard-error-under-autocorrelation",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "akuna", weight: 0.1 }],
  source: { kind: "textbook", inspiration: "the long-run variance of a sample mean under AR(1) dependence, and effective sample size" },
  params: {
    phi: { choices: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75] },
    sd: { choices: [3, 4, 5, 6, 8, 10, 12, 15] },
    n: { choices: [25, 36, 49, 64, 100, 144] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    const ratio = round((1 + p.phi) / (1 - p.phi));
    return {
      root, ratio,
      onePlus: round(1 + p.phi),
      oneMinus: round(1 - p.phi),
      naiveSe: round(p.sd / Math.sqrt(p.n)),
      answer: round((p.sd / Math.sqrt(p.n)) * Math.sqrt((1 + p.phi) / (1 - p.phi))),
      effectiveN: round(p.n / ((1 + p.phi) / (1 - p.phi))),
      // The EXACT finite-sample standard error, for the sanity check. The long-run formula is
      // an asymptotic one and overstates at any finite count, because the pairs at lag k number
      // n-k rather than n. At the shortest samples here the gap runs to a tenth of the answer,
      // which is why the question asks for the long-run figure by name rather than leaving a
      // careful solver to be marked wrong for computing this one.
      exactSe: round(exactSeOf(p.sd, p.phi, p.n)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A researcher averages ${fmtNum(p.n)} consecutive daily readings of a stationary AR(1) signal to estimate its long-run mean. The signal has a daily standard deviation of ${fmtNum(p.sd)} and carries ${fmtNum(p.phi)} of each day into the next. ` +
    `Using the long-run variance formula, what is the standard error of that average?`,
  solution: (p, d) => [
    { title: "The usual standard error assumes something false here", body: `Dividing the standard deviation by the root of the count is a statement about INDEPENDENT readings. It would give $\\dfrac{${fmtNum(p.sd)}}{\\sqrt{${fmtNum(p.n)}}}=${fmtNum(d.naiveSe)}$, and on a persistent series that is too small — consecutive readings largely repeat information already collected.` },
    { title: "Sum the whole autocovariance function", body: `Over a long stretch the variance of the average is the daily variance times one plus twice the sum of every autocorrelation, divided by the count. For this process the autocorrelations are a geometric series, and summing it gives an inflation of $\\dfrac{1+${fmtNum(p.phi)}}{1-${fmtNum(p.phi)}}=${fmtNum(d.ratio)}$ on the VARIANCE.` },
    { title: "Apply its root to the naive figure", body: `Standard errors take the square root of that: $\\dfrac{${fmtNum(p.sd)}}{\\sqrt{${fmtNum(p.n)}}}\\times\\sqrt{\\dfrac{${fmtNum(d.onePlus)}}{${fmtNum(d.oneMinus)}}}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The standard error of the average is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Read the other way, the inflation says these ${fmtNum(p.n)} dependent readings carry as much information as about ${fmtNum(d.effectiveN)} independent ones. That is the number to quote when someone asks how much data there is: on a persistent series, collecting more days at the same frequency buys far less precision than the count suggests, and sampling twice as often can buy almost none. The long-run formula is asymptotic and deliberately errs on the cautious side — the exact finite-sample figure here is ${fmtNum(d.exactSe)}, below the ${fmtNum(d.answer)} quoted, because a sample of ${fmtNum(p.n)} has fewer pairs at each lag than an infinite one does.`},
  ],
  keyInsight: "The precision of an average depends on the entire autocovariance function, not on the sample size alone, so dependence converts into an effective sample size smaller than the count. Persistence inflates the variance of a mean by a factor built from the sum of all autocorrelations, which for a first-order process collapses to one plus the carry-over over one minus it.",
  commonTrap: "Using the independent-sampling standard error on a serially correlated series, which understates it and turns ordinary noise into an apparently significant finding — the single most common way a backtest overstates its own evidence. The other slip is applying the inflation to the standard error directly when it is derived for the VARIANCE, which leaves the correction squared and far too large.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
