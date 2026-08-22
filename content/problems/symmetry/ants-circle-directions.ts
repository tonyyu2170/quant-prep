import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// On a circle, a collision is unavoidable unless every ant marches the same way; all-same
// comes in exactly two flavours (all clockwise, all counter-clockwise) out of 2^n equally
// likely direction assignments, so the clean-replay probability is 1/2^(n-1).
export const antsCircleDirections: ProblemTemplate = {
  id: "symmetry/ants-circle-directions",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "optiver", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "ants on a triangle choosing directions, generalised to n ants on a circle" },
  params: {
    ants: { range: { min: 3, max: 14, step: 1 } },
    bounty: { choices: [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000] },
  },
  derived: (p) => {
    const denom = Math.pow(2, p.ants - 1);
    return { denom, assignments: 2 * denom, prob: 1 / denom, ev: p.bounty / denom };
  },
  statement: (p) =>
    `${fmtNum(p.ants)} ants stand at distinct spots on a narrow circular track, facing random directions: each ant independently picks clockwise or counter-clockwise with equal probability, and then they all march at the same speed forever. A replay of the experiment is called clean if no two ants ever meet. An entomologist pays you ${fmtNum(p.bounty)} dollars for every clean replay. What is your expected payment per replay?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "When do ants ever meet?", body: `Two ants moving the same direction never close the gap between them. Two ants moving in opposite directions around a closed track must eventually meet head-on. So a replay is clean exactly when all ${fmtNum(p.ants)} ants picked the same direction.` },
    { title: "Count the direction assignments", body: `Each ant contributes two choices, so there are $${fmtNum(d.assignments)}$ equally likely assignments in total (${fmtNum(2)} to the power ${fmtNum(p.ants)}).` },
    { title: "Isolate the clean ones", body: `Exactly ${fmtNum(2)} assignments are clean — everybody clockwise or everybody counter-clockwise — so the clean probability is $\\frac{${fmtNum(2)}}{${fmtNum(d.assignments)}}=\\frac{${fmtNum(1)}}{${fmtNum(d.denom)}}=${fmtNum(d.prob)}$.` },
    { title: "Price the bet", body: `The expected payment per replay is the bounty times the clean probability: $\\frac{${fmtNum(p.bounty)}}{${fmtNum(d.denom)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Every extra ant halves the clean chance, so the answer shrinks by half as the colony grows — and it can never exceed the full bounty, which holds here.` },
  ],
  keyInsight: "On a closed loop the whole question collapses to one bit per ant: any disagreement of directions forces a head-on meeting, and uniform agreement is the only escape — two favourable assignments out of two to the power of the colony size.",
  commonTrap: "Reasoning pairwise about which ants might dodge, or checking only the starting configuration. Direction, not position, decides everything on a circle, and the ants are treated as points that pass nothing — meeting means meeting.",
  expectedPaceS: 80,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
