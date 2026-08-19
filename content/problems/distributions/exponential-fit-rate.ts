import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(X<t)=c means 1-e^{-lambda t}=c, so e^{-lambda t}=1-c, giving lambda=-ln(1-c)/t.
const fittedLamOf = (t: number, c: number) => -Math.log(1 - c) / t;

export const exponentialFitRate: ProblemTemplate = {
  id: "distributions/exponential-fit-rate",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.35 }, { firm: "millennium", weight: 0.3 }],
  source: { kind: "original", inspiration: "fitting an exponential rate from a stated arrival probability" },
  params: {
    t: { range: { min: 1, max: 20, step: 1 } },
    c: { range: { min: 0.1, max: 0.9, step: 0.02 } },
  },
  // c=0.5 is excluded: there -ln(1-c) and -ln(c) coincide exactly (1-0.5=0.5), which would make
  // the fitted rate algebraically identical to the commonTrap's shortcut at that one value.
  constraint: (p) => p.c !== 0.5 && Number.isFinite(fittedLamOf(p.t, p.c)),
  derived: (p) => {
    const survival = 1 - p.c;
    const fittedLam = fittedLamOf(p.t, p.c);
    return { survival, fittedLam };
  },
  statement: (p) =>
    `The time between consecutive trades on an illiquid name follows an exponential distribution with unknown rate $\\lambda$. The probability the next trade happens within ${fmtNum(p.t)} seconds is ${fmtNum(p.c)}. Find $\\lambda$.`,
  answerKey: "fittedLam",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Set up the survival equation", body: `"Within ${fmtNum(p.t)} seconds" has probability ${fmtNum(p.c)}, so surviving past it has probability $1-${fmtNum(p.c)}=${fmtNum(d.survival)}$: $e^{-\\lambda\\times ${fmtNum(p.t)}}=${fmtNum(d.survival)}$.` },
    { title: "Solve for lambda", body: `$\\lambda$ is $\\frac{-\\ln(\\text{survival})}{t}$, giving $\\lambda\\approx${fmtNum(d.fittedLam)}$ per second.` },
    { title: "Sanity check", body: `The arrival probability and the survival probability are complements of the same split, so they must sum to $1$: $${fmtNum(p.c)}+${fmtNum(d.survival)}=${fmtNum(1)}$, and they do.` },
  ],
  keyInsight: "P(X<t)=c inverts to a rate through the survival probability's logarithm — solve for the survival share first, then take one logarithm, never differentiate the CDF directly.",
  commonTrap: "Taking the logarithm of the stated probability c itself instead of its complement, the survival probability 1-c.",
  expectedPaceS: 60,
  verify: { method: "montecarlo" },
  constants: [1],
};
