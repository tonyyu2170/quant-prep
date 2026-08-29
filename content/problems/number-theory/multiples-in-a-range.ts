import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` needs the least common multiple to pin an answer
// floor, and it never sees `derived`. This is the exact case the rule exists for.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));
const lcmOf = (a: number, b: number) => (a * b) / gcdOf(a, b);

export const multiplesInARange: ProblemTemplate = {
  id: "number-theory/multiples-in-a-range",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "counting multiples by division, then removing the overlap" },
  params: {
    upto: { choices: [200, 250, 300, 360, 400, 480, 500, 600, 660, 720, 800, 840, 900, 960, 1000, 1200] },
    // A PRIME `by` cannot survive the constraint at all: sharing a factor with a prime means
    // being a multiple of it, which the divides-conjunct then rejects. 3, 7 and 11 contributed
    // zero legal draws and only dragged the acceptance rate down, so they are composites now.
    // 13 was dead in `notBy` for the same reason — nothing in `by` shares a factor with it.
    by: { choices: [4, 6, 8, 9, 10, 12, 14, 15] },
    notBy: { choices: [5, 6, 8, 10, 14, 15, 20, 21] },
  },
  // The overlap conjunct guarantees it is non-empty. Without it one draw in 610 has no number
  // divisible by both, so nothing is struck out and the whole lesson is vacuous — and the
  // prose's "removing the overlap leaves fewer" becomes false on the page.
  //
  // The two conjuncts after `by !== notBy` are B24's, and both close a trap this template's own
  // prose names (tools/trap-audit.ts). Coprime sizes make the product EQUAL the least common
  // multiple, so "dividing by the product" was the right answer on 369 of 609 draws. And when
  // `by` divides `notBy` every multiple of the second is already a multiple of the first, so
  // striking the second list out whole removes nothing that was not counted — the trap wins
  // outright, and the sentence describing it is false on the page. `upto` was widened from ten
  // values to sixteen to pay for both: without that the space falls to 190 tuples and lands on
  // `maxRepeat` 4, exactly the emittedSpread ceiling, one draw-shift from failing CI.
  constraint: (p) => p.by !== p.notBy && gcdOf(p.by, p.notBy) > 1 && p.notBy % p.by !== 0 && Math.floor(p.upto / lcmOf(p.by, p.notBy)) >= 1 && Math.floor(p.upto / p.by) - Math.floor(p.upto / lcmOf(p.by, p.notBy)) >= 5,
  derived: (p) => {
    const shared = gcdOf(p.by, p.notBy);
    const both = lcmOf(p.by, p.notBy);
    return {
      shared,
      both,
      hitsBy: Math.floor(p.upto / p.by),
      hitsBoth: Math.floor(p.upto / both),
      answer: Math.floor(p.upto / p.by) - Math.floor(p.upto / both),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `How many whole numbers from 1 up to ${fmtNum(p.upto)} are divisible by ${fmtNum(p.by)} but NOT ` +
    `divisible by ${fmtNum(p.notBy)}?`,
  solution: (p, d) => [
    { title: "Count what you want, then remove what you do not", body: `Counting the multiples of $a$ up to $N$ is a single division: they are $a$, $2a$, $3a$ and so on, so there are as many as whole copies of $a$ that fit. The ones to exclude are those divisible by BOTH numbers, and the answer is one count less the other.` },
    { title: "The multiples of the first number", body: `Whole copies of ${fmtNum(p.by)} fitting inside ${fmtNum(p.upto)}: there are ${fmtNum(d.hitsBy)} of them, the largest being $${fmtNum(d.hitsBy)}\\times${fmtNum(p.by)}$, which is at most ${fmtNum(p.upto)}.` },
    { title: "What counts as being in both lists", body: `A number divisible by both is divisible by their least common multiple, NOT by their product — the shared factor would otherwise be counted twice. Here the two share ${fmtNum(d.shared)}, so the common multiple is $\\dfrac{${fmtNum(p.by)}\\times${fmtNum(p.notBy)}}{${fmtNum(d.shared)}}=${fmtNum(d.both)}$, and ${fmtNum(d.hitsBoth)} of those fit.` },
    { title: "Answer", body: `Removing the overlap leaves $${fmtNum(d.hitsBy)}-${fmtNum(d.hitsBoth)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The answer must be below the ${fmtNum(d.hitsBy)} multiples we started from, since we only ever removed: $${fmtNum(d.answer)}<${fmtNum(d.hitsBy)}$. And had the two numbers shared no factor at all, the common multiple would have been their full product and fewer would have been struck out.` },
  ],
  keyInsight: "Counting multiples is division with the remainder thrown away, and counting numbers divisible by two things means dividing by their least common multiple rather than their product. Using the product is the single most common slip, and it silently undercounts the overlap whenever the two share a factor.",
  commonTrap: "Excluding the multiples of the second number outright rather than only those that were in the first list, which removes numbers that were never counted. The other slip is dividing by the product instead of the least common multiple.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  // 1, 2 and 3 are all structural: the range starts at 1, and the prose enumerates the
  // multiples as a, 2a, 3a to show what is being counted.
  constants: [1, 2, 3],
};
