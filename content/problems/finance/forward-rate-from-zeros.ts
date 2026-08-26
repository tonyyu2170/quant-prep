import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const forwardRateFromZeros: ProblemTemplate = {
  id: "finance/forward-rate-from-zeros",
  version: 1,
  topic: "finance/fixed-income",
  difficulty: 1,
  firms: [{ firm: "citadel", weight: 0.2 }, { firm: "millennium", weight: 0.2 }, { firm: "jane-street", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the one-year forward rate implied by two spot zero rates, by no arbitrage" },
  params: {
    // Half-point steps are a printing requirement, not a taste: at 0.25 the growth factor
    // needs five significant figures (1.0325) and fmtNum prints four, so the chain below would
    // be evaluated from a truncated operand. The range is widened to keep the tuple count up.
    z1: { range: { min: 1, max: 8, step: 0.5 } },
    z2: { range: { min: 1, max: 9, step: 0.5 } },
  },
  constraint: (p) => Math.abs(p.z2 - p.z1) >= 0.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const onePlusOne = round(1 + p.z1 / 100);
    const onePlusTwo = round(1 + p.z2 / 100);
    return {
      onePlusOne, onePlusTwo,
      twoYearGrowth: round(onePlusTwo * onePlusTwo),
      growthFactor: round((onePlusTwo * onePlusTwo) / onePlusOne),
      answer: round(((onePlusTwo * onePlusTwo) / onePlusOne - 1) * 100),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A rates desk sees one-year money at ${fmtNum(p.z1)}% and two-year money at ${fmtNum(p.z2)}%, both quoted as annually compounded zero rates. ` +
    `What one-year rate, starting a year from now, does the curve already imply?`,
  solution: (p, d) => [
    { title: "Two routes to the same date must pay the same", body: `Lending for two years, or lending for one and rolling into a rate agreed today for the second year, both leave you holding cash at the same moment with no risk taken. If they paid differently, the cheaper route funds the dearer one for free — so the two growth factors have to match exactly.` },
    { title: "Write both routes out", body: `Two years of compounding gives $${fmtNum(d.onePlusTwo)}\\times${fmtNum(d.onePlusTwo)}=${fmtNum(d.twoYearGrowth)}$. The other route grows by ${fmtNum(d.onePlusOne)} in the first year and then by the forward factor.` },
    { title: "Divide out the first year", body: `The forward factor is what is left: $\\dfrac{${fmtNum(d.onePlusTwo)}\\times${fmtNum(d.onePlusTwo)}}{${fmtNum(d.onePlusOne)}}=${fmtNum(d.growthFactor)}$, which is a rate of ${fmtNum(d.answer)}% for that second year.` },
    { title: "Answer", body: `The curve implies a one-year forward rate of ${fmtNum(d.answer)}%.` },
    { title: "Sanity check", body: `The forward sits ${p.z2 > p.z1 ? "above" : "below"} both spot rates, which is the rule rather than a coincidence: the two-year rate is an average of this year's rate and the forward, so a curve sloping ${p.z2 > p.z1 ? "up" : "down"} needs the far year to pull that average ${p.z2 > p.z1 ? "up" : "down"}. A forward rate always overshoots the spread between the two spots.` },
  ],
  keyInsight: "The forward rate is not a forecast, it is the only second-year rate that stops the two funding routes from arbitraging each other, so it falls out of division rather than opinion. Because a multi-year spot rate is a geometric average of the forwards inside it, the forward always lies beyond the spot it is being read off.",
  commonTrap: "Doubling the two-year rate and subtracting the one-year rate, which is the right shape done in the wrong algebra — rates compound, so it is the growth FACTORS that divide, not the percentages that subtract. The approximation is close at small rates and drifts as they rise, which is what makes it hard to spot.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1],
};
