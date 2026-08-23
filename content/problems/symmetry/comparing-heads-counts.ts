import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// P(tie) = sum_k C(a,k)C(b,k) / 2^(a+b), and Vandermonde collapses that sum to C(a+b,a):
// picking k heads from A and k from B is picking a heads-set from the pooled a+b flips, once
// B's chosen positions are read as the ones he left TAILS.
//
// Deliberately NOT the "who gets strictly more heads" question. That one is only a half minus
// half the tie when the two flip counts are EQUAL — the exchange argument needs the two
// players to be exchangeable. At 24 flips against 4 the leader is nearly certain, not even
// money, and an earlier draft of this template shipped that error until the Python counterpart
// disagreed with it.
export const comparingHeadsCounts: ProblemTemplate = {
  id: "symmetry/comparing-heads-counts",
  version: 1,
  firms: [{ firm: "jane-street", weight: 0.45 }, { firm: "sig", weight: 0.35 }, { firm: "hrt", weight: 0.25 }],
  topic: "probability/symmetry",
  difficulty: 3,
  source: { kind: "free-resource", inspiration: "two players flipping unequal numbers of fair coins and tying on head count" },
  params: {
    flipsA: { range: { min: 4, max: 24, step: 1 } },
    flipsB: { range: { min: 4, max: 24, step: 1 } },
    contests: { choices: [20, 50, 100, 250, 500] },
  },
  derived: (p) => {
    const total = p.flipsA + p.flipsB;
    let tieWays = 1;
    for (let i = 0; i < p.flipsA; i++) tieWays = (tieWays * (total - i)) / (i + 1);
    tieWays = Math.round(tieWays);
    const totalWays = Math.pow(2, total);
    const tieProb = tieWays / totalWays;
    return { total, tieWays, totalWays, tieProb, ev: p.contests * tieProb };
  },
  statement: (p) =>
    `Two traders settle arguments with coins. In each contest Ana flips ${fmtNum(p.flipsA)} fair coins and Bruno flips ${fmtNum(p.flipsB)} fair coins, all independently, and each counts their own heads. A contest is a draw when the two head counts come out equal. Over ${fmtNum(p.contests)} such contests, how many draws should they expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Write the draw as a sum", body: `A draw means both counted the same number of heads, say $k$ each. Summing over $k$, the number of ways is a sum of products of two binomial coefficients — one for Ana's flips, one for Bruno's.` },
    { title: "Turn Bruno's heads into tails", body: `Instead of recording which of Bruno's flips came up heads, record which came up tails. If Ana had $k$ heads and Bruno had $k$ heads, then Bruno has exactly ${fmtNum(p.flipsB)} minus $k$ tails, so together the two chosen sets have ${fmtNum(p.flipsA)} members in total, whatever $k$ was.` },
    { title: "So the sum is a single coefficient", body: `That correspondence is reversible, so drawing is the same as choosing ${fmtNum(p.flipsA)} positions out of all ${fmtNum(d.total)} flips pooled together — the whole sum collapses to $\\binom{${fmtNum(d.total)}}{${fmtNum(p.flipsA)}}=${fmtNum(d.tieWays)}$.` },
    { title: "Divide by the sample space", body: `All ${fmtNum(d.total)} flips are fair and independent, giving $${fmtNum(d.totalWays)}$ equally likely outcomes, so a single contest is drawn with probability $\\frac{${fmtNum(d.tieWays)}}{${fmtNum(d.totalWays)}}=${fmtNum(d.tieProb)}$.` },
    { title: "Count the contests", body: `Expectation adds across contests, so over ${fmtNum(p.contests)} of them the expected number of draws is ${fmtNum(d.ev)}.` },
    { title: "Sanity check", body: `Draws are commonest when the two flip counts match and become very unlikely when they are far apart, since a lopsided pair of counts has to travel a long way to meet. The answer never exceeds ${fmtNum(p.contests)}, the number of contests played.` },
  ],
  keyInsight: "Recording Bruno's tails rather than his heads turns a sum of products of binomial coefficients into a single choice from the pooled flips — Vandermonde's identity as a relabelling rather than an algebraic manipulation.",
  commonTrap: "Assuming the trader with more coins is more likely to lead, then trying to price that with a normal approximation. Worse, assuming the two strict orderings are equally likely: that needs the two flip counts to be EQUAL, and is badly wrong when they are not.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
};
