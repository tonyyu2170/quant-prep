import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The multiplication principle on independent slots of two different sizes.
// The Sanity check counts the same plates under a ban on repeated letters — a
// falling product rather than a power — and the ban must shrink the total.
export const productRulePlates: ProblemTemplate = {
  id: "counting/product-rule-plates",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "jump", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic licence-plate application of the multiplication principle" },
  params: {
    alphabet: { choices: [24, 25, 26] },
    letters: { range: { min: 2, max: 4, step: 1 } },
    digits: { range: { min: 2, max: 4, step: 1 } },
  },
  // Keeps the plate count inside the emitter's decimal-safe window; it rejects the
  // largest formats (four letters with four digits runs past a billion plates).
  constraint: (p) => Math.pow(p.alphabet, p.letters) * Math.pow(10, p.digits) < 1e9,
  derived: (p) => {
    const letterWays = Math.pow(p.alphabet, p.letters);
    const digitWays = Math.pow(10, p.digits);
    let distinctLetterWays = 1;
    for (let i = 0; i < p.letters; i++) distinctLetterWays *= p.alphabet - i;
    return {
      letterWays,
      digitWays,
      ways: letterWays * digitWays,
      slots: p.letters + p.digits,
      distinctLetterWays,
      distinctWays: distinctLetterWays * digitWays,
    };
  },
  statement: (p, d) =>
    `A state stamps every licence plate with ${fmtNum(p.letters)} letters followed by ${fmtNum(p.digits)} digits, in that fixed order. ` +
    `To keep plates readable the state bars a handful of letters that look like digits, leaving ${fmtNum(p.alphabet)} letters in service; all 10 digits stay in service. ` +
    `Letters may repeat, digits may repeat, and the ${fmtNum(d.slots)} positions are filled independently. How many different plates can the state stamp?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `A plate is just a filled-in list of ${fmtNum(d.slots)} positions. Nothing about one position restricts another, so count the options in each position and multiply across all of them.` },
    { title: "The letter block", body: `Each of the ${fmtNum(p.letters)} letter positions independently takes any of the ${fmtNum(p.alphabet)} letters in service, giving $${fmtNum(p.alphabet)}^{${fmtNum(p.letters)}}=${fmtNum(d.letterWays)}$ letter blocks.` },
    { title: "The digit block and the product", body: `Each of the ${fmtNum(p.digits)} digit positions independently takes any of the 10 digits, giving $10^{${fmtNum(p.digits)}}=${fmtNum(d.digitWays)}$ digit blocks. A plate pairs one letter block with one digit block freely, so the total is $${fmtNum(d.letterWays)}\\times${fmtNum(d.digitWays)}=${fmtNum(d.ways)}$.` },
    { title: "Sanity check", body: `Suppose the state also banned repeated letters. The letter positions would then be filled by a falling product — ${fmtNum(p.alphabet)} choices, then one fewer, and so on — worth only ${fmtNum(d.distinctLetterWays)} letter blocks instead of ${fmtNum(d.letterWays)}, for ${fmtNum(d.distinctWays)} plates in all. Banning something can only remove plates, so the answer for the real rules must sit strictly above that, and $${fmtNum(d.distinctWays)} < ${fmtNum(d.ways)}$.` },
  ],
  keyInsight: "Independent positions multiply: when what goes in one slot never constrains another, the total is the product of the per-slot option counts, and slots of different kinds simply contribute different factors to that same product.",
  commonTrap: "Adding the letter-block count to the digit-block count instead of multiplying them, or swapping base and exponent so the alphabet size is raised to itself rather than to the number of letter positions.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [10],
};
