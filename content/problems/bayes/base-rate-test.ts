import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Classic diagnostic-test base-rate problem (spec §6 source kind: textbook classic,
// new prose + new parameters + our own solution).
export const baseRateTest: ProblemTemplate = {
  id: "bayes/base-rate-test",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.8 }, { firm: "jane-street", weight: 0.5 }, { firm: "optiver", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: base-rate fallacy / diagnostic testing" },
  params: {
    sens: { choices: [0.9, 0.95, 0.98] },
    spec: { choices: [0.85, 0.9, 0.95] },
    prev: { choices: [0.02, 0.05, 0.1] },
  },
  derived: (p) => {
    const fpr = Math.round((1 - p.spec) * 1e10) / 1e10;
    const healthy = Math.round((1 - p.prev) * 1e10) / 1e10;
    const tp = p.prev * p.sens;
    const fp = healthy * fpr;
    const pos = tp + fp;
    return { fpr, healthy, tp, fp, pos, posterior: tp / pos };
  },
  statement: (p) =>
    `A screening test for a condition is ${pc(p.sens)}% sensitive and ${pc(p.spec)}% specific. ` +
    `${pc(p.prev)}% of the tested population has the condition. A randomly tested person's result comes back positive. ` +
    `What is the probability they actually have the condition?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.01 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $D$ = has the condition, $+$ = tests positive. Given: $P(+\\mid D)=${p.sens}$, $P(-\\mid \\bar D)=${p.spec}$, $P(D)=${p.prev}$.` },
    { title: "Bayes", body: `$P(D\\mid +)=\\dfrac{P(+\\mid D)\\,P(D)}{P(+)}$ — we need the total positive mass $P(+)$.` },
    { title: "Positive mass", body: `True positives: $${p.sens}\\times${p.prev}=${fmtNum(d.tp)}$. False positives: the healthy ${fmtNum(d.healthy)} share times the ${fmtNum(d.fpr)} false-positive rate $=${fmtNum(d.healthy)}\\times${fmtNum(d.fpr)}=${fmtNum(d.fp)}$.` },
    { title: "Combine", body: `$P(+)=${fmtNum(d.tp)}+${fmtNum(d.fp)}=${fmtNum(d.pos)}$, so $P(D\\mid +)=${fmtNum(d.tp)}/${fmtNum(d.pos)}=${fmtNum(d.posterior)}$.` },
    { title: "Sanity check", body: `False positives come from the much larger healthy share, so the posterior must land well below the ${pc(p.sens)}% sensitivity — it does.` },
  ],
  keyInsight: "The base rate anchors the answer: the posterior is true-positive mass over total positive mass, and the healthy majority feeds the denominator.",
  commonTrap: "Answering with the sensitivity itself — that inverts the conditional and ignores the base rate entirely.",
  expectedPaceS: 90,
  verify: { method: "montecarlo" },
  constants: [],
};
