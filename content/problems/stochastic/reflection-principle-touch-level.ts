import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const reflectionPrincipleTouchLevel: ProblemTemplate = {
  id: "stochastic/reflection-principle-touch-level",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the reflection principle for a finite-horizon one-barrier touch" },
  params: {
    steps: { choices: [10, 12, 14, 16, 18, 20, 22, 24] },
    start: { choices: [0, 1, 2, 3, 4, 5, 6, 8] },
    barrier: { choices: [4, 5, 6, 7, 8, 9, 10, 12, 14, 16] },
  },
  // The upper bound is steps MINUS ONE, not steps. At a gap of exactly `steps` the only path
  // reaching the limit is the all-up one and none finishes strictly above it, so the reflected
  // group is empty and the sanity check's strict inequality becomes false on the page.
  constraint: (p) => p.barrier - p.start >= 2 && p.barrier - p.start <= p.steps - 1,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    // Local, not module-level: `constraint` never calls it, and constraint 2 licenses a
    // module-level helper only where constraint would otherwise duplicate the answer formula.
    //
    // Counts the +/-1 paths of length n finishing at or above level a — an INTEGER, not a
    // probability. That is what keeps every printed chain exact: two tail probabilities
    // rendered at four figures do not add back to the rendering of their sum (0.2403 + 0.2403
    // prints 0.4806 where the true total prints 0.4807). Reflection is a counting argument
    // anyway, so counting is also the honest way to present it.
    const pathsFinishingAtLeast = (n: number, a: number) => {
      let total = 0;
      for (let ups = 0; ups <= n; ups++) {
        if (2 * ups - n < a) continue;
        let c = 1;
        for (let i = 0; i < Math.min(ups, n - ups); i++) c = (c * (n - i)) / (i + 1);
        total += c;
      }
      return total;
    };
    const gap = p.barrier - p.start;
    const atOrAbove = pathsFinishingAtLeast(p.steps, gap);
    const strictlyAbove = pathsFinishingAtLeast(p.steps, gap + 1);
    const totalPaths = Math.pow(2, p.steps);
    return {
      gap,
      gapAbove: gap + 1,
      atOrAbove,
      strictlyAbove,
      touchingPaths: atOrAbove + strictlyAbove,
      totalPaths,
      endsAtOrAbove: round(atOrAbove / totalPaths),
      answer: round((atOrAbove + strictlyAbove) / totalPaths),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A desk's inventory sits at ${fmtNum(p.start)} lots and changes by exactly one lot after every trade, up or down ` +
    `with equal probability. A risk limit sits at ${fmtNum(p.barrier)} lots — that is ${fmtNum(d.gap)} lots above where ` +
    `inventory stands now. Over the next ${fmtNum(p.steps)} trades, what is the probability the limit is touched at ` +
    `least once? (Touching it does not stop the trading.)`,
  solution: (p, d) => [
    { title: "Touching is not the same as finishing there", body: `The walk can touch the limit and come back, so counting only the paths that END at or above it undercounts. Write $T$ for the highest level reached and $X$ for the level at the end: what is wanted is a statement about $T$, and only $X$ has a binomial distribution.` },
    { title: "Reflect the paths that came back", body: `Take any path that touches the limit and then finishes below it. Flip every move after the first touch. That maps it to a path finishing strictly ABOVE the limit — reversibly, and one to one. So the paths that touch and come back are exactly as numerous as the paths that finish strictly above.` },
    { title: "Count both groups as paths, not probabilities", body: `Of the $2^{${fmtNum(p.steps)}}=${fmtNum(d.totalPaths)}$ equally likely paths, ${fmtNum(d.atOrAbove)} finish ${fmtNum(d.gap)} or more above the start, and ${fmtNum(d.strictlyAbove)} finish ${fmtNum(d.gapAbove)} or more above it. Counting whole paths keeps this exact — adding two rounded probabilities would not.` },
    { title: "Answer", body: `Touching paths number $${fmtNum(d.atOrAbove)}+${fmtNum(d.strictlyAbove)}=${fmtNum(d.touchingPaths)}$, so the probability is $\\dfrac{${fmtNum(d.touchingPaths)}}{${fmtNum(d.totalPaths)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The answer must beat the chance of simply finishing at or above the limit, since every such path touched it on the way: $${fmtNum(d.answer)}>${fmtNum(d.endsAtOrAbove)}$. How much bigger depends on where the limit sits — near the middle of the walk's range the reflected group is nearly as large as the direct one and the probability roughly doubles, while for a limit far out almost nothing can overshoot it and the two nearly coincide.` },
  ],
  keyInsight: "Reflection turns a question about the running maximum, which has no simple distribution, into two questions about the endpoint, which is just a binomial. The trick is that flipping the path after its first touch is an exact pairing, so nothing is approximated away.",
  commonTrap: "Answering with the probability of FINISHING at or above the barrier, which ignores every path that touched and retreated and understates the answer by roughly half. The other slip is doubling that probability exactly, which over-counts the paths that land precisely on the barrier.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [2],
};
