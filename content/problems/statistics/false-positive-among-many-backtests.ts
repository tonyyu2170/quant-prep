import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The per-strategy false-positive rate alpha^k and its complement are licensed exact by
// `constraint`, and the power (1 - rate)^m is evaluated ONCE inside the final chain — the
// precision gate reads a braced exponent — so no rounded rendering is ever re-used. The number
// of periods a strategy must pass, k, is a real third axis rather than a decoy: it carries the
// in-sample / out-of-sample lesson inside one template.
export const falsePositiveAmongManyBacktests: ProblemTemplate = {
  id: "statistics/false-positive-among-many-backtests",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the family-wise false-positive rate of many independent backtests" },
  params: {
    m: { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30, 32, 40, 48, 50, 60, 64, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500] },
    alphaPct: { choices: [1, 2, 2.5, 4, 5, 10] },
    k: { choices: [1, 2] },
  },
  constraint: (p) => exact4(Math.pow(p.alphaPct / 100, p.k)) && exact4(1 - Math.pow(p.alphaPct / 100, p.k)) && 1 - Math.pow(1 - Math.pow(p.alphaPct / 100, p.k), p.m) >= 0.02 && 1 - Math.pow(1 - Math.pow(p.alphaPct / 100, p.k), p.m) <= 0.98,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const alpha = round(p.alphaPct / 100);
    const rate = round(Math.pow(alpha, p.k));
    const survive = round(1 - rate);
    return {
      alpha,
      rate,
      survive,
      noneProb: round(Math.pow(survive, p.m)),
      expectedFalse: round(p.m * rate),
      answer: round(1 - Math.pow(survive, p.m)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk backtests ${fmtNum(p.m)} candidate strategies, none of which has any real edge. Each is tested at the ${fmtNum(p.alphaPct)} percent significance level${p.k === 2 ? ", and a strategy is kept only if it passes on each of two disjoint periods, in-sample and then out-of-sample" : ", and a strategy is kept if it passes on the one period available"}. All the tests are independent. ` +
    `What is the probability that at least one useless strategy is kept?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "At least one is the complement of none", body: `Each strategy independently survives its screening with some rate $r$, so the chance that none of $m$ survive is $(1-r)^{m}$, and the chance that at least one does is $P=1-(1-r)^{m}$. The whole problem is finding $r$.` },
    { title: "The rate per strategy", body: p.k === 2
      ? `A test at the ${fmtNum(p.alphaPct)} percent level passes a strategy with no edge $\\dfrac{${fmtNum(p.alphaPct)}}{100}=${fmtNum(d.alpha)}$ of the time, and passing two independent periods multiplies: $${fmtNum(d.alpha)}^{2}=${fmtNum(d.rate)}$. The out-of-sample check is what turns the level into its square.`
      : `A test at the ${fmtNum(p.alphaPct)} percent level passes a strategy with no edge $\\dfrac{${fmtNum(p.alphaPct)}}{100}=${fmtNum(d.alpha)}$ of the time — that is what the level means — so each useless strategy is kept with probability ${fmtNum(d.rate)}.` },
    { title: "The chance none survive", body: `Each strategy is discarded with probability $1-${fmtNum(d.rate)}=${fmtNum(d.survive)}$, and across ${fmtNum(p.m)} independent strategies the chance all are discarded is $${fmtNum(d.survive)}^{${fmtNum(p.m)}}=${fmtNum(d.noneProb)}$.` },
    { title: "Answer", body: `So the probability that at least one useless strategy is kept is $1-${fmtNum(d.survive)}^{${fmtNum(p.m)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The expected number of useless strategies kept is $${fmtNum(p.m)}\\times${fmtNum(d.rate)}=${fmtNum(d.expectedFalse)}$, and the probability of at least one can never exceed that expectation — the union bound. When the expectation is small the two nearly coincide; when it is large the probability saturates toward one while the expectation keeps growing. ${p.k === 2 ? "Without the out-of-sample period the per-strategy rate would be the level itself, and the desk would almost certainly keep something useless." : "Demanding a second, out-of-sample pass would square the per-strategy rate and shrink this number dramatically."}` },
  ],
  keyInsight: "Screening many candidates at a fixed level is a multiple-testing problem: the probability that SOMETHING passes by luck is one minus the survival probability raised to the number of candidates, and it races toward one as the candidates multiply. An independent out-of-sample test squares the per-candidate rate, which is why it is worth more than any tightening of the level.",
  commonTrap: "Multiplying the level by the number of strategies and calling that the probability, which is the expected count and exceeds one for large families. The other slip is treating the second period as halving the rate rather than squaring it.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [1, 2, 100],
};
