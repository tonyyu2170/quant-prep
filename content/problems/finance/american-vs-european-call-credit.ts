import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The gap is drawn and the American quote derived from it, so the credit per pair is a printed
// literal and the answer a whole number of contracts times it — exact throughout. Spot and
// strike are quoted for realism and never enter the answer; `constraint` keeps them within ten
// of each other and the European quote at or above intrinsic value, so the scenario is one a
// desk could actually see.
export const americanVsEuropeanCallCredit: ProblemTemplate = {
  id: "finance/american-vs-european-call-credit",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.25 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "an American call quoted below its European twin on a non-dividend stock" },
  params: {
    spot: { choices: [40, 50, 60, 80, 100] },
    strike: { choices: [35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110] },
    euro: { range: { min: 2, max: 12, step: 0.25 } },
    gap: { choices: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1] },
    n: { choices: [10, 20, 25, 40, 50, 100, 200] },
  },
  constraint: (p) => Math.abs(p.spot - p.strike) <= 10 && p.euro >= p.spot - p.strike + 0.25,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      american: round(p.euro - p.gap),
      answer: round(p.n * p.gap),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `Two call options are written on the same stock, which pays no dividend: both are struck at ${fmtNum(p.strike)} and expire on the same day, but one is European — exercisable only at expiry — and the other is American, exercisable at any time up to and including expiry. ` +
    `The stock trades at ${fmtNum(p.spot)}. The European call is quoted at ${fmtNum(p.euro)} and the American at ${fmtNum(d.american)}, and you can trade ${fmtNum(p.n)} of each. What riskless credit can you lock in today?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "More rights cannot be worth less", body: `An American option carries every right the European one does and one more, so it can never be worth less: $C_A=C_E+e$, with $e$ the value of the extra right, and $e$ is never negative. On a stock that pays nothing before expiry that extra right is worth nothing at all — exercising a call early throws away its time value and the interest on the strike — so the two are the same contract. A quote with the American BELOW the European is a free lunch.` },
    { title: "The trade", body: `Buy the American and sell the European, and collect the difference up front on each pair: $${fmtNum(p.euro)}-${fmtNum(d.american)}=${fmtNum(p.gap)}$.` },
    { title: "Then do nothing", body: `Hold both to expiry. Whatever the stock does, the American you own pays exactly what the European you sold demands, since at expiry they are the same claim on the same stock at the same strike. Nothing has to be predicted and nothing has to be hedged.` },
    { title: "Answer", body: `Across the position, $${fmtNum(p.n)}\\times${fmtNum(p.gap)}=${fmtNum(d.answer)}$ dollars today, and nothing owed later.` },
    { title: "Sanity check", body: `The credit is small because the mispricing is small — ${fmtNum(p.gap)} on options quoted near ${fmtNum(p.euro)} — but it is riskless, which no directional trade on a ${fmtNum(p.spot)} stock is. Had the stock paid a dividend before expiry, an American call could rationally trade ABOVE the European, since exercising just before the payout can be worth something; it still could never trade below. The direction of this gap is wrong whatever the stock does.` },
  ],
  keyInsight: "More rights can never be worth less: an American option trades at or above its European twin, and on a stock that pays nothing before expiry the two are worth exactly the same, because early exercise of a call only throws value away. A quote that inverts that order is a riskless credit, collected by buying the cheaper twin and selling the dearer one.",
  commonTrap: "Pricing the credit on one contract and forgetting the size, or reasoning that an American should trade above a European and so a gap is normal. The gap here runs the wrong way — and even the right way, it should be zero on a non-dividend stock.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
};
