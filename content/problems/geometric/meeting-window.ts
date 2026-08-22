import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two friends arrive independently and uniformly in [0, T]; they meet iff |X - Y| <= w:
// 1 - ((T - w)/T)^2. Band asked through this helper (constraint cannot see `derived`,
// packages/engine/src/problem.ts:24).
const meetOf = (p: Params) => 1 - Math.pow((p.windowMinutes - p.waitMinutes) / p.windowMinutes, 2);

export const meetingWindow: ProblemTemplate = {
  id: "geometric/meeting-window",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the classic meeting puzzle, parameterized" },
  params: {
    windowMinutes: { range: { min: 30, max: 120, step: 10 } },
    waitMinutes: { range: { min: 3, max: 57, step: 2 } },
  },
  constraint: (p) => p.waitMinutes < p.windowMinutes && meetOf(p) >= 0.1 && meetOf(p) <= 0.99,
  derived: (p) => {
    const answer = 1 - Math.pow((p.windowMinutes - p.waitMinutes) / p.windowMinutes, 2);
    const missProb = Math.pow((p.windowMinutes - p.waitMinutes) / p.windowMinutes, 2);
    const missLeg = p.windowMinutes - p.waitMinutes;
    return { answer, missProb, missLeg };
  },
  statement: (p) =>
    `Two friends agree to arrive at a cafe at some point during a ${fmtNum(p.windowMinutes)}-minute window, each choosing their arrival time uniformly at random within it, and each willing to wait ${fmtNum(p.waitMinutes)} minutes. What is the probability they meet?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Plot the two arrivals as one point in a ${fmtNum(p.windowMinutes)} by ${fmtNum(p.windowMinutes)} square of possibilities — every pairing equally likely. Meeting means the point sits within ${fmtNum(p.waitMinutes)} of the diagonal.` },
    { title: "Miss regions are corners", body: `They miss only when the first arrives more than ${fmtNum(p.waitMinutes)} before the second or vice versa: two right triangles at opposite corners, each with legs of ${fmtNum(d.missLeg)} minutes.` },
    { title: "Subtract the corners", body: `The two corner triangles together take a fraction of the arrival square equal to one minus the squared patience-to-window ratio, leaving a meeting probability of about ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `They meet with probability $${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Missing has probability ${fmtNum(d.missProb)}, and meeting plus missing fills the square exactly.` },
  ],
  keyInsight: "The meeting puzzle is the two-points-gap geometry wearing a coat: closeness within w around the diagonal of an arrival square.",
  commonTrap: "Averaging the two waiting windows or doubling one — the miss region is two triangles whose legs are the patience short of the window, not the patience itself.",
  expectedPaceS: 45,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
