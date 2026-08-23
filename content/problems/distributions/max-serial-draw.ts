import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The k sampled tags cut the N-k unsampled ones into k+1 gaps whose expected sizes are equal
// by exchangeability, so the gap above the largest tag averages (N-k)/(k+1) and the largest
// tag averages N minus that, which simplifies to k(N+1)/(k+1).
export const maxSerialDraw: ProblemTemplate = {
  id: "distributions/max-serial-draw",
  version: 1,
  firms: [{ firm: "de-shaw", weight: 0.4 }, { firm: "jump", weight: 0.3 }, { firm: "hrt", weight: 0.25 }],
  topic: "probability/distributions",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "expected largest serial number in a sample drawn without replacement" },
  params: {
    stock: { range: { min: 20, max: 120, step: 1 } },
    picked: { choices: [2, 3, 4, 5] },
  },
  derived: (p) => {
    const gaps = p.picked + 1;
    const nPlus1 = p.stock + 1;
    return {
      gaps,
      nPlus1,
      unsampled: p.stock - p.picked,
      topGap: (p.stock - p.picked) / gaps,
      numer: p.picked * nPlus1,
      answer: (p.picked * nPlus1) / gaps,
    };
  },
  statement: (p) =>
    `A workshop stamps its units with consecutive tags ${fmtNum(1)} through ${fmtNum(p.stock)}, one tag per unit. An auditor pulls ${fmtNum(p.picked)} units at random without replacement and reads their tags. What is the expected value of the largest tag the auditor sees?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Look at the gaps, not the tags", body: `The ${fmtNum(p.picked)} sampled tags split the ${fmtNum(d.unsampled)} unsampled ones into ${fmtNum(d.gaps)} stretches: the ones below the smallest sampled tag, the ones between consecutive sampled tags, and the ones above the largest.` },
    { title: "Every gap is the same size on average", body: `Nothing distinguishes one of those ${fmtNum(d.gaps)} stretches from another — relabelling the tags in reverse maps the top stretch onto the bottom one — so each holds $${fmtNum(d.topGap)}$ unsampled tags on average.` },
    { title: "Read off the largest tag", body: `The largest sampled tag is ${fmtNum(p.stock)} minus whatever sits above it, so its expectation is $\\frac{${fmtNum(p.picked)}\\times${fmtNum(d.nPlus1)}}{${fmtNum(d.gaps)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Pulling more units pushes the expected maximum closer to ${fmtNum(p.stock)} without ever reaching it, and the answer is always a fraction of the way up rather than the whole way — which is exactly why doubling the observed maximum is the standard estimator for the stock.` },
  ],
  keyInsight: "Counting the unsampled tags between the sampled ones turns an order-statistic question into an exchangeability one: all the gaps are equivalent, so each takes the same expected share.",
  commonTrap: "Reusing the with-replacement answer, or assuming the expected maximum is the stock scaled by the fraction sampled. Sampling without replacement spreads the picks out, and the gap argument is what makes the plus-one appear.",
  expectedPaceS: 110,
  constants: [1],
  verify: { method: "brute-force" },
};
