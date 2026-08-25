import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The par coupon is a ratio — the shortfall on the last dollar over the annuity factor — and
// its final division is the one step allowed to round. Everything before it is exact: a
// two-decimal zero subtracted from one, a whole face times that, a sum of two-decimal zeros.
// Asked in DOLLARS rather than as a rate so the answer space spreads (114 distinct, against a
// Macaulay-duration design that collapsed to 3); `constraint` keeps the longest zero above 0.7
// so the curve stays a curve.
export const parCouponFromZeros: ProblemTemplate = {
  id: "finance/par-coupon-from-zeros",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "millennium", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the coupon that prices a bond at par off a zero curve — the swap-rate formula" },
  params: {
    face: { choices: [100, 1000] },
    df1: { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop: { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n: { choices: [2, 3, 4] },
  },
  constraint: (p) => p.df1 - (p.n - 1) * p.drop >= 0.7,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const dfs = Array.from({ length: p.n }, (_, i) => round(p.df1 - i * p.drop));
    const sumDf = round(dfs.reduce((a, b) => a + b, 0));
    const dfLast = dfs[p.n - 1];
    const oneMinus = round(1 - dfLast);
    return {
      df2: dfs[1],
      df3: p.n >= 3 ? dfs[2] : round(p.df1 - 2 * p.drop),
      df4: p.n >= 4 ? dfs[3] : round(p.df1 - 3 * p.drop),
      dfLast,
      sumDf,
      oneMinus,
      shortfall: round(p.face * oneMinus),
      redemption: round(p.face * dfLast),
      ratePct: round(100 * oneMinus / sumDf),
      answer: round(p.face * oneMinus / sumDf),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) => {
    const quotes = [`${fmtNum(p.df1)} for one year out`, `${fmtNum(d.df2)} for two years`, ...(p.n >= 3 ? [`${fmtNum(d.df3)} for three years`] : []), ...(p.n >= 4 ? [`${fmtNum(d.df4)} for four years`] : [])];
    return `A dealer quotes zero-coupon bonds paying one dollar: ${quotes.slice(0, -1).join(", ")}, and ${quotes[quotes.length - 1]}. ` +
      `A ${fmtNum(p.n)}-year bond on a face of ${fmtNum(p.face)} pays one coupon a year and returns the face with the last coupon. ` +
      `What annual coupon, in dollars, would make this bond trade exactly at par?`;
  },
  solution: (p, d) => {
    const dfTerms = [fmtNum(p.df1), fmtNum(d.df2), ...(p.n >= 3 ? [fmtNum(d.df3)] : []), ...(p.n >= 4 ? [fmtNum(d.df4)] : [])].join("+");
    return [
      // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
      { title: "Set the price equal to the face", body: `Price the bond as a strip of zeros: $c\\,A+F\\,\\text{DF}_n=P$, with $A$ the sum of the zeros and the last zero pricing the redemption. Par means $P=F$, so $c\\,A=F(1-\\text{DF}_n)$ and $c=\\dfrac{F(1-\\text{DF}_n)}{A}$: over the life of the bond the coupons must make up exactly what the redemption falls short of the face today.` },
      { title: "The annuity factor", body: `A dollar a year for ${fmtNum(p.n)} years costs $${dfTerms}=${fmtNum(d.sumDf)}$ today.` },
      { title: "What the redemption falls short", body: `The last zero prices the face at $1-${fmtNum(d.dfLast)}=${fmtNum(d.oneMinus)}$ below par per dollar, so the redemption falls $${fmtNum(p.face)}\\times${fmtNum(d.oneMinus)}=${fmtNum(d.shortfall)}$ short of the face today.` },
      { title: "Answer", body: `The coupon that fills the gap: $\\dfrac{${fmtNum(d.shortfall)}}{${fmtNum(d.sumDf)}}=${fmtNum(d.answer)}$ dollars a year — as a rate, $\\dfrac{100\\times${fmtNum(d.oneMinus)}}{${fmtNum(d.sumDf)}}=${fmtNum(d.ratePct)}$ percent of face.` },
      { title: "Sanity check", body: `Price the bond with that coupon and it comes back to the face: the coupons are worth exactly the shortfall, ${fmtNum(d.shortfall)}, and the redemption is worth $${fmtNum(p.face)}\\times${fmtNum(d.dfLast)}=${fmtNum(d.redemption)}$, and $${fmtNum(d.shortfall)}+${fmtNum(d.redemption)}=${fmtNum(p.face)}$. A coupon above ${fmtNum(d.answer)} would put the bond above par, one below it at a discount.` },
    ];
  },
  keyInsight: "A bond trades at par when its coupons, priced off the curve, exactly fill the gap between the face and what the redemption is worth today. That makes the par coupon a ratio — the shortfall on the final dollar over the price of a dollar a year — which is the swap-rate formula, and the yield a new issue must carry to sell at face.",
  commonTrap: "Reading the par coupon off the last zero alone as if it were a yield, or dividing the shortfall by the number of years instead of by the sum of the zeros. Each coupon is discounted by its own zero, and the annuity factor is what does that.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
