import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (it holds the Python
// counterpart's sequence enumeration under 10^5) and never asks the expectation, so a helper
// would be a second copy of the answer formula for nothing. Constraint 2's floor cannot bind —
// measured over the legal space |answer| runs [3.333, 55.34].
// The coupon-collector count, done by indicators on what is MISSING: a design is absent only
// when every pack misses it, which independence turns into a plain power. Everything is kept
// as an integer power over the pack count, so the rate folds into the same fraction and the
// Sanity check can reconcile held against missing in integer numerators.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const distinctTypesCollected: ProblemTemplate = {
  id: "ev-variance/distinct-types-collected",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "the expected number of distinct coupons in a fixed number of packs, counted by indicators on the missing ones" },
  params: {
    types: { choices: [3, 4, 5, 6, 8, 10] },
    draws: { range: { min: 2, max: 6, step: 1 } },
    rate: { range: { min: 2, max: 15, step: 1 } },
  },
  // The whole sequence space is what the Python counterpart enumerates, so it has to stay
  // under the 10^5 atoms constraint 7 allows; 20000 leaves the widest (types, draws) pairs in
  // while keeping the enumeration instant.
  constraint: (p) => p.types ** p.draws <= 20000,
  derived: (p) => {
    const allNumer = p.types ** p.draws;
    const missNumer = (p.types - 1) ** p.draws;
    const distinct = (p.types * (allNumer - missNumer)) / allNumer;
    return {
      allNumer,
      missNumer,
      pMiss: missNumer / allNumer,
      distinct,
      missing: (p.types * missNumer) / allNumer,
      mostHeld: Math.min(p.types, p.draws),   // designs are capped by the smaller of set and packs
      capPay: p.rate * Math.min(p.types, p.draws),
      ev: (p.rate * p.types * (allNumer - missNumer)) / allNumer,
    };
  },
  statement: (p) =>
    `A promotion puts one of ${fmtNum(p.types)} collectible card designs into every pack, each design equally likely, ` +
    `and what one pack holds says nothing about what the others hold. You open ${fmtNum(p.draws)} packs. A dealer pays you ${fmtNum(p.rate)} dollars ` +
    `for every distinct design you end up holding, however many copies of it you have. What is your expected payout, ` +
    `in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Ask which designs are missing", body: `Counting the distinct designs directly means tracking which packs repeated each other, which is a mess. Counting the designs you failed to get is easy. Fix one design: a single pack misses it whenever it holds any of the others, and the packs are independent, so the design is absent from all of them with probability $\\frac{(${fmtNum(p.types)}-1)^{${fmtNum(p.draws)}}}{${fmtNum(p.types)}^{${fmtNum(p.draws)}}}=${fmtNum(d.pMiss)}$.` },
    // Every chain stays on the integer power counts, so the rate can be folded into the same
    // fraction; multiplying the printed average by the rate would drift off the printed answer.
    { title: "Add one indicator per design", body: `Every design has that same chance of being missed, so each contributes the complementary chance of being held, and expectations add whether or not the designs' fates are linked. The expected haul is $\\frac{${fmtNum(p.types)}\\times(${fmtNum(d.allNumer)}-${fmtNum(d.missNumer)})}{${fmtNum(d.allNumer)}}=${fmtNum(d.distinct)}$ designs.` },
    { title: "Price the haul", body: `At ${fmtNum(p.rate)} dollars a design, the expected payout in dollars is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.types)}\\times(${fmtNum(d.allNumer)}-${fmtNum(d.missNumer)})}{${fmtNum(d.allNumer)}}=${fmtNum(d.ev)}$.` },
    { title: "Sanity check", body: `Count the designs you are missing by the same argument: $\\frac{${fmtNum(p.types)}\\times${fmtNum(d.missNumer)}}{${fmtNum(d.allNumer)}}=${fmtNum(d.missing)}$ of them on average. Held and missing have to account for the whole set, and over a common denominator they do: $\\frac{${fmtNum(p.types)}\\times(${fmtNum(d.allNumer)}-${fmtNum(d.missNumer)})+${fmtNum(p.types)}\\times${fmtNum(d.missNumer)}}{${fmtNum(d.allNumer)}}=${fmtNum(p.types)}$. The payout is also short of the $${fmtNum(p.rate)}\\times${fmtNum(d.mostHeld)}=${fmtNum(d.capPay)}$ dollars it would take to hold ${
      p.draws <= p.types ? "a different design in every pack" : "the whole set"
    }, which is the most the promotion can ever pay.` },
  ],
  keyInsight: "Counting distinct types head-on means untangling which draws repeated each other; counting the types that are missing does not, because a type is absent only when every single draw misses it, and independence turns that into a plain power. Linearity then adds one indicator per type, even though whether one type shows up is plainly tangled with whether another does.",
  commonTrap: "Treating every pack as bringing a design not seen before, so the haul is just the number of packs opened. Repeats are common enough that the expected haul is strictly smaller, and the shortfall grows with every extra pack bought.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  // 1 is the design held back from the count of designs a single pack can miss.
  constants: [1],
};
