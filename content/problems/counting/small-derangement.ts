import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Exactly-m-correct: choose which letters land right, then derange the rest. The
// Sanity check prices the naive "pick the right ones and let the rest fall where
// they may" count, which silently includes stuffings with more matches than asked
// for and so must come out strictly larger.
export const smallDerangement: ProblemTemplate = {
  id: "counting/small-derangement",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "hat-check derangement, asked for a fixed number of matches rather than none" },
  params: {
    letters: { range: { min: 5, max: 8, step: 1 } },
    correct: { range: { min: 1, max: 4, step: 1 } },
  },
  // At least two letters left over: a single leftover letter has nowhere to go but
  // its own envelope, so the "everything else wrong" requirement would be
  // impossible and the count would collapse to zero.
  constraint: (p) => p.letters - p.correct >= 2,
  derived: (p) => {
    const fact = (m: number) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      return num / fact(j);
    };
    const rest = p.letters - p.correct;
    // Subfactorial by the standard recurrence, seeded at none and one leftover.
    let prev = 1;
    let cur = 0;
    for (let j = 2; j <= rest; j++) { const next = (j - 1) * (cur + prev); prev = cur; cur = next; }
    const derangeRest = rest === 0 ? 1 : cur;
    const places = choose(p.letters, p.correct);
    const favourable = places * derangeRest;
    const totalArr = fact(p.letters);
    const naiveCount = places * fact(rest);
    return {
      rest,
      places,
      derangeRest,
      favourable,
      totalArr,
      prob: favourable / totalArr,
      restArr: fact(rest),
      naiveCount,
      naiveProb: naiveCount / totalArr,
    };
  },
  statement: (p) =>
    `An office assistant stuffs ${fmtNum(p.letters)} personalised letters into ${fmtNum(p.letters)} addressed envelopes completely at random, one letter per envelope. ` +
    `What is the probability that exactly ${fmtNum(p.correct)} of the letters end up in the envelope addressed to their own recipient?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `All $${fmtNum(p.letters)}!=${fmtNum(d.totalArr)}$ stuffings are equally likely. "Exactly ${fmtNum(p.correct)} correct" means those letters are right and every other letter is wrong — the second half is the part that is easy to lose.` },
    { title: "Choose which letters are the correct ones", body: `Any ${fmtNum(p.correct)} of the ${fmtNum(p.letters)} letters could be the matched ones: $\\binom{${fmtNum(p.letters)}}{${fmtNum(p.correct)}}=${fmtNum(d.places)}$ ways.` },
    { title: "Derange the rest", body: `The other ${fmtNum(d.rest)} letters must all miss their own envelopes. Counting those arrangements is the classic derangement: no arrangement of a single leftover letter avoids its own envelope, exactly one arrangement of two does, and each further size follows from $D(j)=(j-1)\\left(D(j-1)+D(j-2)\\right)$, which reaches ${fmtNum(d.derangeRest)} here. So $${fmtNum(d.places)}\\times${fmtNum(d.derangeRest)}=${fmtNum(d.favourable)}$ stuffings qualify, and the probability is $${fmtNum(d.favourable)}/${fmtNum(d.totalArr)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Try it without the deranging step: pick the ${fmtNum(p.correct)} matched letters and let the remaining ${fmtNum(d.rest)} fall anywhere, $${fmtNum(d.places)}\\times${fmtNum(d.restArr)}=${fmtNum(d.naiveCount)}$ stuffings, a probability of ${fmtNum(d.naiveProb)}. That version counts a stuffing with more matches than asked for once for every way to pick ${fmtNum(p.correct)} of its matches, so it must overshoot — and $${fmtNum(d.prob)} < ${fmtNum(d.naiveProb)}$.` },
  ],
  keyInsight: "An exactly-k question has two halves: choose which items succeed, then force every remaining item to fail, and that second half is a derangement rather than a free arrangement.",
  commonTrap: "Choosing the matched letters and letting the others fall freely, which counts stuffings that have more matches than the question asks for, once for each subset of matches of the requested size.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
