import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the joint space the
// Python counterpart enumerates has to stay inside the enumeration budget) and never asks the
// answer, so a helper would be a second copy of the product for nothing. Constraint 2's floor
// cannot bind — enumerated over the legal space |answer| runs [8, 405].
// A sum of a random number of random pieces. Both averages are halves of whole numbers, so
// every chain is written over a common denominator of four and no printed decimal is ever an
// operand. The Sanity check re-derives the answer by conditioning on the delivery size instead
// of multiplying two averages, and both of its endpoints land on exact halves, so they can be
// re-read as literals in the midpoint chain.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const waldRandomSum: ProblemTemplate = {
  id: "ev-variance/wald-random-sum",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "Wald's identity — the expected total of a random number of independent pieces" },
  params: {
    boxes: { range: { min: 3, max: 8, step: 1 } },
    items: { range: { min: 3, max: 8, step: 1 } },
    rate: { range: { min: 2, max: 20, step: 1 } },
  },
  // The Python counterpart walks the whole joint space of (delivery size, contents of each
  // box), which is the assigned independent path and grows as items to the power of boxes.
  // Constraint 7 caps an enumeration at about 1e5 atoms; 3e4 keeps the slowest draw well
  // inside it with 25 instances verified per problem.
  constraint: (p) => Math.pow(p.items, p.boxes) <= 3e4,
  derived: (p) => ({
    meanBoxes: (p.boxes + 1) / 2,
    meanItems: (p.items + 1) / 2,
    meanTotalItems: ((p.boxes + 1) * (p.items + 1)) / 4,
    lowTotal: (p.rate * (p.items + 1)) / 2,
    highTotal: (p.rate * p.boxes * (p.items + 1)) / 2,
    ev: (p.rate * (p.boxes + 1) * (p.items + 1)) / 4,
  }),
  statement: (p) =>
    `A courier drops off a random number of boxes at a stall: the number of boxes is equally likely to be anything from ` +
    `1 up to ${fmtNum(p.boxes)}. Each box independently holds a random number of items, equally likely to be anything from ` +
    `1 up to ${fmtNum(p.items)}. Every item sells for ${fmtNum(p.rate)} dollars. What is the expected total value of one ` +
    `delivery, in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Two random things stacked", body: `Nothing here is fixed: the delivery brings $\\frac{${fmtNum(p.boxes)}+1}{2}=${fmtNum(d.meanBoxes)}$ boxes on average, and each box that arrives holds $\\frac{${fmtNum(p.items)}+1}{2}=${fmtNum(d.meanItems)}$ items on average.` },
    // Both averages land on an exact half, but they are still combined over a common
    // denominator of four rather than multiplied as printed decimals: at seven boxes of six
    // items the printed averages are 4 and 3.5, and it is only luck that the product of those
    // two roundings agrees with the answer on this draw.
    { title: "Why the two averages simply multiply", body: `How many boxes turn up is settled without any regard to what is inside them, so every box that arrives brings a full average box-load with it, however many others came along. The delivery therefore averages $\\frac{(${fmtNum(p.boxes)}+1)\\times(${fmtNum(p.items)}+1)}{4}=${fmtNum(d.meanTotalItems)}$ items, and a bigger delivery is not made up of smaller boxes.` },
    { title: "Price the items", body: `At ${fmtNum(p.rate)} dollars an item that is $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.boxes)}+1)\\times(${fmtNum(p.items)}+1)}{4}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Rebuild it by conditioning on the delivery size instead of multiplying two averages. A single box is worth $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.items)}+1)}{2}=${fmtNum(d.lowTotal)}$ dollars and the largest delivery is worth $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.boxes)}\\times(${fmtNum(p.items)}+1)}{2}=${fmtNum(d.highTotal)}$ dollars, and since every delivery size in between is equally likely and evenly spaced along that line, the average is simply the midpoint: $\\frac{${fmtNum(d.lowTotal)}+${fmtNum(d.highTotal)}}{2}=${fmtNum(d.ev)}$ dollars, matching. That also settles the direction of the common error: $${fmtNum(d.ev)}<${fmtNum(d.highTotal)}$, so pricing every delivery as though it arrived at full size overstates the stall's takings.` },
  ],
  keyInsight: "When a random number of independent pieces are added up, the two sources of randomness multiply rather than interfering: the expected total is the expected count times the expected size of a piece. What licenses that shortcut is that the count is settled without reference to the sizes — if larger deliveries came in smaller boxes the product would be wrong, and the joint behaviour would have to be worked out piece by piece.",
  commonTrap: "Pricing the delivery as though the courier always turned up with a full load, which quietly replaces the average count with the largest one. The count is the thing that is random here, and its average sits below its maximum on every draw, so the full-load figure is an upper bound and never the expectation.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  // 1 is the smallest delivery and the smallest box, and the offset in both averages; 2 is the
  // halving in each of them; 4 is the common denominator once the two are multiplied.
  constants: [1, 2, 4],
};
