import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const lamPrimeOf = (par: Params) => (par.lam0 * par.w1) / par.w0;
const atLeastOneOf = (par: Params) => 1 - Math.exp(-lamPrimeOf(par));

export const poissonRescaledAtLeastOne: ProblemTemplate = {
  id: "distributions/poisson-rescaled-at-least-one",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "millennium", weight: 0.3 }],
  source: { kind: "original", inspiration: "rescaling a Poisson rate to a different window before asking a complement question" },
  params: {
    lam0: { range: { min: 0.5, max: 8, step: 0.5 } },
    w0: { range: { min: 1, max: 5, step: 1 } },
    w1: { range: { min: 1, max: 8, step: 1 } },
  },
  constraint: (p) => atLeastOneOf(p) >= 0.01 && atLeastOneOf(p) <= 0.9,
  derived: (p) => {
    const lamPrime = lamPrimeOf(p);
    const zeroEvents = Math.exp(-lamPrime);
    const atLeastOne = 1 - zeroEvents;
    return { lamPrime, zeroEvents, atLeastOne };
  },
  statement: (p) =>
    `An anomaly detector flags an average of ${fmtNum(p.lam0)} anomalies over every ${fmtNum(p.w0)}-minute window it monitors, following a Poisson process. What is the probability that it flags at least one anomaly over a ${fmtNum(p.w1)}-minute window?`,
  answerKey: "atLeastOne",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Rescale the rate", body: `The stated rate applies to a ${fmtNum(p.w0)}-minute window, but the question asks about a ${fmtNum(p.w1)}-minute window, so scale by the window ratio to get the rescaled rate $\\lambda'$: $${fmtNum(p.lam0)}\\times\\frac{${fmtNum(p.w1)}}{${fmtNum(p.w0)}}=${fmtNum(d.lamPrime)}$.` },
    { title: "Take the complement", body: `"At least one" over the rescaled window is everything except zero anomalies, which is a single Poisson term rather than an infinite sum.` },
    { title: "Compute the zero-event probability", body: `$P(\\text{zero anomalies})=e^{-\\lambda'}=e^{-${fmtNum(d.lamPrime)}}=${fmtNum(d.zeroEvents)}$.` },
    { title: "Sanity check", body: `The zero-anomaly event and the at-least-one event partition every outcome over the rescaled window, so they must sum to ${fmtNum(1)}: $${fmtNum(d.zeroEvents)}+${fmtNum(d.atLeastOne)}=${fmtNum(1)}$, giving $P(\\text{at least one})=${fmtNum(d.atLeastOne)}$.` },
  ],
  keyInsight: "A Poisson rate only applies to the window it was measured over — rescale it by the ratio of windows before using it, and \"at least one\" is still easiest as the complement of zero.",
  commonTrap: "Plugging the stated rate directly into the at-least-one formula for the asked-about window without first rescaling it to that window's length.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
