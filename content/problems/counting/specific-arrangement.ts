import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// One specific ordered arrangement out of all of them. The Sanity check prices the
// easier question — right symbols, any order — and the two must differ by exactly
// the number of orderings, which is the factor a careless solver drops.
export const specificArrangement: ProblemTemplate = {
  id: "counting/specific-arrangement",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "akuna", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "probability that one random ordered selection is the single correct one" },
  params: {
    symbols: { range: { min: 5, max: 9, step: 1 } },
    length: { range: { min: 2, max: 4, step: 1 } },
  },
  // A code shorter than the keypad keeps the selection a real choice of symbols as
  // well as an ordering; a full-length code would make the two questions in the
  // Sanity check the same question.
  constraint: (p) => p.length <= p.symbols - 1,
  derived: (p) => {
    let perm = 1;
    for (let i = 0; i < p.length; i++) perm *= p.symbols - i;
    let orders = 1;
    for (let i = 2; i <= p.length; i++) orders *= i;
    const sets = perm / orders;
    return {
      perm,
      orders,
      sets,
      prob: 1 / perm,
      setProb: 1 / sets,
      lastFactor: p.symbols - p.length + 1,
    };
  },
  statement: (p) =>
    `A parcel locker opens to a code that uses ${fmtNum(p.length)} of the ${fmtNum(p.symbols)} symbols on its keypad, no symbol twice, entered in the right order. ` +
    `A courier who has forgotten the code keys in one arrangement at random. What is the probability it opens the locker?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Exactly one arrangement opens the locker and the courier picks one at random, so the probability is one divided by the number of codes the keypad allows.` },
    { title: "Count the codes", body: `Fill the code left to right: the first press has all ${fmtNum(p.symbols)} symbols available, the next has one fewer because symbols cannot repeat, and so on down to ${fmtNum(d.lastFactor)} choices for the last press. That gives ${fmtNum(d.perm)} codes.` },
    { title: "Divide", body: `One of those ${fmtNum(d.perm)} codes is right, so the probability is $1/${fmtNum(d.perm)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Price the easier question: guessing the right ${fmtNum(p.length)} symbols in any order. There are $${fmtNum(d.perm)}/${fmtNum(d.orders)}=${fmtNum(d.sets)}$ symbol sets, so that happens with probability ${fmtNum(d.setProb)}. Getting the set right still leaves ${fmtNum(d.orders)} orders to guess among, only one of which opens the locker — so the answer must be smaller than ${fmtNum(d.setProb)} by exactly that factor, and $\\frac{1}{${fmtNum(d.sets)}}/${fmtNum(d.orders)}=\\frac{1}{${fmtNum(d.perm)}}=${fmtNum(d.prob)}$.` },
  ],
  keyInsight: "A single specific outcome has probability one over the size of the outcome space, so the whole problem is counting that space — and when order matters the space is a falling product rather than a selection count.",
  commonTrap: "Counting the symbol sets instead of the codes, which ignores that the same symbols entered in a different order do not open the locker and overstates the chance by the number of orderings.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1],
};
