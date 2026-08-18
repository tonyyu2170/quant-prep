import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Multiset permutations: count as if every item were distinct, then divide by the
// factorial of each repeated block. The Sanity check re-derives the same total by
// a different route — choosing which positions each colour occupies.
export const repeatedLetters: ProblemTemplate = {
  id: "counting/repeated-letters",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.4 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic anagram / multiset-permutation count with repeated indistinguishable items" },
  params: {
    red: { range: { min: 2, max: 6, step: 1 } },
    blue: { range: { min: 1, max: 5, step: 1 } },
    green: { range: { min: 1, max: 5, step: 1 } },
  },
  // Caps the mast at eight flags: the Python counterpart enumerates every ordering,
  // and 8! orderings is the largest set worth walking through. That cap is the
  // binding one, so the colour ranges are spread wide underneath it — the answer
  // depends only on the multiset of colour counts, and a narrow spread collapses
  // permutations of the same multiset onto identical answers. Red stays at two or
  // more so the divide-out step never degenerates to dividing by one.
  constraint: (p) => p.red + p.blue + p.green <= 8,
  derived: (p) => {
    const fact = (m: number) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    const choose = (m: number, j: number) => { let num = 1; for (let i = 0; i < j; i++) num *= m - i; return num / fact(j); };
    const total = p.red + p.blue + p.green;
    const redFact = fact(p.red);
    const blueFact = fact(p.blue);
    const greenFact = fact(p.green);
    const divisor = redFact * blueFact * greenFact;
    const afterRed = total - p.red;
    const pickRed = choose(total, p.red);
    const pickBlue = choose(afterRed, p.blue);
    return {
      total,
      totalFact: fact(total),
      redFact,
      blueFact,
      greenFact,
      divisor,
      ways: fact(total) / divisor,
      afterRed,
      pickRed,
      pickBlue,
      posProduct: pickRed * pickBlue,
    };
  },
  statement: (p, d) =>
    `A ship's signal mast flies ${fmtNum(d.total)} flags stacked in one vertical line. The flags come in three colours — ${fmtNum(p.red)} red, ${fmtNum(p.blue)} blue and ${fmtNum(p.green)} green — ` +
    `and two flags of the same colour are identical, so swapping them changes nothing an observer can see. How many distinguishable signals can the mast fly?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Two hoists look the same exactly when the colour reads the same top to bottom. Positions are distinguishable (top is not bottom); flags of one colour are not.` },
    { title: "Pretend every flag is distinct", body: `Tag the flags with tiny serial numbers for a moment. Then all ${fmtNum(d.total)} are different and there are $${fmtNum(d.total)}!=${fmtNum(d.totalFact)}$ orderings.` },
    { title: "Divide out the invisible swaps", body: `Peeling the tags off, one visible signal corresponds to $${fmtNum(p.red)}!\\times${fmtNum(p.blue)}!\\times${fmtNum(p.green)}!=${fmtNum(d.redFact)}\\times${fmtNum(d.blueFact)}\\times${fmtNum(d.greenFact)}=${fmtNum(d.divisor)}$ tagged orderings — shuffle the reds among their own slots, the blues among theirs, the greens among theirs. So the visible count is $${fmtNum(d.totalFact)}/${fmtNum(d.divisor)}=${fmtNum(d.ways)}$.` },
    { title: "Sanity check", body: `Build a signal a different way: choose which ${fmtNum(p.red)} of the ${fmtNum(d.total)} positions are red in $\\binom{${fmtNum(d.total)}}{${fmtNum(p.red)}}=${fmtNum(d.pickRed)}$ ways, then which ${fmtNum(p.blue)} of the remaining ${fmtNum(d.afterRed)} are blue in $\\binom{${fmtNum(d.afterRed)}}{${fmtNum(p.blue)}}=${fmtNum(d.pickBlue)}$ ways; green fills whatever is left, with nothing more to choose. That route gives $${fmtNum(d.pickRed)}\\times${fmtNum(d.pickBlue)}=${fmtNum(d.posProduct)}$ — the same total, reached without ever writing a factorial of ${fmtNum(d.total)}.` },
  ],
  keyInsight: "Identical items collapse whole blocks of orderings into a single visible outcome, so count as though everything were distinct and then divide by the number of ways the identical items could be shuffled among themselves.",
  commonTrap: "Dividing only by the factorial of the colour that repeats most, or subtracting the repeats instead of dividing them out — every colour contributes its own factorial to the divisor, and the correction is multiplicative.",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [],
};
