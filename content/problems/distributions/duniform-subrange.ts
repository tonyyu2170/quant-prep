import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

const answerOf = (par: Params) => (par.d - par.c + 1) / par.N;

export const duniformSubrange: ProblemTemplate = {
  id: "distributions/duniform-subrange",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "discrete uniform subrange probability as a ratio of counts" },
  params: {
    N: { range: { min: 10, max: 50, step: 1 } },
    c: { range: { min: 1, max: 50, step: 1 } },
    d: { range: { min: 1, max: 50, step: 1 } },
  },
  constraint: (p) => p.c <= p.d && p.d <= p.N && answerOf(p) >= 0.01 && answerOf(p) <= 0.9 && !complementGrades(answerOf(p)),
  derived: (p) => {
    const subrangeSize = p.d - p.c + 1;
    const answer = subrangeSize / p.N;
    return { subrangeSize, answer };
  },
  statement: (p) =>
    `Serial numbers are assigned sequentially from ${fmtNum(1)} to ${fmtNum(p.N)} for a batch of manufactured items. What is the probability that a randomly selected item's serial number falls between ${fmtNum(p.c)} and ${fmtNum(p.d)}, inclusive?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Every serial number from ${fmtNum(1)} through ${fmtNum(p.N)} is equally likely, so ${fmtNum(p.N)} total possibilities.` },
    { title: "Count the favorable outcomes", body: `The integers from ${fmtNum(p.c)} through ${fmtNum(p.d)} number $d-c+1=${fmtNum(d.subrangeSize)}$.` },
    { title: "Combine", body: `$P(c\\le X\\le d)\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The favorable count ${fmtNum(d.subrangeSize)} can never exceed the total ${fmtNum(p.N)}, since $[c,d]$ sits entirely inside $[1,N]$ by construction — consistent with a valid probability.` },
  ],
  keyInsight: "A discrete uniform subrange probability is purely a ratio of counts — how many integers qualify against how many are possible — with no need to weight any outcome differently from another.",
  commonTrap: "Counting the subrange as d minus c instead of d minus c plus one, which undercounts by exactly one integer since both endpoints are included.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1],
};
