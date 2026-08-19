import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(X=0)=c=e^{-lambda t} inverts to a closed form — no root-finder needed.
const fittedLamOf = (par: Params) => -Math.log(par.c) / par.t;
const atLeastTwoOf = (par: Params) => {
  const lamP = fittedLamOf(par) * par.t2;
  return 1 - Math.exp(-lamP) * (1 + lamP);
};

export const poissonFitThenTail: ProblemTemplate = {
  id: "distributions/poisson-fit-then-tail",
  version: 1,
  topic: "probability/distributions",
  difficulty: 3,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "fitting a Poisson rate from P(X=0), then rescaling for a tail probability over a different window" },
  params: {
    t: { range: { min: 1, max: 5, step: 1 } },
    c: { range: { min: 0.05, max: 0.85, step: 0.02 } },
    t2: { range: { min: 1, max: 8, step: 1 } },
  },
  constraint: (p) => atLeastTwoOf(p) >= 0.01 && atLeastTwoOf(p) <= 0.95,
  derived: (p) => {
    const lam = fittedLamOf(p);
    const lamP = lam * p.t2;
    const pZero = Math.exp(-lamP);
    const pOne = lamP * pZero;
    const atLeastTwo = 1 - pZero - pOne;
    return { lam, lamP, pZero, pOne, atLeastTwo };
  },
  statement: (p) =>
    `Over a ${fmtNum(p.t)}-hour trading window, the probability of zero block trades executing is ${fmtNum(p.c)}. Modeling block-trade arrivals as a Poisson process with a constant rate, find that rate, then compute the probability of at least two block trades over a ${fmtNum(p.t2)}-hour window.`,
  answerKey: "atLeastTwo",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Fit the rate", body: `Zero block trades over ${fmtNum(p.t)} hours means $e^{-\\lambda\\times ${fmtNum(p.t)}}=${fmtNum(p.c)}$, so $\\lambda$ is $\\frac{-\\ln(c)}{t}$, giving $\\lambda\\approx${fmtNum(d.lam)}$ per hour.` },
    { title: "Rescale to the asked-about window", body: `Over ${fmtNum(p.t2)} hours the expected count is the rescaled rate $\\lambda'$: $${fmtNum(d.lam)}\\times${fmtNum(p.t2)}\\approx${fmtNum(d.lamP)}$.` },
    { title: "Take the complement", body: `"At least two" is everything except zero or exactly one: $P(X=0)=e^{-${fmtNum(d.lamP)}}=${fmtNum(d.pZero)}$ and $P(X=1)\\approx${fmtNum(d.lamP)}\\times${fmtNum(d.pZero)}\\approx${fmtNum(d.pOne)}$.` },
    { title: "Sanity check", body: `Zero, exactly one, and at least two partition every outcome, so all three account for the whole outcome space: $P(X=0)\\approx${fmtNum(d.pZero)}$, $P(X=1)\\approx${fmtNum(d.pOne)}$, $P(X\\ge2)\\approx${fmtNum(d.atLeastTwo)}$, and they sum to essentially $${fmtNum(1)}$.` },
  ],
  keyInsight: "P(X=0)=e^{-\\lambda t} inverts to a rate with a single logarithm — no root-finder needed — and that fitted rate then rescales cleanly to any other window before a tail probability is asked.",
  commonTrap: "Using the fitted rate directly against the original window's length when computing the tail probability, instead of rescaling it to the new window first.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [0, 1, 2],
};
