import type { ProblemTemplate } from "@qp/engine";
import { baseRateTest } from "./bayes/base-rate-test";
import { twoUrns } from "./bayes/two-urns";
import { twoSignalFraud } from "./bayes/two-signal-fraud";
import { weatherAlarmComplement } from "./bayes/weather-alarm-complement";
import { spamFilterOdds } from "./bayes/spam-filter-odds";
import { strategyOutcomeTable } from "./bayes/strategy-outcome-table";
import { raffleWithoutReplacement } from "./bayes/raffle-without-replacement";
import { threeMachineDefect } from "./bayes/three-machine-defect";
import { coinIdentificationStreak } from "./bayes/coin-identification-streak";
import { taxiCabWitness } from "./bayes/taxi-cab-witness";
import { diceFaceGivenSum } from "./bayes/dice-face-given-sum";
import { surveyOverlapConditional } from "./bayes/survey-overlap-conditional";

export const PROBLEMS: ProblemTemplate[] = [
  baseRateTest,
  twoUrns,
  twoSignalFraud,
  weatherAlarmComplement,
  spamFilterOdds,
  strategyOutcomeTable,
  raffleWithoutReplacement,
  threeMachineDefect,
  coinIdentificationStreak,
  taxiCabWitness,
  diceFaceGivenSum,
  surveyOverlapConditional,
];

export const byId = new Map(PROBLEMS.map((t) => [t.id, t]));

export function problemsFor(topic?: string, difficulty?: 1 | 2 | 3): ProblemTemplate[] {
  return PROBLEMS.filter((t) => (!topic || t.topic === topic) && (!difficulty || t.difficulty === difficulty));
}

export const TOPIC_LABELS: Record<string, string> = {
  "probability/bayes": "bayes",
  "probability/counting": "counting",
  "probability/ev-variance": "ev & variance",
  "probability/distributions": "distributions",
  "probability/ruin": "ruin & walks",
  "probability/geometric": "geometric",
};
