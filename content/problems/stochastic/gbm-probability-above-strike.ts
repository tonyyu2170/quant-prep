import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` never sees `derived`, and the rejection rule here
// genuinely needs the answer's own statistic. Bounding the standardised distance keeps the
// probability off the deep tail — at an answer of 1.7e-4 the relative tolerance works out to
// about 8e9 Monte Carlo draws, which is not a check anyone will run.
const zOf = (par: { spot: number; strike: number; growPct: number; volPct: number; years: number }) =>
  (100 * Math.log(par.strike / par.spot) - (par.growPct - (par.volPct * par.volPct) / 200) * par.years) /
  (par.volPct * Math.sqrt(par.years));

export const gbmProbabilityAboveStrike: ProblemTemplate = {
  id: "stochastic/gbm-probability-above-strike",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 3,
  firms: [{ firm: "citadel-securities", weight: 0.3 }, { firm: "jane-street", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the terminal tail of a lognormal price, drift corrected by half the variance" },
  params: {
    spot: { choices: [50, 60, 75, 80, 100, 120] },
    strike: { choices: [55, 66, 80, 90, 110, 130, 150] },
    growPct: { choices: [2, 4, 5, 6, 8, 10] },
    volPct: { choices: [15, 20, 25, 30, 40] },
    // Perfect squares only, so the square root of the horizon is an integer and the volatility
    // chain stays exact. A root of 2 would print at four figures and cost the next step a digit.
    years: { choices: [1, 4, 9] },
  },
  constraint: (p) => p.strike > p.spot && p.strike <= 2 * p.spot && p.growPct * p.years <= 32 && Math.abs(zOf(p as Parameters<typeof zOf>[0])) <= 1.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const halfVarPct = round((p.volPct * p.volPct) / 200);
    const logDriftPct = round(p.growPct - halfVarPct);
    const driftOverHorizonPct = round(logDriftPct * p.years);
    const sdPct = round(p.volPct * Math.sqrt(p.years));
    const hurdlePct = round(100 * Math.log(p.strike / p.spot));
    const z = round((hurdlePct - driftOverHorizonPct) / sdPct);
    return {
      halfVarPct, logDriftPct, driftOverHorizonPct, sdPct, hurdlePct,
      rootYears: round(Math.sqrt(p.years)),
      z,
      answer: round(1 - normalCdf(z)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A name trades at ${fmtNum(p.spot)} and its EXPECTED price grows at ${fmtNum(p.growPct)} percent a year, with an ` +
    `annual volatility of ${fmtNum(p.volPct)} percent. What is the probability it finishes above ${fmtNum(p.strike)} ` +
    `in ${fmtNum(p.years)} years?`,
  solution: (p, d) => [
    { title: "Work in logs, and correct the drift first", body: `The price is lognormal, so the question is a normal tail once it is written in logs. But the ${fmtNum(p.growPct)} percent quoted is the growth of the AVERAGE price, and the log's own drift sits half a variance below that. Skipping the correction is the single most common way to get this wrong.` },
    { title: "The log drift and the log spread", body: `Half the variance is $\\dfrac{${fmtNum(p.volPct)}\\times${fmtNum(p.volPct)}}{200}=${fmtNum(d.halfVarPct)}$ percent a year, so the log drifts at $${fmtNum(p.growPct)}-${fmtNum(d.halfVarPct)}=${fmtNum(d.logDriftPct)}$ percent a year — over the horizon, $${fmtNum(d.logDriftPct)}\\times${fmtNum(p.years)}=${fmtNum(d.driftOverHorizonPct)}$ percent. The spread grows with the square root of time instead: $${fmtNum(p.volPct)}\\times${fmtNum(d.rootYears)}=${fmtNum(d.sdPct)}$ percent.` },
    { title: "How far away the strike is, in logs", body: `Write $h$ for the natural log of the strike over the spot, expressed in percent. Here $h=${fmtNum(d.hurdlePct)}$. The standardised distance is what remains of that hurdle once the drift has covered part of it, measured in log standard deviations: $\\dfrac{${fmtNum(d.hurdlePct)}-${fmtNum(d.driftOverHorizonPct)}}{${fmtNum(d.sdPct)}}\\approx${fmtNum(d.z)}$. A log has no exact four-figure rendering, so this step is written as an approximation — the exact chains above it are the ones carrying the arithmetic.` },
    { title: "Answer", body: `The probability of finishing above the strike is the standard normal upper tail there: $P(Z>${fmtNum(d.z)})=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Raising the strike lifts the hurdle and can only push this probability down, while stretching the horizon lets the drift eat more of it. Note the direction of the vol: it widens ${fmtNum(d.sdPct)} — which HELPS a strike above today's price — but it also drags the log drift down to ${fmtNum(d.logDriftPct)}, and those two effects fight.` },
  ],
  keyInsight: "A price whose average grows at a stated rate has a log that drifts more slowly, by exactly half its variance. Every lognormal tail question turns on carrying that correction, and it is the reason a volatile asset can have a rising expected price while most of its outcomes fall.",
  commonTrap: "Using the quoted growth rate as the log drift, which ignores the half-variance correction and overstates the chance of finishing high. The other slip is scaling volatility by the horizon rather than by its square root.",
  expectedPaceS: 175,
  verify: { method: "montecarlo" },
  constants: [200],
};
