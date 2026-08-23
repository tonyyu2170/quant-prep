import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The discount factor is a PARAMETER, not something derived from a rate and a horizon. A
// factor built as (1+r)^-T is a repeating decimal on almost every draw, and it is then
// multiplied by the strike and carried into the next printed step — a rounded operand inside
// a printed chain, which is exactly what the precision gate catches. Quoting the price of a
// zero-coupon bond directly is also how a trader states it, so realism costs nothing.
// `constraint` needs the put price itself: rel 0.005 on a near-zero answer is exact grading.
//
// The final chain multiplies the strike by the factor again rather than reusing the printed
// `pvK`: at a strike of 105 and a factor of 0.97 the product is 101.85, which prints at four
// significant figures as 101.9, and 3.5 - 40 + 101.9 does not reconcile with the answer. The
// gate caught exactly that on 2 of 60 seeds.
const putOf = (par: { call: number; spot: number; strike: number; df: number }) =>
  par.call - par.spot + par.strike * par.df;

export const putCallParity: ProblemTemplate = {
  id: "finance/put-call-parity",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "put-call parity by replication, with the discount factor quoted directly" },
  params: {
    spot: { choices: [40, 45, 50, 55, 60, 75, 80, 100] },
    strike: { choices: [35, 40, 45, 50, 55, 60, 70, 80, 90, 105] },
    call: { range: { min: 1, max: 12, step: 0.5 } },
    df: { choices: [0.94, 0.95, 0.96, 0.97, 0.98, 0.99] },
  },
  constraint: (p) => putOf(p as { call: number; spot: number; strike: number; df: number }) >= 0.3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      pvK: round(p.strike * p.df),
      intrinsic: round(Math.max(p.spot - p.strike, 0)),
      putIntrinsic: round(Math.max(p.strike - p.spot, 0)),
      callTimeValue: round(p.call - Math.max(p.spot - p.strike, 0)),
      putTimeValue: round(p.call - p.spot + p.strike * p.df - Math.max(p.strike - p.spot, 0)),
      carry: round(p.strike * (1 - p.df)),
      answer: round(p.call - p.spot + p.strike * p.df),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A European call and a European put are written on the same stock, share a strike of ${fmtNum(p.strike)}, and expire on the same day. The stock pays no dividend and trades at ${fmtNum(p.spot)}. The call is quoted at ${fmtNum(p.call)}. ` +
    `A zero-coupon bond paying one dollar on that expiry day trades at ${fmtNum(p.df)}. ` +
    `What must the put be worth, if no riskless profit is available?`,
  solution: (p, d) => [
    { title: "Build the same payoff two ways", body: `Hold one call and enough of the bond to pay the strike at expiry. Alternatively hold one put and one share. At expiry both are worth the larger of the share price and the strike — above the strike the call pays the difference and the bond pays the strike, while the put expires worthless beside the share; below it the reverse. Two portfolios with identical payoffs must cost the same today, so $C-P=S-K\\,\\text{DF}$.` },
    { title: "Price the bond leg", body: `Paying the strike at expiry costs $${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.pvK)}$ today, since each dollar due then is worth ${fmtNum(p.df)} now.` },
    { title: "Answer", body: `Rearranging, the put is the call, less the share, plus the discounted strike: $${fmtNum(p.call)}-${fmtNum(p.spot)}+${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.answer)}$.` },
    { title: "Why no model is needed", body: `Nothing above used a volatility, a distribution or a drift. The relation is a statement about two portfolios that pay the same amount in every state of the world, so it holds whatever the stock actually does — which is why a quoted put that disagrees with it is an arbitrage rather than a difference of opinion.` },
    { title: "Sanity check", body: `The call is quoted at ${fmtNum(p.call)} against an intrinsic value of ${fmtNum(d.intrinsic)}, so it carries ${fmtNum(d.callTimeValue)} of time value; the put comes out at ${fmtNum(d.answer)} against an intrinsic value of ${fmtNum(d.putIntrinsic)}, so it carries ${fmtNum(d.putTimeValue)}. Those are not equal, and the gap between them is fixed: $${fmtNum(p.strike)}\\times(${fmtNum(1)}-${fmtNum(p.df)})=${fmtNum(d.carry)}$, the interest earned on the strike between now and expiry. The two time values coincide only when money costs nothing.` },
  ],
  keyInsight: "Parity is replication, not a pricing model: a call plus a bond and a put plus a share pay the same amount in every state, so their costs must match today. It is the one option relation that survives any assumption about how the underlying moves.",
  commonTrap: "Assuming the call and the put carry the same time value, or using the raw strike instead of its discounted value. The bond leg pays the strike at expiry, not today, and skipping the discount pushes the put out by the strike times one minus the discount factor — which is larger than most of the time value being argued about.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [1],
};
