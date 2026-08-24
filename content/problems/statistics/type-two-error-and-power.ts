import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

// One-sided critical values, derived from the level so the two can never disagree on the page.
// The power is computed as a CDF evaluated directly rather than as one minus a tail: subtracting
// two four-figure renderings is the rounding trap this file exists to avoid.
const critOf = (par: { alphaPct: number }) =>
  par.alphaPct === 10 ? 1.282 : par.alphaPct === 5 ? 1.645 : 2.326;

export const typeTwoErrorAndPower: ProblemTemplate = {
  id: "statistics/type-two-error-and-power",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the power of a one-sided z-test against a specific alternative" },
  params: {
    alphaPct: { choices: [10, 5, 1] },
    sigma: { choices: [10, 15, 20, 25, 40] },
    n: { choices: [16, 25, 36, 64, 100] },
    gap: { choices: [4, 6, 8, 10, 12, 15, 20] },
  },
  // Keep the shifted statistic where both the power and its complement are readable at four
  // figures; outside this band one of the two collapses into the display's last digit.
  constraint: (p) => (p.gap * Math.sqrt(p.n)) / p.sigma - critOf(p as { alphaPct: number }) >= -2 && (p.gap * Math.sqrt(p.n)) / p.sigma - critOf(p as { alphaPct: number }) <= 3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    const crit = critOf(p as { alphaPct: number });
    const delta = round((p.gap * root) / p.sigma);
    const shift = round(delta - crit);
    return {
      root,
      crit,
      delta,
      shift,
      beta: round(normalCdf(-shift)),
      answer: round(normalCdf(shift)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A one-sided test at the ${fmtNum(p.alphaPct)} percent level, which rejects when the z-statistic exceeds ${fmtNum(d.crit)}, is run on ${fmtNum(p.n)} observations with a known standard deviation of ${fmtNum(p.sigma)}. Suppose the truth is that the mean sits ${fmtNum(p.gap)} above the null value. ` +
    `What is the power of the test — the probability it correctly rejects?`,
  solution: (p, d) => [
    { title: "Power is the rejection region seen from the alternative", body: `The rejection rule is fixed by the null, but the probability of landing in it must be computed under the TRUTH. Writing it out, $\\text{power}=P(Z>c-e)$ with $c$ the critical value and $e$ the true effect in standard errors. Shifting the reference point turns the statistic into a normal centred on that effect, so the question becomes how far the critical value sits from that new centre.` },
    { title: "The true effect in standard errors", body: `With $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, an effect of ${fmtNum(p.gap)} is $${fmtNum(p.gap)}\\times${fmtNum(d.root)}/${fmtNum(p.sigma)}=${fmtNum(d.delta)}$ standard errors.` },
    { title: "How far past the threshold that lands", body: `The critical value is ${fmtNum(d.crit)}, so the true centre sits $${fmtNum(p.gap)}\\times${fmtNum(d.root)}/${fmtNum(p.sigma)}-${fmtNum(d.crit)}=${fmtNum(d.shift)}$ above it — recomputed from the original figures rather than from the rounded ${fmtNum(d.delta)}, which would lose a digit.` },
    { title: "Answer", body: `The power is the standard normal area below ${fmtNum(d.shift)}, which is ${fmtNum(d.answer)}. The type two error rate — failing to reject when the effect is real — is the rest, ${fmtNum(d.beta)}.` },
    { title: "Sanity check", body: `Tightening the level raises the critical value, pushes ${fmtNum(d.shift)} down, and costs power: the two error rates trade against each other and cannot both be reduced without more data. Only raising ${fmtNum(p.n)} moves ${fmtNum(d.delta)} up and improves both at once.` },
  ],
  keyInsight: "The level is chosen under the null and the power is measured under the alternative, so the two live on the same axis with different centres. Everything about experimental design follows: you may move the threshold and trade one error for the other, or add data and shift the alternative's centre away, but nothing else helps.",
  commonTrap: "Computing the power against the null rather than the alternative, which just returns the significance level. The other slip is treating power as a property of the test alone, when it is meaningless until a specific effect size is named.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [],
};
