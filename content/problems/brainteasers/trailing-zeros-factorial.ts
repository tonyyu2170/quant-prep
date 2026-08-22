import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Trailing zeros = number of factors of 5 (twos are always in surplus) = sum of floor(n/5^k).
export const trailingZerosFactorial: ProblemTemplate = {
  id: "brainteasers/trailing-zeros-factorial",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.3 }, { firm: "jump", weight: 0.3 }, { firm: "two-sigma", weight: 0.2 }],
  source: { kind: "original", inspiration: "counting factors of five in a factorial" },
  params: {
    n: { range: { min: 50, max: 400, step: 1 } },
  },
  derived: (p) => {
    const byFive = Math.floor(p.n / 5);
    const byTwentyFive = Math.floor(p.n / 25);
    const byOneTwentyFive = Math.floor(p.n / 125);
    const answer = byFive + byTwentyFive + byOneTwentyFive;
    return { byFive, byTwentyFive, byOneTwentyFive, answer, byTwo: Math.floor(p.n / 2), fifthOfN: p.n / 5 };
  },
  statement: (p) =>
    `Write out ${fmtNum(p.n)}! in full. How many zeros does it end in?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "A trailing zero is a factor of ten", body: `Each trailing zero comes from one factor of 10, and each 10 is a 2 paired with a 5. So the question is how many such pairs the product contains.` },
    { title: "Fives are the bottleneck", body: `Multiples of 2 are far commoner than multiples of 5 — there are $${fmtNum(d.byTwo)}$ even numbers up to ${fmtNum(p.n)} against $${fmtNum(d.byFive)}$ multiples of five — so every 5 finds a 2 to pair with and the fives alone decide the count.` },
    { title: "Do not stop at one five each", body: `A multiple of 25 contributes two fives, a multiple of 125 contributes three. Counting each multiple of five just once is the standard error here.` },
    { title: "Add the tiers", body: `The tally is $${d.byFive}+${d.byTwentyFive}+${d.byOneTwentyFive}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The answer must sit a little above $\\frac{${p.n}}{5}=${fmtNum(d.fifthOfN)}$ — one per multiple of five, plus the extras from the higher powers. It does.` },
  ],
  keyInsight: "Trailing zeros count paired factors of 2 and 5, and since twos are always in surplus the whole problem reduces to counting fives — including the repeats inside 25, 125 and beyond.",
  commonTrap: "Counting only multiples of 5 and stopping. Every multiple of 25 carries a second five that this misses.",
  expectedPaceS: 100,
  constants: [2, 5, 10, 25, 125],
  verify: { method: "brute-force" },
};
