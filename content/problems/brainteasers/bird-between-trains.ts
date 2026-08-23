import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The final chain multiplies and divides the original integers rather than reusing the printed
// meeting time, which is a repeating decimal on most draws.
export const birdBetweenTrains: ProblemTemplate = {
  id: "brainteasers/bird-between-trains",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.25 }, { firm: "citadel", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the shuttling bird, solved by time rather than by summing the legs" },
  params: {
    d: { choices: [90, 120, 150, 180, 200, 240, 300, 360] },
    v1: { choices: [20, 25, 30, 35, 40, 45, 50] },
    v2: { choices: [20, 25, 30, 35, 40, 45, 50] },
    vb: { choices: [55, 60, 65, 70, 75, 80, 90, 100] },
  },
  constraint: (p) => p.v1 <= p.v2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      closing: p.v1 + p.v2,
      hours: round(p.d / (p.v1 + p.v2)),
      firstLeg: round((p.vb * p.d) / (p.vb + p.v2)),
      answer: round((p.vb * p.d) / (p.v1 + p.v2)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two trains are ${fmtNum(p.d)} kilometres apart on the same track, heading towards each other at ${fmtNum(p.v1)} and ${fmtNum(p.v2)} kilometres an hour. ` +
    `A bird starts at the front of the slower train and flies at ${fmtNum(p.vb)} kilometres an hour to the other train, turns instantly on reaching it, flies back, and keeps shuttling until the two trains meet. ` +
    `How far does the bird fly in total?`,
  solution: (p, d) => [
    { title: "Do not chase the legs", body: `Each leg is shorter than the one before and there are infinitely many of them, so adding them up means summing a series. The first leg alone is already awkward: the bird and the far train close at ${fmtNum(p.vb)} plus ${fmtNum(p.v2)}, giving ${fmtNum(d.firstLeg)} kilometres. There is a much shorter route.` },
    { title: "Ask how long the bird is flying", body: `The bird flies without pause from the start until the trains meet, so the only thing to work out is when that is. The gap closes at $${fmtNum(p.v1)}+${fmtNum(p.v2)}=${fmtNum(d.closing)}$ kilometres an hour, so the trains meet after ${fmtNum(d.hours)} hours.` },
    { title: "Distance is speed times time", body: `Flying at ${fmtNum(p.vb)} for that long covers $${fmtNum(p.vb)}\\times${fmtNum(p.d)}/${fmtNum(d.closing)}=${fmtNum(d.answer)}$ kilometres.` },
    { title: "Answer", body: `The bird flies ${fmtNum(d.answer)} kilometres, however many times it turns around.` },
    { title: "Sanity check", body: `The bird is faster than either train, so it must cover more ground than either does before they meet — and indeed ${fmtNum(d.answer)} exceeds both of their trips. It also stays under ${fmtNum(p.d)} whenever its speed is below the closing rate of ${fmtNum(d.closing)}, which is the sense in which the answer is bounded by the gap rather than by the number of turns.` },
  ],
  keyInsight: "When a quantity accumulates at a constant rate, the only thing worth finding is how long the accumulation runs. Reformulating from distance to time replaces an infinite series with one division, and the turning points never enter the calculation.",
  commonTrap: "Summing the legs. The series does converge to the same number, but it takes real work and invites an off-by-one in the first leg — and the trap is that the setup deliberately makes the leg-by-leg route look like the intended one.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
