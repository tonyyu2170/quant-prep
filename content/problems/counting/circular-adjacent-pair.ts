import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Adjacency at a round table. The number of guests is deliberately a free
// parameter: it never enters the answer, which is the lesson. The Sanity check
// counts the non-neighbouring chairs separately and asks the two to close to one.
export const circularAdjacentPair: ProblemTemplate = {
  id: "counting/circular-adjacent-pair",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic round-table seating question: chance two named people sit side by side" },
  params: {
    chairs: { range: { min: 6, max: 17, step: 1 } },
    guests: { range: { min: 3, max: 8, step: 1 } },
  },
  // Cannot seat more guests than chairs. At least three guests keeps the room from
  // collapsing to just the two people the question is about. Six chairs is the
  // floor because at five the non-neighbouring chairs number two as well, and the
  // Sanity check would restate the answer's own fraction instead of checking it.
  // The answer moves with `chairs` alone, so its range carries the whole spread of
  // distinct answers — twelve of them.
  constraint: (p) => p.guests <= p.chairs,
  derived: (p) => ({
    otherChairs: p.chairs - 1,
    farChairs: p.chairs - 3,
    prob: 2 / (p.chairs - 1),
    probNot: (p.chairs - 3) / (p.chairs - 1),
  }),
  statement: (p) =>
    `A private dining room has ${fmtNum(p.chairs)} chairs spaced evenly around one round table. A party of ${fmtNum(p.guests)} guests, among them Ana and Ben, walks in and takes chairs at random, with every seating equally likely; any chairs left over stay empty. ` +
    `What is the probability that Ana and Ben end up in neighbouring chairs — that is, chairs with no chair between them?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The event names only two people. Where the other guests land, and which chairs are left empty, cannot make Ana and Ben neighbours or stop them being neighbours — so the rest of the room can be dropped from the problem before any counting starts.` },
    { title: "Pin Ana down", body: `Every chair around a round table looks like every other, so it costs nothing to condition on Ana's chair, whichever it turns out to be. Given that, Ben is equally likely to be in any of the other ${fmtNum(d.otherChairs)} chairs.` },
    { title: "Count the chairs that work", body: `On a circle every chair has exactly two neighbours, one on each side, so ${fmtNum(2)} of the ${fmtNum(d.otherChairs)} chairs open to Ben are next to Ana. The probability is $${fmtNum(2)}/${fmtNum(d.otherChairs)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Count the other side of the ledger from scratch: strike Ana's own chair and her two neighbours off the ${fmtNum(p.chairs)} chairs and ${fmtNum(d.farChairs)} remain, all of them too far away. That makes the chance they are not neighbours $${fmtNum(d.farChairs)}/${fmtNum(d.otherChairs)}=${fmtNum(d.probNot)}$, and the two chances have to account for every seating between them: $${fmtNum(d.prob)}+${fmtNum(d.probNot)}=${fmtNum(1)}$.` },
  ],
  keyInsight: "Only the relative position of the two named people matters, so the size of the party and the empty chairs drop out entirely — fix one person anywhere and the other's chair is uniform over everything left, which reduces a seating problem to counting neighbours.",
  commonTrap: "Counting neighbours as though the table were a straight row, which misses the pair that wraps around from the last chair back to the first, or grinding through full seating arrangements of the whole party when almost all of that work cancels.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
