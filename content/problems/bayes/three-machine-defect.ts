import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Three-source variant: three machines with different output shares and defect rates,
// posterior on source given a defect.
export const threeMachineDefect: ProblemTemplate = {
  id: "bayes/three-machine-defect",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "susquehanna", weight: 0.5 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic: multi-source total-probability / posterior-on-source" },
  params: {
    shareA: { choices: [0.2, 0.3, 0.4] },
    shareB: { choices: [0.2, 0.3, 0.4] },
    defA: { choices: [0.02, 0.03, 0.04] },
    defB: { choices: [0.02, 0.03, 0.04] },
    defC: { choices: [0.1, 0.12, 0.15] },
  },
  derived: (p) => {
    const shareC = 1 - p.shareA - p.shareB;
    const massA = p.shareA * p.defA;
    const massB = p.shareB * p.defB;
    const massC = shareC * p.defC;
    const totalDef = massA + massB + massC;
    const postC = massC / totalDef;
    return { shareC, massA, massB, massC, totalDef, postC };
  },
  statement: (p) =>
    `Three assembly lines feed a single output bin. Line A supplies ${pc(p.shareA)}% of units and has a ${pc(p.defA)}% defect rate; ` +
    `Line B supplies ${pc(p.shareB)}% of units and has a ${pc(p.defB)}% defect rate; Line C supplies the rest and has a ${pc(p.defC)}% defect rate. ` +
    `A unit pulled at random from the bin is defective. What is the probability it came from Line C?`,
  answerKey: "postC",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A,B,C$ = source line, $D$ = defective. Line C's share is $${fmtNum(d.shareC)}$ (the remainder after $${p.shareA}$ and $${p.shareB}$). Given $P(D\\mid A)=${p.defA}$, $P(D\\mid B)=${p.defB}$, $P(D\\mid C)=${p.defC}$.` },
    { title: "Contribution from each line", body: `$${p.shareA}\\times${p.defA}=${fmtNum(d.massA)}$, $${p.shareB}\\times${p.defB}=${fmtNum(d.massB)}$, $${fmtNum(d.shareC)}\\times${p.defC}=${fmtNum(d.massC)}$.` },
    { title: "Total defect probability", body: `$P(D)=${fmtNum(d.massA)}+${fmtNum(d.massB)}+${fmtNum(d.massC)}=${fmtNum(d.totalDef)}$.` },
    { title: "Posterior", body: `$P(C\\mid D)=${fmtNum(d.massC)}/${fmtNum(d.totalDef)}=${fmtNum(d.postC)}$.` },
    { title: "Sanity check", body: `Line C's defect rate exceeds both A's and B's, so a defective unit should be more likely to be from C than C's raw share suggests — and $${fmtNum(d.postC)} > ${fmtNum(d.shareC)}$ holds.` },
  ],
  keyInsight: "With three (or more) sources, Bayes' rule just needs one share-times-rate mass term per source summed in the denominator — the structure doesn't change beyond two sources.",
  commonTrap: "Assuming each of the three lines contributes equally to defects because there are three of them — the mass depends on both share and defect rate, not the source count.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
