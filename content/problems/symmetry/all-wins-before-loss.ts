import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Only the RELATIVE order of the relevant faces matters, and every relative order is equally
// likely. So the answer is one over the number of ways to interleave them: 1/C(g+b, g).
export const allWinsBeforeLoss: ProblemTemplate = {
  id: "symmetry/all-wins-before-loss",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.2 }],
  source: { kind: "original", inspiration: "'all odds before any even', generalized off the 3-3 die" },
  params: {
    good: { choices: [2, 3, 4, 5, 6] },
    bad: { choices: [2, 3, 4, 5, 6] },
    rounds: { choices: [50, 100, 200, 300, 500, 800, 1200, 2000, 3000, 5000, 8000, 12000] },
  },
  derived: (p) => {
    const total = p.good + p.bad;
    let ways = 1;
    for (let i = 0; i < p.good; i++) ways = (ways * (total - i)) / (i + 1);
    ways = Math.round(ways);
    return { total, ways, prob: 1 / ways, answer: p.rounds / ways };
  },
  statement: (p, d) =>
    `A spinner has ${fmtNum(d.total)} equally likely faces: ${fmtNum(p.good)} are marked WIN and ${fmtNum(p.bad)} are marked LOSS. You spin repeatedly, and a round is a success if all ${fmtNum(p.good)} WIN faces have each appeared at least once before any LOSS face appears. Across ${fmtNum(p.rounds)} independent rounds, how many successes should you expect?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Throw away the repeats", body: `Spins that repeat a face already seen change nothing about the order in which the ${fmtNum(d.total)} faces FIRST appear. So the only thing that matters is the relative order of those first appearances.` },
    { title: "Every order is equally likely", body: `By symmetry no face is favoured, so all orderings of the ${fmtNum(d.total)} first-appearances are equally likely — and the question becomes purely combinatorial.` },
    { title: "Count the good orderings", body: `Exactly one interleaving pattern works: all ${fmtNum(p.good)} WIN faces, then all ${fmtNum(p.bad)} LOSS faces. The number of patterns is $\\binom{${d.total}}{${p.good}}=${fmtNum(d.ways)}$, so a round succeeds with probability $\\frac{1}{${d.ways}}=${fmtNum(d.prob)}$.` },
    { title: "Scale to the rounds", body: `Expected successes are $\\frac{${p.rounds}}{${d.ways}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Swapping the two labels would ask for all LOSS faces first, and $\\binom{${d.total}}{${p.bad}}=${fmtNum(d.ways)}$ is the same count — as it must be, since the two questions are mirror images.` },
  ],
  keyInsight: "When only the order of first appearances matters, the waiting is irrelevant: discard repeats and the problem collapses to counting equally likely orderings.",
  commonTrap: "Multiplying per-spin probabilities down a sequence. That answers a different question — it conditions on a particular number of spins rather than on the order alone.",
  expectedPaceS: 130,
  constants: [1],
  verify: { method: "brute-force" },
};
