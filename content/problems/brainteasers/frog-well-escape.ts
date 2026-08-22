import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Net progress is (climb - slip) per full day, but the LAST day has no slip — so the frog only
// needs to reach (depth - climb) by the end of the previous night.
export const frogWellEscape: ProblemTemplate = {
  id: "brainteasers/frog-well-escape",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "drw", weight: 0.3 }, { firm: "jump", weight: 0.3 }, { firm: "flow", weight: 0.2 }],
  source: { kind: "original", inspiration: "the snail-in-the-well counting trap" },
  params: {
    depth: { range: { min: 20, max: 200, step: 1 } },
    climb: { choices: [3, 4, 5, 6, 7] },
    slip: { choices: [1, 2, 3, 4] },
  },
  constraint: (p) => p.slip < p.climb && p.depth > 2 * p.climb,
  derived: (p) => {
    const net = p.climb - p.slip;
    const toCover = p.depth - p.climb;
    const fullDays = Math.ceil(toCover / net);
    return { net, toCover, fullDays, answer: fullDays + 1, naive: Math.ceil(p.depth / (p.climb - p.slip)) };
  },
  statement: (p) =>
    `A frog sits at the bottom of a well ${fmtNum(p.depth)} feet deep. Each day it climbs ${fmtNum(p.climb)} feet, and each night it slides back ${fmtNum(p.slip)} feet while asleep. On which day does it first reach the top?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "The net gain per full day", body: `A day and its following night together move the frog $${p.climb}-${p.slip}=${fmtNum(d.net)}$ feet upward.` },
    { title: "The last day is different", body: `Once the frog reaches the rim it is out, so it never slides back on the final day. Dividing the whole depth by the net gain therefore overcounts.` },
    { title: "Set the real target", body: `The frog needs to be within one day's climb of the top when it wakes, that is at $${p.depth}-${p.climb}=${fmtNum(d.toCover)}$ feet. Covering that at ${fmtNum(d.net)} feet per full day takes ${fmtNum(d.fullDays)} of them.` },
    { title: "Add the final climb", body: `One more day gets it out, so the answer is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The naive division would have said ${fmtNum(d.naive)} days, and that is at least as large — the correction never makes the escape slower.` },
  ],
  keyInsight: "Whenever a process stops on success, the final step does not pay the usual penalty — set the target one step short and add the last move separately.",
  commonTrap: "Dividing the depth by the net daily gain. That charges the frog for a slide it never takes, and overstates the answer.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
};
