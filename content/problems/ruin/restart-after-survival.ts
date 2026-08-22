import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Fresh absorption probability from a survived level j in an unfair game:
// (1 - r^j)/(1 - r^N), r = q/p. `constraint` cannot see `derived`
// (packages/engine/src/problem.ts:24), so it asks through this same helper.
const successFromJ = (p: Params) => {
  const prob = p.winPct / 100;
  const r = (1 - prob) / prob;
  return (1 - Math.pow(r, p.reachedLevel)) / (1 - Math.pow(r, p.goalChips));
};

export const restartAfterSurvival: ProblemTemplate = {
  id: "ruin/restart-after-survival",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "drw", weight: 0.35 }, { firm: "millennium", weight: 0.3 }],
  source: { kind: "original", inspiration: "Markov restart decomposition of a ruin climb" },
  params: {
    winPct: { range: { min: 44, max: 56, step: 1 } },
    reachedLevel: { range: { min: 2, max: 12, step: 1 } },
    goalChips: { range: { min: 14, max: 30, step: 2 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && p.reachedLevel < p.goalChips && successFromJ(p) >= 0.01 && successFromJ(p) <= 0.99,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const ratio = q / prob;
    const rj = Math.pow(ratio, p.reachedLevel);
    const rn = Math.pow(ratio, p.goalChips);
    const success = (1 - rj) / (1 - rn);
    const remaining = p.goalChips - p.reachedLevel;
    return { prob, q, ratio, success, remaining };
  },
  statement: (p) =>
    `In a game where each hand wins with probability ${fmtNum(p.winPct)} percent and moves your stack one chip, you began the night at zero, climbed to ${fmtNum(p.reachedLevel)} chips along the way, and your goal remains ${fmtNum(p.goalChips)} chips before you quit (busting first is the only other ending). Given that you are holding ${fmtNum(p.reachedLevel)} chips right now, what is the probability you reach ${fmtNum(p.goalChips)} before going broke?`,
  answerKey: "success",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The past path is irrelevant — what matters is today's stack. The problem is the same ruin climb with starting stack ${fmtNum(p.reachedLevel)}, barriers at $0$ and $${fmtNum(p.goalChips)}$, win probability ${fmtNum(d.prob)}.` },
    { title: "Same exponential form", body: `With odds ratio $r=\\frac{${fmtNum(d.q)}}{${fmtNum(d.prob)}}=${fmtNum(d.ratio)}$, the reach chance from ${fmtNum(p.reachedLevel)} is ${fmtNum(d.success)}.` },
    { title: "Answer", body: `From here, the chance of finishing the climb is $${fmtNum(d.success)}$.` },
    { title: "Sanity check", body: `Only ${fmtNum(d.remaining)} chips of climbing remain, and your position inside the corridor — closer to the top than to bust — puts the answer above even odds exactly when ${fmtNum(p.reachedLevel)} sits past the midpoint; check the printed value against that reading.` },
  ],
  keyInsight: "A random walk forgets its history: surviving to level j restarts the ruin problem from j, so the original starting point never enters the updated probability.",
  commonTrap: "Discounting or boosting the chance because of the path already travelled — the Markov property prices the future from the current state alone.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
