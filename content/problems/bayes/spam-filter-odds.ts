import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Posterior odds / likelihood-ratio framing: answer is a probability, steps work through odds
// (spec §6 source kind: textbook classic, new prose + new parameters + our own solution).
export const spamFilterOdds: ProblemTemplate = {
  id: "bayes/spam-filter-odds",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.5 }, { firm: "optiver", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "classic: posterior odds via likelihood ratio" },
  params: {
    priorSpam: { choices: [0.2, 0.3, 0.4] },
    pPhraseSpam: { choices: [0.6, 0.7, 0.8] },
    pPhraseHam: { choices: [0.05, 0.1, 0.15] },
  },
  derived: (p) => {
    const priorHam = 1 - p.priorSpam;
    const priorOdds = p.priorSpam / priorHam;
    const likelihoodRatio = p.pPhraseSpam / p.pPhraseHam;
    const posteriorOdds = priorOdds * likelihoodRatio;
    const onePlusOdds = posteriorOdds + 1;
    const posterior = posteriorOdds / onePlusOdds;
    return { priorHam, priorOdds, likelihoodRatio, posteriorOdds, onePlusOdds, posterior };
  },
  statement: (p) =>
    `A spam filter sees that ${pc(p.priorSpam)}% of incoming email is spam. The phrase "act now" appears in ${pc(p.pPhraseSpam)}% of spam emails ` +
    `but only ${pc(p.pPhraseHam)}% of legitimate (ham) emails. A new email contains the phrase "act now". What is the probability it is spam?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $S$ = spam, $H$ = phrase present. Given $P(S)=${p.priorSpam}$, $P(H\\mid S)=${p.pPhraseSpam}$, $P(H\\mid \\bar S)=${p.pPhraseHam}$; the ham share is ${fmtNum(d.priorHam)}.` },
    { title: "Prior odds", body: `$\\text{odds}(S) = P(S)/P(\\bar S) = ${p.priorSpam}/${fmtNum(d.priorHam)} = ${fmtNum(d.priorOdds)}$.` },
    { title: "Likelihood ratio", body: `$\\text{LR} = P(H\\mid S)/P(H\\mid \\bar S) = ${p.pPhraseSpam}/${p.pPhraseHam} = ${fmtNum(d.likelihoodRatio)}$.` },
    { title: "Posterior odds", body: `$\\text{odds}(S\\mid H) = \\text{odds}(S)\\times\\text{LR} = ${fmtNum(d.priorOdds)}\\times${fmtNum(d.likelihoodRatio)} = ${fmtNum(d.posteriorOdds)}$.` },
    { title: "Convert to probability", body: `$P(S\\mid H) = \\dfrac{${fmtNum(d.posteriorOdds)}}{${fmtNum(d.posteriorOdds)}+1} = \\dfrac{${fmtNum(d.posteriorOdds)}}{${fmtNum(d.onePlusOdds)}} = ${fmtNum(d.posterior)}$.` },
    { title: "Sanity check", body: `The phrase is more common in spam than in ham, so the likelihood ratio exceeds 1 and the posterior must exceed the raw $${p.priorSpam}$ prior — and $${fmtNum(d.posterior)} > ${p.priorSpam}$ holds.` },
  ],
  keyInsight: "Posterior odds are just prior odds multiplied by the likelihood ratio — no need to compute a total-probability denominator explicitly.",
  commonTrap: "Treating the likelihood ratio itself as the answer instead of multiplying it into the prior odds and then converting the result back into a probability.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1],
};
