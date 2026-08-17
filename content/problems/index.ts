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
import { prosecutorsFallacyMatch } from "./bayes/prosecutors-fallacy-match";
import { cardDrawWithoutReplacement } from "./bayes/card-draw-without-replacement";
import { threeCoinAtLeastOneHead } from "./bayes/three-coin-at-least-one-head";
import { bookmakerOddsUpdate } from "./bayes/bookmaker-odds-update";
import { threeBoxUnequalPrior } from "./bayes/three-box-unequal-prior";
import { diceMaxGivenThreshold } from "./bayes/dice-max-given-threshold";
import { twoChildrenAtLeastOneBoy } from "./bayes/two-children-at-least-one-boy";
import { coffeeSupplierAllPass } from "./bayes/coffee-supplier-all-pass";
import { airportTwoStageScreening } from "./bayes/airport-two-stage-screening";
import { networkOutageJointAlerts } from "./bayes/network-outage-joint-alerts";

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
  prosecutorsFallacyMatch,
  cardDrawWithoutReplacement,
  threeCoinAtLeastOneHead,
  bookmakerOddsUpdate,
  threeBoxUnequalPrior,
  diceMaxGivenThreshold,
  twoChildrenAtLeastOneBoy,
  coffeeSupplierAllPass,
  airportTwoStageScreening,
  networkOutageJointAlerts,
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
