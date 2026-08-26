import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const bootstrapTwoYearZero: ProblemTemplate = {
  id: "finance/bootstrap-two-year-zero",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "bootstrapping the two-year zero from a one-year discount factor and a two-year par coupon" },
  params: {
    df1: { range: { min: 0.88, max: 0.99, step: 0.0025 } },
    c: { choices: [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const firstCoupon = round(p.c * p.df1);
    const finalFlow = 100 + p.c;
    const df2 = round((100 - p.c * p.df1) / (100 + p.c));
    return {
      firstCoupon, finalFlow, df2,
      leftToDiscount: round(100 - p.c * p.df1),
      growth: round(Math.pow((100 + p.c) / (100 - p.c * p.df1), 0.5)),
      answer: round((Math.pow((100 + p.c) / (100 - p.c * p.df1), 0.5) - 1) * 100),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk can buy one-year money at a discount factor of ${fmtNum(p.df1)} per dollar. A two-year bond paying an annual coupon of ${fmtNum(p.c)} per 100 face trades exactly at par. ` +
    `What two-year zero rate does that pair imply, annually compounded?`,
  solution: (p, d) => [
    { title: "Trading at par pins the whole discounted stream", body: `A par price says the two cash flows are together worth exactly ${fmtNum(100)}: the coupon of ${fmtNum(p.c)} in a year, and ${fmtNum(d.finalFlow)} — the final coupon plus the face — in two. One discount factor is known, so the other is the only unknown in that equation.` },
    { title: "Take out the year you already know", body: `The first coupon is worth $${fmtNum(p.c)}\\times${fmtNum(p.df1)}=${fmtNum(d.firstCoupon)}$ today, leaving $100-${fmtNum(p.c)}\\times${fmtNum(p.df1)}=${fmtNum(d.leftToDiscount)}$ for the second date to account for.` },
    { title: "Solve for the two-year factor, then annualise it", body: `Dividing by the ${fmtNum(d.finalFlow)} that arrives gives a two-year discount factor of ${fmtNum(d.df2)}. Its reciprocal is two years of compounding, so one year's growth is the square root: $\\sqrt{\\dfrac{${fmtNum(d.finalFlow)}}{100-${fmtNum(p.c)}\\times${fmtNum(p.df1)}}}=${fmtNum(d.growth)}$, a rate of ${fmtNum(d.answer)}%.` },
    { title: "Answer", body: `The implied two-year zero rate is ${fmtNum(d.answer)}%.` },
    { title: "Sanity check", body: `The two-year factor of ${fmtNum(d.df2)} is below the one-year ${fmtNum(p.df1)}, as it must be while rates are positive — a dollar further away is worth less. Bootstrapping only ever works in this order: each new maturity is solved using the factors already built beneath it, which is why a gap anywhere in the curve stops everything past it.` },
  ],
  keyInsight: "A par quote is an equation, not a price: it says the discounted flows sum to face, which leaves exactly one unknown once the shorter factors are known. That is what makes a curve buildable at all — each maturity is solved from the ones below it, in order, and never independently.",
  commonTrap: "Reading the par coupon as the two-year zero rate. They coincide only on a flat curve, because the par coupon is an average over both dates while the zero rate belongs to the far one alone. The other slip is annualising by halving the two-year growth instead of taking its square root, which ignores compounding within the estimate.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [100, 1],
};
