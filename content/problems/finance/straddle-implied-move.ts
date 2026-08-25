import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The premium is a sum of two quarter-grid quotes and so exact; `constraint` keeps it between
// two and fifteen percent of the spot — a straddle priced outside that band is a misquote, not a
// question — and licenses the percentage as a four-significant-figure exact value, which makes
// the fraction exact as well. Both breakeven prices are sums of exact operands.
export const straddleImpliedMove: ProblemTemplate = {
  id: "finance/straddle-implied-move",
  version: 1,
  topic: "finance/pricing",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "jane-street", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the at-the-money straddle's premium as the move the market is pricing" },
  params: {
    spot: { choices: [20, 25, 40, 50, 80, 100, 125, 200, 250, 400, 500] },
    call: { range: { min: 0.25, max: 15, step: 0.25 } },
    put: { range: { min: 0.25, max: 15, step: 0.25 } },
  },
  constraint: (p) => (p.call + p.put) / p.spot >= 0.02 && (p.call + p.put) / p.spot <= 0.15 && exact4(100 * (p.call + p.put) / p.spot),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const premium = round(p.call + p.put);
    return {
      premium,
      fraction: round(premium / p.spot),
      upper: round(p.spot + premium),
      lower: round(p.spot - premium),
      answer: round(100 * premium / p.spot),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A stock trades at ${fmtNum(p.spot)}. The at-the-money straddle — a call and a put both struck at ${fmtNum(p.spot)}, expiring together — is quoted with the call at ${fmtNum(p.call)} and the put at ${fmtNum(p.put)}. ` +
    `By what percentage must the stock move from here, in either direction, for a buyer of the straddle to break even at expiry?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Where a straddle breaks even", body: `At expiry one leg is worthless and the other pays the distance from the strike, so the straddle is worth $|S_T-K|$. The buyer paid $C+P$ for it and is square where $|S_T-K|=C+P$ — the whole premium has to come back through one leg.` },
    { title: "The premium", body: `Both legs are paid for: $${fmtNum(p.call)}+${fmtNum(p.put)}=${fmtNum(d.premium)}$.` },
    { title: "As a fraction of the price", body: `The strike is the spot, so the required move is the premium over the spot: $\\dfrac{${fmtNum(d.premium)}}{${fmtNum(p.spot)}}=${fmtNum(d.fraction)}$.` },
    { title: "Answer", body: `In percent, $\\dfrac{100\\times${fmtNum(d.premium)}}{${fmtNum(p.spot)}}=${fmtNum(d.answer)}$ — the stock has to move ${fmtNum(d.answer)} percent either way before the buyer is ahead.` },
    { title: "Sanity check", body: `The two breakeven prices are $${fmtNum(p.spot)}+${fmtNum(d.premium)}=${fmtNum(d.upper)}$ on the way up and $${fmtNum(p.spot)}-${fmtNum(d.premium)}=${fmtNum(d.lower)}$ on the way down, symmetric about the strike. Inside that band the straddle expires worth less than it cost; outside it the buyer wins, and the seller has collected ${fmtNum(d.premium)} for taking the other side.` },
  ],
  keyInsight: "The at-the-money straddle's premium, read as a fraction of the stock price, is the move the market is charging for. A trader who expects the stock to travel further than that buys the straddle and one who expects it to sit still sells it — both are trading a view on size, not on direction.",
  commonTrap: "Using only the call's premium, or halving the straddle's cost because there are two legs. The buyer pays for both and needs the whole premium back from one of them, since the other expires worthless.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [100],
};
