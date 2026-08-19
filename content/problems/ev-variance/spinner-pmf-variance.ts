import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A three-row pmf read off a painted rim, run through the computational formula
// E[X squared] minus the square of the mean. Band widths are whole tens so the dial reads in
// exact tenths: that keeps the mean and the mean square printable to their last digit, which
// is what lets the final subtraction take them as operands without drifting.
// The Sanity check re-reaches the answer through the expected squared distance between two
// independent spins — a different identity, not a rearrangement of the same one.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
const bandsOk = (p: Params) => {
  const pctC = 100 - p.pctA - p.pctB;
  return pctC >= 20 && pctC <= 60;
};

export const spinnerPmfVariance: ProblemTemplate = {
  id: "ev-variance/spinner-pmf-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "original", inspiration: "variance straight from a three-row probability table, where the widest band drags the answer down" },
  params: {
    pctA: { range: { min: 20, max: 60, step: 10 } },
    pctB: { range: { min: 20, max: 60, step: 10 } },
    vA: { range: { min: 2, max: 15, step: 1 } },
    vB: { range: { min: 2, max: 15, step: 1 } },
    vC: { range: { min: 2, max: 15, step: 1 } },
  },
  // The third band takes whatever the first two leave, so it has to land inside the same
  // 20-to-60 window or the statement stops making sense. Distinct payouts are what keep the
  // answer off zero — three equal payouts have no spread at all, and constraint 2's floor
  // forbids an answer that cannot be graded; with them distinct the smallest legal variance
  // measured over the 32,760 legal draws is 0.4 and the largest 39.81.
  constraint: (p) => bandsOk(p) && p.vA !== p.vB && p.vA !== p.vC && p.vB !== p.vC,
  derived: (p) => {
    const pctC = 100 - p.pctA - p.pctB;
    const tA = p.pctA / 10, tB = p.pctB / 10, tC = pctC / 10;
    const mean = (tA * p.vA + tB * p.vB + tC * p.vC) / 10;
    const meanSq = (tA * p.vA * p.vA + tB * p.vB * p.vB + tC * p.vC * p.vC) / 10;
    return {
      pctC, tA, tB, tC, mean, meanSq,
      dAB: Math.abs(p.vA - p.vB),
      dAC: Math.abs(p.vA - p.vC),
      dBC: Math.abs(p.vB - p.vC),
      varPay: meanSq - mean * mean,
    };
  },
  statement: (p, d) =>
    `A carnival wheel's rim is painted in three bands: red covers ${fmtNum(p.pctA)} percent of the rim, blue covers ` +
    `${fmtNum(p.pctB)} percent, and green covers the remaining ${fmtNum(d.pctC)} percent. The pointer is equally likely to ` +
    `come to rest anywhere on the rim. Red pays ${fmtNum(p.vA)} dollars, blue pays ${fmtNum(p.vB)} dollars and green pays ` +
    `${fmtNum(p.vC)} dollars. What is the variance of the payout from one spin, in squared dollars?`,
  answerKey: "varPay",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Read the dial in tenths", body: `Every band is a whole ten percent of the rim, so the wheel is really ten equal slices: red takes $\\frac{${fmtNum(p.pctA)}}{10}=${fmtNum(d.tA)}$ of them, blue $\\frac{${fmtNum(p.pctB)}}{10}=${fmtNum(d.tB)}$, and green $\\frac{${fmtNum(d.pctC)}}{10}=${fmtNum(d.tC)}$. Working in tenths keeps every figure below exact.` },
    // Both totals stay as integers over ten, so each prints to its last digit and can safely be
    // an operand in the subtraction that follows. Weighting the payouts into decimals first and
    // adding those would put an already-rounded number into the next step.
    { title: "Average the payout", body: `Weight each payout by its slices: $\\frac{${fmtNum(d.tA)}\\times${fmtNum(p.vA)}+${fmtNum(d.tB)}\\times${fmtNum(p.vB)}+${fmtNum(d.tC)}\\times${fmtNum(p.vC)}}{10}=${fmtNum(d.mean)}$ dollars on an average spin.` },
    { title: "Average the squared payout", body: `Variance — written $\\sigma^2$ — is the average of the squared payout less the square of the average payout, and those are two different things. Squaring first and averaging after gives $\\frac{${fmtNum(d.tA)}\\times${fmtNum(p.vA)}\\times${fmtNum(p.vA)}+${fmtNum(d.tB)}\\times${fmtNum(p.vB)}\\times${fmtNum(p.vB)}+${fmtNum(d.tC)}\\times${fmtNum(p.vC)}\\times${fmtNum(p.vC)}}{10}=${fmtNum(d.meanSq)}$.` },
    { title: "Subtract", body: `The gap between those two is the variance: $${fmtNum(d.meanSq)}-${fmtNum(d.mean)}\\times${fmtNum(d.mean)}=${fmtNum(d.varPay)}$ squared dollars.` },
    { title: "Sanity check", body: `Reach it by a different identity. Spin the wheel twice, independently: the expected squared distance between the two results comes to exactly twice the variance. That total is easy to assemble directly, because only the spins that land on different bands contribute anything, and each pair of bands can be taken once. Red with blue are ${fmtNum(d.dAB)} apart, red with green ${fmtNum(d.dAC)}, blue with green ${fmtNum(d.dBC)}, so the variance is $\\frac{${fmtNum(d.tA)}\\times${fmtNum(d.tB)}\\times${fmtNum(d.dAB)}\\times${fmtNum(d.dAB)}+${fmtNum(d.tA)}\\times${fmtNum(d.tC)}\\times${fmtNum(d.dAC)}\\times${fmtNum(d.dAC)}+${fmtNum(d.tB)}\\times${fmtNum(d.tC)}\\times${fmtNum(d.dBC)}\\times${fmtNum(d.dBC)}}{10\\times10}=${fmtNum(d.varPay)}$, the same figure and not a rearrangement of the same sum.` },
  ],
  keyInsight: "Averaging the squares is not the same as squaring the average, and the whole variance is exactly the gap between those two totals — a gap that can never be negative, and that closes to nothing only when every outcome pays the same. That is what lets a table of payouts be turned into a spread from two weighted sums and nothing else, with no distance from the mean ever measured.",
  commonTrap: "Squaring the average payout and calling that the average squared payout, so the two figures cancel and the spread collapses. They differ by exactly the variance, which is the quantity being asked for, so treating them as interchangeable answers zero to every version of this question.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  // 10 is the tenths denominator the whole solution runs on; 2 is the exponent in the
  // sigma-squared notation, a bare digit the audit can trace to nothing else.
  constants: [2, 10],
};
