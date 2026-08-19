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
import { loanDefaultNaturalFrequency } from "./bayes/loan-default-natural-frequency";
import { flightDelayStormTree } from "./bayes/flight-delay-storm-tree";
import { batteryNegativeTest } from "./bayes/battery-negative-test";
import { creditBureauDisagreement } from "./bayes/credit-bureau-disagreement";
import { insuranceRiskPoolMixture } from "./bayes/insurance-risk-pool-mixture";
import { strategyEdgeStreak } from "./bayes/strategy-edge-streak";
import { dataVendorWorstSource } from "./bayes/data-vendor-worst-source";
import { twoUrnsWithoutReplacement } from "./bayes/two-urns-without-replacement";
import { committeeSelection } from "./counting/committee-selection";
import { distinctPermutations } from "./counting/distinct-permutations";
import { repeatedLetters } from "./counting/repeated-letters";
import { productRulePlates } from "./counting/product-rule-plates";
import { forcedMemberCommittee } from "./counting/forced-member-committee";
import { starsAndBarsBasic } from "./counting/stars-and-bars-basic";
import { circularAdjacentPair } from "./counting/circular-adjacent-pair";
import { allOneTypeDraw } from "./counting/all-one-type-draw";
import { atLeastOneComplement } from "./counting/at-least-one-complement";
import { inclusionExclusionTwoSets } from "./counting/inclusion-exclusion-two-sets";
import { inclusionExclusionThreeSets } from "./counting/inclusion-exclusion-three-sets";
import { adjacencyForbiddenGap } from "./counting/adjacency-forbidden-gap";
import { starsAndBarsLowerBounds } from "./counting/stars-and-bars-lower-bounds";
import { atLeastKCommittee } from "./counting/at-least-k-committee";
import { adjacencyRequiredBlock } from "./counting/adjacency-required-block";
import { onePairReducedDeck } from "./counting/one-pair-reduced-deck";
import { birthdayCollision } from "./counting/birthday-collision";
import { specificArrangement } from "./counting/specific-arrangement";
import { latticePathsGrid } from "./counting/lattice-paths-grid";
import { smallDerangement } from "./counting/small-derangement";
import { generalDerangements } from "./counting/general-derangements";
import { surjectionsNoEmptyBin } from "./counting/surjections-no-empty-bin";
import { latticePathsForbiddenNode } from "./counting/lattice-paths-forbidden-node";
import { pigeonholeExtremal } from "./counting/pigeonhole-extremal";
import { twoPairVsFullHouse } from "./counting/two-pair-vs-full-house";
import { twoOutcomeBet } from "./ev-variance/two-outcome-bet";
import { diePayoffTable } from "./ev-variance/die-payoff-table";
import { raffleFairPrice } from "./ev-variance/raffle-fair-price";
import { sumOfTwoDraws } from "./ev-variance/sum-of-two-draws";
import { labeledTicketsDraw } from "./ev-variance/labeled-tickets-draw";
import { profitNetOfCost } from "./ev-variance/profit-net-of-cost";
import { binomialMean } from "./ev-variance/binomial-mean";
import { indicatorMatchCount } from "./ev-variance/indicator-match-count";
import { twoOutcomeVariance } from "./ev-variance/two-outcome-variance";
import { spinnerPmfVariance } from "./ev-variance/spinner-pmf-variance";
import { affineScalingSd } from "./ev-variance/affine-scaling-sd";
import { pushBranchBet } from "./ev-variance/push-branch-bet";
import { sumOfBetsVariance } from "./ev-variance/sum-of-bets-variance";
import { urnChoiceTotalExpectation } from "./ev-variance/urn-choice-total-expectation";
import { maxOfTwoDice } from "./ev-variance/max-of-two-dice";
import { oneOptionalReroll } from "./ev-variance/one-optional-reroll";
import { geometricWaitingTime } from "./ev-variance/geometric-waiting-time";
import { hypergeometricMean } from "./ev-variance/hypergeometric-mean";
import { cappedPayoff } from "./ev-variance/capped-payoff";
import { insuranceBreakEvenPremium } from "./ev-variance/insurance-break-even-premium";
import { distinctTypesCollected } from "./ev-variance/distinct-types-collected";
import { binomialVariance } from "./ev-variance/binomial-variance";
import { equalEvSdComparison } from "./ev-variance/equal-ev-sd-comparison";
import { conditionalExpectationGivenEvent } from "./ev-variance/conditional-expectation-given-event";
import { matchingIndicatorsVariance } from "./ev-variance/matching-indicators-variance";
import { patternWaitingHhHt } from "./ev-variance/pattern-waiting-hh-ht";
import { twoRerollStoppingValue } from "./ev-variance/two-reroll-stopping-value";
import { truncatedDoublingGame } from "./ev-variance/truncated-doubling-game";
import { waldRandomSum } from "./ev-variance/wald-random-sum";
import { samplingWithoutReplacementVariance } from "./ev-variance/sampling-without-replacement-variance";
import { binomialExactCount } from "./distributions/binomial-exact-count";
import { binomialAtMost } from "./distributions/binomial-at-most";
import { binomialAtLeastOne } from "./distributions/binomial-at-least-one";
import { binomialFitThenPmf } from "./distributions/binomial-fit-then-pmf";
import { poissonExactCount } from "./distributions/poisson-exact-count";
import { poissonAtMost } from "./distributions/poisson-at-most";
import { poissonRescaledAtLeastOne } from "./distributions/poisson-rescaled-at-least-one";
import { poissonFitThenTail } from "./distributions/poisson-fit-then-tail";
import { geometricExactTrial } from "./distributions/geometric-exact-trial";
import { geometricMoreThanK } from "./distributions/geometric-more-than-k";
import { geometricConditionalMemoryless } from "./distributions/geometric-conditional-memoryless";
import { negbinomExactTrial } from "./distributions/negbinom-exact-trial";
import { negbinomFitP } from "./distributions/negbinom-fit-p";
import { hypergeomExactDraw } from "./distributions/hypergeom-exact-draw";
import { hypergeomZeroSuccesses } from "./distributions/hypergeom-zero-successes";
import { duniformSubrange } from "./distributions/duniform-subrange";
import { duniformFitRange } from "./distributions/duniform-fit-range";
import { cuniformBelowThreshold } from "./distributions/cuniform-below-threshold";
import { exponentialCdfThreshold } from "./distributions/exponential-cdf-threshold";
import { exponentialFitRate } from "./distributions/exponential-fit-rate";
import { exponentialMemoryless } from "./distributions/exponential-memoryless";
import { normalBelow } from "./distributions/normal-below";
import { normalAbove } from "./distributions/normal-above";
import { normalBetween } from "./distributions/normal-between";
import { normalQuantileThenRange } from "./distributions/normal-quantile-then-range";

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
  loanDefaultNaturalFrequency,
  flightDelayStormTree,
  batteryNegativeTest,
  creditBureauDisagreement,
  insuranceRiskPoolMixture,
  strategyEdgeStreak,
  dataVendorWorstSource,
  twoUrnsWithoutReplacement,
  committeeSelection,
  distinctPermutations,
  repeatedLetters,
  productRulePlates,
  forcedMemberCommittee,
  starsAndBarsBasic,
  circularAdjacentPair,
  allOneTypeDraw,
  atLeastOneComplement,
  inclusionExclusionTwoSets,
  inclusionExclusionThreeSets,
  adjacencyForbiddenGap,
  starsAndBarsLowerBounds,
  atLeastKCommittee,
  adjacencyRequiredBlock,
  onePairReducedDeck,
  birthdayCollision,
  specificArrangement,
  latticePathsGrid,
  smallDerangement,
  generalDerangements,
  surjectionsNoEmptyBin,
  latticePathsForbiddenNode,
  pigeonholeExtremal,
  twoPairVsFullHouse,
  twoOutcomeBet,
  diePayoffTable,
  raffleFairPrice,
  sumOfTwoDraws,
  labeledTicketsDraw,
  profitNetOfCost,
  binomialMean,
  indicatorMatchCount,
  twoOutcomeVariance,
  spinnerPmfVariance,
  affineScalingSd,
  pushBranchBet,
  sumOfBetsVariance,
  urnChoiceTotalExpectation,
  maxOfTwoDice,
  oneOptionalReroll,
  geometricWaitingTime,
  hypergeometricMean,
  cappedPayoff,
  insuranceBreakEvenPremium,
  distinctTypesCollected,
  binomialVariance,
  equalEvSdComparison,
  conditionalExpectationGivenEvent,
  matchingIndicatorsVariance,
  patternWaitingHhHt,
  twoRerollStoppingValue,
  truncatedDoublingGame,
  waldRandomSum,
  samplingWithoutReplacementVariance,
  binomialExactCount,
  binomialAtMost,
  binomialAtLeastOne,
  binomialFitThenPmf,
  poissonExactCount,
  poissonAtMost,
  poissonRescaledAtLeastOne,
  poissonFitThenTail,
  geometricExactTrial,
  geometricMoreThanK,
  geometricConditionalMemoryless,
  negbinomExactTrial,
  negbinomFitP,
  hypergeomExactDraw,
  hypergeomZeroSuccesses,
  duniformSubrange,
  duniformFitRange,
  cuniformBelowThreshold,
  exponentialCdfThreshold,
  exponentialFitRate,
  exponentialMemoryless,
  normalBelow,
  normalAbove,
  normalBetween,
  normalQuantileThenRange,
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
