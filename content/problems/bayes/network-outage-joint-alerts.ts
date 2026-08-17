import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Dependent evidence: the two alerts' JOINT conditional probabilities are given directly
// (not independent), so the trap of multiplying the marginals gives a different, wrong number.
export const networkOutageJointAlerts: ProblemTemplate = {
  id: "bayes/network-outage-joint-alerts",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.5 }, { firm: "jane-street", weight: 0.4 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "novel: posterior update from an explicitly given joint (non-independent) likelihood" },
  params: {
    prior: { choices: [0.05, 0.1, 0.15] },
    pS1D: { choices: [0.6, 0.7, 0.8] },
    pS2D: { choices: [0.5, 0.6, 0.7] },
    boostD: { choices: [1.05, 1.1, 1.15, 1.2] },
    jointND: { choices: [0.02, 0.03, 0.05, 0.08] },
  },
  derived: (p) => {
    const legit = 1 - p.prior;
    const productD = p.pS1D * p.pS2D;
    const jointD = p.boostD * productD;
    const numD = p.prior * jointD;
    const numND = legit * p.jointND;
    const denom = numD + numND;
    const postD = numD / denom;
    return { legit, productD, jointD, numD, numND, denom, postD };
  },
  statement: (p, d) =>
    `A network operations team monitors two alert systems, Alert 1 and Alert 2, which share upstream infrastructure. The prior probability of an actual outage on any given check is ${pc(p.prior)}%. ` +
    `During an outage, Alert 1 fires ${pc(p.pS1D)}% of the time on its own and Alert 2 fires ${pc(p.pS2D)}% of the time on its own — but because they share dependencies, they do NOT fire independently: ` +
    `during an outage, BOTH alerts fire together ${pc(d.jointD)}% of the time (more than the ${pc(d.productD)}% that independence would predict). During normal operation (no outage), both alerts still fire together ${pc(p.jointND)}% of the time due to shared background noise. ` +
    `Both Alert 1 and Alert 2 fire right now. What is the probability there is an actual outage?`,
  answerKey: "postD",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $D$ = outage, $S_1,S_2$ = Alert 1, Alert 2 fire. Given $P(D)=${p.prior}$, $P(S_1\\mid D)=${p.pS1D}$, $P(S_2\\mid D)=${p.pS2D}$, and directly, $P(S_1\\cap S_2\\mid D)=${fmtNum(d.jointD)}$, $P(S_1\\cap S_2\\mid \\bar D)=${p.jointND}$.` },
    { title: "Why the marginals alone don't work", body: `If the alerts fired independently given $D$, $P(S_1\\cap S_2\\mid D)$ would be the product $${p.pS1D}\\times${p.pS2D}=${fmtNum(d.productD)}$ — but the problem gives the TRUE joint value directly, $${fmtNum(d.jointD)}$, which is larger because the alerts are correlated. The given joint must be used, not the product of marginals.` },
    { title: "Combine with the prior", body: `True-fire mass: $${p.prior}\\times${fmtNum(d.jointD)}=${fmtNum(d.numD)}$. False-fire mass: the no-outage share is ${fmtNum(d.legit)}, giving $${fmtNum(d.legit)}\\times${p.jointND}=${fmtNum(d.numND)}$.` },
    { title: "Posterior", body: `$P(S_1\\cap S_2)=${fmtNum(d.numD)}+${fmtNum(d.numND)}=${fmtNum(d.denom)}$, so $P(D\\mid S_1\\cap S_2)=${fmtNum(d.numD)}/${fmtNum(d.denom)}=${fmtNum(d.postD)}$.` },
    { title: "Sanity check", body: `Both alerts co-occurring is stated to be more common during an outage than during normal background noise ($${fmtNum(d.jointD)} > ${p.jointND}$), so observing both fire together must push the posterior above the raw prior — and $${fmtNum(d.postD)} > ${p.prior}$ holds.` },
  ],
  keyInsight: "When two pieces of evidence are explicitly dependent, their joint likelihood has to be taken as given (or derived from a real joint model) rather than reconstructed from the marginals — multiplying conditional probabilities together is only valid when the underlying events are conditionally independent, and correlated alerts break that assumption in exactly the regime where compound evidence matters most.",
  commonTrap: "Multiplying the individual alert rates P(S1|D) x P(S2|D) instead of using the given joint P(S1 and S2|D) directly — the alerts are explicitly stated to be correlated through shared infrastructure, so their joint firing rate is not the product of their marginals.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
