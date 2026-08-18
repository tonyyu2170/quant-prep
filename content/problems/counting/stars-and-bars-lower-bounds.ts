import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Stars and bars with a floor under every bin: pay the minimums up front, then run
// the unrestricted count on what is left. The Sanity check prices the same split
// with the floors removed, which must come out strictly larger — the direction that
// catches a minimum added where it should have been subtracted.
export const starsAndBarsLowerBounds: ProblemTemplate = {
  id: "counting/stars-and-bars-lower-bounds",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "stars and bars with a per-bin lower bound, reduced to the unrestricted case" },
  params: {
    units: { range: { min: 15, max: 30, step: 1 } },
    labs: { range: { min: 3, max: 5, step: 1 } },
    minEach: { range: { min: 2, max: 4, step: 1 } },
  },
  // The surplus must clear the number of labs comfortably: with less left over the
  // count collapses toward its floor and the problem stops being about the
  // reduction at all. Three spare units is the smallest surplus worth counting.
  constraint: (p) => p.units - p.labs * p.minEach >= 3,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const committed = p.labs * p.minEach;
    const surplus = p.units - committed;
    const bars = p.labs - 1;
    const slots = surplus + bars;
    return {
      committed,
      surplus,
      bars,
      slots,
      ways: choose(slots, bars),
      freeSlots: p.units + bars,
      freeWays: choose(p.units + bars, bars),
    };
  },
  statement: (p) =>
    `A foundation splits ${fmtNum(p.units)} identical grant units among ${fmtNum(p.labs)} research labs. The units are indistinguishable, so a split is described entirely by how many each lab receives. ` +
    `Every lab must receive at least ${fmtNum(p.minEach)} units; above that floor there is no restriction, and a lab may receive any number. In how many ways can the foundation split the grant?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Identical units into distinguishable labs: a split is just a list of lab totals. The floor is the only obstacle, so remove it first.` },
    { title: "Pay the minimums up front", body: `Hand every lab its ${fmtNum(p.minEach)} guaranteed units immediately. That commits $${fmtNum(p.labs)}\\times${fmtNum(p.minEach)}=${fmtNum(d.committed)}$ units and leaves $${fmtNum(p.units)}-${fmtNum(d.committed)}=${fmtNum(d.surplus)}$ to hand out with no floor at all. Every legal split corresponds to exactly one unrestricted split of that surplus.` },
    { title: "Count the unrestricted split", body: `Write the ${fmtNum(d.surplus)} surplus units in a row and place ${fmtNum(d.bars)} dividers among them to mark where one lab's share ends and the next begins. The row of units and dividers has $${fmtNum(d.surplus)}+${fmtNum(d.bars)}=${fmtNum(d.slots)}$ positions, and choosing which hold the dividers fixes the split: $\\binom{${fmtNum(d.slots)}}{${fmtNum(d.bars)}}=${fmtNum(d.ways)}$ ways.` },
    { title: "Sanity check", body: `Price the same question with the floor lifted, so a lab may receive nothing: the identical row argument on all ${fmtNum(p.units)} units gives $\\binom{${fmtNum(d.freeSlots)}}{${fmtNum(d.bars)}}=${fmtNum(d.freeWays)}$. A requirement can only rule splits out, never create them, so the answer has to land strictly below that figure — and $${fmtNum(d.ways)} < ${fmtNum(d.freeWays)}$. Adding the committed units instead of subtracting them would push the count above it.` },
  ],
  keyInsight: "A per-bin minimum is not a new counting problem: giving every bin its floor first is a reversible relabelling that turns the constrained split into an unrestricted split of the surplus, which the divider argument already counts.",
  commonTrap: "Running the divider count on the full pile and hoping the floor takes care of itself, which counts splits that starve a lab below its minimum and therefore reports far too many.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [],
};
