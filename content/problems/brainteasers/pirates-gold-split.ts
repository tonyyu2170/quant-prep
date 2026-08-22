import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Backward induction from two pirates: the proposer needs floor((n-1)/2) supporters and buys
// each with a single coin, keeping the rest.
export const piratesGoldSplit: ProblemTemplate = {
  id: "brainteasers/pirates-gold-split",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "citadel", weight: 0.3 }, { firm: "de-shaw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the pirate coin-splitting problem" },
  params: {
    pirates: { range: { min: 3, max: 21, step: 1 } },
    coins: { range: { min: 60, max: 400, step: 5 } },
  },
  derived: (p) => {
    const bribes = Math.floor((p.pirates - 1) / 2);
    return { bribes, answer: p.coins - bribes, votesNeeded: bribes + 1, crewAfter: p.pirates - 1 };
  },
  statement: (p) =>
    `${fmtNum(p.pirates)} perfectly rational pirates, ranked strictly by seniority, must divide ${fmtNum(p.coins)} gold coins. The most senior proposes a split; all pirates vote, and the proposal passes on a tie or better. If it fails the proposer is thrown overboard and the next most senior proposes. Every pirate wants gold above all, and prefers fewer rivals when the gold is equal. How many coins does the most senior pirate keep?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Start from the end, not the start", body: `With two pirates left the senior takes everything: their own vote ties, and a tie passes. Knowing that, the third-most-senior can buy the most junior pirate's vote with a single coin, since that pirate gets nothing in the two-pirate case.` },
    { title: "The pattern repeats", body: `Each step down alternates who gets nothing, so at every stage the proposer can buy exactly the pirates who would be left out of the next proposal — and one coin each is enough, because their alternative is zero.` },
    { title: "Count the votes needed", body: `With ${fmtNum(p.pirates)} pirates the proposer needs ${fmtNum(d.votesNeeded)} votes to reach a tie, one of which is their own. That leaves ${fmtNum(d.bribes)} to buy.` },
    { title: "Pay the minimum", body: `One coin apiece is enough, so the proposer keeps $${p.coins}-${d.bribes}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Adding one more pirate does not always cost the proposer more: bribes go up only every SECOND pirate added, because a tie already passes.` },
  ],
  keyInsight: "Solve backward from the smallest case. Each pirate's vote is priced against what they would get from the next proposal, and that is usually nothing.",
  commonTrap: "Assuming the proposer must win a strict majority, or must offer a fair-looking share. A tie passes, and a single coin beats zero for a rational pirate.",
  expectedPaceS: 190,
  verify: { method: "brute-force" },
};
