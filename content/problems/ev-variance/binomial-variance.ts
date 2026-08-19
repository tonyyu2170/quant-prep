import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (even odds are
// excluded, because at even odds the count sits exactly ON the ceiling the Sanity check
// compares it against) and never asks the answer, so a helper would be a second copy of the
// variance formula for nothing. Constraint 2's floor cannot bind — the thinnest legal spread
// measures 0.475.
// The variance of a count of independent yes/no trials, built from one trial's spread and
// multiplied up rather than quoted as a formula. Percentages are integers over a hundred
// throughout, so every chain has exact operands; the mean lands on at most four significant
// figures by construction, which is what lets the Sanity check use it as an operand.
export const binomialVariance: ProblemTemplate = {
  id: "ev-variance/binomial-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "the spread of a binomial count, assembled from one trial's spread rather than recalled as npq" },
  params: {
    trials: { range: { min: 10, max: 30, step: 1 } },
    winPct: { range: { min: 5, max: 95, step: 5 } },
  },
  // Even odds are excluded: there the count sits exactly on the ceiling the Sanity check
  // compares it against, and "strictly below" would be false on those draws.
  constraint: (p) => p.winPct !== 50,
  derived: (p) => ({
    lossPct: 100 - p.winPct,
    mean: (p.trials * p.winPct) / 100,
    oneVar: (p.winPct * (100 - p.winPct)) / 10000,
    capVar: p.trials / 4,
    varCount: (p.trials * p.winPct * (100 - p.winPct)) / 10000,
  }),
  statement: (p) =>
    `A trading desk quotes on ${fmtNum(p.trials)} auctions in a day. Each auction is won with probability ` +
    `${fmtNum(p.winPct)} percent, independently of every other. What is the variance of the number of auctions ` +
    `the desk wins in a day?`,
  answerKey: "varCount",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Take one auction on its own", body: `A single auction adds either one to the day's count or nothing, so its two outcomes lie exactly one apart. Squaring that gap and weighting it by how often each side arrives leaves its spread, written $\\sigma^2$, as nothing more than the product of the two chances: $\\frac{${fmtNum(p.winPct)}\\times${fmtNum(d.lossPct)}}{100\\times100}=${fmtNum(d.oneVar)}$.` },
    // Percentages stay as integers over a hundred so every chain prints exactly; neither the
    // per-auction spread nor the mean is ever fed back in as an operand. Reading the variance
    // as mean times the loss chance was tried and dropped: at 19 trials on 45 percent that
    // chain computes 4.7025, a four-significant-figure tie the float lands one ulp above, so
    // the page would print 4.703 against an answer of 4.702.
    { title: "Independence adds the spreads", body: `Variances add across independent pieces — the auctions cannot amplify or damp one another — so the day's count carries ${fmtNum(p.trials)} copies of that spread: $\\frac{${fmtNum(p.trials)}\\times${fmtNum(p.winPct)}\\times${fmtNum(d.lossPct)}}{100\\times100}=${fmtNum(d.varCount)}$.` },
    { title: "Sanity check", body: `Read the same day another way, then hold it against a ceiling. The count of auctions LOST is the count won taken away from a fixed total, and subtracting from a constant flips a quantity without stretching it, so the losses must carry the identical spread — and swapping the two percentages, $\\frac{${fmtNum(p.trials)}\\times${fmtNum(d.lossPct)}\\times${fmtNum(p.winPct)}}{100\\times100}=${fmtNum(d.varCount)}$, is the same figure. Keep the day's average count beside it as the figure this is not: the desk wins $\\frac{${fmtNum(p.trials)}\\times${fmtNum(p.winPct)}}{100}=${fmtNum(d.mean)}$ auctions on a typical day, which is where the count sits rather than how far it strays. Finally the ceiling: no count of ${fmtNum(p.trials)} yes-or-no outcomes can be more spread out than $\\frac{${fmtNum(p.trials)}}{4}=${fmtNum(d.capVar)}$, which even odds would reach, and this one comes in under it.` },
  ],
  keyInsight: "The spread of a count of independent trials is built one trial at a time: a single yes-or-no outcome has a variance that is just the product of its two chances, and independence lets those spreads be added rather than combined in any subtler way. Because that product is symmetric, a lopsided chance and its mirror image carry exactly the same risk, and the spread peaks at even odds.",
  commonTrap: "Reporting the expected count instead of its spread — the trials times the win chance, stopping there. That is where the count centres, not how far it wanders, and the two are different numbers on every draw.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  // 2 is the exponent in the sigma-squared notation, 4 the divisor in the even-odds ceiling,
  // 100 the percentage denominator.
  constants: [2, 4, 100],
};
