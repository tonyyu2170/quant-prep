import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const ar1ForecastLevel: ProblemTemplate = {
  id: "statistics/ar1-forecast-level",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.2 }, { firm: "two-sigma", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the h-step forecast of a mean-reverting AR(1) decays toward the long-run mean" },
  params: {
    phi: { choices: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8] },
    mu: { choices: [50, 100, 200, 400] },
    xt: { choices: [20, 60, 150, 300, 500, 700] },
    h: { choices: [2, 3] },
  },
  constraint: (p) => Math.abs(p.xt - p.mu) >= 30,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const deviation = p.xt - p.mu;
    const phiPow = round(Math.pow(p.phi, p.h));
    return {
      deviation: round(Math.abs(deviation)),
      phiPow,
      decayed: round(Math.abs(Math.pow(p.phi, p.h) * deviation)),
      answer: round(p.mu + Math.pow(p.phi, p.h) * deviation),
      oneStep: round(p.mu + p.phi * deviation),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A commodity basis is mean-reverting, settling around a long-run level of ${fmtNum(p.mu)} and carrying ${fmtNum(p.phi)} of each day's deviation from that level into the next day. It stands at ${fmtNum(p.xt)} today. ` +
    `What does the model expect it to be ${fmtNum(p.h)} days from now?`,
  solution: (p, d) => [
    { title: "Forecast the deviation, not the level", body: `Future shocks average to zero, so the only thing that carries forward is how far the basis sits from its long-run level today. Work in that deviation and the forecast becomes one multiplication; work in levels and the mean has to be added back in at every step.` },
    { title: "Decay it once per day", body: `Today's deviation is ${fmtNum(d.deviation)} ${p.xt > p.mu ? "above" : "below"} the long-run level. Each day keeps ${fmtNum(p.phi)} of it, so after ${fmtNum(p.h)} days a fraction $${fmtNum(p.phi)}^{${fmtNum(p.h)}}=${fmtNum(d.phiPow)}$ survives, leaving $${fmtNum(p.phi)}^{${fmtNum(p.h)}}\\times${fmtNum(d.deviation)}=${fmtNum(d.decayed)}$.` },
    { title: "Put the level back", body: `That much still ${p.xt > p.mu ? "above" : "below"} ${fmtNum(p.mu)} gives ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The model expects ${fmtNum(d.answer)} in ${fmtNum(p.h)} days.` },
    { title: "Sanity check", body: `The forecast sits between where the basis is now and where it settles, and it is nearer the long-run level than the one-day-ahead forecast of ${fmtNum(d.oneStep)} — every extra day pulls it further in. Pushed far enough out, the forecast is just ${fmtNum(p.mu)}, because a mean-reverting process eventually forgets where it started.` },
  ],
  keyInsight: "A mean-reverting forecast is the long-run level plus a decayed version of today's departure from it, because future shocks contribute nothing in expectation. Every step multiplies the departure by the carry-over again, so the forecast approaches the mean geometrically and never crosses it.",
  commonTrap: "Decaying the LEVEL rather than the deviation, which drags the forecast toward zero instead of toward the long-run mean and is only ever right when that mean happens to be zero. The other slip is multiplying by the carry-over once for a multi-day horizon, which leaves the forecast too far from the mean.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
