import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const duniformFitRange: ProblemTemplate = {
  id: "distributions/duniform-fit-range",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "recovering a discrete uniform's range size from a stated subrange probability" },
  params: {
    M: { range: { min: 1, max: 20, step: 1 } },
    N: { range: { min: 6, max: 80, step: 1 } },
  },
  constraint: (p) => p.N > p.M && p.M / p.N >= 0.05 && p.M / p.N <= 0.9,
  derived: (p) => {
    const c = p.M / p.N;
    const answer = p.M / c;
    return { c, answer };
  },
  statement: (p) =>
    `Serial numbers are assigned sequentially from ${fmtNum(1)} up to an unknown total $N$ for a batch of manufactured items. The probability that a randomly selected item's serial number is at most ${fmtNum(p.M)} is ${fmtNum(p.M / p.N)}. Find $N$.`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Set up the ratio", body: `A serial number at most ${fmtNum(p.M)}, drawn uniformly from ${fmtNum(1)} through $N$, has probability $\\frac{M}{N}=${fmtNum(d.c)}$.` },
    { title: "Solve for N", body: `Rearranging: $N\\approx\\frac{M}{c}\\approx\\frac{${fmtNum(p.M)}}{${fmtNum(d.c)}}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `A larger total $N$ should make the stated probability smaller for a fixed cutoff ${fmtNum(p.M)}, since the same ${fmtNum(p.M)} favorable numbers are spread across more possibilities — the recovered $N$ here is consistent with that inverse relationship.` },
  ],
  keyInsight: "A discrete uniform's stated subrange probability pins the range size directly through the ratio favorable/total — solving for the unknown total is a one-line inversion.",
  commonTrap: "Treating the stated probability as the range size itself, or forgetting that the total N, not the cutoff M, is what the question asks for.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [1],
};
