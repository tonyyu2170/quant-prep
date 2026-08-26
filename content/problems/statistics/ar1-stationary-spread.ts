import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const ar1StationarySpread: ProblemTemplate = {
  id: "statistics/ar1-stationary-spread",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the stationary variance of a first-order autoregressive process" },
  params: {
    phi: { choices: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9] },
    sigmaEps: { choices: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const phiSq = round(p.phi * p.phi);
    const oneMinus = round(1 - phiSq);
    return {
      phiSq, oneMinus,
      answer: round(p.sigmaEps / Math.sqrt(1 - p.phi * p.phi)),
      inflation: round(1 / Math.sqrt(1 - p.phi * p.phi)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A pairs desk models the spread between two listings as first-order autoregressive: each day's spread is ${fmtNum(p.phi)} times the previous day's, plus a fresh independent shock with a standard deviation of ${fmtNum(p.sigmaEps)} basis points. ` +
    `Once the process has settled down, what is the standard deviation of the spread?`,
  solution: (p, d) => [
    { title: "Stationary means the variance has stopped moving", body: `Today's variance is ${fmtNum(p.phi)} squared times yesterday's, plus the shock's variance, because the carried-over part and the new shock are independent. Settled down means the two sides are the SAME number, and that self-consistency is what pins the level — there is nothing to iterate.` },
    { title: "Solve for it", body: `Collecting the variance on one side leaves the shock variance over $1$ minus ${fmtNum(p.phi)} squared. Here $${fmtNum(p.phi)}\\times${fmtNum(p.phi)}=${fmtNum(d.phiSq)}$, so the divisor is $1-${fmtNum(d.phiSq)}=${fmtNum(d.oneMinus)}$.` },
    { title: "Take the root", body: `Standard deviations rather than variances, so divide the shock's by the root of that: $\\dfrac{${fmtNum(p.sigmaEps)}}{\\sqrt{${fmtNum(d.oneMinus)}}}=${fmtNum(d.answer)}$ basis points.` },
    { title: "Answer", body: `The stationary standard deviation is ${fmtNum(d.answer)} basis points.` },
    { title: "Sanity check", body: `The spread is ${fmtNum(d.inflation)} times as wide as a single day's shock, and it must be wider than one shock: yesterday's disturbance has not finished decaying when today's arrives, so shocks pile up. The closer the carry-over runs to one, the more of the past is still present and the wider the process gets.` },
  ],
  keyInsight: "A stationary process is defined by a variance that reproduces itself, so the level is found by setting today's equal to yesterday's and solving, never by iterating forward. The persistence enters squared, which is why the spread widens slowly at first and then explosively as the carry-over approaches one.",
  commonTrap: "Reporting the shock's own standard deviation as the spread's, which ignores that undecayed past shocks are still present and understates the width. The other slip is dividing by one minus the persistence rather than by one minus its SQUARE, which mixes a statement about levels with one about variances and overstates the width badly.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
