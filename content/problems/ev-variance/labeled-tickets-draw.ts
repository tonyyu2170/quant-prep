import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The mean of an evenly spaced ladder of labels. The main route collapses the ladder to its
// two ends; the Sanity check totals every label the long way and divides, which is a
// genuinely different computation that catches an off-by-one in the top label.
export const labeledTicketsDraw: ProblemTemplate = {
  id: "ev-variance/labeled-tickets-draw",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected value of a uniform draw from an arithmetic run of labels" },
  params: {
    n: { range: { min: 6, max: 30, step: 1 } },
    first: { range: { min: 1, max: 20, step: 1 } },
    gap: { range: { min: 1, max: 9, step: 1 } },
  },
  // first = 1 with gap = 1 makes the labels the plain run 1, 2, ..., n, where the answer can
  // be read straight off the ticket count and the ladder structure teaches nothing.
  // Constraint 2's floor cannot bind — the smallest label is at least 1, so the mean is too;
  // over the legal space the answer runs [4.5, 150.5].
  constraint: (p) => !(p.first === 1 && p.gap === 1),
  derived: (p) => {
    const steps = p.n - 1;
    const last = p.first + p.gap * steps;
    const pairSteps = (p.n * steps) / 2;
    const sumIncr = p.gap * pairSteps;
    return { steps, last, pairSteps, sumIncr, total: p.n * p.first + sumIncr, mean: (p.first + last) / 2 };
  },
  statement: (p) =>
    `A cloakroom stack holds ${fmtNum(p.n)} tickets whose printed labels climb evenly: the lowest label is ${fmtNum(p.first)}, ` +
    `and each label after it is ${fmtNum(p.gap)} higher than the one before. One ticket is pulled from the stack at random, ` +
    `every ticket equally likely. What is the expected label on it?`,
  answerKey: "mean",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Every ticket is equally likely, so the expected label is simply the average of the ${fmtNum(p.n)} labels in the stack.` },
    { title: "Find the top of the ladder", body: `There are ${fmtNum(d.steps)} gaps between ${fmtNum(p.n)} tickets — one fewer gap than there are tickets — so the highest label is $${fmtNum(p.first)}+${fmtNum(p.gap)}\\times${fmtNum(d.steps)}=${fmtNum(d.last)}$.` },
    // Every operand printed below is an exact integer or an exact half, so no printed chain
    // can drift off the printed answer.
    { title: "Average the two ends", body: `Evenly spaced numbers average to the midpoint of their range: pair the lowest label with the highest, the second lowest with the second highest, and every such pair shares the same midpoint. So the expected label is $\\frac{${fmtNum(p.first)}+${fmtNum(d.last)}}{2}=${fmtNum(d.mean)}$.` },
    { title: "Sanity check", body: `Total every label the long way and divide. Each ticket carries at least ${fmtNum(p.first)}, and on top of that they carry one step of ${fmtNum(p.gap)}, two steps, and so on up to ${fmtNum(d.steps)} steps. Those step counts add to $1+2+\\cdots+${fmtNum(d.steps)}=${fmtNum(d.pairSteps)}$, worth $${fmtNum(p.gap)}\\times${fmtNum(d.pairSteps)}=${fmtNum(d.sumIncr)}$, so the labels total $${fmtNum(p.n)}\\times${fmtNum(p.first)}+${fmtNum(d.sumIncr)}=${fmtNum(d.total)}$. Dividing by the ${fmtNum(p.n)} tickets gives $\\frac{${fmtNum(d.total)}}{${fmtNum(p.n)}}=${fmtNum(d.mean)}$, the same figure.` },
  ],
  keyInsight: "Evenly spaced values average to the midpoint of their range, so a whole ladder of labels collapses to its two ends and nothing has to be summed; how many labels there are matters only through where the top of the ladder lands.",
  commonTrap: "Counting one step of the ladder for every ticket. A stack has one fewer gap than it has tickets, so building the top label from the ticket count overshoots the range and drags the average up with it.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
