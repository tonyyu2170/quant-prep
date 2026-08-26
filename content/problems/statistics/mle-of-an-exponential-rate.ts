import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const mleOfAnExponentialRate: ProblemTemplate = {
  id: "statistics/mle-of-an-exponential-rate",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.2 }, { firm: "citadel", weight: 0.15 }, { firm: "imc", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the maximum-likelihood estimator of an exponential rate from a completed sample" },
  params: {
    gaps: { choices: [8, 10, 12, 15, 16, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60] },
    hours: { choices: [4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24] },
  },
  constraint: (p) => p.gaps / p.hours >= 0.6 && p.gaps / p.hours <= 9,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const answer = round(p.gaps / p.hours);
    return {
      answer,
      meanGapMin: round((60 * p.hours) / p.gaps),
      twiceHours: 2 * p.hours,
      twiceGaps: 2 * p.gaps,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A market-data team times the gaps between consecutive quote updates on a thinly traded name, treating them as independent draws from an exponential distribution. Over ${fmtNum(p.hours)} hours of continuous trading they record ${fmtNum(p.gaps)} completed gaps. ` +
    `What is the maximum-likelihood estimate of the update rate, in updates per hour?`,
  solution: (p, d) => [
    { title: "Only two numbers from the sample survive", body: `The likelihood multiplies one exponential density per gap, so the log-likelihood is the gap count times the log of the rate, less the rate times the total time watched. The individual gap lengths enter nowhere except through their sum, which here is the whole ${fmtNum(p.hours)}-hour window — so a sample of ${fmtNum(p.gaps)} gaps carries exactly as much information as the pair (count, elapsed time).` },
    { title: "Where the derivative vanishes", body: `Differentiating in the rate gives the count over the rate, less the elapsed time, and that is zero at $\\text{rate}=\\dfrac{\\text{count}}{\\text{elapsed time}}$. The estimate is an occurrence rate — events divided by the exposure that produced them — and not an average of the gaps.` },
    { title: "Put the numbers in", body: `$\\dfrac{${fmtNum(p.gaps)}}{${fmtNum(p.hours)}}=${fmtNum(d.answer)}$ updates per hour.` },
    { title: "Answer", body: `The maximum-likelihood update rate is ${fmtNum(d.answer)} per hour.` },
    { title: "Sanity check", body: `The reciprocal is the mean gap: at ${fmtNum(d.answer)} updates an hour the average wait is $\\dfrac{60\\times${fmtNum(p.hours)}}{${fmtNum(p.gaps)}}=${fmtNum(d.meanGapMin)}$ minutes, which is just the ${fmtNum(p.hours)} hours shared out among the ${fmtNum(p.gaps)} gaps. Watching twice as long on the same name would be expected to yield ${fmtNum(d.twiceGaps)} gaps in ${fmtNum(d.twiceHours)} hours and return the same estimate — more data sharpens the rate, it does not move it.` },
  ],
  keyInsight: "The likelihood of a completed exponential sample depends on the data only through the number of events and the total time they were observed over, so the estimate is a count divided by an exposure. Everything else in the sample — the order of the gaps, their spread, the longest one — is information the model cannot use.",
  commonTrap: "Averaging the gaps and reporting that as the rate. The mean gap is the reciprocal of the rate, so quoting it answers the opposite question, and the two agree only when the rate happens to be one. The other slip is dividing the elapsed time by the count and calling the result a rate, which is the same inversion wearing a division sign.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [60, 2],
};
