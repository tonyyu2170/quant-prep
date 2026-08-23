import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Each interior position is a peak exactly when it is the largest of its own three-element
// window, which by exchangeability happens with probability 1/3. The windows overlap heavily,
// but linearity does not care, so E = (n-2)/3.
export const localMaxima: ProblemTemplate = {
  id: "ev-variance/local-maxima",
  version: 1,
  firms: [{ firm: "two-sigma", weight: 0.4 }, { firm: "jane-street", weight: 0.35 }, { firm: "millennium", weight: 0.25 }],
  topic: "probability/ev-variance",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "expected count of local maxima in a random permutation" },
  params: {
    days: { range: { min: 6, max: 40, step: 1 } },
    bounty: { choices: [1, 2, 3, 5, 10, 20] },
  },
  derived: (p) => {
    const interior = p.days - 2;
    return { interior, numer: p.bounty * interior, ev: (p.bounty * interior) / 3 };
  },
  statement: (p) =>
    `A desk logs ${fmtNum(p.days)} daily settlement prices, all distinct, and history says every ordering of them is equally likely. A day is called a swing high if its price is higher than both the day before and the day after — the first and last days do not qualify, having only one neighbour each. A reviewer pays ${fmtNum(p.bounty)} dollars per swing high. What payment should the desk expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One indicator per eligible day", body: `Only the ${fmtNum(d.interior)} interior days can be swing highs, since the two ends are missing a neighbour. Attach an indicator to each and add.` },
    { title: "A single day's chance", body: `Whether day $i$ is a swing high depends only on the relative order of three prices: its own and its two neighbours'. All orderings of the full list are equally likely, so all six orderings of that window are too.` },
    { title: "Middle-is-largest", body: `The day is a swing high exactly when its own price is the largest of the three, which happens for two of the six window orderings — probability one third, the same for every interior day.` },
    { title: "Add them up", body: `Neighbouring windows share prices, so the indicators are certainly not independent — but expectation adds anyway, giving $\\frac{${fmtNum(d.numer)}}{3}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `About a third of the interior days are swing highs, which matches the intuition that peaks, troughs and slopes divide the interior roughly evenly. Lengthening the log raises the answer linearly.` },
  ],
  keyInsight: "The dependence between overlapping windows is real and irrelevant: linearity of expectation adds the indicators regardless, and each indicator reduces to the chance that the middle of three exchangeable values is the largest.",
  commonTrap: "Counting all the days rather than the interior ones, or trying to correct for the fact that two adjacent days cannot both be swing highs. That constraint changes the variance, not the expectation.",
  expectedPaceS: 100,
  constants: [3],
  verify: { method: "brute-force" },
};
