import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const sprtConsecutiveWins: ProblemTemplate = {
  id: "statistics/sprt-consecutive-wins",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Wald's sequential probability ratio test and its upper stopping boundary" },
  // Rates are drawn as whole percents and the alternative as a percentage ratio of the null,
  // so the per-win likelihood ratio is an exact two-decimal number rather than a quotient that
  // has to be rounded before it can be printed.
  params: {
    p0:    { choices: [20, 25, 30, 40, 50, 60] },
    ratio: { choices: [104, 105, 106, 108, 110, 112, 115, 118, 120, 125] },
    alpha: { choices: [1, 2, 5, 10] },
    beta:  { choices: [2, 5, 10, 20] },
  },
  // Three structural conjuncts, none cosmetic. The fractional part is held away from both ends
  // so the boundary crossing is visible at PRINTED precision — a ratio landing a hair under the
  // bound renders identically to it and the strict comparison on the page reads false. The
  // ceiling is required to move when the type-two rate is dropped, or "the bound is just one
  // over alpha" returns the right count on a third of draws. And the count is capped so the
  // answer stays a number a desk could actually wait for.
  constraint: (p) => p.p0 * p.ratio <= 9500 && p.alpha < 100 - p.beta && Math.log((100 - p.beta) / p.alpha) / Math.log(p.ratio / 100) % 1 >= 0.1 && Math.log((100 - p.beta) / p.alpha) / Math.log(p.ratio / 100) % 1 <= 0.9 && Math.ceil(Math.log((100 - p.beta) / p.alpha) / Math.log(p.ratio / 100)) <= 60 && Math.ceil(Math.log((100 - p.beta) / p.alpha) / Math.log(p.ratio / 100)) !== Math.ceil(Math.log(100 / p.alpha) / Math.log(p.ratio / 100)),
  derived: (p) => {
    const r9 = (x: number) => Math.round(x * 1e9) / 1e9;
    const A = r9((100 - p.beta) / p.alpha);
    const step = p.ratio / 100;
    const wins = Math.ceil(Math.log(A) / Math.log(step));
    return {
      nullRate: r9(p.p0 / 100),
      altRate: r9((p.p0 * p.ratio) / 10000),
      step: r9(step),
      alphaRate: r9(p.alpha / 100),
      betaRate: r9(p.beta / 100),
      power: r9((100 - p.beta) / 100),
      bound: A,
      winsLess: wins - 1,
      reached: r9(Math.pow(step, wins)),
      shortOf: r9(Math.pow(step, wins - 1)),
      answer: wins,
    };
  },
  answerKey: "answer",
  // A count: a relative band around it would accept a neighbourhood that contains no other
  // whole number, and the question is precisely about which whole number it is.
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A desk tests a strategy trade by trade rather than waiting for a fixed sample. Under the null hypothesis each ` +
    `trade wins with probability ${fmtNum(d.nullRate)}; under the alternative it wins with probability ` +
    `${fmtNum(d.altRate)}. Wald's sequential test stops and rejects the null the first time the likelihood ratio ` +
    `reaches one less the type-two error rate, divided by the type-one error rate — here ${fmtNum(d.betaRate)} and ` +
    `${fmtNum(d.alphaRate)}. The ratio starts at one. If every trade from now on is a win, how many wins does it ` +
    `take to stop?`,
  solution: (p, d) => [
    { title: "The boundary is a ratio of the two error rates", body: `Wald's test compares the likelihood of the data under the two hypotheses and stops when that ratio leaves a corridor. The upper edge of the corridor, the one that rejects the null, sits at $A=\\dfrac{u}{v}$ with $u$ one less the type-two error rate and $v$ the type-one rate. Neither the sample size nor the trade count appears in it — the boundary is fixed before any data arrives.` },
    { title: "Put the numbers in", body: `One less the type-two error rate is ${fmtNum(d.power)}, so the boundary is $\\dfrac{${fmtNum(d.power)}}{${fmtNum(d.alphaRate)}}=${fmtNum(d.bound)}$. That is the value the likelihood ratio has to reach before the desk is entitled to reject.` },
    { title: "What one win is worth", body: `Each win is more likely under the alternative than under the null, and the ratio of those two probabilities is what multiplies into the running total: $\\dfrac{${fmtNum(d.altRate)}}{${fmtNum(d.nullRate)}}=${fmtNum(d.step)}$. Wins compound it, so after a run of them the ratio is that number raised to the length of the run.` },
    { title: "Answer", body: `The run has to be long enough that the compounded ratio clears the boundary. At ${fmtNum(d.winsLess)} wins it is still short — $${fmtNum(d.step)}^{${fmtNum(d.winsLess)}}=${fmtNum(d.shortOf)}<${fmtNum(d.bound)}$ — and at ${fmtNum(d.answer)} it is past it: $${fmtNum(d.step)}^{${fmtNum(d.answer)}}=${fmtNum(d.reached)}>${fmtNum(d.bound)}$. So it takes ${fmtNum(d.answer)} consecutive wins.` },
    { title: "Sanity check", body: `Note how weak a single win is as evidence: it moves the ratio by a factor of ${fmtNum(d.step)}, and the boundary is ${fmtNum(d.bound)} away from where the test starts. A small edge is not detected quickly, however sequential the test — which is the honest lesson of the boundary rather than a defect of it.` },
  ],
  keyInsight: "The SPRT's stopping boundaries are fixed by the two error rates alone and are known before a single observation arrives. The data only decides WHEN a boundary is hit, never where it sits — which is what lets a sequential test control both error rates without a pre-committed sample size.",
  commonTrap: "Using one over the type-one rate as the boundary and dropping the type-two rate entirely. That is the boundary only for a test willing to accept no power at all; the true numerator is one less the type-two rate, which lowers the bar and shortens the run.",
  expectedPaceS: 150,
  verify: { method: "brute-force" },
  constants: [],
};
