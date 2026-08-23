import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two independent Poisson streams merge into one of rate le+lc, and each arrival in the merged
// stream is an email with probability le/(le+lc) independently of timing — so the first arrival
// of the day is an email with exactly that probability.
export const firstContactRace: ProblemTemplate = {
  id: "distributions/first-contact-race",
  version: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "flow", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  topic: "probability/distributions",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "which of two competing Poisson streams produces the first arrival" },
  params: {
    emailRate: { choices: [1, 2, 3, 4, 5, 6] },
    callRate: { choices: [1, 2, 3, 4, 5, 6] },
    days: { choices: [2, 3, 4, 5, 7, 10] },
  },
  derived: (p) => {
    const merged = p.emailRate + p.callRate;
    return {
      merged,
      share: p.emailRate / merged,
      numer: p.days * p.emailRate,
      ev: (p.days * p.emailRate) / merged,
    };
  },
  statement: (p) =>
    `A desk opens each morning to two independent streams of client contact: emails arriving as a Poisson process at ${fmtNum(p.emailRate)} per hour, and phone calls as a Poisson process at ${fmtNum(p.callRate)} per hour. Each day the desk notes whether the very first contact of the day was an email or a call. Over ${fmtNum(p.days)} such days, on how many should the desk expect an email to have come first?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Merge the two streams", body: `Superimposing two independent Poisson processes gives another Poisson process, with the rates simply adding: $${fmtNum(p.emailRate)}+${fmtNum(p.callRate)}=${fmtNum(d.merged)}$ contacts per hour.` },
    { title: "Label each arrival", body: `In the merged stream every arrival is independently an email or a call, and the chance it is an email is that stream's share of the total rate. Crucially this label is independent of when the arrival happened.` },
    { title: "So the first one is no different", body: `Because the labels do not depend on timing, the first arrival of the day is an email with the same share: $\\frac{${fmtNum(p.emailRate)}}{${fmtNum(d.merged)}}=${fmtNum(d.share)}$. How busy the morning is never enters it.` },
    { title: "Count the days", body: `Expectation adds across the ${fmtNum(p.days)} days, giving $\\frac{${fmtNum(p.days)}\\times${fmtNum(p.emailRate)}}{${fmtNum(d.merged)}}=${fmtNum(d.ev)}$ days.` },
    { title: "Sanity check", body: `The answer depends only on the ratio of the two rates, not their size: doubling both leaves it unchanged, because a busier day speeds up both streams equally.` },
  ],
  keyInsight: "The winner of a race between independent Poisson streams is decided by rate share alone, because the merged process labels each arrival independently of when it lands.",
  commonTrap: "Comparing the two expected waiting times and picking the smaller, or computing which stream has more arrivals per day. Neither answers the question asked, and the first is a comparison of means where a probability was wanted.",
  expectedPaceS: 100,
  verify: { method: "montecarlo" },
};
