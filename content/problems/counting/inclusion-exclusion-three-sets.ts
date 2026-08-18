import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Three-set inclusion–exclusion. The Sanity check rebuilds the readership from the
// seven disjoint regions of the diagram — a route that never writes the alternating
// sum, so dropping the add-back of the triple overlap breaks it visibly.
export const inclusionExclusionThreeSets: ProblemTemplate = {
  id: "counting/inclusion-exclusion-three-sets",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "two-sigma", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic three-set inclusion–exclusion with nested pairwise and triple overlaps" },
  params: {
    daily: { range: { min: 12, max: 24, step: 1 } },
    evening: { range: { min: 12, max: 24, step: 1 } },
    weekly: { range: { min: 12, max: 24, step: 1 } },
    dailyEvening: { range: { min: 4, max: 10, step: 1 } },
    dailyWeekly: { range: { min: 4, max: 10, step: 1 } },
    eveningWeekly: { range: { min: 4, max: 10, step: 1 } },
    allThree: { range: { min: 1, max: 4, step: 1 } },
  },
  // Every one of the seven regions must hold at least one reader: a triple overlap
  // strictly inside each pairwise overlap keeps the pair-only regions non-empty, and
  // the three single-only conditions keep the corners non-empty. Without these the
  // reported counts describe an impossible diagram.
  constraint: (p) =>
    p.allThree < Math.min(p.dailyEvening, Math.min(p.dailyWeekly, p.eveningWeekly)) &&
    p.daily - p.dailyEvening - p.dailyWeekly + p.allThree >= 1 &&
    p.evening - p.dailyEvening - p.eveningWeekly + p.allThree >= 1 &&
    p.weekly - p.dailyWeekly - p.eveningWeekly + p.allThree >= 1,
  derived: (p) => {
    const singleSum = p.daily + p.evening + p.weekly;
    const pairSum = p.dailyEvening + p.dailyWeekly + p.eveningWeekly;
    const onlyDaily = p.daily - p.dailyEvening - p.dailyWeekly + p.allThree;
    const onlyEvening = p.evening - p.dailyEvening - p.eveningWeekly + p.allThree;
    const onlyWeekly = p.weekly - p.dailyWeekly - p.eveningWeekly + p.allThree;
    const justDE = p.dailyEvening - p.allThree;
    const justDW = p.dailyWeekly - p.allThree;
    const justEW = p.eveningWeekly - p.allThree;
    return {
      singleSum,
      pairSum,
      afterPairs: singleSum - pairSum,
      union: singleSum - pairSum + p.allThree,
      onlyDaily,
      onlyEvening,
      onlyWeekly,
      justDE,
      justDW,
      justEW,
      cornerSum: onlyDaily + onlyEvening + onlyWeekly,
      pairOnlySum: justDE + justDW + justEW,
    };
  },
  statement: (p) =>
    `A research firm publishes three newsletters. ${fmtNum(p.daily)} people take the morning note, ${fmtNum(p.evening)} take the evening wrap and ${fmtNum(p.weekly)} take the weekend review. ` +
    `Counting readers who take more than one: ${fmtNum(p.dailyEvening)} take the morning note and the evening wrap, ${fmtNum(p.dailyWeekly)} take the morning note and the weekend review, ` +
    `${fmtNum(p.eveningWeekly)} take the evening wrap and the weekend review, and ${fmtNum(p.allThree)} take all three. Each of those pair counts includes the readers who take all three. ` +
    `How many people take at least one newsletter?`,
  answerKey: "union",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Adding the three list sizes counts a reader once for every list they are on, so readers on two lists are counted twice and readers on all three are counted three times. The fix is to correct each kind of reader down to exactly one.` },
    { title: "Add the lists, then remove the pair overlaps", body: `The raw sum is $${fmtNum(p.daily)}+${fmtNum(p.evening)}+${fmtNum(p.weekly)}=${fmtNum(d.singleSum)}$. Subtracting each reported pair overlap, $${fmtNum(p.dailyEvening)}+${fmtNum(p.dailyWeekly)}+${fmtNum(p.eveningWeekly)}=${fmtNum(d.pairSum)}$, gives $${fmtNum(d.singleSum)}-${fmtNum(d.pairSum)}=${fmtNum(d.afterPairs)}$.` },
    { title: "Put the triple overlap back", body: `A reader on all three lists was added three times and then removed three times — once inside each pair overlap — so they now count zero times. Adding them back once gives $${fmtNum(d.afterPairs)}+${fmtNum(p.allThree)}=${fmtNum(d.union)}$ readers on at least one list.` },
    { title: "Sanity check", body: `Rebuild the readership from regions that cannot overlap. Exactly one list: the morning note alone is $${fmtNum(p.daily)}-${fmtNum(p.dailyEvening)}-${fmtNum(p.dailyWeekly)}+${fmtNum(p.allThree)}=${fmtNum(d.onlyDaily)}$ readers, and the same subtraction on the other two lists gives ${fmtNum(d.onlyEvening)} and ${fmtNum(d.onlyWeekly)}, summing to ${fmtNum(d.cornerSum)}. Exactly two lists: $${fmtNum(p.dailyEvening)}-${fmtNum(p.allThree)}=${fmtNum(d.justDE)}$, $${fmtNum(p.dailyWeekly)}-${fmtNum(p.allThree)}=${fmtNum(d.justDW)}$ and $${fmtNum(p.eveningWeekly)}-${fmtNum(p.allThree)}=${fmtNum(d.justEW)}$, summing to ${fmtNum(d.pairOnlySum)}. All three lists: ${fmtNum(p.allThree)}. Those seven groups are disjoint and cover every reader, and $${fmtNum(d.cornerSum)}+${fmtNum(d.pairOnlySum)}+${fmtNum(p.allThree)}=${fmtNum(d.union)}$ — the same total, reached without ever writing an alternating sum.` },
  ],
  keyInsight: "Inclusion–exclusion is bookkeeping on how many times each reader has been counted: subtracting the pairwise overlaps overshoots for anyone in all three lists, so that group must be added back to return every reader to a single tally.",
  commonTrap: "Subtracting the three pairwise overlaps and stopping there, which zeroes out the readers who take all three instead of counting them once — and forgetting that each reported pair count already contains those readers.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
