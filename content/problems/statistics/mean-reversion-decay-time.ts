import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const meanReversionDecayTime: ProblemTemplate = {
  id: "statistics/mean-reversion-decay-time",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "millennium", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the half-life of mean reversion in an AR(1), solved as an exponent" },
  params: {
    phi: { choices: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75] },
    from: { choices: [40, 50, 60, 75, 80, 90, 100, 120] },
    to: { choices: [8, 10, 12, 15, 20, 25] },
  },
  constraint: (p) => p.to <= p.from * 0.6,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      ratio: round(p.to / p.from),
      answer: round(Math.log(p.to / p.from) / Math.log(p.phi)),
      halfLife: round(Math.log(0.5) / Math.log(p.phi)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A dislocation in a funding spread stands at ${fmtNum(p.from)} basis points and decays by mean reversion, each day retaining ${fmtNum(p.phi)} of the previous day's gap. ` +
    `How many days until the expected gap has narrowed to ${fmtNum(p.to)} basis points?`,
  solution: (p, d) => [
    { title: "The gap is a power, so the horizon is an exponent", body: `Each day multiplies the gap by ${fmtNum(p.phi)}, so after some number of days the gap is that factor raised to the number of days, times where it started. Asking when it reaches a target is asking for the exponent that produces a given shrinkage — a logarithm, not a division.` },
    { title: "What fraction has to survive", body: `The gap must fall from ${fmtNum(p.from)} to ${fmtNum(p.to)}, a surviving fraction of $\\dfrac{${fmtNum(p.to)}}{${fmtNum(p.from)}}=${fmtNum(d.ratio)}$.` },
    { title: "Solve for the exponent", body: `Taking logs of both sides and dividing, the horizon is the log of that fraction over the log of the retention. Checking it, $${fmtNum(p.phi)}^{${fmtNum(d.answer)}}$ returns the ${fmtNum(d.ratio)} shrinkage required — approximately, because the horizon is quoted to four figures and an exponent carries that rounding into the result.` },
    { title: "Answer", body: `It takes about ${fmtNum(d.answer)} days.` },
    { title: "Sanity check", body: `The half-life — the horizon for any gap to lose half of itself — is ${fmtNum(d.halfLife)} days at this retention, and it depends only on the retention, never on how wide the dislocation happens to be. A mean-reverting gap of any size loses the same PROPORTION per day, which is why traders quote a half-life rather than a time-to-zero: the gap never reaches zero at all.` },
  ],
  keyInsight: "Geometric decay makes the time to a target an exponent, so the horizon comes from a ratio of logarithms rather than from dividing the distance by a speed. Because only the ratio of the two levels enters, the half-life is a property of the process alone and says nothing about how far from equilibrium it currently sits.",
  commonTrap: "Treating the decay as a fixed number of basis points per day and dividing the distance by it. That is a straight-line answer to a geometric question: the daily fall shrinks as the gap does, so the straight line runs out of gap long before the process does and, for any target more than a day away, reaches it too soon. The other slip is reading the retention as the fraction LOST rather than the fraction kept, which inverts the speed of reversion.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
