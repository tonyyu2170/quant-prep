import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Equal flip counts make the two lead events mirror images under swapping every coin, so
// P(A leads) = P(B leads) = (1 - P(tie))/2. Ties collapse by Vandermonde: C(2n,n) of them.
//
// Equal counts are load-bearing, not decoration. The half-minus-half-the-tie answer needs the
// two players to be EXCHANGEABLE; at 24 flips against 4 the bigger flipper wins almost surely
// and this template's answer is wrong by a factor that no content gate would notice. An earlier
// version of this file asked exactly that question and shipped the error until the Python
// counterpart disagreed with it.
//
// `contests` is the third axis and it is not padding: two axes give 84 tuples, and consecutive
// seeds are correlated enough in their first draw that 84 serves only 57 distinct texts per 100
// against a floor of 70. A drawn horizon also spreads the answers apart.
export const comparingHeadsCounts: ProblemTemplate = {
  id: "symmetry/comparing-heads-counts",
  version: 2,   // the shipped question changed: unequal flip counts and a draw count, to equal counts and a lead
  topic: "probability/symmetry",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.45 }, { firm: "citadel-securities", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "two people flip coins, probability one beats the other, by tie-and-swap symmetry" },
  params: {
    flipsEach: { range: { min: 4, max: 24, step: 1 } },
    bounty: { choices: [2, 5, 10, 25] },
    contests: { choices: [10, 20, 50, 100] },
  },
  derived: (p) => {
    const sumFlips = 2 * p.flipsEach;
    let comb = 1;
    for (let i = 0; i < p.flipsEach; i++) comb = (comb * (sumFlips - i)) / (i + 1);
    const tieWays = Math.round(comb);
    const totalWays = Math.pow(2, sumFlips);
    const tieProb = tieWays / totalWays;
    const leadProb = (totalWays - tieWays) / (2 * totalWays);
    return { sumFlips, tieWays, totalWays, tieProb, leadProb, ev: p.contests * p.bounty * leadProb };
  },
  statement: (p) =>
    `Two traders settle a dispute the old-fashioned way: Ana and Ben each flip their own fair coin ${fmtNum(p.flipsEach)} times, all flips independent, and each counts heads. A spectator pays Ana ${fmtNum(p.bounty)} dollars if she ends up with strictly more heads than Ben, and nothing otherwise (a tie pays nobody). Over ${fmtNum(p.contests)} such contests, what total payment should Ana expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Partition the joint outcomes", body: `Every pairing of the two flip sequences lands in exactly one of three events: Ana leads, Ben leads, or a tie. So $P(\\text{Ana leads})+P(\\text{Ben leads})+P(\\text{tie})=${fmtNum(1)}$.` },
    { title: "Swap every coin", body: `Flip all ${fmtNum(d.sumFlips)} coins over — heads become tails and tails heads. Ana's head count becomes ${fmtNum(p.flipsEach)} minus what it was, and so does Ben's, so an outcome where Ana led maps to one where Ben leads, and the map reverses. The two lead events are mirror images: equally likely.` },
    { title: "Count the ties", body: `Both showing $k$ heads happens in $\\binom{${fmtNum(p.flipsEach)}}{k}\\times\\binom{${fmtNum(p.flipsEach)}}{k}$ ways; summed over $k$ this collapses to $\\binom{${fmtNum(d.sumFlips)}}{${fmtNum(p.flipsEach)}}=${fmtNum(d.tieWays)}$ tied outcomes out of $${fmtNum(d.totalWays)}$ total, a tie chance of $\\frac{${fmtNum(d.tieWays)}}{${fmtNum(d.totalWays)}}=${fmtNum(d.tieProb)}$.` },
    { title: "Split the remainder", body: `The non-tie mass splits evenly between the two lead events, so Ana leads with probability $\\frac{${fmtNum(d.totalWays)}-${fmtNum(d.tieWays)}}{${fmtNum(2)}\\times${fmtNum(d.totalWays)}}=${fmtNum(d.leadProb)}$. Keeping the counts as integers rather than halving the rounded tie chance is what stops the last digit drifting.` },
    // No equality chain here on purpose: multiplying by the lead chance AS PRINTED drifts off
    // the answer at display precision — 10 times 2 times 0.3953 renders 7.906 against an answer
    // of 7.905, and the gate caught it on 77 draws. The product is stated instead, and the
    // exact-integer form of the same number is one step above for anyone checking it.
    { title: "Price the run", body: `Expectations add over contests whether or not the contests are related, so ${fmtNum(p.contests)} of them at ${fmtNum(p.bounty)} dollars a win come to ${fmtNum(d.ev)} dollars — that lead chance, multiplied by the bounty and by the number of contests.` },
    { title: "Sanity check", body: `Ties are genuinely possible, so the lead probability sits strictly below one half — and as the flip count grows the tie chance shrinks toward zero, dragging the lead chance up toward exactly one half. Both hold here, and the total stays strictly below the ${fmtNum(p.contests)} times ${fmtNum(p.bounty)} dollars an every-contest sweep would pay.` },
  ],
  keyInsight: "Never convolve the distribution of the head difference. Partition into leads-and-tie, note the two leads are mirror images under flipping every coin, and the entire answer hangs on counting ties — which Vandermonde collapses to a single binomial coefficient.",
  commonTrap: "Summing P(A has k more heads) across k with heavy algebra, or forgetting that ties pay nothing and answering with half the bounty flat.",
  expectedPaceS: 140,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
