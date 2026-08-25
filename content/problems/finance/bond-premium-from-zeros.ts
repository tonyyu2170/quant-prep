import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer is the distance from par, not the price: a price near par collapses under the
// draw-space gate's transitive band (measured at 4 distinct answers over 800 tuples), while the
// premium spreads either side of zero (248). Every operand is exact — two-decimal zeros, a
// whole coupon — and the answer chain is built from the two exact legs rather than from the
// printed price, which may round as the last step of its own chain (19.53 + 90 = 109.53 prints
// as 109.5). `constraint` keeps the bond at least a quarter away from par, so the sign is real.
export const bondPremiumFromZeros: ProblemTemplate = {
  id: "finance/bond-premium-from-zeros",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "a coupon bond priced as a strip of zeros, read as a premium or discount to par" },
  params: {
    couponPct: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    df1: { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop: { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n: { choices: [2, 3] },
  },
  constraint: (p) => Math.abs(p.couponPct * (p.n === 2 ? 2 * p.df1 - p.drop : 3 * p.df1 - 3 * p.drop) + 100 * (p.df1 - (p.n - 1) * p.drop) - 100) >= 0.25,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const df2 = round(p.df1 - p.drop), df3 = round(p.df1 - 2 * p.drop);
    const sumDf = round(p.n === 2 ? p.df1 + df2 : p.df1 + df2 + df3);
    const dfLast = p.n === 2 ? df2 : df3;
    const couponLeg = round(p.couponPct * sumDf);
    const redemptionLeg = round(100 * dfLast);
    return {
      df2,
      df3,
      dfLast,
      sumDf,
      couponLeg,
      redemptionLeg,
      price: round(couponLeg + redemptionLeg),
      parCoupon: round(100 * (1 - dfLast) / sumDf),
      answer: round(couponLeg + redemptionLeg - 100),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A bond pays an annual coupon of ${fmtNum(p.couponPct)} percent on a face of 100 and returns the face with its last coupon, ${fmtNum(p.n)} years from now. ` +
    `A dealer quotes zero-coupon bonds paying one dollar: ${fmtNum(p.df1)} for one year out, ${fmtNum(d.df2)} for two years${p.n === 3 ? `, and ${fmtNum(d.df3)} for three years` : ""}. ` +
    `By how many dollars per 100 of face does the bond trade above or below par? Give a negative number if below.`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A coupon bond is a strip of zeros", body: `Each coupon is a dollar amount due on a date the dealer already prices, and so is the redemption: $P=c\\,A+100\\,\\text{DF}_n$, with $A$ the sum of the zeros — what a dollar a year for the life of the bond costs today — and the last zero pricing the face. Par is where that comes to exactly the face.` },
    { title: "Price the coupons", body: `A dollar a year costs $${fmtNum(p.df1)}+${fmtNum(d.df2)}${p.n === 3 ? `+${fmtNum(d.df3)}` : ""}=${fmtNum(d.sumDf)}$, so the ${fmtNum(p.couponPct)}-dollar coupons are worth $${fmtNum(p.couponPct)}\\times${fmtNum(d.sumDf)}=${fmtNum(d.couponLeg)}$.` },
    { title: "Price the redemption", body: `The face comes back with the last coupon: $100\\times${fmtNum(d.dfLast)}=${fmtNum(d.redemptionLeg)}$ today.` },
    { title: "The bond's price", body: `$${fmtNum(d.couponLeg)}+${fmtNum(d.redemptionLeg)}=${fmtNum(d.price)}$ per 100 of face.` },
    { title: "Answer", body: `Against par, $${fmtNum(d.couponLeg)}+${fmtNum(d.redemptionLeg)}-100=${fmtNum(d.answer)}$ — the bond trades ${d.answer > 0 ? "above" : "below"} par by ${fmtNum(Math.abs(d.answer))} per 100.` },
    { title: "Sanity check", body: `The sign is the coupon against the curve. A bond priced at par on these zeros would need a coupon of about ${fmtNum(d.parCoupon)} — the shortfall of the last zero spread over the annuity — and this one pays ${fmtNum(p.couponPct)}, so it ${d.answer > 0 ? "out-earns the curve and trades at a premium" : "under-earns the curve and trades at a discount"}. The premium is the present value of that difference in coupons.` },
  ],
  keyInsight: "A coupon bond is a strip of zeros: each coupon is priced by the zero maturing when it is paid, and the redemption by the last one. It trades above par when its coupon exceeds what the curve would pay a new issue, and below when it falls short — the premium is the present value of that difference.",
  commonTrap: "Discounting every cash flow with the one-year zero, or forgetting that the face comes back with the final coupon. The other slip is reporting the price when the question asks for its distance from par.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [100],
};
