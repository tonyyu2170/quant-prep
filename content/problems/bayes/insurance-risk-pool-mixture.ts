import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, pc, complementGrades } from "../util";

// Mixture prior: the population base rate isn't given directly — it's a stated mix of two risk
// pools with different condition rates, so total probability has to build it first, before a
// single positive test result updates it further. That mixture step is the L2 move here.
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  const lowShare = 1 - p.mixShare;
  const basePrior = p.mixShare * p.rateHigh + lowShare * p.rateLow;
  const distLow = basePrior - p.rateLow;
  const distHigh = p.rateHigh - basePrior;
  const healthy = 1 - basePrior;
  const tp = basePrior * p.sens;
  const fp = healthy * p.fpr;
  const posTotal = tp + fp;
  const posterior = tp / posTotal;
  return { lowShare, basePrior, distLow, distHigh, healthy, tp, fp, posTotal, posterior };
};

export const insuranceRiskPoolMixture: ProblemTemplate = {
  id: "bayes/insurance-risk-pool-mixture",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.5 }, { firm: "jump", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: total-probability mixture prior feeding a base-rate update" },
  params: {
    mixShare: { choices: [0.2, 0.3, 0.35, 0.4] },
    rateHigh: { choices: [0.15, 0.2, 0.25, 0.3] },
    rateLow: { choices: [0.02, 0.03, 0.05, 0.08] },
    sens: { choices: [0.85, 0.9, 0.95] },
    fpr: { choices: [0.05, 0.1, 0.15] },
  },
  // rateHigh always exceeds rateLow (min 0.15 > max 0.08) so the mixture step is never vacuous,
  // and mixShare never hits 0.5, so the naive "just average the two rates" trap never coincides.
  constraint: (p) => p.rateHigh > p.rateLow && p.mixShare !== 0.5 && p.sens < 1 && p.fpr > 0 && !complementGrades(derive(p).posterior),
  derived: derive,
  statement: (p) =>
    `An insurer's book of business is a mix of two risk pools: ${pc(p.mixShare)}% of policyholders are in the high-risk pool, where ${pc(p.rateHigh)}% develop a costly claim within the year, and the rest are in the low-risk pool, where only ${pc(p.rateLow)}% do. ` +
    `A screening indicator flags ${pc(p.sens)}% of policyholders who will actually develop a costly claim, and also flags ${pc(p.fpr)}% of those who won't. A policyholder is flagged by the indicator. What is the probability they will actually develop a costly claim?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $H$ = will develop a costly claim, $F$ = flagged. The pool mix gives $P(H\\mid\\text{high pool})=${p.rateHigh}$, $P(H\\mid\\text{low pool})=${p.rateLow}$, with ${pc(p.mixShare)}% of policyholders in the high pool.` },
    { title: "Mixture base rate", body: `Total probability across the two pools: $P(H)=${p.mixShare}\\times${p.rateHigh}+${fmtNum(d.lowShare)}\\times${p.rateLow}=${fmtNum(d.basePrior)}$.` },
    { title: "Apply the test", body: `True-positive mass: $${fmtNum(d.basePrior)}\\times${p.sens}=${fmtNum(d.tp)}$. False-positive mass: $${fmtNum(d.healthy)}\\times${p.fpr}=${fmtNum(d.fp)}$.` },
    { title: "Posterior", body: `$P(F)=${fmtNum(d.basePrior)}\\times${p.sens}+${fmtNum(d.healthy)}\\times${p.fpr}=${fmtNum(d.posTotal)}$, so $P(H\\mid F)=\\dfrac{${fmtNum(d.basePrior)}\\times${p.sens}}{${fmtNum(d.basePrior)}\\times${p.sens}+${fmtNum(d.healthy)}\\times${p.fpr}}=${fmtNum(d.posterior)}$.` },
    { title: "Sanity check", body: `Fewer than half of policyholders sit in the high pool, so the mixture base rate must land closer to the low pool's rate than the high pool's: distance to low is $${fmtNum(d.basePrior)}-${p.rateLow}=${fmtNum(d.distLow)}$, distance to high is $${p.rateHigh}-${fmtNum(d.basePrior)}=${fmtNum(d.distHigh)}$, and $${fmtNum(d.distLow)} < ${fmtNum(d.distHigh)}$ holds.` },
  ],
  keyInsight: "When a population is really a mix of sub-groups with different rates, the population-level base rate isn't handed to you — it has to be built first as a weighted average (total probability) before any test evidence gets folded in on top of it.",
  commonTrap: "Using the plain average of the two pools' condition rates as the population base rate instead of weighting each pool by its actual share of the population — that silently assumes the two pools are equally sized.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [],
};
