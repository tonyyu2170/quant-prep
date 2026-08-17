import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Odds-to-probability conversion, then a single likelihood-ratio update — all in odds space,
// converting back to a probability only at the end.
export const bookmakerOddsUpdate: ProblemTemplate = {
  id: "bayes/bookmaker-odds-update",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "drw", weight: 0.5 }, { firm: "jump", weight: 0.4 }],
  source: { kind: "original", inspiration: "novel: converting a bookmaker odds quote into a Bayesian prior and updating via a single likelihood ratio" },
  params: {
    againstOdds: { choices: [2, 3, 4, 5, 6, 7, 8, 9] },
    likelihoodRatio: { choices: [1.2, 1.5, 1.8, 2, 2.5, 3] },
  },
  derived: (p) => {
    const denomOdds = p.againstOdds + 1;
    const priorProb = 1 / denomOdds;
    const complement = p.againstOdds / denomOdds;
    const priorOdds = priorProb / complement;
    const postOdds = priorOdds * p.likelihoodRatio;
    const onePlusPostOdds = postOdds + 1;
    const postProb = postOdds / onePlusPostOdds;
    return { denomOdds, priorProb, complement, priorOdds, postOdds, onePlusPostOdds, postProb };
  },
  statement: (p) =>
    `A bookmaker quotes odds of ${p.againstOdds} to 1 against a horse winning its race — this quote is already a probability statement in disguise. ` +
    `Then news breaks that the horse's jockey has recovered from injury, a signal that is ${p.likelihoodRatio} times more likely to be reported if the horse wins than if it does not. ` +
    `Using this one piece of evidence, what is the updated probability the horse wins?`,
  answerKey: "postProb",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `"${p.againstOdds} to 1 against" means for every $1$ way of winning there are ${p.againstOdds} ways of losing, out of ${fmtNum(d.denomOdds)} equally weighted ways total.` },
    { title: "Convert to a probability", body: `$P(\\text{win})=1/${fmtNum(d.denomOdds)}=${fmtNum(d.priorProb)}$, and $P(\\text{lose})=${p.againstOdds}/${fmtNum(d.denomOdds)}=${fmtNum(d.complement)}$.` },
    { title: "Prior odds", body: `$\\text{odds}(\\text{win})=P(\\text{win})/P(\\text{lose})=${fmtNum(d.priorProb)}/${fmtNum(d.complement)}=${fmtNum(d.priorOdds)}$ — this recovers the bookmaker's original $1:${p.againstOdds}$ quote.` },
    { title: "Update with the likelihood ratio", body: `$\\text{odds}(\\text{win}\\mid\\text{signal})=\\text{odds}(\\text{win})\\times\\text{LR}=${fmtNum(d.priorOdds)}\\times${p.likelihoodRatio}=${fmtNum(d.postOdds)}$.` },
    { title: "Convert back to a probability", body: `$P(\\text{win}\\mid\\text{signal})=\\dfrac{${fmtNum(d.postOdds)}}{${fmtNum(d.postOdds)}+1}=\\dfrac{${fmtNum(d.postOdds)}}{${fmtNum(d.onePlusPostOdds)}}=${fmtNum(d.postProb)}$.` },
    { title: "Sanity check", body: `The likelihood ratio ${p.likelihoodRatio} exceeds $1$, so the update can only raise the odds above ${fmtNum(d.priorOdds)}, and since probability increases with odds, the posterior probability must clear the prior implied probability ${fmtNum(d.priorProb)} — and $${fmtNum(d.postProb)} > ${fmtNum(d.priorProb)}$ holds.` },
  ],
  keyInsight: "A quoted betting line is already a prior expressed in odds form — there's no separate base-rate calculation needed, just isolate the implied fraction, then a single likelihood-ratio update is one multiplication in odds space before converting back to a probability.",
  commonTrap: "Reporting the posterior odds ratio itself as the final probability instead of converting it back via odds/(1+odds) — odds and probability are different scales that only coincide at even odds.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
