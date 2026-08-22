import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-stage meeting: stage one prices the agreed wait from a stated chance at the original
// window; stage two reprices that same wait after the window shrinks.
const impliedWait = (p: Params) => p.firstWindow * (1 - Math.sqrt(1 - p.targetPct / 100));

export const fitWindowThenOtherWindow: ProblemTemplate = {
  id: "geometric/fit-window-then-other-window",
  version: 1,
  topic: "probability/geometric",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "carry a negotiated meeting wait across a shorter window" },
  params: {
    firstWindow: { range: { min: 60, max: 120, step: 10 } },
    targetPct: { range: { min: 15, max: 80, step: 5 } },
    secondWindow: { range: { min: 25, max: 55, step: 5 } },
  },
  constraint: (p) => { const w = impliedWait(p); const ans = w < p.secondWindow ? 1 - Math.pow((p.secondWindow - w) / p.secondWindow, 2) : -1; return w >= 1 && w < p.secondWindow && ans >= 0.1 && ans <= 0.99; },
  derived: (p) => {
    const wait = impliedWait(p);
    const answer = 1 - Math.pow((p.secondWindow - wait) / p.secondWindow, 2);
    const missLeg = p.secondWindow - wait;
    return { wait, answer, missLeg };
  },
  statement: (p) =>
    `Two friends originally planned to arrive uniformly at random inside a ${fmtNum(p.firstWindow)}-minute window, each waiting a fixed time for the other, sized so their meeting chance was exactly ${fmtNum(p.targetPct)} percent. The cafe has since shortened the arrival window to ${fmtNum(p.secondWindow)} minutes, but they keep the same absolute wait. What is their meeting chance now?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: recover the wait", body: `Inverting the original meeting square, the wait is the old window times one minus the square root of the miss share: about ${fmtNum(d.wait)} minutes.` },
    { title: "Stage two: reprice in the smaller window", body: `The same ${fmtNum(d.wait)}-minute wait inside the ${fmtNum(p.secondWindow)}-minute window leaves miss triangles with legs of ${fmtNum(d.missLeg)} minutes, and one minus their squared share of the window gives about ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `Their meeting chance rises to about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `A shorter window squeezes the corners around an unchanged diagonal band, so the chance can only improve — ${fmtNum(d.answer)} exceeds the staged-in ${fmtNum(p.targetPct)} percent, as it must.` },
  ],
  keyInsight: "A fixed wait means shrinking the window shrinks only the corners, so the same patience buys a better chance when schedules tighten.",
  commonTrap: "Re-running stage one's inversion inside the new window — the wait was already negotiated from the OLD window and carries over unchanged.",
  expectedPaceS: 80,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
