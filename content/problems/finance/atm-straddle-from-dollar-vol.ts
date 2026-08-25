import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Time to expiry is drawn in TRADING DAYS out of a 256-day year, so that its square root is a
// clean sixteenth and the dollar standard deviation is exact on every draw. The factor sqrt(2/pi)
// is transcendental, so the one chain that multiplies by it is written with \approx — which the
// precision gate does not read — and the template carries three exact `=` chains beside it. No
// `\pi` is printed: the allowlist does not have it, and the factor is named in prose instead.
export const atmStraddleFromDollarVol: ProblemTemplate = {
  id: "finance/atm-straddle-from-dollar-vol",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "jane-street", weight: 0.2 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the at-the-money straddle as the expected absolute move, and the four-fifths rule of thumb" },
  params: {
    spot: { choices: [20, 25, 40, 50, 80, 100, 125, 200] },
    volPct: { choices: [16, 20, 25, 30, 32, 40, 50, 60, 80] },
    days: { choices: [4, 9, 16, 25, 36, 49, 64, 100, 144, 196, 256] },
  },
  constraint: (p) => exact4(p.spot * p.volPct / 100 * Math.sqrt(p.days) / 16) && p.spot * p.volPct / 100 * Math.sqrt(p.days) / 16 >= 0.2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const rootT = Math.sqrt(p.days) / 16;
    const s = round(p.spot * p.volPct / 100 * rootT);
    return {
      vol: round(p.volPct / 100),
      rootT: round(rootT),
      dollarVol: s,
      factor: round(Math.sqrt(2 / Math.PI)),
      ruleOfThumb: round(0.8 * s),
      pctOfSpot: round(100 * s * Math.sqrt(2 / Math.PI) / p.spot),
      answer: round(s * Math.sqrt(2 / Math.PI)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A stock trades at ${fmtNum(p.spot)} with an annualised volatility of ${fmtNum(p.volPct)} percent. An at-the-money straddle — one call and one put, both struck at ${fmtNum(p.spot)} — expires in ${fmtNum(p.days)} trading days. ` +
    `Take the year to be 256 trading days, so that the time to expiry has a clean square root, and treat the expiry price as normally distributed about today's price with no drift and no discounting. What is the straddle worth?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "What the straddle pays", body: `Whichever side the stock finishes, exactly one leg is in the money and it pays the distance from the strike, so the straddle is worth the expected size of the move: $V=E|S_T-K|$, with the strike $K$ at today's price.` },
    { title: "The dollar standard deviation", body: `Vol scales with the square root of time, and $\\sqrt{${fmtNum(p.days)}/256}=${fmtNum(d.rootT)}$ of a year has elapsed by expiry. One standard deviation of the expiry price is therefore $${fmtNum(p.spot)}\\times${fmtNum(d.vol)}\\times${fmtNum(d.rootT)}=${fmtNum(d.dollarVol)}$ dollars.` },
    { title: "The expected absolute move", body: `For a normal variable centred on the strike with standard deviation $s$, the expected distance from the strike is $s$ times the square root of two over pi — a constant $c$ of about ${fmtNum(d.factor)}. So $V=c\\times s$, and here $${fmtNum(d.dollarVol)}\\times${fmtNum(d.factor)}\\approx${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The straddle is worth about ${fmtNum(d.answer)} dollars — ${fmtNum(d.pctOfSpot)} percent of the share price, which is the move the market is pricing in by expiry, give or take.` },
    { title: "The desk shortcut", body: `Four fifths of a standard deviation is the rule of thumb, and it lands within a third of a percent of the exact constant: $0.8\\times${fmtNum(d.dollarVol)}=${fmtNum(d.ruleOfThumb)}$ against ${fmtNum(d.answer)}. That is why a trader quotes an at-the-money straddle as roughly eight tenths of the dollar vol without reaching for a model.` },
  ],
  keyInsight: "An at-the-money straddle is a bet on the size of the move, and its fair price is the expected size of that move: one standard deviation of the expiry price scaled by the square root of two over pi, or four fifths of it as a desk approximation. Price, vol and time enter only through that single dollar standard deviation.",
  commonTrap: "Charging a full standard deviation for the straddle, or scaling vol with time rather than with its square root. A quarter of a year carries half a year's worth of vol, not a quarter of it.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [256, 0.8],
};
