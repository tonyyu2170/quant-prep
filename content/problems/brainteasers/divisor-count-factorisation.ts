import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The number itself is printed, so it has to be a derived value; at the top of the parameter
// range it reaches about 3 billion, comfortably inside fmtNum's decimal-safe window.
export const divisorCountFactorisation: ProblemTemplate = {
  id: "brainteasers/divisor-count-factorisation",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "two-sigma", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "counting divisors from a prime factorisation" },
  params: {
    a: { range: { min: 1, max: 6, step: 1 } },
    b: { range: { min: 1, max: 5, step: 1 } },
    c: { range: { min: 1, max: 4, step: 1 } },
    d: { range: { min: 1, max: 3, step: 1 } },
  },
  derived: (p) => ({
    n: 2 ** p.a * 3 ** p.b * 5 ** p.c * 7 ** p.d,
    ea: p.a + 1, eb: p.b + 1, ec: p.c + 1, ed: p.d + 1,
    answer: (p.a + 1) * (p.b + 1) * (p.c + 1) * (p.d + 1),
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A number is built as $${fmtNum(2)}^{${fmtNum(p.a)}}\\times${fmtNum(3)}^{${fmtNum(p.b)}}\\times${fmtNum(5)}^{${fmtNum(p.c)}}\\times${fmtNum(7)}^{${fmtNum(p.d)}}=${fmtNum(d.n)}$. ` +
    `How many positive whole numbers divide it exactly?`,
  solution: (p, d) => [
    { title: "A divisor is a choice of exponents", body: `Any divisor is itself built out of the same four primes and no others, since a prime dividing the divisor must divide the number. So a divisor is fixed by choosing how many copies of each prime it takes, and no two different choices give the same divisor — that is unique factorisation.` },
    { title: "Count the choices, prime by prime", body: `The number carries ${fmtNum(p.a)} twos, so a divisor may take anywhere from none of them up to all ${fmtNum(p.a)} — that is ${fmtNum(d.ea)} choices, not ${fmtNum(p.a)}, because taking none is allowed. The same reasoning gives ${fmtNum(d.eb)}, ${fmtNum(d.ec)} and ${fmtNum(d.ed)} choices for the threes, fives and sevens.` },
    { title: "Multiply", body: `The four choices are made independently, so $(${fmtNum(p.a)}+${fmtNum(1)})\\times(${fmtNum(p.b)}+${fmtNum(1)})\\times(${fmtNum(p.c)}+${fmtNum(1)})\\times(${fmtNum(p.d)}+${fmtNum(1)})=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `${fmtNum(d.n)} has exactly ${fmtNum(d.answer)} positive divisors.` },
    { title: "Sanity check", body: `The count includes both ends: taking none of every prime gives ${fmtNum(1)}, and taking all of every prime gives ${fmtNum(d.n)} itself. A count that came out as ${fmtNum(p.a)} times ${fmtNum(p.b)} times ${fmtNum(p.c)} times ${fmtNum(p.d)} would have quietly excluded both.` },
  ],
  keyInsight: "Unique factorisation turns a divisor into an independent choice of exponent for each prime, so counting divisors is a product rule rather than a search. The plus one on each exponent is the option of leaving that prime out altogether.",
  commonTrap: "Multiplying the exponents instead of the exponents plus one, which drops every divisor that omits a prime — including one and the number itself. The other slip is assuming a divisor could involve a prime the number does not contain.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [1, 2, 3, 5, 7],
};
