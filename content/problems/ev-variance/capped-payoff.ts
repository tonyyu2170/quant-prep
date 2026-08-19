import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the cap has to bite
// somewhere strictly inside the die) and never asks the expectation, so a helper would be a
// second copy of the answer formula for nothing. Constraint 2's floor cannot bind — the
// cheapest game pays two dollars on its lowest face.
// A payoff cap, which is Jensen in miniature: the cap has to be applied inside each face's own
// payout, never to the average. The statement prints only the cap in dollars, so locating the
// face at which it starts to bite is the first step of the work rather than a given. Both the
// full-pay total and the capped total are whole dollars, which is what lets them be added as
// exact operands before the single division.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const cappedPayoff: ProblemTemplate = {
  id: "ev-variance/capped-payoff",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "original", inspiration: "a capped payout, where averaging the cap and capping the average are different numbers" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    capFace: { range: { min: 2, max: 19, step: 1 } }, // the lowest roll that pays the cap
    rate: { range: { min: 2, max: 10, step: 1 } },
  },
  // The cap has to bite strictly inside the die: at the top face it never binds and the problem
  // is a plain average, and the range's own floor of two keeps at least one roll paying under
  // the cap, which is what makes the answer sit strictly below it.
  constraint: (p) => p.capFace <= p.faces - 1,
  derived: (p) => {
    const cappedFaces = p.faces - p.capFace;
    const cap = p.rate * p.capFace;
    const lowTotal = (p.rate * p.capFace * (p.capFace + 1)) / 2;
    const highTotal = cappedFaces * cap;
    return {
      cap,
      cappedFaces,
      lowTotal,
      highTotal,
      evUncapped: (p.rate * (p.faces + 1)) / 2,
      ev: (lowTotal + highTotal) / p.faces,
    };
  },
  statement: (p, d) =>
    `A fair die with ${fmtNum(p.faces)} faces, numbered 1 up to ${fmtNum(p.faces)}, is rolled once. You are paid ` +
    `${fmtNum(p.rate)} dollars for each point showing, except that the payout is capped at ${fmtNum(d.cap)} dollars ` +
    `however high the roll. What is your expected payout, in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Find where the cap bites", body: `At ${fmtNum(p.rate)} dollars a point, the cap is reached at $\\frac{${fmtNum(d.cap)}}{${fmtNum(p.rate)}}=${fmtNum(p.capFace)}$ points. Rolls up to there are paid in full; every higher roll is paid the cap and nothing more, so the die really has two regions and each has to be totalled on its own.` },
    // Both totals are whole dollars, which is what makes them safe operands in the sum below;
    // averaging first and adding the printed averages would drift off the printed answer.
    { title: "Total the full-pay rolls", body: `The rolls from 1 up to ${fmtNum(p.capFace)} pay ${fmtNum(p.rate)} dollars a point, and those points add up the way any run of consecutive numbers does: $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.capFace)}\\times(${fmtNum(p.capFace)}+1)}{2}=${fmtNum(d.lowTotal)}$ dollars across those faces.` },
    { title: "Total the capped rolls", body: `${
      d.cappedFaces === 1
        ? `The single face above that is paid the cap whatever it shows, contributing ${fmtNum(d.highTotal)} dollars`
        : `The ${fmtNum(d.cappedFaces)} faces above that are each paid the cap, whatever they show: $${fmtNum(d.cappedFaces)}\\times${fmtNum(d.cap)}=${fmtNum(d.highTotal)}$ dollars between them`
    }.` },
    { title: "Average over the die", body: `Every face is equally likely, so the two totals simply pool and divide: $\\frac{${fmtNum(d.lowTotal)}+${fmtNum(d.highTotal)}}{${fmtNum(p.faces)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Two bounds have to hold and both do. Without the cap the die would pay $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.faces)}+1)}{2}=${fmtNum(d.evUncapped)}$ dollars on average, and a cap can only ever take money away, so the answer sits below that. It also sits below ${fmtNum(d.cap)} dollars, because no roll is paid more than the cap and the low rolls are paid strictly less.` },
  ],
  keyInsight: "A cap changes the payoff on each outcome, not the outcome itself, so it has to be applied inside the average rather than to it. Capping the average instead quietly pays the high rolls their uncapped amount and then trims the result once, which is a different and always larger number.",
  commonTrap: "Working out what the die averages and then applying the cap to that single figure. The rolls above the cap have already been overpaid by the time the average is taken, and trimming afterwards never gives the money back.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  // 1 is the lowest face and the offset in the consecutive-run total; 2 is that run's divisor
  // and the halving of the uncapped die's range.
  constants: [1, 2],
};
