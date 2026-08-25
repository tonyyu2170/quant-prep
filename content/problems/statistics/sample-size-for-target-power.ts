import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

// Both multipliers are GIVENS printed in the statement, at three decimals, so their sum is four
// significant figures and can stand as an operand. The squared requirement is written over the
// original literals inside one chain, and the count is the ceiling of that requirement ROUNDED at
// the ninth decimal first (sample-size-for-margin's lesson: 14.000000000000002 squared is not 196).
// The constraint keeps the fractional part of the requirement inside [0.02, 0.98], so no draw sits
// near an integer boundary where the ceiling could flip on float dirt. The three-decimal power
// points all round UP from the true quantiles, so the power at the count really does clear the
// target the statement names.
const critOf = (par: { alphaPct: number }) => (par.alphaPct === 10 ? 1.282 : par.alphaPct === 5 ? 1.645 : 2.326);
const powerPointOf = (par: { powerPct: number }) => (par.powerPct === 80 ? 0.842 : par.powerPct === 90 ? 1.282 : 1.645);
const rawOf = (par: { alphaPct: number; powerPct: number; sigma: number; gap: number }) =>
  Math.round((((critOf(par) + powerPointOf(par)) * par.sigma) / par.gap) ** 2 * 1e9) / 1e9;

export const sampleSizeForTargetPower: ProblemTemplate = {
  id: "statistics/sample-size-for-target-power",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the sample size that buys a target power against a named effect" },
  params: {
    alphaPct: { choices: [10, 5, 1] },
    powerPct: { choices: [80, 90, 95] },
    sigma: { choices: [5, 8, 10, 12, 15, 20, 25, 30] },
    gap: { choices: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8] },
  },
  constraint: (p) => rawOf(p as { alphaPct: number; powerPct: number; sigma: number; gap: number }) >= 4 && rawOf(p as { alphaPct: number; powerPct: number; sigma: number; gap: number }) <= 5000 && rawOf(p as { alphaPct: number; powerPct: number; sigma: number; gap: number }) % 1 >= 0.02 && rawOf(p as { alphaPct: number; powerPct: number; sigma: number; gap: number }) % 1 <= 0.98,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const crit = critOf(p as { alphaPct: number });
    const zBeta = powerPointOf(p as { powerPct: number });
    const raw = rawOf(p as { alphaPct: number; powerPct: number; sigma: number; gap: number });
    const answer = Math.ceil(raw);
    return {
      crit,
      zBeta,
      multiplier: round(crit + zBeta),
      raw,
      powerAtAnswer: round(normalCdf((p.gap * Math.sqrt(answer)) / p.sigma - crit)),
      answer,
    };
  },
  answerKey: "answer",
  // A count grades exactly: one observation short provably misses the target power.
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A one-sided test at the ${fmtNum(p.alphaPct)} percent level rejects when the z-statistic exceeds ${fmtNum(d.crit)}. Observations have a known standard deviation of ${fmtNum(p.sigma)}, and you want the test to have ${fmtNum(p.powerPct)} percent power against a true mean ${fmtNum(p.gap)} above the null — the standard normal point for ${fmtNum(p.powerPct)} percent is ${fmtNum(d.zBeta)}. ` +
    `What is the smallest number of observations that does it?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Where the two multipliers come from", body: `If the truth sits $g$ above the null, the statistic is a standard normal centred $g\\sqrt{n}/\\sigma$ above zero. It clears the threshold $c$ with the target probability exactly when that centre sits $b$ above $c$, where $b$ is the normal point for the target power. So at the boundary $\\dfrac{g\\sqrt{n}}{\\sigma}=c+b$, and solving for the count, $n=\\left(\\dfrac{(c+b)\\,\\sigma}{g}\\right)^{2}$.` },
    { title: "The two multipliers add", body: `The threshold and the power point stack: $${fmtNum(d.crit)}+${fmtNum(d.zBeta)}=${fmtNum(d.multiplier)}$ standard errors between the null's centre and the point the truth's centre must reach.` },
    { title: "The requirement", body: `Scaling by the spread and the effect, then squaring: $\\left(\\dfrac{${fmtNum(d.multiplier)}\\times${fmtNum(p.sigma)}}{${fmtNum(p.gap)}}\\right)^{2}=${fmtNum(d.raw)}$.` },
    { title: "Answer", body: `Observations come whole and a fraction of one buys nothing, so round up to ${fmtNum(d.answer)}: $${fmtNum(d.answer)}\\geq${fmtNum(d.raw)}$, and one fewer falls short of the requirement. At ${fmtNum(d.answer)} observations the power is ${fmtNum(d.powerAtAnswer)}, just clear of the target.` },
    { title: "Sanity check", body: `Everything enters squared. Halving the effect you need to detect quadruples the count; so does doubling the spread. Tightening the level or raising the power adds to the multiplier ${fmtNum(d.multiplier)} before the square, which is why the last few points of power are the expensive ones.` },
  ],
  keyInsight: "A power calculation is two multipliers added — the critical value that protects the null and the normal point that delivers the power — scaled by the spread over the effect, and squared. The square is the whole economics of experimental design: precision on a mean costs quadratically in observations.",
  commonTrap: "Using only the critical value and forgetting the power point, which sizes a test with fifty percent power. The other slip is rounding the count down, or scaling it linearly with the effect rather than with its square.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [2],
};
