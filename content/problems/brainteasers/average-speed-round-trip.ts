import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The chain divides two exact integers, so the repeating decimal only ever appears as the
// final printed value and never as an operand feeding another step.
export const averageSpeedRoundTrip: ProblemTemplate = {
  id: "brainteasers/average-speed-round-trip",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "average speed over a there-and-back trip is the harmonic mean" },
  params: {
    v1: { choices: [20, 24, 30, 36, 40, 45, 48, 50, 60, 72, 80, 90] },
    v2: { choices: [20, 24, 30, 36, 40, 45, 48, 50, 60, 72, 80, 90] },
    dist: { choices: [60, 90, 120, 180, 240] },
  },
  constraint: (p) => p.v1 < p.v2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      num: 2 * p.v1 * p.v2,
      den: p.v1 + p.v2,
      twiceDist: 2 * p.dist,
      arithmeticMean: round((p.v1 + p.v2) / 2),
      answer: round((2 * p.v1 * p.v2) / (p.v1 + p.v2)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A driver covers ${fmtNum(p.dist)} kilometres out to a site at a steady ${fmtNum(p.v1)} kilometres an hour, then returns along the same ${fmtNum(p.dist)} kilometres at a steady ${fmtNum(p.v2)}. ` +
    `What is the average speed over the whole round trip, in kilometres an hour?`,
  solution: (p, d) => [
    { title: "Average speed is total distance over total time", body: `It is not the average of the two speeds, because the two legs take different amounts of time and the slower one takes longer. Whatever fraction of the trip is spent crawling counts for more than the fraction spent flying.` },
    { title: "The distance cancels", body: `Total distance is $${fmtNum(2)}\\times${fmtNum(p.dist)}=${fmtNum(d.twiceDist)}$ kilometres, and total time is that distance split as ${fmtNum(p.dist)} over ${fmtNum(p.v1)} plus ${fmtNum(p.dist)} over ${fmtNum(p.v2)}. Every term carries one factor of ${fmtNum(p.dist)}, so it divides out and the answer does not depend on how far the site is.` },
    { title: "What is left is the harmonic mean", body: `Cancelling leaves twice the product of the two speeds over their sum. The product is $${fmtNum(2)}\\times${fmtNum(p.v1)}\\times${fmtNum(p.v2)}=${fmtNum(d.num)}$ and the sum is $${fmtNum(p.v1)}+${fmtNum(p.v2)}=${fmtNum(d.den)}$.` },
    { title: "Answer", body: `$${fmtNum(d.num)}/${fmtNum(d.den)}=${fmtNum(d.answer)}$ kilometres an hour.` },
    { title: "Sanity check", body: `The straight average of the two speeds is ${fmtNum(d.arithmeticMean)}, and the true figure of ${fmtNum(d.answer)} sits below it — as it must whenever the two speeds differ, since the slow leg eats more of the clock. It also stays above the slower speed of ${fmtNum(p.v1)}, so it lands between the two.` },
  ],
  keyInsight: "Averaging a rate means weighting by the quantity the rate is measured against — time, not distance. Equal distances at different speeds mean unequal times, so the mean that comes out is harmonic and always sits below the arithmetic one.",
  commonTrap: "Averaging the two speeds. That answers a different question — the average speed of someone who spends equal TIME at each speed — and it always overstates the round trip, by more the further apart the two speeds are.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [2],
};
