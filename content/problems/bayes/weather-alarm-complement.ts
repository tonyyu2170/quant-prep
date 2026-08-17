import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Rain/alarm base-rate problem framed operationally, using only one complement
// (spec §6 source kind: textbook classic, new prose + new parameters + our own solution).
export const weatherAlarmComplement: ProblemTemplate = {
  id: "bayes/weather-alarm-complement",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.5 }, { firm: "de-shaw", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: rain/alarm base-rate problem" },
  params: {
    pRain: { choices: [0.2, 0.3, 0.4] },
    pAlarmGivenRain: { choices: [0.8, 0.85, 0.9] },
    pAlarmGivenNoRain: { choices: [0.1, 0.15, 0.2] },
  },
  derived: (p) => {
    const pNoRain = 1 - p.pRain;
    const tp = p.pRain * p.pAlarmGivenRain;
    const fp = pNoRain * p.pAlarmGivenNoRain;
    const pAlarm = tp + fp;
    const postRain = tp / pAlarm;
    return { pNoRain, tp, fp, pAlarm, postRain };
  },
  statement: (p) =>
    `A weather station's automated alarm is designed to sound when rain is likely. On any given day, rain occurs ${pc(p.pRain)}% of the time. ` +
    `The alarm sounds on ${pc(p.pAlarmGivenRain)}% of rainy days and on ${pc(p.pAlarmGivenNoRain)}% of dry days. ` +
    `The alarm sounds today. What is the probability it is actually going to rain?`,
  answerKey: "postRain",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $R$ = rain, $A$ = alarm sounds. Given $P(R)=${p.pRain}$, $P(A\\mid R)=${p.pAlarmGivenRain}$, $P(A\\mid \\bar R)=${p.pAlarmGivenNoRain}$; the dry-day share is ${fmtNum(d.pNoRain)}.` },
    { title: "True-alarm mass", body: `$${p.pRain}\\times${p.pAlarmGivenRain}=${fmtNum(d.tp)}$ — the share of days that are both rainy and alarmed.` },
    { title: "False-alarm mass", body: `$${fmtNum(d.pNoRain)}\\times${p.pAlarmGivenNoRain}=${fmtNum(d.fp)}$ — the share of days that are dry but alarmed anyway.` },
    { title: "Combine", body: `$P(A)=${fmtNum(d.tp)}+${fmtNum(d.fp)}=${fmtNum(d.pAlarm)}$, so $P(R\\mid A)=${fmtNum(d.tp)}/${fmtNum(d.pAlarm)}=${fmtNum(d.postRain)}$.` },
    { title: "Sanity check", body: `The alarm sounds far more on rainy days than on dry ones, so the posterior must exceed the raw $${p.pRain}$ prior — and $${fmtNum(d.postRain)} > ${p.pRain}$ holds.` },
  ],
  keyInsight: "The alarm's evidential value comes from the gap between its rainy-day and dry-day sounding rates, not either rate alone.",
  commonTrap: "Reporting the alarm's rainy-day sounding rate as the answer — that's the reverse conditional, not the probability of rain given the alarm sounded.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
