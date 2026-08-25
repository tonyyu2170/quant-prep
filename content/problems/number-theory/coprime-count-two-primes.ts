import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const coprimeCountTwoPrimes: ProblemTemplate = {
  id: "number-theory/coprime-count-two-primes",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "hrt", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "counting the integers coprime to a product of two primes" },
  params: {
    pr: { choices: [3, 5, 7, 11, 13, 17, 19, 23] },
    qr: { choices: [5, 7, 11, 13, 17, 19, 23, 29] },
    mult: { choices: [1, 2, 3, 4, 5, 6, 8, 10] },
  },
  constraint: (p) => p.pr < p.qr && p.pr * p.qr * p.mult <= 4000,
  derived: (p) => ({
    modulus: p.pr * p.qr,
    span: p.pr * p.qr * p.mult,
    dropP: p.qr * p.mult,
    dropQ: p.pr * p.mult,
    perBlock: (p.pr - 1) * (p.qr - 1),
    answer: p.mult * (p.pr - 1) * (p.qr - 1),
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Both ${fmtNum(p.pr)} and ${fmtNum(p.qr)} are prime. How many whole numbers from 1 up to ` +
    `${fmtNum(d.span)} share NO common factor above one with ${fmtNum(d.modulus)}?`,
  solution: (p, d) => [
    { title: "Sharing a factor means being caught by a prime", body: `The only primes dividing the modulus are the two given, so a number fails only by being a multiple of one of them or of both. Counting what fails and subtracting is easier than counting what survives — and the two failing sets overlap, so they cannot simply be added. Per block of $pq$ the count is $\\text{survivors}=(p-1)(q-1)$.` },
    { title: "Strike out each prime's multiples", body: `Multiples of ${fmtNum(p.pr)} up to ${fmtNum(d.span)} number $\\dfrac{${fmtNum(d.span)}}{${fmtNum(p.pr)}}=${fmtNum(d.dropP)}$, and multiples of ${fmtNum(p.qr)} number $\\dfrac{${fmtNum(d.span)}}{${fmtNum(p.qr)}}=${fmtNum(d.dropQ)}$. Both divisions come out whole, because the range was chosen as a whole number of blocks.` },
    { title: "One block at a time", body: `Inside a single block of ${fmtNum(d.modulus)} the survivors number $(${fmtNum(p.pr)}-1)\\times(${fmtNum(p.qr)}-1)=${fmtNum(d.perBlock)}$ — a number is free of both primes exactly when it avoids each independently, and the two conditions are independent because the primes are different.` },
    { title: "Answer", body: `The range holds ${fmtNum(p.mult)} whole blocks, so the count is $${fmtNum(p.mult)}\\times${fmtNum(d.perBlock)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The survivors must be fewer than the ${fmtNum(d.span)} numbers we started with, and they are: $${fmtNum(d.answer)}<${fmtNum(d.span)}$. Note how large the surviving share stays — even after striking two primes, most numbers survive, and that is why factoring a large number is hard rather than a matter of a few lucky divisions.` },
  ],
  keyInsight: "The count of integers sharing no factor with a number depends only on which primes divide it, never on how many times each divides it. For a product of two distinct primes it is just each prime one less, multiplied — the basis of every public-key scheme in use.",
  commonTrap: "Adding the two struck-out sets without removing their overlap, which double counts the multiples of both and undercounts the survivors. The other slip is subtracting one from the product rather than multiplying the two reduced primes.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
