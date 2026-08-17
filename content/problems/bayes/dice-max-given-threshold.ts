import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Dice conditional via complementary counting: P(max of two dice = m | at least one die >= x).
export const diceMaxGivenThreshold: ProblemTemplate = {
  id: "bayes/dice-max-given-threshold",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.5 }, { firm: "imc", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "classic: conditional probability of the max of two dice given a threshold event" },
  params: {
    x: { choices: [2, 3, 4, 5] },
    m: { choices: [1, 2, 3, 4, 5, 6] },
  },
  constraint: (p) => p.m >= p.x,
  derived: (p) => {
    const complementPairs: [number, number][] = [];
    for (let d1 = 1; d1 <= 6; d1++) for (let d2 = 1; d2 <= 6; d2++) if (d1 < p.x && d2 < p.x) complementPairs.push([d1, d2]);
    const favorablePairs: [number, number][] = [];
    for (let d1 = 1; d1 <= 6; d1++) for (let d2 = 1; d2 <= 6; d2++) if (Math.max(d1, d2) === p.m) favorablePairs.push([d1, d2]);
    const complementCount = complementPairs.length;
    const total = 36 - complementCount;
    const favorable = favorablePairs.length;
    const probMax = favorable / total;
    const probMaxUnconditional = favorable / 36;
    return { complementCount, total, favorable, probMax, probMaxUnconditional };
  },
  statement: (p) =>
    `Two fair six-sided dice are rolled. Given that at least one of the two dice shows a value of ${p.x} or higher, what is the probability that the maximum of the two values shown is exactly ${p.m}?`,
  answerKey: "probMax",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => {
    const complementPairs: [number, number][] = [];
    for (let d1 = 1; d1 <= 6; d1++) for (let d2 = 1; d2 <= 6; d2++) if (d1 < p.x && d2 < p.x) complementPairs.push([d1, d2]);
    const favorablePairs: [number, number][] = [];
    for (let d1 = 1; d1 <= 6; d1++) for (let d2 = 1; d2 <= 6; d2++) if (Math.max(d1, d2) === p.m) favorablePairs.push([d1, d2]);
    const complementList = complementPairs.map(([a, b]) => `(${a},${b})`).join(", ");
    const favorableList = favorablePairs.map(([a, b]) => `(${a},${b})`).join(", ");
    return [
      { title: "Setup", body: `There are 36 equally likely ordered pairs $(d_1,d_2)$. The condition "at least one die $\\geq ${p.x}$" is easiest to handle by its complement: "both dice $< ${p.x}$".` },
      { title: "Count the complement", body: `Pairs with both dice below ${p.x} are ${complementList} — ${fmtNum(d.complementCount)} pairs. So the condition holds for $36-${fmtNum(d.complementCount)}=${fmtNum(d.total)}$ pairs.` },
      { title: "Enumerate the favorable pairs", body: `Pairs whose MAXIMUM equals exactly ${p.m} are ${favorableList} — ${fmtNum(d.favorable)} pairs. (A pair like one die at ${p.m} with the other above it does NOT count — the maximum there is higher than ${p.m}.)` },
      { title: "Conditional probability", body: `$P(\\max=${p.m}\\mid\\text{at least one}\\geq${p.x})=${fmtNum(d.favorable)}/${fmtNum(d.total)}=${fmtNum(d.probMax)}$.` },
      { title: "Sanity check", body: `Since ${fmtNum(d.total)} is strictly less than the full 36-pair sample space, dividing the same ${fmtNum(d.favorable)} favorable pairs by this smaller total must exceed the unconditional rate $${fmtNum(d.favorable)}/36=${fmtNum(d.probMaxUnconditional)}$ — and $${fmtNum(d.probMax)} > ${fmtNum(d.probMaxUnconditional)}$ holds.` },
    ];
  },
  keyInsight: "Conditioning on 'at least one die clears a threshold' is best handled by complementary counting — subtract the small set where both dice fall short of the threshold from the full sample space, rather than trying to enumerate every pair that satisfies the condition directly.",
  commonTrap: "Counting every pair where at least one die shows the target value m, rather than pairs where m is specifically the MAXIMUM of the two values — a pair like (m, m+1) has an m showing, but its maximum is m+1, not m, so it must be excluded from the favorable count.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [0, 1, 2, 3, 4, 5, 6, 36],
};
