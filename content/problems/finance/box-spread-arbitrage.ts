import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A box, quoted as its two spreads rather than as four separate option prices. Quoting the
// legs individually would put four more axes in the draw space for no extra idea, and the
// trader's own quote is the spread; the arithmetic a candidate is being asked for is the same
// either way. `constraint` needs the profit — it must stay clear of zero for rel 0.005 to be
// a real tolerance, and the box has to be trading below its certain payout for the question
// to have an answer.
const edgeOf = (par: { width: number; df: number; callSpread: number; putSpread: number }) =>
  par.width * par.df - (par.callSpread + par.putSpread);

export const boxSpreadArbitrage: ProblemTemplate = {
  id: "finance/box-spread-arbitrage",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "hrt", weight: 0.25 }, { firm: "citadel-securities", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the box spread as synthetic lending, and the arbitrage when it is quoted cheap" },
  params: {
    k1: { choices: [40, 45, 50, 55, 60] },
    width: { choices: [10, 15, 20, 25] },
    callSpread: { range: { min: 4, max: 12, step: 0.5 } },
    putSpread: { range: { min: 3, max: 10, step: 0.5 } },
    df: { choices: [0.95, 0.96, 0.97, 0.98] },
  },
  constraint: (p) => edgeOf(p as { width: number; df: number; callSpread: number; putSpread: number }) >= 0.5 && p.callSpread + p.putSpread < p.width,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      k2: p.k1 + p.width,
      cost: round(p.callSpread + p.putSpread),
      fairValue: round(p.width * p.df),
      answer: round(p.width * p.df - (p.callSpread + p.putSpread)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `European calls and puts trade on one underlying at one expiry, struck at ${fmtNum(p.k1)} and ${fmtNum(d.k2)}. The call spread — long the ${fmtNum(p.k1)} call, short the ${fmtNum(d.k2)} call — is offered at ${fmtNum(p.callSpread)}, and the put spread — long the ${fmtNum(d.k2)} put, short the ${fmtNum(p.k1)} put — is offered at ${fmtNum(p.putSpread)}. A bond paying one dollar at that expiry trades at ${fmtNum(p.df)}. ` +
    `You buy both spreads. What riskless profit does that lock in, per unit?`,
  solution: (p, d) => [
    { title: "The two spreads together pay a constant", body: `Held together the four legs are a box, and a box pays the strike width at expiry whatever the underlying does: $\\text{box}=W\\,\\text{DF}$ today, because a certain payout is priced like a bond and nothing else about the underlying matters.` },
    { title: "Check that at both ends", body: `Finish below ${fmtNum(p.k1)} and both calls expire worthless while the put spread pays the full $${fmtNum(d.k2)}-${fmtNum(p.k1)}=${fmtNum(p.width)}$. Finish above ${fmtNum(d.k2)} and the puts expire worthless while the call spread pays the same ${fmtNum(p.width)}. Finish between them and the two spreads split it, one paying what the other does not.` },
    { title: "What that certainty is worth today", body: `A guaranteed ${fmtNum(p.width)} on the expiry date is worth $${fmtNum(p.width)}\\times${fmtNum(p.df)}=${fmtNum(d.fairValue)}$ today, at the bond price the market is already quoting.` },
    { title: "Answer", body: `The two spreads cost $${fmtNum(p.callSpread)}+${fmtNum(p.putSpread)}=${fmtNum(d.cost)}$ together, so buying the box is buying ${fmtNum(p.width)} of certain money for ${fmtNum(d.cost)}: $${fmtNum(p.width)}\\times${fmtNum(p.df)}-${fmtNum(d.cost)}=${fmtNum(d.answer)}$ per unit, riskless.` },
    { title: "Sanity check", body: `A box is lending dressed as options — pay ${fmtNum(d.cost)} now, receive ${fmtNum(p.width)} at expiry, with no exposure to the underlying anywhere in between. This one lends at better than the market's own rate, which is why the profit is positive; quoted the other way round, above ${fmtNum(d.fairValue)}, the same structure would be sold rather than bought and the arbitrage would run in the opposite direction.` },
  ],
  keyInsight: "A box spread has no exposure to the underlying at all — it is a zero-coupon bond built out of four options, and it must be priced by discounting the strike width. Comparing what the options cost against what that certain payout is worth is the whole trade.",
  commonTrap: "Comparing the cost against the undiscounted strike width and calling any cheaper price an arbitrage. The width is paid at expiry, not today, so the fair price is the width discounted — and a box bought just under the width can still be a losing trade.",
  expectedPaceS: 115,
  verify: { method: "brute-force" },
  constants: [],
};
