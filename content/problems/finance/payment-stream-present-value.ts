import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The curve is quoted as four zero-coupon bond prices and the contract pays for the first
// three or four of them. Two design notes, both forced by measurement rather than taste:
//
// The principal repayment of a real coupon bond is deliberately NOT part of the answer. A
// bond's price sits within a few percent of par whatever the curve does, and an answer space
// that narrow collapses under the draw-space merge rule — priced in full it scores 3 distinct
// answers against a floor of 12, where the payment stream alone scores 56. The technique is
// the same one, and the last solution step names the leg that would make it a bond.
//
// `drop` steps in whole cents for the same reason. On a half-cent grid the clusters one
// payment size apart overlap and the count falls to 9; the count is carried by the payment
// size and by the three-or-four-year term, not by the curve's fine structure.
export const paymentStreamPresentValue: ProblemTemplate = {
  id: "finance/payment-stream-present-value",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "millennium", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "present value of a level payment stream off quoted zero-coupon bond prices" },
  params: {
    pmt: { range: { min: 2, max: 14, step: 1 } },
    df1: { range: { min: 0.94, max: 0.99, step: 0.01 } },
    drop: { choices: [0.01, 0.02, 0.03] },
    n: { choices: [3, 4] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const df2 = round(p.df1 - p.drop);
    const df3 = round(p.df1 - 2 * p.drop);
    const df4 = round(p.df1 - 3 * p.drop);
    const sumUsed = round(p.n === 3 ? p.df1 + df2 + df3 : p.df1 + df2 + df3 + df4);
    const answer = round(p.pmt * sumUsed);
    const nominal = round(p.pmt * p.n);
    return { df2, df3, df4, sumUsed, nominal, timeCost: round(nominal - answer), answer };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A dealer quotes the price of a bond paying one dollar on a single future date: ${fmtNum(p.df1)} for one year out, ${fmtNum(d.df2)} for two years, ${fmtNum(d.df3)} for three years, and ${fmtNum(d.df4)} for four years. ` +
    `A service contract pays you ${fmtNum(p.pmt)} at the end of each of the next ${fmtNum(p.n)} years and nothing after that. What is the contract worth today?`,
  solution: (p, d) => {
    const used = [p.df1, d.df2, d.df3, d.df4].slice(0, p.n).map(fmtNum).join("+");
    return [
      { title: "Price each payment with its own bond", body: `A dollar due at a given date is worth that date's bond price today, whatever else is being paid on other dates, so a stream is priced leg by leg and added: $PV=C\\,\\text{DF}_1+C\\,\\text{DF}_2+\\cdots+C\\,\\text{DF}_n$. No single interest rate appears anywhere in that — the quoted prices already are the curve.` },
      { title: "Add the factors the contract actually uses", body: `Payments land on the first ${fmtNum(p.n)} dates only, so the bond prices that matter sum to $${used}=${fmtNum(d.sumUsed)}$. The later quote is real but nothing is paid on it.` },
      { title: "Answer", body: `Every date pays the same ${fmtNum(p.pmt)}, so the payment comes straight out of the sum: $${fmtNum(p.pmt)}\\times${fmtNum(d.sumUsed)}=${fmtNum(d.answer)}$.` },
      { title: "What the waiting costs", body: `Undiscounted, the contract hands over $${fmtNum(p.pmt)}\\times${fmtNum(p.n)}=${fmtNum(d.nominal)}$ in total. The gap, $${fmtNum(d.nominal)}-${fmtNum(d.answer)}=${fmtNum(d.timeCost)}$, is what the delay costs — and it grows with the term, which is why the last payment is discounted hardest.` },
      { title: "Sanity check", body: `Every bond price quoted is below one, so the present value has to come in under the ${fmtNum(d.nominal)} of nominal payments, and it does. Add a repayment of principal on the final date and this same sum becomes a coupon bond's price: the coupons are exactly this stream, and the principal is one more leg priced off the same quote.` },
    ];
  },
  keyInsight: "A stream of cash flows is priced one date at a time against that date's own discount factor, then added. Quoted zero-coupon bond prices give the factors directly, so no yield has to be computed or assumed — and a coupon bond is nothing more than this stream plus one final principal leg.",
  commonTrap: "Discounting every payment at the first year's factor, or averaging the quotes and applying one number to all of them. Each date has its own price, and the curve slopes, so a level payment is worth progressively less the later it lands.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
