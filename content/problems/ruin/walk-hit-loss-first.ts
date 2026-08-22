import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Mirror of the upper-first walk: P(touch -b before +a) = a/(a+b). Same helper discipline:
// `constraint` asks through this function because it cannot see `derived`.
const lossFirstOf = (p: Params) => p.reboundTarget / (p.dropLimit + p.reboundTarget);

export const walkHitLossFirst: ProblemTemplate = {
  id: "ruin/walk-hit-loss-first",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "drawdown-side reading of the two-barrier symmetric walk" },
  params: {
    dropLimit: { range: { min: 2, max: 16, step: 1 } },
    reboundTarget: { range: { min: 2, max: 16, step: 1 } },
  },
  constraint: (p) => lossFirstOf(p) >= 0.01 && lossFirstOf(p) <= 0.99,
  derived: (p) => {
    const total = p.dropLimit + p.reboundTarget;
    const frac = p.reboundTarget / total;
    const gainFirst = p.dropLimit / total;
    return { total, frac, gainFirst };
  },
  statement: (p) =>
    `A strategy's cumulative PnL in points follows a random walk that steps one point up or one point down with equal probability at every close, currently sitting at zero. The desk will cut the strategy the first time the curve sits ${fmtNum(p.dropLimit)} points underwater, and the trader retires happily if it first banks a ${fmtNum(p.reboundTarget)}-point gain. What is the probability the desk cuts the strategy first?`,
  answerKey: "frac",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The PnL curve wanders between $-${fmtNum(p.dropLimit)}$ and $+${fmtNum(p.reboundTarget)}$, moving one point either way with even odds. Ask which end of the corridor is touched first.` },
    { title: "Borrow the fair-share line", body: `For an even-odds walk the chance of exiting through the top equals distance-from-the-bottom over corridor width: $\\frac{${fmtNum(p.dropLimit)}}{${fmtNum(d.total)}}$. The chance of exiting through the bottom is the complement, $\\frac{${fmtNum(p.reboundTarget)}}{${fmtNum(d.total)}}=${fmtNum(d.frac)}$.` },
    { title: "Answer", body: `The cut happens first with probability $${fmtNum(d.frac)}$.` },
    { title: "Sanity check", body: `The two exit probabilities must account for the whole walk: $${fmtNum(d.frac)}+${fmtNum(d.gainFirst)}=${fmtNum(1)}$, where ${fmtNum(d.gainFirst)} is the banking-first chance — a wider stop (${fmtNum(p.dropLimit)}) would lower the cut chance, exactly as the ratio reads.` },
  ],
  keyInsight: "Reading a barrier question from the loss side flips the ratio: the chance of ruin first is the distance to the upside target over the full corridor width.",
  commonTrap: "Doubling the risk just because the walk looks volatile — widening the corridor moves both exit probabilities toward even odds without changing their sum-to-one structure.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
