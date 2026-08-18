import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Pigeonhole in its extremal form: build the largest haul that still fails, then add
// one. The Sanity check prices the same guarantee one reel lower; the two answers
// must differ by exactly the number of colours, which pins the slope of the rule
// rather than restating it.
export const pigeonholeExtremal: ProblemTemplate = {
  id: "counting/pigeonhole-extremal",
  version: 1,
  topic: "probability/counting",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "pigeonhole guarantee: the worst case is the largest configuration that still fails" },
  params: {
    colours: { range: { min: 3, max: 8, step: 1 } },
    need: { range: { min: 3, max: 6, step: 1 } },
    perColour: { range: { min: 6, max: 12, step: 1 } },
  },
  // Stock must exceed the requirement with room to spare, so the guarantee is set by
  // the pigeonhole argument rather than by running out of reels of some colour.
  constraint: (p) => p.perColour >= p.need + 2,
  derived: (p) => ({
    stock: p.colours * p.perColour,
    needLess1: p.need - 1,
    needLess2: p.need - 2,
    worst: (p.need - 1) * p.colours,
    ways: (p.need - 1) * p.colours + 1,
    easier: (p.need - 2) * p.colours + 1,
    gap: p.colours,
  }),
  statement: (p, d) =>
    `An unlit storeroom holds ${fmtNum(d.stock)} cable reels: ${fmtNum(p.perColour)} reels in each of ${fmtNum(p.colours)} colours. A technician takes reels off the shelf one at a time and cannot make out any colour in the dark. ` +
    `How many reels must the technician carry out to be certain of having ${fmtNum(p.need)} reels of one and the same colour?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `"Certain" rules out luck: the number must work even against the worst possible draw. So find the largest haul that can still fail, and the answer is one more than that.` },
    { title: "Build the worst haul", body: `A haul fails only if every colour appears at most ${fmtNum(d.needLess1)} times. The largest such haul takes ${fmtNum(d.needLess1)} reels of every colour, $${fmtNum(d.needLess1)}\\times${fmtNum(p.colours)}=${fmtNum(d.worst)}$ reels in total — and the shelves hold ${fmtNum(p.perColour)} of each colour, so that haul really is available.` },
    { title: "Take one more", body: `Any further reel has to be some colour, and that colour already appears ${fmtNum(d.needLess1)} times in the worst haul, so it reaches ${fmtNum(p.need)}. Below ${fmtNum(d.ways)} reels the worst haul is still possible, so ${fmtNum(d.ways)} is the smallest number that guarantees it.` },
    { title: "Sanity check", body: `Ask for one reel less of a colour: the same argument gives $${fmtNum(d.needLess2)}\\times${fmtNum(p.colours)}+1=${fmtNum(d.easier)}$. Each extra reel demanded of a single colour costs exactly one more reel per colour in the worst case, so the two answers must differ by the number of colours: $${fmtNum(d.ways)}-${fmtNum(d.easier)}=${fmtNum(d.gap)}$. A guarantee built from the total stock instead of the worst case would not track that way.` },
  ],
  keyInsight: "A guarantee question is an extremal question in disguise: the answer is one past the largest configuration that avoids the target, so the work is constructing that configuration rather than reasoning about likelihood.",
  commonTrap: "Multiplying the requirement by the number of colours, which describes a haul that already holds the required run of every colour — far more than certainty demands, since only one colour has to get there.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
