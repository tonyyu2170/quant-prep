import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const convexityAdjustedPriceChange: ProblemTemplate = {
  id: "finance/convexity-adjusted-price-change",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 3,
  firms: [{ firm: "millennium", weight: 0.2 }, { firm: "citadel", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the second-order term in a bond's price response to a large yield move" },
  params: {
    modDur: { choices: [3, 4, 5, 6, 7, 8, 9, 10] },
    convex: { choices: [20, 30, 40, 50, 60, 80, 100, 120] },
    bp: { choices: [75, 100, 125, 150, 200, 250, 300] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const dy = round(p.bp / 10000);
    const durationDrop = round(p.modDur * (p.bp / 10000) * 100);
    const convexityGain = round(0.5 * p.convex * (p.bp / 10000) * (p.bp / 10000) * 100);
    return {
      dy, durationDrop, convexityGain,
      answer: round(convexityGain - durationDrop),
      share: round((convexityGain / durationDrop) * 100),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A bond has a modified duration of ${fmtNum(p.modDur)} and a convexity of ${fmtNum(p.convex)}. Yields sell off by ${fmtNum(p.bp)} basis points. ` +
    `Including the convexity term, what is the percentage change in the bond's price?`,
  solution: (p, d) => [
    { title: "Duration is only the first term", body: `Price against yield is a curve, and duration is its slope at today's yield. A slope predicts well for a small move and progressively worse for a large one, because the curve bends away from its own tangent — always in the holder's favour for an ordinary bond.` },
    { title: "The straight-line loss", body: `The move is $\\dfrac{${fmtNum(p.bp)}}{10000}=${fmtNum(d.dy)}$ in yield, so the duration term predicts a fall of $${fmtNum(p.modDur)}\\times${fmtNum(d.dy)}\\times100=${fmtNum(d.durationDrop)}$%.` },
    { title: "The curvature gives some back", body: `The second-order term is half the convexity times the SQUARE of the move: $0.5\\times${fmtNum(p.convex)}\\times${fmtNum(d.dy)}\\times${fmtNum(d.dy)}\\times100=${fmtNum(d.convexityGain)}$%. Squaring is why it is negligible on a small move and material on this one — and why it is a gain whichever way yields go.` },
    { title: "Answer", body: `Net, the price changes by ${fmtNum(d.answer)}% — a fall of ${fmtNum(d.durationDrop)}% less the ${fmtNum(d.convexityGain)}% the curvature returns.` },
    { title: "Sanity check", body: `The convexity term recovers ${fmtNum(d.share)}% of what duration predicted, so a duration-only desk would have overstated this loss. Convexity is worth paying for precisely because it works in both directions: the same term would ADD to a rally's gain, which is why two bonds of equal duration are not the same asset.` },
  ],
  keyInsight: "Duration is the first term of an expansion and convexity the second, so the correction grows with the SQUARE of the yield move — irrelevant at a basis point and decisive at a hundred. Because the term is squared it is signed the same way for a rally and a sell-off, which makes convexity an asset rather than a directional bet.",
  commonTrap: "Stopping at the duration term on a move large enough for curvature to matter, which overstates a loss and understates a gain. The other slip is dropping the half in front of the convexity term, or applying the yield change unsquared, either of which leaves the correction far too large — and unlike the first mistake, too large in a direction that flatters the position.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [10000, 100, 0.5],
};
