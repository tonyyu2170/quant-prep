import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The combinations opener: count ordered picks, then divide out the orderings.
// `nMinus1` and `lastFactor` exist purely so the prose can name the first and
// last factors of the falling product — every digit in text must be traceable.
export const committeeSelection: ProblemTemplate = {
  id: "counting/committee-selection",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "sig", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic combinations opener: choosing an unordered committee from a pool" },
  params: {
    n: { range: { min: 8, max: 16, step: 1 } },
    k: { range: { min: 3, max: 6, step: 1 } },
  },
  // k < n-k forces complement > k strictly: without it, n = 2k draws make the
  // Sanity check render the vacuous identity C(n,k) = C(n,k).
  constraint: (p) => p.k < p.n - p.k,
  derived: (p) => {
    let ordered = 1;
    for (let i = 0; i < p.k; i++) ordered *= p.n - i;
    let kFact = 1;
    for (let i = 2; i <= p.k; i++) kFact *= i;
    return {
      ordered,
      kFact,
      ways: ordered / kFact,
      complement: p.n - p.k,
      nMinus1: p.n - 1,
      lastFactor: p.n - p.k + 1,
    };
  },
  statement: (p) =>
    `A trading desk has ${fmtNum(p.n)} analysts. The desk lead needs a committee of ${fmtNum(p.k)} of them to review risk models, ` +
    `and all ${fmtNum(p.k)} seats are identical — the committee has no chair and no ranks. How many distinct committees can be formed?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Order does not matter: swapping two analysts between identical seats leaves the same committee. So this is a combination, not a permutation.` },
    // At k = 3 the falling product is written out in full: an ellipsis there would
    // sit between two adjacent factors with nothing hidden between them.
    { title: "Count ordered picks first", body: `Pretend the seats are numbered and fill them one at a time: $${
      p.k === 3 ? `${fmtNum(p.n)}\\times${fmtNum(d.nMinus1)}\\times${fmtNum(d.lastFactor)}`
      : `${fmtNum(p.n)}\\times${fmtNum(d.nMinus1)}\\times\\cdots\\times${fmtNum(d.lastFactor)}`
    }=${fmtNum(d.ordered)}$ ordered picks.` },
    { title: "Divide out the ordering", body: `Each committee got counted once for every way to order its members, which is $${fmtNum(p.k)}!=${fmtNum(d.kFact)}$ times. So the number of distinct committees is $${fmtNum(d.ordered)}/${fmtNum(d.kFact)}=${fmtNum(d.ways)}$.` },
    { title: "Sanity check", body: `Choosing ${fmtNum(p.k)} analysts to include is the same act as choosing ${fmtNum(d.complement)} to leave out, so $\\binom{${fmtNum(p.n)}}{${fmtNum(p.k)}}=\\binom{${fmtNum(p.n)}}{${fmtNum(d.complement)}}$ must hold — and both count ${fmtNum(d.ways)}.` },
  ],
  keyInsight: "Counting ordered picks first and then dividing by the number of orderings within each group is the whole idea behind combinations — it converts an awkward unordered count into an easy ordered one plus a correction factor.",
  commonTrap: "Reporting the ordered count, which treats the seats as distinguishable even though the problem says they are identical, overcounting each committee once for every way to arrange its members.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [],
};
