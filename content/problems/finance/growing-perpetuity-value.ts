import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Yield and growth are quoted as whole percents so their difference is a whole percent and
// its decimal form is exact, which keeps the one division that matters over clean operands.
export const growingPerpetuityValue: ProblemTemplate = {
  id: "finance/growing-perpetuity-value",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "millennium", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "value of a perpetual cash flow growing at a constant rate" },
  params: {
    cf: { choices: [40, 60, 80, 100, 120, 150, 200, 250, 300] },
    yieldPct: { choices: [8, 9, 10, 11, 12, 14, 15, 16, 18, 20] },
    growthPct: { choices: [0, 1, 2, 3, 4, 5, 6, 7] },
  },
  // The sum only converges when the required return beats the growth rate, and a spread of a
  // point or two puts the value somewhere no sensible buyer would go.
  constraint: (p) => p.yieldPct - p.growthPct >= 3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const spread = p.yieldPct - p.growthPct;
    return {
      spread,
      spreadDec: round(spread / 100),
      flatValue: round(p.cf / (p.yieldPct / 100)),   // what it is worth with no growth at all
      answer: round(p.cf / (spread / 100)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A small business will pay its owner ${fmtNum(p.cf)} dollars a year from now, and that annual payment is expected to grow by ${fmtNum(p.growthPct)} percent every year after that, forever. ` +
    `You will not sell it on; you simply collect the payments. You require a return of ${fmtNum(p.yieldPct)} percent a year on money tied up this way. ` +
    `What is the most you would pay for the business today?`,
  solution: (p, d) => [
    { title: "Discount every payment and add them up", body: `The payment $n$ years out is the first payment grown $n-1$ times, and it is discounted $n$ times. Growth and discounting are both geometric, so the terms form a geometric series whose ratio is one plus the growth over one plus the required return.` },
    { title: "The series collapses", body: `A geometric series with a ratio below one sums to its first term over one less the ratio, and the algebra tidies to $V=\\dfrac{C}{y-g}$ — the next payment divided by the gap between the required return and the growth rate. The gap is what matters; the levels do not.` },
    { title: "Take the gap", body: `$${fmtNum(p.yieldPct)}-${fmtNum(p.growthPct)}=${fmtNum(d.spread)}$ percent, which is ${fmtNum(d.spreadDec)} as a decimal.` },
    { title: "Answer", body: `Dividing the first payment by that gap: $${fmtNum(p.cf)}/${fmtNum(d.spreadDec)}=${fmtNum(d.answer)}$ dollars.` },
    { title: "Sanity check", body: `With no growth at all the same business would be worth ${fmtNum(p.cf)} divided by ${fmtNum(p.yieldPct)} percent, or ${fmtNum(d.flatValue)} dollars. The growth is worth the difference, and note how sharply the value climbs as the growth rate approaches the required return — the denominator, not the numerator, does all the work.` },
  ],
  keyInsight: "A perpetual stream is worth the next payment divided by the gap between what you demand and what the payment grows at. Only the gap matters, which is why a valuation of this shape is far more sensitive to a small change in either rate than to a large change in the cash flow.",
  commonTrap: "Dividing by the required return and ignoring growth, which undervalues anything growing, or letting growth reach the required return, where the series stops converging and the formula stops meaning anything rather than returning a very large number.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
