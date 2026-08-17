import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Two-stage chain framed explicitly as a probability tree: all FOUR leaf masses (storm/clear
// crossed with delayed/on-time) are computed and shown, not just the two the evidence matches —
// a mini single Bayes update, but the pedagogy is drawing out the whole tree before pruning it.
export const flightDelayStormTree: ProblemTemplate = {
  id: "bayes/flight-delay-storm-tree",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.5 }, { firm: "imc", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: base-rate update drawn out as a full probability tree" },
  params: {
    prior: { choices: [0.1, 0.15, 0.2, 0.25, 0.3] },
    pDelayStorm: { choices: [0.7, 0.75, 0.8, 0.85, 0.9] },
    pDelayNoStorm: { choices: [0.1, 0.15, 0.2, 0.25] },
  },
  // pDelayStorm's minimum (0.7) exceeds pDelayNoStorm's maximum (0.25), so the two rates are
  // always distinct and storms are always the stronger delay-driver — guaranteed on every draw.
  constraint: (p) => p.pDelayStorm > p.pDelayNoStorm,
  derived: (p) => {
    const noStorm = 1 - p.prior;
    const onTimeStorm = 1 - p.pDelayStorm;
    const onTimeNoStorm = 1 - p.pDelayNoStorm;
    const massStormDelay = p.prior * p.pDelayStorm;
    const massStormOnTime = p.prior * onTimeStorm;
    const massNoStormDelay = noStorm * p.pDelayNoStorm;
    const massNoStormOnTime = noStorm * onTimeNoStorm;
    const pDelay = massStormDelay + massNoStormDelay;
    const postStorm = massStormDelay / pDelay;
    const leafSum = massStormDelay + massStormOnTime + massNoStormDelay + massNoStormOnTime;
    return { noStorm, onTimeStorm, onTimeNoStorm, massStormDelay, massStormOnTime, massNoStormDelay, massNoStormOnTime, pDelay, postStorm, leafSum };
  },
  statement: (p) =>
    `An airline's flight-ops model assigns a ${pc(p.prior)}% chance that a storm will affect a given route today. Historically, ${pc(p.pDelayStorm)}% of flights on stormy days get delayed, ` +
    `versus only ${pc(p.pDelayNoStorm)}% of flights on clear days. Today's flight on this route is delayed. What is the probability a storm affected the route?`,
  answerKey: "postStorm",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $S$ = storm, $D$ = delayed. Given $P(S)=${p.prior}$, $P(D\\mid S)=${p.pDelayStorm}$, $P(D\\mid \\bar S)=${p.pDelayNoStorm}$.` },
    { title: "Draw all four leaves", body: `Storm-and-delayed: $${p.prior}\\times${p.pDelayStorm}=${fmtNum(d.massStormDelay)}$. Storm-and-on-time: $${p.prior}\\times${fmtNum(d.onTimeStorm)}=${fmtNum(d.massStormOnTime)}$. Clear-and-delayed: $${fmtNum(d.noStorm)}\\times${p.pDelayNoStorm}=${fmtNum(d.massNoStormDelay)}$. Clear-and-on-time: $${fmtNum(d.noStorm)}\\times${fmtNum(d.onTimeNoStorm)}=${fmtNum(d.massNoStormOnTime)}$.` },
    { title: "Prune to the matching leaves", body: `Only the two delayed leaves survive the evidence: $P(D)=${fmtNum(d.massStormDelay)}+${fmtNum(d.massNoStormDelay)}=${fmtNum(d.pDelay)}$, so $P(S\\mid D)=${fmtNum(d.massStormDelay)}/${fmtNum(d.pDelay)}=${fmtNum(d.postStorm)}$.` },
    { title: "Sanity check", body: `The four leaves partition every possible flight today, so they must sum to exactly $1$: $${fmtNum(d.massStormDelay)}+${fmtNum(d.massStormOnTime)}+${fmtNum(d.massNoStormDelay)}+${fmtNum(d.massNoStormOnTime)}=${fmtNum(d.leafSum)}$ — and it does. Storms also drive delays far more than clear weather does, so seeing a delay should raise the storm probability above its ${p.prior} prior — and $${fmtNum(d.postStorm)} > ${p.prior}$ holds.` },
  ],
  keyInsight: "Drawing out all four branches of the tree — not just the two that match the evidence — makes it obvious which leaves to keep and confirms nothing was dropped, since the full set always has to sum to one.",
  commonTrap: "Reporting the storm-and-delayed leaf mass itself as the answer instead of dividing it by the total delayed mass — a joint leaf mass from the tree is not yet a conditional probability.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
