import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The minute hand sweeps 6 deg/min, the hour hand 0.5 deg/min, so the gap is |30h - 5.5m|.
// Written as |60h - 11m|/2 the whole chain stays over integers.
export const clockHandsAngle: ProblemTemplate = {
  id: "brainteasers/clock-hands-angle",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.3 }, { firm: "akuna", weight: 0.25 }],
  source: { kind: "original", inspiration: "the classic clock-angle question" },
  params: {
    hour: { range: { min: 1, max: 12, step: 1 } },
    minute: { range: { min: 10, max: 59, step: 1 } },
  },
  constraint: (p) => {
    const raw = Math.abs(60 * (p.hour % 12) - 11 * p.minute);
    const a = Math.min(raw, 720 - raw) / 2;
    return a >= 3;
  },
  derived: (p) => {
    const hourTwelfths = p.hour % 12;
    const rawDoubled = Math.abs(60 * hourTwelfths - 11 * p.minute);
    const doubled = Math.min(rawDoubled, 720 - rawDoubled);
    return { hourTwelfths, rawDoubled, doubled, answer: doubled / 2, rawAngle: rawDoubled / 2, minuteDeg: 6 * p.minute, hourDeg: (60 * hourTwelfths + p.minute) / 2 };
  },
  statement: (p) =>
    `A standard analogue clock reads ${fmtNum(p.hour)}:${fmtNum(p.minute)}. What is the smaller of the two angles, in degrees, between the hour hand and the minute hand?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Both hands move", body: `The minute hand turns a full circle each hour, so it sits at $6\\times${p.minute}=${fmtNum(d.minuteDeg)}$ degrees past twelve. The trap is assuming the hour hand sits exactly on its numeral — it does not.` },
    { title: "The hour hand drifts", body: `The hour hand covers 30 degrees per hour, so it creeps half a degree every minute. At this time it stands at $\\frac{60\\times${d.hourTwelfths}+${p.minute}}{2}=${fmtNum(d.hourDeg)}$ degrees.` },
    { title: "Take the gap", body: `The difference between the two positions is $\\frac{${d.rawDoubled}}{2}=${fmtNum(d.rawAngle)}$ degrees.` },
    { title: "Take the smaller side", body: `A gap beyond 180 degrees is better read the other way round, which leaves $\\frac{${d.doubled}}{2}=${fmtNum(d.answer)}$ degrees as the smaller angle.` },
    { title: "Sanity check", body: `Every answer must land in the range 0 to 180, and $${fmtNum(d.answer)}$ does.` },
  ],
  keyInsight: "The hour hand is never parked on its numeral — it moves continuously, half a degree per minute, and that drift is the whole problem.",
  commonTrap: "Reading the hour hand as fixed on the hour mark. At half past it is midway between two numerals, which throws the angle out by up to 30 degrees.",
  expectedPaceS: 90,
  constants: [0, 2, 6, 30, 60, 180],
  verify: { method: "brute-force" },
};
