import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The second arm is one, two or four times the first, and `constraint` keeps the pooled rate an
// integer percent, so the pooled rate and its complement have two decimals and their product at
// most four significant figures — exact operands all. The count factor 1/nA + 1/nB is licensed by
// exact4. The root is evaluated once, inside the final chain; the standard error is a label.
// Both fill counts are whole numbers by constraint, and the difference in rates is the drawn
// axis, so the statistic is signed and spread about zero.
const nBOf = (par: { nA: number; ratio: number }) => par.nA * par.ratio;
const pooledPctOf = (par: { nA: number; ratio: number; pAPct: number; diffPct: number }) =>
  (par.nA * par.pAPct + nBOf(par) * (par.pAPct + par.diffPct)) / (par.nA + nBOf(par));
const zOf = (par: { nA: number; ratio: number; pAPct: number; diffPct: number }) =>
  (par.diffPct / 100) / Math.sqrt((pooledPctOf(par) / 100) * (1 - pooledPctOf(par) / 100) * (1 / par.nA + 1 / nBOf(par)));

export const twoProportionZStatistic: ProblemTemplate = {
  id: "statistics/two-proportion-z-statistic",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the pooled two-proportion z-test, the A/B test's statistic" },
  params: {
    nA: { choices: [100, 200, 250, 400, 500, 1000] },
    ratio: { choices: [1, 2, 4] },
    pAPct: { choices: [4, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50] },
    diffPct: { choices: [-8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8] },
  },
  constraint: (p) => p.pAPct + p.diffPct >= 1 && p.pAPct + p.diffPct <= 95 && Number.isInteger(p.nA * p.pAPct / 100) && Number.isInteger(nBOf(p as { nA: number; ratio: number }) * (p.pAPct + p.diffPct) / 100) && Math.abs(pooledPctOf(p as { nA: number; ratio: number; pAPct: number; diffPct: number }) - Math.round(pooledPctOf(p as { nA: number; ratio: number; pAPct: number; diffPct: number }))) < 1e-9 && exact4(1 / p.nA + 1 / nBOf(p as { nA: number; ratio: number })) && Math.abs(zOf(p as { nA: number; ratio: number; pAPct: number; diffPct: number })) >= 0.3 && Math.abs(zOf(p as { nA: number; ratio: number; pAPct: number; diffPct: number })) <= 6,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const nB = p.nA * p.ratio;
    const pA = round(p.pAPct / 100);
    const pB = round((p.pAPct + p.diffPct) / 100);
    const kA = round(p.nA * pA);
    const kB = round(nB * pB);
    const pbar = round((kA + kB) / (p.nA + nB));
    const qbar = round(1 - pbar);
    const pooledVar = round(pbar * qbar);
    const invSum = round(1 / p.nA + 1 / nB);
    const se = round(Math.sqrt(pooledVar * invSum));
    return {
      nB,
      pA,
      pB,
      kA,
      kB,
      pbar,
      qbar,
      pooledVar,
      invSum,
      se,
      diff: round(pA - pB),
      answer: round((pA - pB) / se),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `Two order-routing configurations are trialled on independent order flow. Configuration A sent ${fmtNum(p.nA)} orders, of which ${fmtNum(d.kA)} filled at the touch; configuration B sent ${fmtNum(d.nB)}, of which ${fmtNum(d.kB)} filled. ` +
    `Under the null hypothesis that the two fill rates are equal, what is the two-proportion z-statistic for A minus B, using the pooled rate?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "One rate under the null, so pool", body: `If the two configurations fill at the same rate, the best estimate of that common rate uses every order from both arms. The difference of two independent sample proportions then has variance equal to that pooled variance spread over both counts: $z=\\dfrac{p_A-p_B}{\\sqrt{\\bar{p}(1-\\bar{p})(1/n_A+1/n_B)}}$.` },
    { title: "The two sample rates", body: `Configuration A filled $\\dfrac{${fmtNum(d.kA)}}{${fmtNum(p.nA)}}=${fmtNum(d.pA)}$ of its orders and B filled $\\dfrac{${fmtNum(d.kB)}}{${fmtNum(d.nB)}}=${fmtNum(d.pB)}$.` },
    { title: "The pooled rate", body: `All fills over all orders: $\\dfrac{${fmtNum(d.kA)}+${fmtNum(d.kB)}}{${fmtNum(p.nA)}+${fmtNum(d.nB)}}=${fmtNum(d.pbar)}$, with complement $1-${fmtNum(d.pbar)}=${fmtNum(d.qbar)}$. The pooled variance of one order's outcome is $${fmtNum(d.pbar)}\\times${fmtNum(d.qbar)}=${fmtNum(d.pooledVar)}$.` },
    { title: "Spread it over both counts", body: `The two arms contribute $\\dfrac{1}{${fmtNum(p.nA)}}+\\dfrac{1}{${fmtNum(d.nB)}}=${fmtNum(d.invSum)}$, so the standard error of the difference is the root of ${fmtNum(d.pooledVar)} times ${fmtNum(d.invSum)}, about ${fmtNum(d.se)}.` },
    { title: "Answer", body: `The difference over its standard error: $\\dfrac{${fmtNum(d.pA)}-${fmtNum(d.pB)}}{\\sqrt{${fmtNum(d.pooledVar)}\\times${fmtNum(d.invSum)}}}=${fmtNum(d.answer)}$. ${d.answer > 0 ? "A filled more often in the sample" : "B filled more often in the sample"}; the size of the statistic says how surprising that gap is if the two rates are really equal.` },
    { title: "Sanity check", body: `The pooled rate ${fmtNum(d.pbar)} lies between ${fmtNum(d.pA)} and ${fmtNum(d.pB)}, ${p.ratio === 1 ? "exactly halfway because the arms are the same size" : "nearer B's rate because B sent more orders"}. Pooling is right for the TEST, where the null says the rates are one; a confidence interval for the difference would keep the two rates separate.` },
  ],
  keyInsight: "A test of equal proportions pools the two arms to estimate the one rate the null asserts, and the variance of the difference is that pooled variance times the sum of the reciprocal counts. The larger arm pins the pooled rate; the smaller arm dominates the standard error, which is why unbalanced trials waste the extra orders on the bigger side.",
  commonTrap: "Using each arm's own rate in the variance, which is the interval's convention rather than the test's, or averaging the two rates without weighting by the counts. The other slip is dividing by the pooled variance itself instead of its square root.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1],
};
