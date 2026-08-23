import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// On a closed loop a collision is unavoidable unless every ant marches the same way; all-same
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
    // Three axes rather than two. At 150 two-axis tuples the emitter still repeated one tuple
    // six times (draw-space.test.ts caps it at four): consecutive seeds feed mulberry32, whose
    // first draw is not fully decorrelated across them, so tuple COUNT alone does not buy
    // spread. The third axis adds an rng draw per instance and lifts the worst repeat to three.
    // The ant ceiling is the emitter's 1e-6 magnitude window: 16 ants at the smallest bounty
    // and replay count pays 2/2^15.
    ants: { range: { min: 3, max: 16, step: 1 } },
    bounty: { choices: [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000] },
    replays: { choices: [2, 3, 5, 10] },
  },
  derived: (p) => {
    const denom = Math.pow(2, p.ants - 1);
    return {
      denom,
      assignments: 2 * denom,
      prob: 1 / denom,
      perReplay: p.bounty / denom,
      payout: p.bounty * p.replays,
      ev: (p.bounty * p.replays) / denom,
    };
  },
  statement: (p) =>
    `${fmtNum(p.ants)} ants stand at distinct spots on a narrow circular track, facing random directions: each ant independently picks clockwise or counter-clockwise with equal probability, and then they all march at the same speed forever. A replay of the experiment is called clean if no two ants ever meet. An entomologist pays you ${fmtNum(p.bounty)} dollars for each clean replay. Over ${fmtNum(p.replays)} independent replays, what total payment should you expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "When can ants avoid each other?", body: `Two ants marching the same way never close the gap between them. Two ants marching in opposite directions around a closed loop must eventually meet head-on — there is nowhere to escape to. So a replay is clean exactly when all ${fmtNum(p.ants)} ants picked the same direction.` },
    { title: "Count the direction assignments", body: `Each ant contributes two independent choices, so there are $${fmtNum(d.assignments)}$ equally likely assignments of directions in total.` },
    { title: "Isolate the clean ones", body: `Exactly ${fmtNum(2)} of those are clean — everybody clockwise, or everybody counter-clockwise. The clean probability is therefore $\\frac{${fmtNum(2)}}{${fmtNum(d.assignments)}}=\\frac{${fmtNum(1)}}{${fmtNum(d.denom)}}=${fmtNum(d.prob)}$.` },
    { title: "Scale to the full run", body: `Each replay pays ${fmtNum(p.bounty)} dollars with that probability, and expectations add across independent replays, so the total is $\\frac{${fmtNum(p.bounty)}\\times${fmtNum(p.replays)}}{${fmtNum(d.denom)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Every extra ant halves the clean chance, so the answer halves as the colony grows by one. It can also never exceed ${fmtNum(d.payout)} dollars, the payment if every replay came back clean — and it does not.` },
  ],
  keyInsight: "On a closed loop the whole question collapses to one bit per ant: any disagreement of directions forces a head-on meeting, so uniform agreement is the only escape — two favourable assignments out of two raised to the colony size.",
  commonTrap: "Reasoning pairwise about which ants might dodge each other, or checking only the starting positions. Direction, not position, decides everything on a loop, and the spacing of the ants never enters the answer.",
  expectedPaceS: 80,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
