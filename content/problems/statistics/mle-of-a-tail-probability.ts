import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const mleOfATailProbability: ProblemTemplate = {
  id: "statistics/mle-of-a-tail-probability",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "citadel-securities", weight: 0.15 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the invariance of maximum likelihood under reparameterisation" },
  params: {
    gaps: { choices: [8, 10, 12, 15, 16, 20, 24, 25, 30, 36, 40, 48] },
    hours: { choices: [4, 5, 6, 8, 9, 10, 12, 15, 16, 20] },
    horizon: { choices: [0.25, 0.4, 0.5, 0.6, 0.75, 1, 1.2, 1.5, 2] },
  },
  constraint: (p) => {
    const v = Math.exp(-(p.gaps / p.hours) * p.horizon);
    return v >= 0.02 && v <= 0.6;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const rate = round(p.gaps / p.hours);
    // From the raw ratio, not from the rounded rate above: rounding an operand and then
    // multiplying is what puts a derived value a last-digit step away from its own formula.
    const exponent = round((p.gaps / p.hours) * p.horizon);
    return { rate, exponent, answer: round(Math.exp(-exponent)), horizonMin: round(60 * p.horizon) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk models the time between failed settlements as exponential. Over ${fmtNum(p.hours)} hours of records it observed ${fmtNum(p.gaps)} completed gaps between failures. ` +
    `What is the maximum-likelihood estimate of the probability that the next gap exceeds ${fmtNum(p.horizon)} hours?`,
  solution: (p, d) => [
    { title: "Fit the rate first", body: `The maximum-likelihood rate for a completed exponential sample is the count over the elapsed time: $\\dfrac{${fmtNum(p.gaps)}}{${fmtNum(p.hours)}}=${fmtNum(d.rate)}$ failures per hour.` },
    { title: "Invariance does the rest", body: `The quantity asked for is a function of the rate, and maximum likelihood is invariant under reparameterisation: the estimate of a function is that function OF the estimate. There is no second fit to do and no correction to apply — the value that maximises the likelihood in one parameterisation maximises it in every relabelling of the same model.` },
    { title: "Evaluate the survival function at the fitted rate", body: `An exponential exceeds a horizon with probability equal to the exponential of minus the rate times that horizon. Here the exponent is $\\dfrac{${fmtNum(p.gaps)}}{${fmtNum(p.hours)}}\\times${fmtNum(p.horizon)}=${fmtNum(d.exponent)}$, and raising e to minus that gives ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The maximum-likelihood estimate of the tail probability is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The horizon of ${fmtNum(p.horizon)} hours is ${fmtNum(d.horizonMin)} minutes, and the fitted process produces ${fmtNum(d.rate)} failures an hour, so the exponent of ${fmtNum(d.exponent)} counts how many failures are expected inside the horizon. A tail probability of ${fmtNum(d.answer)} is the chance a Poisson count with that mean comes back empty, which is the same statement read through the other model.` },
  ],
  keyInsight: "Maximum likelihood is invariant under reparameterisation, so estimating a function of a parameter never requires a second optimisation — plug the estimate into the function. This is what makes the method so portable across the quantities a desk actually cares about, which are almost never the model's own parameters.",
  commonTrap: "Estimating the tail probability directly as the fraction of observed gaps that exceeded the horizon. That is a legitimate estimator but it is not the maximum-likelihood one under the exponential model, it throws away the model's structure, and on a small sample it can even return zero for an event the fitted model says is likely. The other slip is dropping the minus sign and reporting the reciprocal of the answer, a number above one that cannot be a probability at all.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [60],
};
