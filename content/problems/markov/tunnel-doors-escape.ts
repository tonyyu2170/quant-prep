import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The classic three-tunnel escape. Every wrong tunnel returns the miner to the identical state,
// so E appears on both sides and the algebra collapses to E = sum of ALL the tunnel times.
export const tunnelDoorsEscape: ProblemTemplate = {
  id: "markov/tunnel-doors-escape",
  version: 1,
  topic: "probability/markov",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.3 }, { firm: "imc", weight: 0.3 }, { firm: "jump", weight: 0.25 }],
  source: { kind: "textbook", inspiration: "the three-tunnel miner, parameterized" },
  params: {
    exitHours: { range: { min: 1, max: 9, step: 1 } },
    loopOneHours: { range: { min: 2, max: 14, step: 1 } },
    loopTwoHours: { range: { min: 3, max: 19, step: 1 } },
  },
  constraint: (p) => p.loopOneHours !== p.loopTwoHours && p.exitHours < p.loopOneHours,
  derived: (p) => {
    const answer = p.exitHours + p.loopOneHours + p.loopTwoHours;
    return { answer, loopTotal: p.loopOneHours + p.loopTwoHours, meanStep: answer / 3 };
  },
  statement: (p) =>
    `A miner stands at a junction of three tunnels. The first reaches the surface after ${fmtNum(p.exitHours)} hours. The second wanders for ${fmtNum(p.loopOneHours)} hours and returns him to the same junction; the third does the same after ${fmtNum(p.loopTwoHours)} hours. He picks a tunnel uniformly at random each time he stands at the junction, with no memory of which he has tried. What is the expected number of hours until he reaches the surface?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One state only", body: `Because he has no memory, every return puts him in exactly the state he began in. So a single unknown $E$ describes the whole problem.` },
    { title: "Average over the first choice", body: `Each tunnel is equally likely. Whatever he picks he spends its hours; two of the three then leave him facing the same expected wait $E$ all over again.` },
    { title: "The self-reference collapses", body: `That gives $E$ as the average of the three tunnel times plus two-thirds of $E$. Moving the $E$ terms together leaves one third of $E$ equal to one third of the total time, so the thirds cancel outright.` },
    { title: "Add them up", body: `The answer is simply every tunnel time added together: $${p.exitHours}+${p.loopOneHours}+${p.loopTwoHours}=${fmtNum(d.answer)}$ hours.` },
    { title: "Sanity check", body: `The mean single-tunnel time is $\\frac{${d.answer}}{3}=${fmtNum(d.meanStep)}$ hours, and he expects about three attempts before finding the exit — consistent with $${fmtNum(d.answer)}$ overall.` },
  ],
  keyInsight: "When every failure returns you to the identical state, the expected time is the sum of all the branch times — the probabilities cancel completely.",
  commonTrap: "Assuming the miner remembers and stops repeating tunnels. Memory changes the state space and gives a strictly smaller answer.",
  expectedPaceS: 120,
  constants: [3],
  verify: { method: "brute-force" },
};
