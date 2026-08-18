import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Forbidden adjacency by the gap method: seat the unreserved bays first, then drop
// the reserved ones into separate gaps. The Sanity check splits on whether the last
// bay is reserved and adds the two disjoint cases, which reproduces the count
// through a recurrence rather than through the same binomial.
export const adjacencyForbiddenGap: ProblemTemplate = {
  id: "counting/adjacency-forbidden-gap",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic no-two-adjacent selection along a row, solved by counting gaps" },
  params: {
    spaces: { range: { min: 10, max: 20, step: 1 } },
    reserved: { range: { min: 2, max: 5, step: 1 } },
  },
  // Two reserved bays per free bay plus one would make the row exactly tight, with
  // only the alternating placement left and the last-bay split degenerating to a
  // single case. Demanding one bay of slack keeps both cases of the Sanity check
  // populated and keeps the count off its floor.
  constraint: (p) => 2 * p.reserved <= p.spaces - 1,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const freeBays = p.spaces - p.reserved;
    const gaps = freeBays + 1;
    const tailFree = choose(freeBays, p.reserved);
    const tailUsed = choose(freeBays, p.reserved - 1);
    return {
      freeBays,
      gaps,
      ways: choose(gaps, p.reserved),
      allPlacements: choose(p.spaces, p.reserved),
      tailFree,
      tailUsed,
      caseSum: tailFree + tailUsed,
      reservedLess1: p.reserved - 1,
    };
  },
  statement: (p) =>
    `A parking deck has ${fmtNum(p.spaces)} bays in one straight row. Management wants to reserve ${fmtNum(p.reserved)} of them for charging points, ` +
    `and no two reserved bays may sit side by side — each charging point needs the bay next to it free so the cable can reach across. ` +
    `The reserved bays are otherwise interchangeable, so all that matters is which bays are picked. How many different sets of bays can be reserved?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Only the set of chosen bays matters, not any order among them, so this is a selection. The adjacency rule is what makes it more than a plain selection.` },
    { title: "Lay out the free bays first", body: `Put down the ${fmtNum(d.freeBays)} bays that stay unreserved, in a row. They create ${fmtNum(d.gaps)} slots where a reserved bay could go: one before the first free bay, one after the last, and one in each space between neighbouring free bays.` },
    { title: "Drop the reserved bays into separate slots", body: `Two reserved bays land side by side exactly when they share a slot, so give each its own: choose ${fmtNum(p.reserved)} of the ${fmtNum(d.gaps)} slots, in $\\binom{${fmtNum(d.gaps)}}{${fmtNum(p.reserved)}}=${fmtNum(d.ways)}$ ways. Every legal reservation arises exactly once this way, so that is the count — and it sits well below the $\\binom{${fmtNum(p.spaces)}}{${fmtNum(p.reserved)}}=${fmtNum(d.allPlacements)}$ selections available if adjacency were allowed.` },
    { title: "Sanity check", body: `Count again by splitting on the last bay in the row. If it stays free, the reserved bays all fit in the shorter row before it, giving $\\binom{${fmtNum(d.freeBays)}}{${fmtNum(p.reserved)}}=${fmtNum(d.tailFree)}$ legal sets. If it is reserved, its neighbour must stay free and the remaining ${fmtNum(d.reservedLess1)} go into the row before that, giving $\\binom{${fmtNum(d.freeBays)}}{${fmtNum(d.reservedLess1)}}=${fmtNum(d.tailUsed)}$. The two cases cannot both happen and nothing else can, so they must add to the answer: $${fmtNum(d.tailFree)}+${fmtNum(d.tailUsed)}=${fmtNum(d.caseSum)}$.` },
  ],
  keyInsight: "A forbidden-adjacency selection becomes an ordinary selection once the unchosen items are placed first: they carve the row into slots, and putting at most one chosen item in each slot enforces the separation automatically.",
  commonTrap: "Counting all selections and subtracting the ones with an adjacent pair by hand, which double subtracts the selections holding two separate adjacent pairs and misses nothing else — the gap construction sidesteps that bookkeeping entirely.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [],
};
