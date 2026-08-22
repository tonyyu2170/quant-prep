import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Inverse of meeting-window: find the wait w with P(meet) = c, w = T(1 - sqrt(1 - c)).
// `constraint` cannot see `derived` (packages/engine/src/problem.ts:24), so it asks here.
const impliedWait = (p: Params) => p.windowMinutes * (1 - Math.sqrt(1 - p.targetPct / 100));

export const meetingInverseFit: ProblemTemplate = {
  id: "geometric/meeting-inverse-fit",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "inverting the meeting square for the patience window" },
  params: {
    windowMinutes: { range: { min: 40, max: 120, step: 10 } },
    targetPct: { range: { min: 15, max: 90, step: 5 } },
  },
  constraint: (p) => impliedWait(p) >= 1 && impliedWait(p) < p.windowMinutes,
  derived: (p) => {
    const wait = impliedWait(p);
    const missLeg = p.windowMinutes - wait;
    const missProb = Math.pow(missLeg / p.windowMinutes, 2);
    return { wait, missLeg, missProb };
  },
  statement: (p) =>
    `Two friends want at least a ${fmtNum(p.targetPct)} percent chance of meeting at a cafe, arriving independently and uniformly inside a ${fmtNum(p.windowMinutes)}-minute window, each willing to wait the same fixed number of minutes for the other. How long should that wait be?`,
  answerKey: "wait",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `From the meeting square: missing happens in two corner triangles whose legs are the window short of the wait, so the meeting chance reads $1-\\left(\\frac{T-w}{T}\\right)^{2}$ with window ${fmtNum(p.windowMinutes)} and wait $w$.` },
    { title: "Set it to the target and solve", body: `Rearranging gives the wait as the window times one minus the square root of the miss share: about ${fmtNum(d.wait)} minutes.` },
    { title: "Answer", body: `Each friend should wait about ${fmtNum(d.wait)} minutes.` },
    { title: "Sanity check", body: `Reading the square back with this wait puts the miss triangles' legs at ${fmtNum(d.missLeg)} minutes and the miss probability at ${fmtNum(d.missProb)} — the exact complement of the target.` },
  ],
  keyInsight: "The meeting square inverts as cleanly as it forms: a target probability fixes the miss triangles, and the wait is whatever the window has left over.",
  commonTrap: "Taking the square root of the target instead of the miss share — the target prices the diagonal band, and only its complement sizes the corners.",
  expectedPaceS: 60,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
