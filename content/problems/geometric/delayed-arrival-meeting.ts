import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Delayed arrival: A uniform on [0, T], B uniform on [s, T+s], meeting iff |A - B| <= w.
// Shifting B back by s puts a band of width 2w around the offset diagonal; for s >= w the
// band sits fully inside for the first T - s - w of the second arrival and then tapers over
// exactly 2w, so P(meet) = (2w(T - s - w) + 2w^2) / T^2 = 2w(T - s) / T^2.
const meetOf = (p: Params) => (2 * p.waitMinutes * (p.windowMinutes - p.delayMinutes)) / (p.windowMinutes * p.windowMinutes);

export const delayedArrivalMeeting: ProblemTemplate = {
  id: "geometric/delayed-arrival-meeting",
  version: 1,
  topic: "probability/geometric",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "de-shaw", weight: 0.35 }],
  source: { kind: "original", inspiration: "meeting square with an offset arrival schedule" },
  params: {
    windowMinutes: { range: { min: 60, max: 120, step: 10 } },
    delayMinutes: { range: { min: 5, max: 40, step: 5 } },
    waitMinutes: { range: { min: 5, max: 30, step: 5 } },
  },
  constraint: (p) => p.delayMinutes >= p.waitMinutes && p.delayMinutes + p.waitMinutes < p.windowMinutes && meetOf(p) >= 0.1 && meetOf(p) <= 0.99,
  derived: (p) => {
    const fullSpan = p.windowMinutes - p.delayMinutes - p.waitMinutes;
    const answer = (2 * p.waitMinutes * (p.windowMinutes - p.delayMinutes)) / (p.windowMinutes * p.windowMinutes);
    const fullArea = 2 * p.waitMinutes * fullSpan;
    const taperArea = 2 * p.waitMinutes * p.waitMinutes;
    const boardArea = p.windowMinutes * p.windowMinutes;
    const stripeWidth = 2 * p.waitMinutes;
    const totalArea = fullArea + taperArea;
    return { fullSpan, answer, fullArea, taperArea, boardArea, stripeWidth, totalArea };
  },
  statement: (p) =>
    `Two friends plan to meet: the first arrives at a uniformly random moment inside a ${fmtNum(p.windowMinutes)}-minute window; the second's train delays them so they arrive uniformly at random in a stretch that starts ${fmtNum(p.delayMinutes)} minutes into the first's window and runs ${fmtNum(p.windowMinutes)} minutes. Each will wait ${fmtNum(p.waitMinutes)} minutes for the other. What is the probability they meet?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Slide the second friend's clock back by the delay: both arrivals become uniform over a ${fmtNum(p.windowMinutes)}-minute square, and the meeting band becomes a diagonal stripe of width ${fmtNum(d.stripeWidth)} minutes, shifted down by ${fmtNum(p.delayMinutes)}.` },
    { title: "Sweep the stripe", body: `With the delay at least the patience, the stripe sits fully inside the square while the second arrival runs its first ${fmtNum(d.fullSpan)} minutes, then tapers away over exactly its own width — contributing ${fmtNum(d.fullArea)} and ${fmtNum(d.taperArea)} square minutes.` },
    { title: "Answer", body: `Together that is ${fmtNum(d.totalArea)} of the square's ${fmtNum(d.boardArea)} square minutes — about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Zero delay would return the classic square; each delayed minute eats ${fmtNum(d.stripeWidth)} square minutes of meeting area linearly, which is why the answer reads as a product, not a difference of squares.` },
  ],
  keyInsight: "An arrival offset acts like lost patience: each delayed minute erases a stripe-width of meeting area, so the chance falls linearly in the offset.",
  commonTrap: "Keeping only the wait in the corner legs and treating the delay as free — every minute of schedule gap costs exactly like a minute of impatience.",
  expectedPaceS: 75,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
