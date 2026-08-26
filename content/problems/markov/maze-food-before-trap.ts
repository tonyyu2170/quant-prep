import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// Absorption on a structure that is NOT a line: two rooms, each with one absorbing exit and the
// rest of its doors leading to the other room. Solving the pair of equations collapses to
// d2/(d1+d2-1), which is far from obvious from the picture.
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  const denom = p.doorsA + p.doorsB - 1;
  const answer = p.doorsB / denom;
  return { denom, answer, equalDoorCase: p.doorsA / (2 * p.doorsA - 1), equalDenom: 2 * p.doorsA - 1, fromB: ((p.doorsB - 1) * p.doorsB) / (p.doorsB * denom), backA: p.doorsA - 1, backB: p.doorsB - 1 };
};

export const mazeFoodBeforeTrap: ProblemTemplate = {
  id: "markov/maze-food-before-trap",
  version: 1,
  topic: "probability/markov",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "hrt", weight: 0.3 }, { firm: "citadel-securities", weight: 0.25 }],
  source: { kind: "original", inspiration: "two-room absorbing maze; simultaneous first-step equations" },
  params: {
    doorsA: { range: { min: 3, max: 26, step: 1 } },
    doorsB: { range: { min: 3, max: 26, step: 1 } },
  },
  constraint: (p) => p.doorsA !== p.doorsB && !complementGrades(derive(p).answer),
  derived: derive,
  statement: (p) =>
    `A mouse is in room A of a two-room maze. Room A has ${fmtNum(p.doorsA)} doors: one opens onto food, the rest lead to room B. Room B has ${fmtNum(p.doorsB)} doors: one opens onto a trap, the rest lead back to room A. The mouse picks a door uniformly at random each time it is in a room. What is the probability it reaches the food before the trap?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Name the two unknowns", body: `Let $a$ be the probability of reaching food starting from room A, and $b$ the same starting from room B. Only these two states exist before absorption, so two equations will pin them both.` },
    { title: "One step from each room", body: `From room A, one door of ${fmtNum(p.doorsA)} ends it in success and the other ${fmtNum(d.backA)} hand the problem to room B. From room B, one door of ${fmtNum(p.doorsB)} ends it in failure and the other ${fmtNum(d.backB)} hand it back to room A.` },
    { title: "Solve the pair", body: `Substituting the room-B equation into the room-A equation leaves a single unknown, and the cross terms cancel to give the compact form $\\frac{${p.doorsB}}{${p.doorsA}+${p.doorsB}-1}=${fmtNum(d.answer)}$.` },
    { title: "Read the shape", body: `Only the door counts survive, and they enter almost symmetrically — the $-1$ is the single absorbing door each room spends. More doors in room B means more chances to bounce back to A and try for food again, so the answer rises with ${fmtNum(p.doorsB)}.` },
    { title: "Sanity check", body: `Were both rooms to hold ${fmtNum(p.doorsA)} doors the answer would be $\\frac{${p.doorsA}}{${d.equalDenom}}=${fmtNum(d.equalDoorCase)}$, a shade above a coin flip because the mouse starts one step nearer the food.` },
  ],
  keyInsight: "First-step analysis turns a maze into simultaneous equations: one unknown per non-absorbing room, one equation per room.",
  commonTrap: "Comparing the two exit doors directly and answering with a ratio of door counts. The mouse can revisit both rooms many times, and that traffic is what the equations capture.",
  expectedPaceS: 150,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
