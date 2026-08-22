import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Conditional expected duration after surviving to level j in a fair game: j(N - j) — the
// parabola restarted at today's stack. `constraint` cannot see `derived`
// (packages/engine/src/problem.ts:24), so it asks through this same helper.
const remainingOf = (p: Params) => p.currentStack * (p.goalChips - p.currentStack);

export const surviveThenRemainingDuration: ProblemTemplate = {
  id: "ruin/survive-then-remaining-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 3,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "conditional expectation restarts the ruin clock" },
  params: {
    currentStack: { range: { min: 3, max: 14, step: 1 } },
    goalChips: { range: { min: 16, max: 30, step: 1 } },
    elapsedHands: { range: { min: 40, max: 400, step: 20 } },
  },
  constraint: (p) => p.currentStack < p.goalChips && remainingOf(p) >= 1 && remainingOf(p) <= 600,
  derived: (p) => {
    const remaining = p.currentStack * (p.goalChips - p.currentStack);
    const fromZero = Math.round(p.goalChips * p.goalChips / 4);
    const upperGap = p.goalChips - p.currentStack;
    return { remaining, fromZero, upperGap };
  },
  statement: (p) =>
    `A colleague has been grinding a fair even-money game for ${fmtNum(p.elapsedHands)} hands already and is still alive, currently holding ${fmtNum(p.currentStack)} chips; sessions end only at bust or at the target of ${fmtNum(p.goalChips)} chips. Measured from right now, how many more hands does the session last on average?`,
  answerKey: "remaining",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Fair-game expected duration depends only on where you stand and where the barriers are — never on how long you took to get there. The walk restarts at today's stack.` },
    { title: "Restart the parabola", body: `With $k=${fmtNum(p.currentStack)}$ and $N=${fmtNum(p.goalChips)}$, the expected remainder is $k(N-k)=${fmtNum(p.currentStack)}\\times(${fmtNum(p.goalChips)}-${fmtNum(p.currentStack)})=${fmtNum(p.currentStack)}\\times${fmtNum(d.upperGap)}=${fmtNum(d.remaining)}$ hands.` },
    { title: "Answer", body: `From here, expect about ${fmtNum(d.remaining)} more hands.` },
    { title: "Sanity check", body: `The ${fmtNum(p.elapsedHands)} hands already played are pure history: the answer ignores them entirely, and sits below the fresh-session ceiling of about ${fmtNum(d.fromZero)} hands because your stack is no longer mid-corridor.` },
  ],
  keyInsight: "Survival does not shorten the road: conditioning on being alive at level j restarts the duration parabola exactly as if the session began there.",
  commonTrap: "Subtracting time already spent, or shrinking the estimate because survival proves luck — the Markov property makes every elapsed hand invisible to the future.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [0],
};
