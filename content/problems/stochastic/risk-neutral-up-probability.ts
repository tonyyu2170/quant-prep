import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  const round = (x: number) => Math.round(x * 1e9) / 1e9;
  return {
    upPrice: p.spot + p.up,
    downPrice: p.spot - p.down,
    span: p.up + p.down,
    answer: round(p.down / (p.up + p.down)),
  };
};

export const riskNeutralUpProbability: ProblemTemplate = {
  id: "stochastic/risk-neutral-up-probability",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.2 }, { firm: "citadel-securities", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the one-step binomial tree probability that makes the stock a fair game" },
  params: {
    spot: { choices: [40, 50, 60, 72, 80, 90, 100, 120] },
    up: { choices: [4, 5, 6, 8, 10, 12, 15, 20, 25, 30] },
    down: { choices: [3, 4, 5, 6, 8, 10, 12, 16, 20] },
  },
  constraint: (p) => p.down < p.spot && p.up + p.down <= p.spot && !complementGrades(derive(p).answer),
  derived: derive,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A name trades at ${fmtNum(p.spot)} today. Over the next period it can only do one of two things: rise to ` +
    `${fmtNum(d.upPrice)} or fall to ${fmtNum(d.downPrice)}. Interest rates are zero, so a fairly priced name is one ` +
    `whose expected price next period is exactly what it costs now. Under what probability of the up move is that true?`,
  solution: (p, d) => [
    { title: "Pricing does not use the real odds", body: `The probability wanted here is not a forecast. It is the weight that makes today's price the average of tomorrow's two, which is what "no free money in this trade" amounts to when nothing is discounted.` },
    { title: "Set the average equal to today", body: `Call that weight $q$. Then $q$ times the up price plus $(1-q)$ times the down price must come to the spot. Rearranged, $q$ is the share of the total move that lies BELOW today's price.` },
    { title: "Measure the two moves", body: `The up move is $${fmtNum(d.upPrice)}-${fmtNum(p.spot)}=${fmtNum(p.up)}$ and the down move is $${fmtNum(p.spot)}-${fmtNum(d.downPrice)}=${fmtNum(p.down)}$, so the whole span from the low outcome to the high one is $${fmtNum(p.up)}+${fmtNum(p.down)}=${fmtNum(d.span)}$.` },
    { title: "Answer", body: `The weight is the down move over the span: $\\dfrac{${fmtNum(p.down)}}{${fmtNum(d.span)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Today's price sits ${fmtNum(p.down)} above the low outcome and ${fmtNum(p.up)} below the high one, so the weight must land strictly between nothing and everything, and it does. Note which distance carries it: the FURTHER today sits above the low outcome, the MORE weight the up move needs to pull the average back up.` },
  ],
  keyInsight: "The probability that prices a two-outcome bet is fixed by the payoffs alone, not by anyone's view of how likely the outcomes are. That is the whole content of risk-neutral pricing, and it is why two desks who disagree completely about direction can still agree on a price.",
  commonTrap: "Pairing the up move with the up probability, which inverts the answer. The weight on an outcome is the distance to the OTHER outcome — the far branch needs the weight, because the near one barely moves the average.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [1],
};
