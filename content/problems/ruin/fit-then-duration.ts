import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Stage one infers the fair-game stake from a stated reach chance; stage two prices the
// expected session for that stake. `constraint` cannot see `derived`
// (packages/engine/src/problem.ts:24), so it asks through this helper.
const impliedStake = (p: Params) => (p.reachPct / 100) * p.goalChips;

export const fitThenDuration: ProblemTemplate = {
  id: "ruin/fit-then-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "two-stage fair game: infer capital from odds, then price time" },
  params: {
    reachPct: { range: { min: 5, max: 60, step: 1 } },
    goalChips: { range: { min: 100, max: 300, step: 20 } },
  },
  constraint: (p) => impliedStake(p) >= 2 && impliedStake(p) === Math.round(impliedStake(p)) && impliedStake(p) < p.goalChips,
  derived: (p) => {
    const stake = Math.round(impliedStake(p));
    const duration = stake * (p.goalChips - stake);
    const straightWin = p.goalChips - stake;
    return { stake, duration, straightWin };
  },
  statement: (p) =>
    `At a fair even-money table, a gambler with an unknown buy-in tells you only this: their chance of multiplying up to ${fmtNum(p.goalChips)} chips before busting is ${fmtNum(p.reachPct)} percent — and at that table your share of the total is exactly your chance. First work out their starting stack; then tell them how many hands their session lasts on average.`,
  answerKey: "duration",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: read back the stake", body: `A fair table makes the reach chance equal the share $\\frac{k}{${fmtNum(p.goalChips)}}$, so ${fmtNum(p.reachPct)} percent of the goal is the stack: $\\frac{${fmtNum(p.reachPct)}}{100}\\times${fmtNum(p.goalChips)}=${fmtNum(d.stake)}$ chips.` },
    { title: "Stage two: price the session", body: `The fair-game parabola gives expected length $k(N-k)=${fmtNum(d.stake)}\\times(${fmtNum(p.goalChips)}-${fmtNum(d.stake)})=${fmtNum(d.stake)}\\times${fmtNum(d.straightWin)}=${fmtNum(d.duration)}$ hands.` },
    { title: "Answer", body: `They started with about ${fmtNum(d.stake)} chips, and their sessions run about ${fmtNum(d.duration)} hands.` },
    { title: "Sanity check", body: `The stage-two inputs are entirely stage-one's output: reading the parabola back at ${fmtNum(d.stake)} reproduces ${fmtNum(d.duration)}, and the clean win path (${fmtNum(d.straightWin)} hands) sits well below the average, as a wandering walk requires.` },
  ],
  keyInsight: "Two-stage ruin questions chain cleanly when both stages live in the same family: the linear fair-share recovers the hidden capital, and the very same variables price the duration parabola.",
  commonTrap: "Reusing the stated percentage inside the duration formula — the percent prices only the stack; once the stack is known, the duration reads off k and N alone.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [0, 1, 100],
};
