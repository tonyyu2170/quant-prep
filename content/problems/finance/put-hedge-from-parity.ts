import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Parity differentiated once: the call's delta less the put's is exactly one, so a put delta
// is a call delta with one subtracted and no model is needed to get it. Every option here is
// on a single share, which keeps the hedge a plain product rather than a product with a
// contract multiplier — the multiplier teaches nothing and doubles the arithmetic.
//
// The strike does not enter the answer at all. It is drawn anyway because a third axis is what
// spreads the emitted tuples: two axes repeat one tuple past the cap of 4 even when the space
// is large, since consecutive seeds are not fully decorrelated in the first draw.
export const putHedgeFromParity: ProblemTemplate = {
  id: "finance/put-hedge-from-parity",
  version: 1,
  topic: "finance/options",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "put delta from put-call parity, and the share hedge it implies" },
  params: {
    n: { choices: [50, 100, 150, 200, 250, 300] },
    dc: { range: { min: 0.3, max: 0.8, step: 0.05 } },
    strike: { choices: [40, 50, 60, 70, 80] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      putDelta: round(p.dc - 1),
      perPut: round(1 - p.dc),
      callHedge: round(p.n * p.dc),
      answer: round(p.n * (1 - p.dc)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A European call and a European put are written on the same non-dividend-paying stock, share a strike of ${fmtNum(p.strike)}, and expire on the same day. Each option is on one share. The call's delta is ${fmtNum(p.dc)}. ` +
    `You are short ${fmtNum(p.n)} of the puts. How many shares must you sell to make the position delta-neutral?`,
  solution: (p, d) => [
    { title: "Differentiate parity once", body: `Parity says a call less a put equals the share less the discounted strike. The strike leg does not move with the share price, so differentiating in the share price leaves, writing $D$ for a delta, $D_C-D_P=1$ — one relation, no volatility, no distribution.` },
    { title: "Read the put's delta off it", body: `So the put's delta is the call's less one: $${fmtNum(p.dc)}-${fmtNum(1)}=${fmtNum(d.putDelta)}$. It is negative because the put gains when the share falls, and it is smaller in size than the call's whenever the call's delta exceeds a half.` },
    { title: "A short put is long the share", body: `Being short an option flips the sign of its delta, so each short put carries $+${fmtNum(d.perPut)}$ of share exposure. Across ${fmtNum(p.n)} of them that is $${fmtNum(p.n)}\\times${fmtNum(d.perPut)}=${fmtNum(d.answer)}$ shares of long exposure.` },
    { title: "Answer", body: `Sell ${fmtNum(d.answer)} shares. The position is then flat in the share price to first order — which is all a delta hedge ever claims, since it says nothing about what happens when the price moves far enough for the delta itself to change.` },
    { title: "Sanity check", body: `Hedging ${fmtNum(p.n)} short calls instead would take $${fmtNum(p.n)}\\times${fmtNum(p.dc)}=${fmtNum(d.callHedge)}$ shares, bought rather than sold. The two hedges add to $${fmtNum(d.answer)}+${fmtNum(d.callHedge)}=${fmtNum(p.n)}$ shares, which is the parity relation again: the deltas differ by exactly one, so the two hedges differ by exactly one share per option.` },
  ],
  keyInsight: "A put's delta is not something to look up — parity fixes it at the call's delta minus one, for any strike, any expiry and any volatility. Differentiating a no-arbitrage identity gives a Greek relation that holds even where the pricing model does not.",
  commonTrap: "Taking the put's delta as the negative of the call's. That is only true at a delta of one half; everywhere else the two deltas differ by one, not by a sign, and the error moves the hedge by the amount the two rules disagree.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [1],
};
