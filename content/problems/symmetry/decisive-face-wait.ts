import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Only spins showing 1 or s decide the game; among those decisive spins the two faces are
// symmetric, so conditioning on which one shows first changes nothing about timing. Time to
// the first decisive spin has success probability 2/s, so expected rolls = s/2.
export const decisiveFaceWait: ProblemTemplate = {
  id: "symmetry/decisive-face-wait",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.45 }, { firm: "jane-street", weight: 0.4 }, { firm: "citadel-securities", weight: 0.25 }],
  source: { kind: "free-resource", inspiration: "expected waiting time for a die's first 6 given it precedes the first 5, by two-face symmetry" },
  params: {
    sides: { range: { min: 8, max: 31, step: 1 } },
    cost: { choices: [2, 3, 5, 7, 11] },
  },
  derived: (p) => {
    const pSpecial = 2 / p.sides;
    const eRolls = p.sides / 2;
    return { pSpecial, eMisses: (p.sides - 2) / 2, eRolls, spend: p.cost * eRolls };
  },
  statement: (p) =>
    `A casino wheel has ${fmtNum(p.sides)} equal sectors numbered ${fmtNum(1)} through ${fmtNum(p.sides)}. You pay ${fmtNum(p.cost)} dollars per spin and keep spinning until either a ${fmtNum(1)} or a ${fmtNum(p.sides)} shows, whichever comes first. A friend who can see the wheel bets you even money that the ${fmtNum(p.sides)} shows before the ${fmtNum(1)} — and inspection of the log later confirms the ${fmtNum(p.sides)} did in fact come first. What is your expected total spend for that game?`,
  answerKey: "spend",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Only decisive spins matter", body: `Every spin showing a middle face leaves the game unchanged; the outcome is decided entirely by the sequence of spins showing ${fmtNum(1)} or ${fmtNum(p.sides)}. Delete all others and read just the decisive subsequence.` },
    { title: "Symmetry between the two faces", body: `The two decisive faces are exchangeable — nothing in the setup favours one over the other — so conditioned on the game having ended on ${fmtNum(p.sides)}, the timing of that ending is exactly what it would have been anyway. The conditioning tells you who won, not when.` },
    { title: "Time to the first decisive spin", body: `Each spin is decisive with probability $\\frac{2}{${fmtNum(p.sides)}}=${fmtNum(d.pSpecial)}$, and the expected wait for the first decisive spin is the reciprocal of that chance: $\\frac{${fmtNum(p.sides)}}{2}=${fmtNum(d.eRolls)}$ spins.` },
    { title: "Price the spins", body: `At ${fmtNum(p.cost)} dollars per spin, the expected spend is $\\frac{${fmtNum(p.cost)}\\times${fmtNum(p.sides)}}{2}=${fmtNum(d.spend)}$ dollars.` },
    { title: "Sanity check", body: `A wider wheel stretches the wait but the half-of-sides law keeps the answer proportional to ${fmtNum(p.sides)}, and doubling the per-spin cost doubles the spend — both of which hold here.` },
  ],
  keyInsight: "Conditioning on WHICH of two symmetric faces arrived first carries no information about WHEN it arrived — strip the indecisive spins, use the two-face symmetry, and the wait is just the reciprocal of the decisive-spin chance.",
  commonTrap: "Answering as if the condition were absent (waiting for one specific face alone) or as if it forced an immediate stop. The condition selects between the two decisive faces without touching the clock.",
  expectedPaceS: 95,
  constants: [1, 2],
  verify: { method: "montecarlo" },
};
