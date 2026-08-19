import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the die's prize has
// to come out a whole number of dollars, and its winning faces have to be few enough that it
// really is the riskier game) and never asks the spread, so a helper would be a second copy of
// the answer formula for nothing. Constraint 2's floor cannot bind — the narrowest legal
// spread measures 3.464.
// Two games matched on expected payout and not on risk. The die's prize is chosen so both
// games pay the same on average, which the first step verifies rather than asserts. Every
// operand is a whole number of dollars — the prize is an integer by construction — so the
// squared-payout chain, the subtraction and the root all run on exact operands.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const equalEvSdComparison: ProblemTemplate = {
  id: "ev-variance/equal-ev-sd-comparison",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "jane-street", weight: 0.3 }],
  source: { kind: "original", inspiration: "two bets with identical expected payouts and very different risk" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    m: { range: { min: 2, max: 20, step: 1 } },  // the expected payout both games share
    k: { range: { min: 1, max: 3, step: 1 } },   // winning faces on the die
  },
  // The prize has to divide out to a whole number of dollars, and the die's winning faces have
  // to be fewer than half of it — at exactly half the two games carry the same spread and the
  // question has no answer, and above half the coin is the riskier one.
  constraint: (p) => p.faces > 2 * p.k && (p.faces * p.m) % p.k === 0,
  derived: (p) => {
    const prize = (p.faces * p.m) / p.k;
    const varCoin = p.m * p.m;
    const meanSqDie = (p.k * prize * prize) / p.faces;
    return {
      prize,
      coinPay: 2 * p.m,
      varCoin,
      meanSqDie,
      blankFaces: p.faces - p.k,
      varDie: meanSqDie - varCoin,
      sdDie: Math.sqrt(meanSqDie - varCoin),
    };
  },
  statement: (p, d) =>
    `Two games are on offer and they pay the same amount on average. Game A is a fair coin: heads pays ` +
    `${fmtNum(d.coinPay)} dollars and tails pays nothing. Game B is a fair die with ${fmtNum(p.faces)} faces, on which ` +
    `${p.k === 1 ? "a single face pays" : `${fmtNum(p.k)} of the faces pay`} ${fmtNum(d.prize)} dollars and the rest ` +
    `pay nothing. Taking risk to mean the standard deviation of the payout, what is the standard deviation of the ` +
    `riskier game's payout, in dollars?`,
  answerKey: "sdDie",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Check the two really do match on average", body: `The coin pays its ${fmtNum(d.coinPay)} dollars half the time, averaging $\\frac{${fmtNum(d.coinPay)}}{2}=${fmtNum(p.m)}$ dollars. The die pays its prize on ${
      p.k === 1 ? "one face" : `${fmtNum(p.k)} faces`
    } out of ${fmtNum(p.faces)}, averaging $\\frac{${fmtNum(p.k)}\\times${fmtNum(d.prize)}}{${fmtNum(p.faces)}}=${fmtNum(p.m)}$ dollars. Identical, so the mean cannot separate them and only the spread can.` },
    // Every operand below is a whole number of dollars — the prize is an integer by
    // construction — so the squared-payout average, the subtraction and the root are all exact.
    { title: "Spread of the coin", body: `Both of the coin's payouts sit exactly ${fmtNum(p.m)} dollars from the mean, one above and one below, so every outcome contributes the same squared distance and the variance is $${fmtNum(p.m)}\\times${fmtNum(p.m)}=${fmtNum(d.varCoin)}$ squared dollars. Its standard deviation is therefore ${fmtNum(p.m)} dollars.` },
    { title: "Spread of the die", body: `The die's squared payout averages $\\frac{${fmtNum(p.k)}\\times${fmtNum(d.prize)}\\times${fmtNum(d.prize)}}{${fmtNum(p.faces)}}=${fmtNum(d.meanSqDie)}$, and taking off the square of the mean leaves a variance of $${fmtNum(d.meanSqDie)}-${fmtNum(d.varCoin)}=${fmtNum(d.varDie)}$ squared dollars. Back in dollars that is $\\sqrt{${fmtNum(d.varDie)}}=${fmtNum(d.sdDie)}$.` },
    { title: "Sanity check", body: `Rebuild the die's variance straight from the definition instead — each outcome's distance from the mean, squared and weighted by the faces it happens on: $\\frac{${fmtNum(p.k)}\\times(${fmtNum(d.prize)}-${fmtNum(p.m)})\\times(${fmtNum(d.prize)}-${fmtNum(p.m)})+${fmtNum(d.blankFaces)}\\times${fmtNum(p.m)}\\times${fmtNum(p.m)}}{${fmtNum(p.faces)}}=${fmtNum(d.varDie)}$ squared dollars, matching. And the die had to come out the riskier of the two: it clears the coin's ${fmtNum(p.m)} dollars of spread, because the same average payout is concentrated on fewer faces and every outcome therefore sits further from the mean.` },
  ],
  keyInsight: "Two bets with the same expected payout can carry completely different risk, because the mean is blind to how the payout is spread across outcomes. Concentrating the same average onto fewer, larger payoffs pushes every outcome further from the mean, and the variance — which weights those distances squared — grows accordingly.",
  commonTrap: "Reading the two games as interchangeable because their expected payouts agree, and then answering with the coin's spread or with the shared expected payout itself. Neither is the figure asked for, and the concentrated game's spread is strictly the larger of the two.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  // 2 is the coin's two equally likely sides, halving its payout to the mean.
  constants: [2],
};
