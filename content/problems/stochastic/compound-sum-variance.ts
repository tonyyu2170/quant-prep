import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const compoundSumVariance: ProblemTemplate = {
  id: "stochastic/compound-sum-variance",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Wald's second identity — the variance of a randomly many-termed sum" },
  params: {
    lots: { choices: [5, 7, 11, 13, 17, 19] },
    units: { choices: [5, 7, 11, 13, 17, 19] },
    rate: { choices: [2, 3, 4, 5, 6, 8, 10] },
  },
  // Counts are ODD and coprime to three, which makes (n+1)/2 and (n*n-1)/12 BOTH integers, so
  // every printed operand is exact. Terminating decimals are not enough: 28.875 and 167.0625
  // are terminating and still render at four figures as 28.88 and 167.1, whose sum prints 196
  // where the true total prints 195.9. Non-negotiable 3 is about significant figures, not
  // about whether a decimal ends.
  constraint: (p) => p.lots * p.units * p.rate <= 900,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const meanLots = round((p.lots + 1) / 2);
    const varLots = round((p.lots * p.lots - 1) / 12);
    const meanUnits = round((p.units + 1) / 2);
    const varUnits = round((p.units * p.units - 1) / 12);
    const meanUnitsSquared = round(meanUnits * meanUnits);
    const spreadWithin = round(meanLots * varUnits);
    const spreadAcross = round(varLots * meanUnitsSquared);
    const combined = round(spreadWithin + spreadAcross);
    return {
      meanLots, varLots, meanUnits, varUnits, meanUnitsSquared,
      spreadWithin, spreadAcross, combined,
      answer: round(p.rate * p.rate * combined),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A delivery brings a random number of crates — equally likely to be anything from 1 up to ${fmtNum(p.lots)}. Each ` +
    `crate independently holds a random number of parts, equally likely to be anything from 1 up to ${fmtNum(p.units)}. ` +
    `Every part is worth ${fmtNum(p.rate)} dollars. What is the VARIANCE of the value of one delivery, in squared dollars?`,
  solution: (p, d) => [
    { title: "Two sources of spread, not one", body: `The total varies for two separate reasons: a fixed number of crates would still vary because their contents do, and on top of that the NUMBER of crates varies. Writing $n$ for the count and $x$ for one crate's contents, the variance of the total is the mean of $n$ times the variance of $x$, plus the variance of $n$ times the squared mean of $x$.` },
    { title: "The four moments of a uniform count", body: `A uniform run from one to $m$ has mean one more than $m$ over two, and variance $m$ squared less one, over twelve. For the crates that is $\\dfrac{${fmtNum(p.lots)}+1}{2}=${fmtNum(d.meanLots)}$ and $\\dfrac{${fmtNum(p.lots)}\\times${fmtNum(p.lots)}-1}{12}=${fmtNum(d.varLots)}$; for the parts, $\\dfrac{${fmtNum(p.units)}+1}{2}=${fmtNum(d.meanUnits)}$ and $\\dfrac{${fmtNum(p.units)}\\times${fmtNum(p.units)}-1}{12}=${fmtNum(d.varUnits)}$.` },
    { title: "Assemble the two pieces", body: `Spread from the contents is $${fmtNum(d.meanLots)}\\times${fmtNum(d.varUnits)}=${fmtNum(d.spreadWithin)}$. Spread from the count is $${fmtNum(d.varLots)}\\times${fmtNum(d.meanUnits)}\\times${fmtNum(d.meanUnits)}=${fmtNum(d.spreadAcross)}$. Together, $${fmtNum(d.spreadWithin)}+${fmtNum(d.spreadAcross)}=${fmtNum(d.combined)}$ squared parts.` },
    { title: "Answer", body: `Money is parts times ${fmtNum(p.rate)}, and scaling a quantity scales its variance by the SQUARE of the factor: $${fmtNum(p.rate)}\\times${fmtNum(p.rate)}\\times${fmtNum(d.combined)}=${fmtNum(d.answer)}$ squared dollars.` },
    { title: "Sanity check", body: `Drop the count's own randomness and only the first piece survives, ${fmtNum(d.spreadWithin)} squared parts — so the count contributes $${fmtNum(d.combined)}>${fmtNum(d.spreadWithin)}$, strictly more spread than a fixed delivery would carry. It could never contribute less.` },
  ],
  keyInsight: "The mean of a randomly-many-termed sum needs only the two means, but the variance needs all four moments, because a varying count injects spread that no amount of averaging inside a crate can see. Treating the count as fixed at its mean always understates the risk.",
  commonTrap: "Multiplying the mean count by the per-item variance and stopping, which prices only the spread inside the crates and ignores that the number of crates moves at all. The other slip is scaling the final variance by the rate rather than by its square.",
  expectedPaceS: 165,
  verify: { method: "brute-force" },
  constants: [1, 2, 12],
};
