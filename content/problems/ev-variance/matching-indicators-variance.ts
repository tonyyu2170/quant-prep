import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the party cannot be
// larger than the room, and one diner alone has no pair to correlate with) and never asks the
// answer, so a helper would be a second copy of the variance formula for nothing. Constraint
// 2's floor cannot bind — every draw carries at least two diners paid at least two dollars.
// The variance of a matching count, where the indicators are NOT independent. Every chain is
// an integer over an integer: the individual spread, the covariance and the total all sit over
// the common denominator that the room size and the room size less one supply, so nothing
// printed is ever fed back in as an operand. The Sanity check rebuilds the same variance from
// the mean of the squares — a different route to the same number — and then holds it against
// what independence alone would have given.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const matchingIndicatorsVariance: ProblemTemplate = {
  id: "ev-variance/matching-indicators-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the matching (hat-check) problem, taken past its mean to the spread of the match count" },
  params: {
    diners: { range: { min: 3, max: 8, step: 1 } },
    party: { range: { min: 2, max: 8, step: 1 } },
    rate: { range: { min: 2, max: 12, step: 1 } },
  },
  // The party sits inside the room. Its lower end is two rather than one because a single
  // diner has nobody to be correlated with, and the whole point of the problem is the pair
  // term; the enumeration in the Python counterpart also fixes the ceiling at eight diners.
  constraint: (p) => p.party <= p.diners,
  derived: (p) => {
    const pairs = p.party * (p.party - 1);
    const numer = p.party * (p.diners - 1) * (p.diners - 1) + pairs;
    const denom = p.diners * p.diners * (p.diners - 1);
    const varCount = numer / denom;
    const indepCount = (p.party * (p.diners - 1)) / (p.diners * p.diners);
    return {
      pairs,
      numer,
      denom,
      pSelf: 1 / p.diners,
      pNext: 1 / (p.diners - 1),
      oneVar: (p.diners - 1) / (p.diners * p.diners),
      pBoth: 1 / (p.diners * (p.diners - 1)),
      cov: 1 / (p.diners * p.diners * (p.diners - 1)),
      varCount,
      indepPay: p.rate * p.rate * indepCount,
      varPay: p.rate * p.rate * varCount,
    };
  },
  statement: (p) =>
    `A caterer prepares ${fmtNum(p.diners)} personalised meals for ${fmtNum(p.diners)} diners, one each. The runner loses the ` +
    `seating plan and delivers them in a completely random order, one meal to each diner. ${
      p.party === p.diners
        ? "Every one of them belongs to a single party"
        : `${fmtNum(p.party)} of the diners are a party seated together`
    }, and their host pays ${fmtNum(p.rate)} dollars for each member of the party who happens to receive ` +
    `their own meal. What is the variance of the party's total payment, in squared dollars?`,
  answerKey: "varPay",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One diner on their own", body: `Every meal is as likely to reach one diner as another, so any given diner receives their own with probability $\\frac{1}{${fmtNum(p.diners)}}=${fmtNum(d.pSelf)}$. That is a yes-or-no outcome, and the spread of a yes-or-no outcome, written $\\sigma^2$, is the product of its two chances: $\\frac{${fmtNum(p.diners)}-1}{${fmtNum(p.diners)}\\times${fmtNum(p.diners)}}=${fmtNum(d.oneVar)}$.` },
    // The covariance is printed as the difference of two exact fractions rather than of two
    // rounded decimals: at eight diners those two chances round to 0.01786 and 0.01563, and
    // differencing the printed decimals misses the printed covariance.
    { title: "The deliveries pull on one another", body: `These outcomes are not independent. Once one diner has their own meal, the rest are shuffled among the rest, so the next diner's chance rises to $\\frac{1}{${fmtNum(p.diners)}-1}=${fmtNum(d.pNext)}$. Two named diners therefore both come good with probability $\\frac{1}{${fmtNum(p.diners)}\\times(${fmtNum(p.diners)}-1)}=${fmtNum(d.pBoth)}$, which is more than the product of their separate chances; the excess is their covariance, $\\frac{1}{${fmtNum(p.diners)}\\times(${fmtNum(p.diners)}-1)}-\\frac{1}{${fmtNum(p.diners)}\\times${fmtNum(p.diners)}}=\\frac{1}{${fmtNum(p.diners)}\\times${fmtNum(p.diners)}\\times(${fmtNum(p.diners)}-1)}=${fmtNum(d.cov)}$.` },
    { title: "Add the spreads and the covariances", body: `The party's count of correct deliveries is ${fmtNum(p.party)} of these outcomes added up, so its spread is the ${fmtNum(p.party)} individual spreads plus one covariance for each of the $${fmtNum(p.party)}\\times(${fmtNum(p.party)}-1)=${fmtNum(d.pairs)}$ ordered pairs of distinct party members. Over the common denominator that gives $\\frac{${fmtNum(p.party)}\\times(${fmtNum(p.diners)}-1)\\times(${fmtNum(p.diners)}-1)+${fmtNum(d.pairs)}}{${fmtNum(p.diners)}\\times${fmtNum(p.diners)}\\times(${fmtNum(p.diners)}-1)}=${fmtNum(d.varCount)}$.` },
    { title: "Price the count", body: `The host pays ${fmtNum(p.rate)} dollars a match, and scaling a quantity scales its spread by the square of the multiplier, so the payment's variance is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.rate)}\\times${fmtNum(d.numer)}}{${fmtNum(d.denom)}}=${fmtNum(d.varPay)}$ squared dollars.` },
    { title: "Sanity check", body: `Rebuild the count's spread the other way, as the average of its square less the square of its average. Over the same denominator that reads $\\frac{${fmtNum(p.party)}\\times${fmtNum(p.diners)}\\times(${fmtNum(p.diners)}-1)+${fmtNum(d.pairs)}\\times${fmtNum(p.diners)}-${fmtNum(p.party)}\\times${fmtNum(p.party)}\\times(${fmtNum(p.diners)}-1)}{${fmtNum(d.denom)}}=${fmtNum(d.varCount)}$, matching. And the answer had to land above what independence would have given, since the covariances all pull the same way: dropping every one of them leaves only $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.rate)}\\times${fmtNum(p.party)}\\times(${fmtNum(p.diners)}-1)}{${fmtNum(p.diners)}\\times${fmtNum(p.diners)}}=${fmtNum(d.indepPay)}<${fmtNum(d.varPay)}$ squared dollars.` },
  ],
  keyInsight: "Indicators add for the mean whether or not they interfere with one another, and that licence does not carry over to the spread. Here they interfere: one diner receiving their own meal leaves a smaller pile in which the remaining diners are likelier to find theirs, so the outcomes move together and a covariance term rides on top of every pair. The count is more variable than a row of independent coin flips would be, and the number of pairs, not the number of diners, is what governs how much more.",
  commonTrap: "Adding up the individual spreads and stopping there, as though the deliveries were independent coin flips. The covariance terms are the entire difference between the two answers, and leaving them out understates the spread on every draw — the mean never needed independence, so it is easy to assume the variance does not either.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  // 1 is the offset in the room-size-less-one denominators and the numerator of every chance
  // printed here; 2 is the exponent in the sigma-squared notation.
  constants: [1, 2],
};
