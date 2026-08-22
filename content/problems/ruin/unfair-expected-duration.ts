import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Unfair-game expected absorption time: (i - N*Pi) / (q - p) with Pi the success probability
// from i and r = q/p. The powers r^i / r^N stay LOCAL (plan constraint 8); Pi itself is a
// probability kept >= ~0.04 by the drift guard, safe for `derived`.
const durationOf = (p: Params) => {
  const prob = p.winPct / 100;
  const q = 1 - prob;
  const r = q / prob;
  const ri = Math.pow(r, p.stake);
  const rn = Math.pow(r, p.target);
  const success = (1 - ri) / (1 - rn);
  return (p.stake - p.target * success) / (q - prob);
};

export const unfairExpectedDuration: ProblemTemplate = {
  id: "ruin/unfair-expected-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "de-shaw", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected absorption time with an edge" },
  params: {
    winPct: { range: { min: 42, max: 58, step: 1 } },
    stake: { range: { min: 2, max: 12, step: 1 } },
    target: { range: { min: 14, max: 26, step: 1 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && p.stake < p.target && durationOf(p) >= 1 && durationOf(p) <= 600,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const edge = q - prob;
    const r = q / prob;
    const ri = Math.pow(r, p.stake);
    const rn = Math.pow(r, p.target);
    const success = (1 - ri) / (1 - rn);
    const duration = (p.stake - p.target * success) / edge;
    const fairDuration = p.stake * (p.target - p.stake);
    return { prob, q, edge, ratio: r, success, duration, fairDuration, straightWin: p.target - p.stake };
  },
  statement: (p) =>
    `A roulette-style game wins one chip per hand with probability ${fmtNum(p.winPct)} percent and loses one otherwise. You sit down with ${fmtNum(p.stake)} chips and quit only at ${fmtNum(p.target)} chips or bust. On average, how many hands does your visit last?`,
  answerKey: "duration",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $e(k)$ be the expected number of hands until the session ends from stack $k$, vanishing at both boundaries. Each hand costs one unit of time and lands you on a neighbour with the game's own odds, so the expected time is one hand plus the odds-weighted average of the two neighbouring times.` },
    { title: "Success first", body: `The absorption chance from stack $k$ takes the exponential two-barrier form in $r$, the odds ratio against you. Here $r=\\frac{${fmtNum(d.q)}}{${fmtNum(d.prob)}}=${fmtNum(d.ratio)}$, and from your stake of ${fmtNum(p.stake)} chips it comes to ${fmtNum(d.success)}.` },
    { title: "Solve the time recursion", body: `Pairing a linear ramp with that same exponential family and fitting both boundaries gives, at your numbers, an expected visit of ${fmtNum(d.duration)} hands.` },
    { title: "Answer", body: `Expect the visit to last about ${fmtNum(d.duration)} hands.` },
    { title: "Sanity check", body: `The fair-coin version of this exact session would run ${fmtNum(d.fairDuration)} hands (${fmtNum(p.stake)} times ${fmtNum(d.straightWin)}); your edge pulls the visit shorter or longer depending on which barrier it pushes you toward, but never multiplies it manyfold — ${fmtNum(d.duration)} sits in the same regime.` },
  ],
  keyInsight: "An edge both bends the win probability into an exponential and tilts expected time below the fair parabola — the same odds ratio r appears inside both answers.",
  commonTrap: "Reaching for the fair-game product i(N-i) after glancing at the barriers — with any edge that formula overestimates, because drift toward one barrier cuts the loitering.",
  expectedPaceS: 80,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
