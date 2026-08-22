import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Strings over {H,T} where every maximal tail-run has even length satisfy the Fibonacci
// recurrence: append H to any valid length n-1 string, or append TT to any valid length
// n-2 string. Both maps are bijections onto the two cases (last run untouched vs extended).
export const evenTailRuns: ProblemTemplate = {
  id: "counting/even-tail-runs",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.5 }, { firm: "jane-street", weight: 0.4 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "coin strings whose tail-runs all have even length, via a Fibonacci bijection" },
  params: {
    n: { range: { min: 6, max: 15, step: 1 } },
  },
  derived: (p) => {
    let fN2 = 1; // f(0)
    let fN1 = 1; // f(1)
    for (let len = 2; len <= p.n; len++) {
      const next = fN1 + fN2;
      fN2 = fN1;
      fN1 = next;
    }
    return { nMinus1: p.n - 1, nMinus2: p.n - 2, fN1, fN2, count: p.n === 0 ? 1 : fN1 };
  },
  statement: (p) =>
    `You record every sequence of ${fmtNum(p.n)} fair coin flips. Some sequences have stray single tails — you only want the disciplined ones: sequences where tails appear exclusively in runs whose length is even (a run of two, four, or more tails in a row, never an odd run). How many sequences of ${fmtNum(p.n)} flips qualify?`,
  answerKey: "count",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Split by how the string ends", body: `Take any valid string of length ${fmtNum(p.n)}. Its last tail-run has even length, so it ends either in heads, or in a tail-run of length at least two.` },
    { title: "Case H: extend any shorter valid string", body: `Appending one head to any valid string of length ${fmtNum(p.n - 1)} keeps every tail-run even, and every valid string ending in H arises this way exactly once. That contributes $f(${fmtNum(d.nMinus1)})=${fmtNum(d.fN1)}$ strings.` },
    { title: "Case TT: grow the last run by two", body: `Appending two tails to a valid string of length ${fmtNum(d.nMinus2)} either extends an existing even run by two or starts a fresh run of two — both stay legal, and the map reverses uniquely by stripping the final pair. That contributes $f(${fmtNum(d.nMinus2)})=${fmtNum(d.fN2)}$ strings.` },
    { title: "Combine", body: `$f(${fmtNum(p.n)})=f(${fmtNum(d.nMinus1)})+f(${fmtNum(d.nMinus2)})=${fmtNum(d.fN1)}+${fmtNum(d.fN2)}=${fmtNum(d.count)}$ — the counts are consecutive Fibonacci numbers.` },
    { title: "Sanity check", body: `The count grows by a factor strictly between one and two per extra flip, and it can never exceed $2^{${fmtNum(p.n)}}$ total strings — ${fmtNum(d.count)} sits well inside that bound.` },
  ],
  keyInsight: "Classify legal strings by their ending: one recursive case appends a head and reuses the previous count, the other appends a tail-pair and reuses the count from two back — which is the Fibonacci recurrence wearing a coin-flip costume.",
  commonTrap: "Trying to place runs of exactly two with inclusion-exclusion. Runs may also have length four, six and so on, so the placement count is not a simple choose-positions problem — the end-character bijection handles all even lengths at once.",
  expectedPaceS: 100,
  constants: [2],
  verify: { method: "brute-force" },
};
