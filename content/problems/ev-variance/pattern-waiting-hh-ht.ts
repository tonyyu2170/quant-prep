import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper, and no `constraint` at all: constraint 2 licenses a helper
// only where a floor has to be pinned against the answer, and this template's floor cannot
// bind — no game ends before two runs and every run is charged at least two dollars:
// enumerated over the legal space |answer| runs [5.625, 360].
// The wait for a repeated outcome, against the wait for a mixed pair. Chances are integers
// over a hundred throughout, so the two closed forms print as one integer over another and no
// rounded decimal is ever an operand. The Sanity check prices the mixed pair — a genuinely
// different wait, not a restatement — and which of the two is longer flips with the bias, so
// the comparison is written from the numbers rather than assumed.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const patternWaitingHhHt: ProblemTemplate = {
  id: "ev-variance/pattern-waiting-hh-ht",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "the classic contrast between waiting for a repeated pattern and waiting for a mixed one" },
  params: {
    cleanPct: { range: { min: 20, max: 80, step: 5 } },
    repeatDirty: { choices: [0, 1] }, // 0: the rig stops on two clean runs, 1: on two dirty ones
    cost: { range: { min: 2, max: 12, step: 1 } },
  },
  // No `constraint`: every combination of the drawn chance, the pair's outcome and the run
  // price is a legal problem. The 20-to-80 band already keeps both outcomes possible, so a
  // rule restating it would reject nothing and read as a check that is not one.
  derived: (p) => {
    const dirtyPct = 100 - p.cleanPct;
    const rPct = p.repeatDirty === 1 ? dirtyPct : p.cleanPct;
    const oPct = 100 - rPct;
    const flips = (100 * (rPct + 100)) / (rPct * rPct);
    const mixFlips = 10000 / (rPct * oPct);
    return {
      dirtyPct,
      rPct,
      oPct,
      firstWait: 100 / rPct,
      flips,
      mixFlips,
      mixSpend: p.cost * mixFlips,
      twoRuns: 2 * p.cost,
      spend: p.cost * flips,
    };
  },
  statement: (p) =>
    `A test rig is run over and over on the same part. Each run comes out clean with probability ${fmtNum(p.cleanPct)} percent ` +
    `and dirty otherwise, independently of every other run. The rig is shut down the first time two ${
      p.repeatDirty === 1 ? "dirty" : "clean"
    } runs happen back to back. Every run costs ${fmtNum(p.cost)} dollars, whatever it shows. What is the expected total cost, ` +
    `in dollars, of running the rig until it shuts down?`,
  answerKey: "spend",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => {
    const word = p.repeatDirty === 1 ? "dirty" : "clean";
    const other = p.repeatDirty === 1 ? "clean" : "dirty";
    return [
      { title: "Wait for the first one", body: `A run comes out ${word} with probability ${fmtNum(d.rPct)} percent, and each run is a fresh attempt, so the wait for the first ${word} run is the reciprocal of that chance: $\\frac{100}{${fmtNum(d.rPct)}}=${fmtNum(d.firstWait)}$ runs.` },
      // The two waits below are written as one integer over another. Multiplying the printed
      // run count by the printed cost instead would drift: at a 35 percent chance the wait
      // prints 11.02 runs, and 11.02 times a rate misses the printed bill.
      { title: "What a broken attempt costs you", body: `With one ${word} run on the board, the next run either completes the pair — probability ${fmtNum(d.rPct)} percent — or comes out ${other}, and a ${other} run throws the attempt away entirely: the pair has to be built again from nothing, not from where you stood. So the run after the first ${word} one is worth one run plus, ${fmtNum(d.oPct)} percent of the time, the entire wait over again. Collecting that into one equation and solving leaves $\\frac{100\\times(${fmtNum(d.rPct)}+100)}{${fmtNum(d.rPct)}\\times${fmtNum(d.rPct)}}=${fmtNum(d.flips)}$ runs.` },
      { title: "Price the runs", body: `Every run is paid for, so the bill is that wait at ${fmtNum(p.cost)} dollars a run: $\\frac{${fmtNum(p.cost)}\\times100\\times(${fmtNum(d.rPct)}+100)}{${fmtNum(d.rPct)}\\times${fmtNum(d.rPct)}}=${fmtNum(d.spend)}$ dollars.` },
      { title: "Sanity check", body: `The rig cannot shut down before its second run, so the bill has to clear the price of two runs: $2\\times${fmtNum(p.cost)}=${fmtNum(d.twoRuns)}<${fmtNum(d.spend)}$ dollars. Now price the other shape of pair — a ${word} run followed immediately by a ${other} one — where a wrong run does not wipe the slate, since the run that broke the attempt starts the next one. That wait costs $\\frac{${fmtNum(p.cost)}\\times100\\times100}{${fmtNum(d.rPct)}\\times${fmtNum(d.oPct)}}=${fmtNum(d.mixSpend)}${d.mixSpend < d.spend ? "<" : ">"}${fmtNum(d.spend)}$ dollars, so on this rig the repeated pair is the ${d.mixSpend < d.spend ? "dearer" : "cheaper"} of the two to wait for — a comparison that turns over as the bias moves, and is not settled by which pair is likelier on any given attempt.` },
    ];
  },
  keyInsight: "Two patterns of the same length can take very different times to arrive, and what separates them is where a broken attempt drops you back to rather than how likely the pattern is on any one attempt. A repeated outcome is fragile: the wrong run destroys every bit of progress and the wait restarts from nothing. A mixed pair is not: the run that broke the attempt is itself the opening of the next one, so nothing is lost. Overlapping attempts are not separate tries, which is why the reciprocal of the pattern's chance is the wrong instinct.",
  commonTrap: "Taking the wait to be one over the chance the pair shows up on a given adjacent pair of runs. That reciprocal counts overlapping attempts as though they were separate tries, and for a repeated outcome it understates the wait every time, because the attempts it counts as fresh are exactly the ones a wrong run has already destroyed.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  // 100 is the percentage denominator and the whole of the chance the two outcomes split
  // between them; 2 is the length of the pair and the runs it takes at minimum; 1 is the run
  // that is spent on every attempt whatever it shows.
  constants: [1, 2, 100],
};
