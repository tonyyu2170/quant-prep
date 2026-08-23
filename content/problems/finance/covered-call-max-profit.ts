import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A buy-write, asked for its best case. `constraint` needs the answer itself — a maximum
// profit near zero grades at rel 0.005 of almost nothing, which is exact equality in disguise
// — so the helper is licensed, and it also enforces that the call is struck above where the
// stock was bought, without which the "sell it higher than you bought it" reading is false.
const maxProfitOf = (par: { strike: number; spot: number; call: number }) => par.strike - par.spot + par.call;

export const coveredCallMaxProfit: ProblemTemplate = {
  id: "finance/covered-call-max-profit",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.3 }, { firm: "flow", weight: 0.25 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "payoff of a covered call (buy-write) at expiry" },
  params: {
    spot: { choices: [40, 45, 50, 55, 60, 70, 75, 80] },
    strike: { choices: [45, 50, 55, 60, 65, 70, 80, 85, 90] },
    call: { range: { min: 1, max: 8, step: 0.5 } },
  },
  constraint: (p) => p.strike > p.spot && maxProfitOf(p as { strike: number; spot: number; call: number }) >= 2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      upside: round(p.strike - p.spot),
      breakeven: round(p.spot - p.call),
      answer: round(p.strike - p.spot + p.call),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `You buy one share at ${fmtNum(p.spot)} and, against it, sell one European call struck at ${fmtNum(p.strike)} expiring in a month, taking in ${fmtNum(p.call)} of premium. Each option is on one share, the stock pays no dividend, and financing over the month can be ignored. ` +
    `What is the most this position can make by expiry, per share?`,
  solution: (p, d) => [
    { title: "Two pieces, one capped payoff", body: `Above the strike the short call gives away every further gain on the share, so the position stops improving there. Below it the call expires worthless and the position is just the share, worth whatever the share is worth. The best case is therefore reached at the strike and at every price above it: $\\text{max profit}=K-S+C$.` },
    { title: "What the share contributes", body: `Called away at the strike, the share is sold for ${fmtNum(p.strike)} having cost ${fmtNum(p.spot)}, a gain of $${fmtNum(p.strike)}-${fmtNum(p.spot)}=${fmtNum(d.upside)}$ per share.` },
    { title: "Answer", body: `The premium is kept whatever happens, so it adds on top: $${fmtNum(p.strike)}-${fmtNum(p.spot)}+${fmtNum(p.call)}=${fmtNum(d.answer)}$ per share. Nothing the stock does above ${fmtNum(p.strike)} improves on that.` },
    { title: "What was given up for it", body: `The premium is compensation for the upside above ${fmtNum(p.strike)}, and a call is written precisely by someone who thinks that upside is worth less than ${fmtNum(p.call)}. The position is short volatility in the plainest sense: it does best in a market that drifts up to the strike and stops.` },
    { title: "Sanity check", body: `On the downside the premium is the only cushion — the position first loses money below $${fmtNum(p.spot)}-${fmtNum(p.call)}=${fmtNum(d.breakeven)}$, and from there it falls one-for-one with the share. A gain capped at ${fmtNum(d.answer)} against a downside that runs to nearly the whole ${fmtNum(d.breakeven)} at risk is the trade being made.` },
  ],
  keyInsight: "Selling a call against a share you own converts unlimited upside into a fixed premium, so the payoff is capped at the strike and the premium is what you were paid for the cap. The maximum is reached at the strike, not somewhere beyond it.",
  commonTrap: "Adding the premium to an uncapped stock gain, or forgetting that the share was bought below the strike so the sale itself contributes. The two pieces are the move up to the strike and the premium — and only the second one is collected if the share never gets there.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
