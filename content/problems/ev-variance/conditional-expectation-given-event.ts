import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the threshold has to
// sit inside the dice and leave more than one face above it) and never asks the answer, so a
// helper would be a second copy of the expectation for nothing. Constraint 2's floor cannot
// bind — enumerated over the legal space |answer| runs [10.4, 472.4].
// An expectation re-taken over the outcomes a piece of news leaves standing. Everything is
// counted in whole combinations and whole points, so every chain divides an integer by an
// integer and no printed decimal is ever fed back in as an operand. The Sanity check puts the
// ruled-out combinations back and recovers the untouched average, which is a reconciliation
// the answer's own numerator cannot fake.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const conditionalExpectationGivenEvent: ProblemTemplate = {
  id: "ev-variance/conditional-expectation-given-event",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "an expectation re-taken over only the outcomes a piece of news leaves standing" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    k: { range: { min: 2, max: 19, step: 1 } }, // the threshold the news reports
    rate: { range: { min: 2, max: 16, step: 1 } },
  },
  // The threshold has to sit inside the dice and leave more than one face clearing it: at the
  // top face the news would name a single combination per die, and above it the news could not
  // be true at all.
  constraint: (p) => p.k <= p.faces - 1,
  derived: (p) => {
    const lowFaces = p.k - 1;
    const pairs = p.faces * p.faces;
    const lowPairs = lowFaces * lowFaces;
    const totalAll = pairs * (p.faces + 1);
    const totalLow = lowPairs * p.k;
    const goodPairs = pairs - lowPairs;
    const totalGood = totalAll - totalLow;
    return {
      lowFaces,
      pairs,
      lowPairs,
      goodPairs,
      totalAll,
      totalLow,
      totalGood,
      plainPoints: p.faces + 1,
      meanGiven: totalGood / goodPairs,
      evPlain: p.rate * (p.faces + 1),
      ev: (p.rate * totalGood) / goodPairs,
    };
  },
  statement: (p) =>
    `Two fair dice, each with ${fmtNum(p.faces)} faces numbered 1 up to ${fmtNum(p.faces)}, are rolled behind a screen. ` +
    `You are told only that at least one of the two came up ${fmtNum(p.k)} or more. You are paid ${fmtNum(p.rate)} dollars ` +
    `for each point on the two dice combined. What is your expected payout, in dollars, given what you have been told?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    // At k = 2 the ruled-out set is the single double-one, and "1 x 1 = 1 of them" reads as a
    // mistake rather than as a count, so that draw names the combination instead.
    { title: "Throw out what the news forbids", body: `The pair lands on one of $${fmtNum(p.faces)}\\times${fmtNum(p.faces)}=${fmtNum(d.pairs)}$ equally likely combinations. What the news rules out is every combination in which both dice came in below ${fmtNum(p.k)} — ${
      d.lowPairs === 1
        ? "the single combination where both show a 1"
        : `$${fmtNum(d.lowFaces)}\\times${fmtNum(d.lowFaces)}=${fmtNum(d.lowPairs)}$ of them`
    } — leaving $${fmtNum(d.pairs)}-${fmtNum(d.lowPairs)}=${fmtNum(d.goodPairs)}$ combinations still in play, each still as likely as any other.` },
    // Both pooled totals are integers, so the division that follows has exact operands. Taking
    // the ruled-out group's average first and subtracting rounded decimals would drift.
    { title: "Pool the points", body: `Rather than average the survivors one by one, total the points across a whole group and divide at the end. Across all ${fmtNum(d.pairs)} combinations the two dice together carry $${fmtNum(d.pairs)}\\times(${fmtNum(p.faces)}+1)=${fmtNum(d.totalAll)}$ points, since a pair of untouched dice averages ${fmtNum(d.plainPoints)} points. The forbidden combinations run over the faces below ${fmtNum(p.k)} on both dice, averaging ${fmtNum(p.k)} points each, so they carry $${fmtNum(d.lowPairs)}\\times${fmtNum(p.k)}=${fmtNum(d.totalLow)}$ points of that.` },
    { title: "Re-average over the survivors", body: `Take the forbidden points off the pool and spread what is left over the combinations still in play: $\\frac{${fmtNum(d.totalAll)}-${fmtNum(d.totalLow)}}{${fmtNum(d.goodPairs)}}=${fmtNum(d.meanGiven)}$ points. At ${fmtNum(p.rate)} dollars a point that is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.totalGood)}}{${fmtNum(d.goodPairs)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Put the forbidden combinations back and the average has to fall to what two untouched dice give: $\\frac{${fmtNum(d.totalLow)}+${fmtNum(d.totalGood)}}{${fmtNum(d.pairs)}}=${fmtNum(d.plainPoints)}$ points, which it does. Since every combination the news removed was one of the low ones, the payout can only have moved up from the untouched figure of $${fmtNum(p.rate)}\\times(${fmtNum(p.faces)}+1)=${fmtNum(d.evPlain)}<${fmtNum(d.ev)}$ dollars.` },
  ],
  keyInsight: "News does not change what any single outcome pays; it changes which outcomes are still on the table. So the expectation is not adjusted, it is retaken — pool the outcomes the news leaves standing and average over those alone, giving each survivor the weight it had relative to the others rather than the weight it had in the original space.",
  commonTrap: "Averaging over the whole grid of rolls as though nothing had been said, or reading the news as a statement about one die and lifting that die's average while leaving the other untouched. The condition is a fact about the pair, and the only combinations it removes are the ones where both dice came in low.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  // 1 is the lowest face and the offset in the untouched pair's average.
  constants: [1],
};
