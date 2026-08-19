import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the drawer has to
// hold at least two sound cables, so that the count really can vary) and never asks the
// answer, so a helper would be a second copy of the variance for nothing. Constraint 2's floor
// cannot bind — enumerated over the legal space |answer| runs [0.1705, 0.9868].
// The spread of a count drawn without replacement. Every chain is one integer over another —
// the correction factor, the with-replacement figure and the answer all sit over the pool size
// squared times one less than the pool — so no rounded decimal is ever an operand. The Sanity
// check rebuilds the same variance from the pairwise term, which is where the negative pull
// between draws actually lives, and holds it against the with-replacement figure.
export const samplingWithoutReplacementVariance: ProblemTemplate = {
  id: "ev-variance/sampling-without-replacement-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "original", inspiration: "the hypergeometric spread, built from one draw's spread and the pull between draws rather than quoted with a correction factor" },
  params: {
    pool: { range: { min: 10, max: 20, step: 1 } },
    faulty: { range: { min: 2, max: 18, step: 1 } },
    draws: { range: { min: 2, max: 5, step: 1 } },
  },
  // At least two sound cables have to remain, so that the drawn count is genuinely uncertain
  // and the blanks can be named in the prose; the drawn handful is always smaller than the
  // drawer, since at most five are pulled from at least ten.
  constraint: (p) => p.faulty <= p.pool - 2,
  derived: (p) => {
    const sound = p.pool - p.faulty;
    const denom = p.pool * p.pool * (p.pool - 1);
    return {
      sound,
      denom,
      pairsDrawn: p.draws * (p.draws - 1),
      oneVar: (p.faulty * sound) / (p.pool * p.pool),
      fpc: (p.pool - p.draws) / (p.pool - 1),
      mean: (p.draws * p.faulty) / p.pool,
      withRepl: (p.draws * p.faulty * sound) / (p.pool * p.pool),
      varCount: (p.draws * p.faulty * sound * (p.pool - p.draws)) / denom,
    };
  },
  statement: (p) =>
    `A drawer holds ${fmtNum(p.pool)} cables, of which ${fmtNum(p.faulty)} are faulty and the rest are sound. You pull ` +
    `${fmtNum(p.draws)} of them out together, so no cable can be pulled twice. What is the variance of the number of faulty ` +
    `cables in your handful?`,
  answerKey: "varCount",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One cable at a time", body: `Whichever position you look at, the cable there is as likely as any other to be faulty, so it is faulty with probability ${fmtNum(p.faulty)} in ${fmtNum(p.pool)}. Taken on its own that is a yes-or-no outcome whose spread, written $\\sigma^2$, is the product of its two chances: $\\frac{${fmtNum(p.faulty)}\\times${fmtNum(d.sound)}}{${fmtNum(p.pool)}\\times${fmtNum(p.pool)}}=${fmtNum(d.oneVar)}$.` },
    { title: "What independent draws would give", body: `Had each cable been examined and thrown back, the ${fmtNum(p.draws)} draws would not interfere and their spreads would simply add, giving $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.faulty)}\\times${fmtNum(d.sound)}}{${fmtNum(p.pool)}\\times${fmtNum(p.pool)}}=${fmtNum(d.withRepl)}$.` },
    // The correction is applied to the integer numerator, never to the printed with-replacement
    // figure: at eleven cables the factor prints as 0.9 and the product of two roundings drifts
    // off the printed answer.
    { title: "Pulling them out together holds the count in", body: `They are not thrown back, so the draws pull against one another: a faulty cable taken out leaves fewer faulty ones for the next draw, which makes the count of faulty cables in the handful less able to run away from its average. What that costs is a single factor, $\\frac{${fmtNum(p.pool)}-${fmtNum(p.draws)}}{${fmtNum(p.pool)}-1}=${fmtNum(d.fpc)}$, and applying it gives $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.faulty)}\\times${fmtNum(d.sound)}\\times(${fmtNum(p.pool)}-${fmtNum(p.draws)})}{${fmtNum(p.pool)}\\times${fmtNum(p.pool)}\\times(${fmtNum(p.pool)}-1)}=${fmtNum(d.varCount)}$.` },
    { title: "Sanity check", body: `Rebuild it from where the pull actually lives, one term per ordered pair of draws. Two different draws carry a covariance that is negative — one faulty cable found means one fewer left to find — and adding ${fmtNum(d.pairsDrawn)} of those to the ${fmtNum(p.draws)} individual spreads gives $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.faulty)}\\times${fmtNum(d.sound)}\\times(${fmtNum(p.pool)}-1)-${fmtNum(d.pairsDrawn)}\\times${fmtNum(p.faulty)}\\times${fmtNum(d.sound)}}{${fmtNum(p.pool)}\\times${fmtNum(p.pool)}\\times(${fmtNum(p.pool)}-1)}=${fmtNum(d.varCount)}$, the same figure. It also has to come in under what independent draws would have given, and it does: $${fmtNum(d.varCount)}<${fmtNum(d.withRepl)}$. The average count is untouched by any of this — it stays at $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.faulty)}}{${fmtNum(p.pool)}}=${fmtNum(d.mean)}$ cables either way, which is what makes the spread the only place the difference shows.` },
  ],
  keyInsight: "Taking a handful all at once instead of one-with-replacement leaves the average count exactly where it was and shrinks the spread, because the draws pull against each other: every faulty item found is one fewer left for the rest to find. The whole of that effect collects into a single factor set by how much of the population was taken, and it closes to nothing as the handful approaches the whole drawer, where the count stops being random at all.",
  commonTrap: "Reaching for the independent-trial spread — the number drawn times the two chances — which is the right mean and the wrong variance. Every draw shrinks the pool it came from, and pretending otherwise overstates how far the count can wander on every draw of this problem.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  // 1 is the one taken off the pool in the correction's denominator; 2 is the exponent in the
  // sigma-squared notation.
  constants: [1, 2],
};
