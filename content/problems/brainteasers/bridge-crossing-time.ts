import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Four crossers, torch returns: either shuttle with the fastest, or send the two slowest
// together. The optimum is min(2*t1 + t2 + t3 + t4, t1 + 3*t2 + t4) — the shuttle pays t1 twice
// and every other time once; the pair-the-slowest route pays t2 three times but t3 not at all.
export const bridgeCrossingTime: ProblemTemplate = {
  id: "brainteasers/bridge-crossing-time",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "imc", weight: 0.3 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the bridge-and-torch problem" },
  params: {
    fastest: { choices: [1, 2, 3] },
    second: { choices: [2, 4, 5, 6] },
    third: { range: { min: 7, max: 14, step: 1 } },
    slowest: { range: { min: 15, max: 30, step: 1 } },
  },
  constraint: (p) => p.fastest < p.second && p.second < p.third && p.third < p.slowest,
  derived: (p) => {
    const shuttle = 2 * p.fastest + p.second + p.third + p.slowest;
    const pairSlow = p.fastest + 3 * p.second + p.slowest;
    return { shuttle, pairSlow, answer: Math.min(shuttle, pairSlow), saving: Math.abs(shuttle - pairSlow) };
  },
  statement: (p) =>
    `Four people must cross a rickety bridge at night with one torch. At most two may cross at a time, the torch must be carried on every crossing, and a pair moves at the slower person's pace. Their individual crossing times are ${fmtNum(p.fastest)}, ${fmtNum(p.second)}, ${fmtNum(p.third)} and ${fmtNum(p.slowest)} minutes. What is the least total time in which all four can get across?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Only two plans are worth checking", body: `The two slowest dominate the total, so the question is really how to pay for them. Either the fastest person shuttles the torch back each time, or the two slowest cross together on one trip.` },
    { title: "Plan A: the fastest ferries everyone", body: `The fastest escorts each of the others over and walks back alone between trips. That costs $2\\times${p.fastest}+${p.second}+${p.third}+${p.slowest}=${fmtNum(d.shuttle)}$ minutes.` },
    { title: "Plan B: pair the two slowest", body: `Send the two fastest over, return the fastest, send the two slowest together, return the second fastest, then the two fastest again. That costs $${p.fastest}+3\\times${p.second}+${p.slowest}=${fmtNum(d.pairSlow)}$ minutes.` },
    { title: "Take the better", body: `Comparing the two gives ${fmtNum(d.answer)} minutes, ${fmtNum(d.saving)} better than the alternative.` },
    { title: "Sanity check", body: `Plan B wins whenever the two slowest are far apart in pace, since it makes them cross on a single trip and pays only once for the slowest. Plan A wins when the fastest is very quick relative to the third.` },
  ],
  keyInsight: "Pairing the two slowest so they cross together means paying the largest time only once — counterintuitive, because it leaves the fastest person idle on that trip.",
  commonTrap: "Assuming the fastest should always carry the torch. That plan pays the slowest person's time in isolation, which the pairing plan avoids.",
  expectedPaceS: 195,
  constants: [2, 3],
  verify: { method: "brute-force" },
};
