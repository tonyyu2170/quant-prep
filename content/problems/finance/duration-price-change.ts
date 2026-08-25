import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The dollar loss is face × price × duration × basis points once the powers of ten cancel, and
// `constraint` licenses that product as four-figure exact so the answer chain reconciles. The
// percentage change and the market value are exact on every draw (a duration of at most two
// figures times a basis-point count of at most three; a whole number of millions times a whole
// price); the per-100 fall is the one value allowed to round, as the last step of its chain.
export const durationPriceChange: ProblemTemplate = {
  id: "finance/duration-price-change",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 1,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "millennium", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the first-order price change of a bond position from its modified duration" },
  params: {
    price: { choices: [90, 92, 94, 95, 96, 98, 100, 102, 104, 105, 108, 110] },
    modDur: { choices: [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8, 10] },
    bp: { choices: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100] },
    faceM: { choices: [1, 2, 5, 10, 25] },
  },
  constraint: (p) => exact4(p.faceM * p.price * p.modDur * p.bp),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const perHundred = round(p.price * p.modDur * p.bp / 10000);
    return {
      dy: round(p.bp / 10000),
      face: p.faceM * 1e6,
      marketValue: round(p.faceM * 1e6 * p.price / 100),
      pctChange: round(p.modDur * p.bp / 100),
      perHundred,
      newPrice: round(p.price - perHundred),
      answer: round(p.faceM * p.price * p.modDur * p.bp),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `You hold ${fmtNum(d.face)} dollars face of a bond quoted at ${fmtNum(p.price)} per 100, with a modified duration of ${fmtNum(p.modDur)}. ` +
    `Yields rise by ${fmtNum(p.bp)} basis points. Approximately how much money does the position lose?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "What duration measures", body: `Modified duration is the price's sensitivity to yield, as a fraction of the price per unit of yield: $\\dfrac{dP}{P}=-D\\,dy$. A rise in yields is a fall in price, by the duration times the size of the move — a first-order rule, linear in both.` },
    { title: "The move in yield", body: `A basis point is a hundredth of a percent, so ${fmtNum(p.bp)} of them is ${fmtNum(d.dy)} in yield. As a percentage of price, the bond moves $${fmtNum(p.modDur)}\\times${fmtNum(p.bp)}/100=${fmtNum(d.pctChange)}$ percent.` },
    { title: "What the position is worth", body: `Quoted per 100 of face, the holding is worth $${fmtNum(d.face)}\\times${fmtNum(p.price)}/100=${fmtNum(d.marketValue)}$ dollars — the loss is a percentage of THAT, not of the face.` },
    { title: "Answer", body: `$${fmtNum(d.marketValue)}\\times${fmtNum(d.pctChange)}/100=${fmtNum(d.answer)}$ dollars lost, to first order.` },
    { title: "Sanity check", body: `Per 100 of face the bond drops $${fmtNum(p.price)}\\times${fmtNum(p.modDur)}\\times${fmtNum(d.dy)}=${fmtNum(d.perHundred)}$ points, from ${fmtNum(p.price)} to about ${fmtNum(d.newPrice)}. Doubling the duration or doubling the move would double the loss: at this order the rule is linear, and the convexity that bends it is a second-order effect the desk quotes separately.` },
  ],
  keyInsight: "Modified duration turns a yield move into a price move: the percentage loss is the duration times the change in yield, and the dollar loss is that percentage of the market value, not of the face. It is a first-order rule, linear in the move and in the duration, and for the moves a desk quotes it is all the arithmetic needed.",
  commonTrap: "Applying the percentage to the face value instead of the market value, or mixing units — a basis point is a hundredth of a percent, and treating the move as whole percent overstates the loss a hundredfold. Both slips are off by factors a desk notices at once.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [100],
};
