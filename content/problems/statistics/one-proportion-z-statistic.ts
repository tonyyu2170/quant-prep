import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The sample size is a perfect square and the null proportion is one of 0.1/0.2/0.5/0.8/0.9, so
// the count's standard deviation sqrt(n p0 q0) is exact on every draw — `constraint` licenses it
// through exact4 — and the statistic is an exact quotient of the excess over it. The excess is
// the drawn axis, so the answer is signed and spread around zero rather than sitting near a level.
export const oneProportionZStatistic: ProblemTemplate = {
  id: "statistics/one-proportion-z-statistic",
  version: 1,
  topic: "statistics/inference",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the one-proportion z-test for a claimed hit rate" },
  params: {
    n: { choices: [25, 36, 64, 100, 144, 196, 225, 256, 400, 625, 900, 1600, 2500] },
    p0Pct: { choices: [10, 20, 50, 80, 90] },
    off: { choices: [-40, -30, -25, -20, -16, -15, -12, -10, -9, -8, -6, -5, -4, -3, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 20, 25, 30, 40, 50] },
  },
  constraint: (p) => Number.isInteger(p.n * p.p0Pct / 100) && exact4(Math.sqrt(p.n * (p.p0Pct / 100) * (1 - p.p0Pct / 100))) && p.n * p.p0Pct / 100 + p.off >= 1 && p.n * p.p0Pct / 100 + p.off <= p.n - 1 && Math.abs(p.off / Math.sqrt(p.n * (p.p0Pct / 100) * (1 - p.p0Pct / 100))) >= 0.4 && Math.abs(p.off / Math.sqrt(p.n * (p.p0Pct / 100) * (1 - p.p0Pct / 100))) <= 4,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const p0 = p.p0Pct / 100;
    const expected = p.n * p0;
    const sdCount = round(Math.sqrt(p.n * p0 * (1 - p0)));
    return {
      p0,
      q0: round(1 - p0),
      expected,
      variance: round(p.n * p0 * (1 - p0)),
      sdCount,
      k: expected + p.off,
      excess: p.off,
      pHat: round((expected + p.off) / p.n),
      answer: round(p.off / sdCount),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A signal is advertised as calling the direction of the next price move correctly ${fmtNum(p.p0Pct)} percent of the time. Over ${fmtNum(p.n)} independent moves it is right ${fmtNum(d.k)} times. ` +
    `Taking the advertised rate as the null hypothesis, what is the z-statistic for the observed hit rate?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A count of successes has a known spread under the null", body: `If each call is right with probability $p_0$, the number right in $n$ calls is binomial with mean $np_0$ and variance $np_0(1-p_0)$, and for a sample this size the normal approximation is good. The statistic is the excess over the expected count measured in its standard deviations: $z=\\dfrac{k-np_0}{\\sqrt{np_0(1-p_0)}}$.` },
    { title: "The expected count", body: `Under the claim, $${fmtNum(p.n)}\\times${fmtNum(d.p0)}=${fmtNum(d.expected)}$ calls should be right.` },
    { title: "Its standard deviation", body: `The variance of the count is $${fmtNum(p.n)}\\times${fmtNum(d.p0)}\\times${fmtNum(d.q0)}=${fmtNum(d.variance)}$, so one standard deviation is $\\sqrt{${fmtNum(d.variance)}}=${fmtNum(d.sdCount)}$ calls.` },
    { title: "Answer", body: `The observed count sits $${fmtNum(d.k)}-${fmtNum(d.expected)}=${fmtNum(d.excess)}$ from the expected one, which is $\\dfrac{${fmtNum(d.excess)}}{${fmtNum(d.sdCount)}}=${fmtNum(d.answer)}$ standard deviations. That is the z-statistic, sign and all.` },
    { title: "Sanity check", body: `In rate terms the signal hit ${fmtNum(d.pHat)} of its calls against a claim of ${fmtNum(d.p0)}. Dividing the gap in rates by the rate's standard error $\\sqrt{p_0(1-p_0)/n}$ gives the same ${fmtNum(d.answer)} — the count form and the proportion form are one calculation scaled by $n$. Two-sided, anything beyond about two in either direction is hard to square with the claim.` },
  ],
  keyInsight: "A hit count is a binomial variable whose spread under the null is fixed by the claimed rate and the sample size, so the only judgement is whether the excess is large against that spread. The statistic scales with the square root of the sample: the same excess rate is nothing on a hundred calls and decisive on ten thousand.",
  commonTrap: "Measuring the excess against the spread of the observed rate instead of the claimed one, or dropping the square root and dividing by the variance. The other slip is forgetting the sign, which says whether the signal did better or worse than advertised.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
