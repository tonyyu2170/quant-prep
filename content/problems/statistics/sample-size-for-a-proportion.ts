import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The ceiling is taken on a ROUNDED requirement. This is the round-before-ceiling rule and it is
// not cosmetic: a requirement that is exactly 384 in real arithmetic can land at
// 384.00000000000006 in floats, and a bare Math.ceil then returns 385 — an answer one too large,
// which under {abs: 0} grades a correct 384 as wrong. `constraint` needs the count, so the
// helper is licensed.
const sizeOf = (par: { conf: number; pPct: number; marginPct: number }) => {
  const z = par.conf === 90 ? 1.645 : par.conf === 95 ? 1.96 : 2.576;
  const p = par.pPct / 100;
  return Math.ceil(Math.round(((z * z * p * (1 - p)) / (par.marginPct / 100) ** 2) * 1e9) / 1e9);
};

export const sampleSizeForAProportion: ProblemTemplate = {
  id: "statistics/sample-size-for-a-proportion",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.2 }, { firm: "millennium", weight: 0.2 }, { firm: "imc", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the sample size needed for a proportion at a target margin" },
  params: {
    conf: { choices: [90, 95, 99] },
    pPct: { choices: [8, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75] },
    marginPct: { choices: [2, 3, 4, 5, 6, 8, 10] },
  },
  constraint: (p) => sizeOf(p as { conf: number; pPct: number; marginPct: number }) >= 25,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const z = p.conf === 90 ? 1.645 : p.conf === 95 ? 1.96 : 2.576;
    const prop = round(p.pPct / 100);
    const margin = round(p.marginPct / 100);
    const raw = round((z * z * prop * (1 - prop)) / (margin * margin));
    return {
      z,
      prop,
      margin,
      variance: round(prop * (1 - prop)),
      raw,
      answer: Math.ceil(raw),
    };
  },
  answerKey: "answer",
  // A count grades exactly. Under a relative band an answer of 1000 would accept 995, and 995
  // respondents provably leave the interval wider than the one the question specifies — the
  // off-by-one this question is ABOUT would grade correct across most of the space.
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A survey will estimate the share of orders that get filled at the touch, believed to be near ${fmtNum(p.pPct)} percent. You want a ${fmtNum(p.conf)} percent confidence interval no wider than plus or minus ${fmtNum(p.marginPct)} percentage points, which at that level uses a multiplier of ${fmtNum(d.z)}. ` +
    `What is the smallest number of orders that must be sampled?`,
  solution: (p, d) => [
    { title: "A proportion carries its own variance", body: `Unlike a mean, a proportion's spread is fixed by its own value: one order either fills at the touch or does not, and that indicator has variance $p(1-p)$. Nothing has to be estimated separately.` },
    { title: "The variance at this share", body: `At a share of ${fmtNum(d.prop)} that is $${fmtNum(d.prop)}\\times(1-${fmtNum(d.prop)})=${fmtNum(d.variance)}$ — largest at one half, and falling away toward either extreme.` },
    { title: "Solve the margin for the count", body: `The margin is the multiplier times the standard error, so squaring and rearranging gives $\\dfrac{${fmtNum(d.z)}\\times${fmtNum(d.z)}\\times${fmtNum(d.variance)}}{${fmtNum(d.margin)}\\times${fmtNum(d.margin)}}=${fmtNum(d.raw)}$.` },
    { title: "Answer", body: `Orders come whole and a fraction of one buys nothing, so round up: ${fmtNum(d.answer)}, since $${fmtNum(d.answer)}\\geq${fmtNum(d.raw)}$. Stopping one short leaves the interval wider than specified.` },
    { title: "Sanity check", body: `Had the share been unknown, the safe choice is one half, where the variance peaks — that is why published surveys quote a single sample size regardless of the answer. Here the share of ${fmtNum(d.prop)} gives ${fmtNum(d.variance)}, so this study is cheaper than the worst case rather than more expensive.` },
  ],
  keyInsight: "A proportion's variance is determined by the proportion itself, peaking at one half, so the sample size a survey needs can be computed before a single response arrives. That is why polling costs are quoted up front while sample sizes for a mean cannot be.",
  commonTrap: "Rounding the count down, or forgetting that the margin enters squared and scaling the sample linearly with it. Both leave the interval wider than the one specified, which is the single thing the question asked for.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1],
};
