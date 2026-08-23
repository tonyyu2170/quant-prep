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
import { evenTailRuns } from "./counting/even-tail-runs";
import { stepsToHeight } from "./counting/steps-to-height";
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
import { chordCrossings } from "./ev-variance/chord-crossings";
import { spreadOfThreeSpins } from "./ev-variance/spread-of-three-spins";
import { localMaxima } from "./ev-variance/local-maxima";
import { covarianceSumDifference } from "./ev-variance/covariance-sum-difference";
import { medianOfThree } from "./ev-variance/median-of-three";
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
import { maxSerialDraw } from "./distributions/max-serial-draw";
import { spareChainUptime } from "./distributions/spare-chain-uptime";
import { firstContactRace } from "./distributions/first-contact-race";
import { fairReachGoal } from "./ruin/fair-reach-goal";
import { unfairReachGoal } from "./ruin/unfair-reach-goal";
import { walkHitUpperFirst } from "./ruin/walk-hit-upper-first";
import { walkHitLossFirst } from "./ruin/walk-hit-loss-first";
import { fairExpectedDuration } from "./ruin/fair-expected-duration";
import { unfairExpectedDuration } from "./ruin/unfair-expected-duration";
import { driftTouchDownside } from "./ruin/drift-touch-downside";
import { adverseDriftReachUpside } from "./ruin/adverse-drift-reach-upside";
import { complementRuinFirst } from "./ruin/complement-ruin-first";
import { fitCapitalFair } from "./ruin/fit-capital-fair";
import { fitCapitalUnfair } from "./ruin/fit-capital-unfair";
import { doublingStrategy } from "./ruin/doubling-strategy";
import { fitGoalFromDurationFair } from "./ruin/fit-goal-from-duration-fair";
import { stakeRescale } from "./ruin/stake-rescale";
import { restartAfterSurvival } from "./ruin/restart-after-survival";
import { driftOneSidedDuration } from "./ruin/drift-one-sided-duration";
import { fitThenDuration } from "./ruin/fit-then-duration";
import { inferCapitalThenNewGoal } from "./ruin/infer-capital-then-new-goal";
import { doublingFitThenDuration } from "./ruin/doubling-fit-then-duration";
import { surviveThenRemainingDuration } from "./ruin/survive-then-remaining-duration";
import { segmentSubinterval } from "./geometric/segment-subinterval";
import { twoPointsGap } from "./geometric/two-points-gap";
import { meetingWindow } from "./geometric/meeting-window";
import { squareInnerDisk } from "./geometric/square-inner-disk";
import { concentricCircles } from "./geometric/concentric-circles";
import { brokenStickLeftShare } from "./geometric/broken-stick-left-share";
import { borderBand } from "./geometric/border-band";
import { chordAngleCap } from "./geometric/chord-angle-cap";
import { meetingInverseFit } from "./geometric/meeting-inverse-fit";
import { stickTriangleConditional } from "./geometric/stick-triangle-conditional";
import { buffonShortNeedle } from "./geometric/buffon-short-needle";
import { threePointsSpacing } from "./geometric/three-points-spacing";
import { cornerQuarterDisk } from "./geometric/corner-quarter-disk";
import { diskInRectComplement } from "./geometric/disk-in-rect-complement";
import { buffonFitLengthInverse } from "./geometric/buffon-fit-length-inverse";
import { triangleParallelCut } from "./geometric/triangle-parallel-cut";
import { fitWindowThenOtherWindow } from "./geometric/fit-window-then-other-window";
import { buffonFitThenOtherBoard } from "./geometric/buffon-fit-then-other-board";
import { delayedArrivalMeeting } from "./geometric/delayed-arrival-meeting";
import { concentricFitThenRing } from "./geometric/concentric-fit-then-ring";
import { unitSquareProduct } from "./geometric/unit-square-product";

import { deuceWinByTwo } from "./markov/deuce-win-by-two";
import { machineUptimeStationary } from "./markov/machine-uptime-stationary";
import { mazeFoodBeforeTrap } from "./markov/maze-food-before-trap";
import { tunnelDoorsEscape } from "./markov/tunnel-doors-escape";
import { switchingCoinsShare } from "./markov/switching-coins-share";
import { systemDaysToFailure } from "./markov/system-days-to-failure";
import { consecutiveRunWait } from "./markov/consecutive-run-wait";
import { twoStateAfterKDays } from "./markov/two-state-after-k-days";

import { allWinsBeforeLoss } from "./symmetry/all-wins-before-loss";
import { firstAcePosition } from "./symmetry/first-ace-position";
import { ballotAlwaysAhead } from "./symmetry/ballot-always-ahead";
import { lastBallColour } from "./symmetry/last-ball-colour";
import { standingTableLegs } from "./symmetry/standing-table-legs";
import { beatEveryRival } from "./symmetry/beat-every-rival";
import { friendsTogetherRoundTable } from "./symmetry/friends-together-round-table";
import { relativeOrderOfPicks } from "./symmetry/relative-order-of-picks";
import { decisiveFaceWait } from "./symmetry/decisive-face-wait";
import { antsCircleDirections } from "./symmetry/ants-circle-directions";
import { comparingHeadsCounts } from "./symmetry/comparing-heads-counts";
import { disjointSubsets } from "./symmetry/disjoint-subsets";

import { clockHandsAngle } from "./brainteasers/clock-hands-angle";
import { lightSwitchesLeftOn } from "./brainteasers/light-switches-left-on";
import { trailingZerosFactorial } from "./brainteasers/trailing-zeros-factorial";
import { piratesGoldSplit } from "./brainteasers/pirates-gold-split";
import { eggDropMinTrials } from "./brainteasers/egg-drop-min-trials";
import { antsPoleCollisions } from "./brainteasers/ants-pole-collisions";
import { bridgeCrossingTime } from "./brainteasers/bridge-crossing-time";
import { frogWellEscape } from "./brainteasers/frog-well-escape";
import { subtractionGameLastWins } from "./brainteasers/subtraction-game-last-wins";
import { subtractionGameLastLoses } from "./brainteasers/subtraction-game-last-loses";
import { twoPileNim } from "./brainteasers/two-pile-nim";
import { chocolateBarBreaks } from "./brainteasers/chocolate-bar-breaks";
import { mutilatedBoardTiling } from "./brainteasers/mutilated-board-tiling";
import { josephusEverySecond } from "./brainteasers/josephus-every-second";
import { coinRowTakeEnds } from "./brainteasers/coin-row-take-ends";
import { nimThreePileMove } from "./brainteasers/nim-three-pile-move";
import { portfolioVarianceTwoAsset } from "./statistics/portfolio-variance-two-asset";
import { minVarianceWeight } from "./statistics/min-variance-weight";
import { correlationBoundThirdPair } from "./statistics/correlation-bound-third-pair";
import { regressionSlopeFromMoments } from "./statistics/regression-slope-from-moments";
import { sharpeTimeScaling } from "./statistics/sharpe-time-scaling";
import { bookOverroundArbitrage } from "./finance/book-overround-arbitrage";
import { triangularFxArbitrage } from "./finance/triangular-fx-arbitrage";
import { putCallParity } from "./finance/put-call-parity";
import { growingPerpetuityValue } from "./finance/growing-perpetuity-value";
import { butterflyMaxProfit } from "./finance/butterfly-max-profit";
import { paymentStreamPresentValue } from "./finance/payment-stream-present-value";
import { putHedgeFromParity } from "./finance/put-hedge-from-parity";
import { coveredCallMaxProfit } from "./finance/covered-call-max-profit";
import { callLowerBoundArbitrage } from "./finance/call-lower-bound-arbitrage";
import { boxSpreadArbitrage } from "./finance/box-spread-arbitrage";
import { adjustedRSquaredFromSums } from "./statistics/adjusted-r-squared-from-sums";
import { duplicatedSampleSlopeVariance } from "./statistics/duplicated-sample-slope-variance";
import { overlappingWindowSums } from "./statistics/overlapping-window-sums";
import { reverseRegressionSlope } from "./statistics/reverse-regression-slope";
import { sampleSizeForMargin } from "./statistics/sample-size-for-margin";
import { paintedBlockOneFace } from "./brainteasers/painted-block-one-face";
import { divisorCountFactorisation } from "./brainteasers/divisor-count-factorisation";
import { averageSpeedRoundTrip } from "./brainteasers/average-speed-round-trip";
import { birdBetweenTrains } from "./brainteasers/bird-between-trains";

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
  evenTailRuns,
  stepsToHeight,
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
  chordCrossings,
  spreadOfThreeSpins,
  localMaxima,
  covarianceSumDifference,
  medianOfThree,
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
  maxSerialDraw,
  spareChainUptime,
  firstContactRace,
  fairReachGoal,
  unfairReachGoal,
  walkHitUpperFirst,
  walkHitLossFirst,
  fairExpectedDuration,
  unfairExpectedDuration,
  driftTouchDownside,
  adverseDriftReachUpside,
  complementRuinFirst,
  fitCapitalFair,
  fitCapitalUnfair,
  doublingStrategy,
  fitGoalFromDurationFair,
  stakeRescale,
  restartAfterSurvival,
  driftOneSidedDuration,
  fitThenDuration,
  inferCapitalThenNewGoal,
  doublingFitThenDuration,
  surviveThenRemainingDuration,
  segmentSubinterval,
  twoPointsGap,
  meetingWindow,
  squareInnerDisk,
  concentricCircles,
  brokenStickLeftShare,
  borderBand,
  chordAngleCap,
  meetingInverseFit,
  stickTriangleConditional,
  buffonShortNeedle,
  threePointsSpacing,
  cornerQuarterDisk,
  diskInRectComplement,
  buffonFitLengthInverse,
  triangleParallelCut,
  fitWindowThenOtherWindow,
  buffonFitThenOtherBoard,
  delayedArrivalMeeting,
  concentricFitThenRing,
  unitSquareProduct,
  deuceWinByTwo,
  machineUptimeStationary,
  mazeFoodBeforeTrap,
  tunnelDoorsEscape,
  switchingCoinsShare,
  systemDaysToFailure,
  consecutiveRunWait,
  twoStateAfterKDays,
  allWinsBeforeLoss,
  firstAcePosition,
  ballotAlwaysAhead,
  lastBallColour,
  standingTableLegs,
  beatEveryRival,
  friendsTogetherRoundTable,
  relativeOrderOfPicks,
  decisiveFaceWait,
  antsCircleDirections,
  comparingHeadsCounts,
  disjointSubsets,
  clockHandsAngle,
  lightSwitchesLeftOn,
  trailingZerosFactorial,
  piratesGoldSplit,
  eggDropMinTrials,
  antsPoleCollisions,
  bridgeCrossingTime,
  frogWellEscape,
  subtractionGameLastWins,
  subtractionGameLastLoses,
  twoPileNim,
  chocolateBarBreaks,
  mutilatedBoardTiling,
  josephusEverySecond,
  coinRowTakeEnds,
  nimThreePileMove,
  portfolioVarianceTwoAsset,
  minVarianceWeight,
  correlationBoundThirdPair,
  regressionSlopeFromMoments,
  sharpeTimeScaling,
  bookOverroundArbitrage,
  triangularFxArbitrage,
  putCallParity,
  growingPerpetuityValue,
  butterflyMaxProfit,
  paintedBlockOneFace,
  divisorCountFactorisation,
  averageSpeedRoundTrip,
  birdBetweenTrains,
  paymentStreamPresentValue,
  putHedgeFromParity,
  coveredCallMaxProfit,
  callLowerBoundArbitrage,
  boxSpreadArbitrage,
  adjustedRSquaredFromSums,
  duplicatedSampleSlopeVariance,
  overlappingWindowSums,
  reverseRegressionSlope,
  sampleSizeForMargin,
];

export const byId = new Map(PROBLEMS.map((t) => [t.id, t]));

export function problemsFor(topic?: string, difficulty?: 1 | 2 | 3, firm?: string): ProblemTemplate[] {
  return PROBLEMS.filter((t) =>
    (!topic || t.topic === topic) &&
    (!difficulty || t.difficulty === difficulty) &&
    (!firm || t.firms.some((f) => f.firm === firm)));
}

// A firm track is the tags every template already carries, nothing new stored. Derived so a
// new slug shows up in the UI the moment a template names it — most-covered firm first.
export const FIRMS: string[] = [...PROBLEMS
  .flatMap((t) => t.firms.map((f) => f.firm))
  .reduce((m, f) => m.set(f, (m.get(f) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([firm]) => firm);

export const TOPIC_LABELS: Record<string, string> = {
  "probability/bayes": "bayes",
  "probability/counting": "counting",
  "probability/ev-variance": "ev & variance",
  "probability/distributions": "distributions",
  "probability/ruin": "ruin & walks",
  "probability/geometric": "geometric",
  "probability/markov": "markov chains",
  "probability/symmetry": "symmetry",
  "brainteasers/logic": "brainteasers",
  "statistics/moments": "statistics",
  "finance/pricing": "finance",
};
