import { describe, expect, it } from "vitest";
import { fmtNum, normalCdf, normalQuantile, type Derived, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS, byId } from "./index";
import { forEachLegalDraw } from "./draw-space";

// Every claim the ev-variance prose makes that no other gate covers.
//
// printed-precision.test.ts checks that each "$...=...$" reconciles from its printed
// literals. It cannot check a claim made in words — "the shortcut has to land below the
// expectation", "the answer sits between the two", "the kitty expects strictly less". Those
// are the ones that shipped false in Tasks 1-3, and contract item 4 requires them to hold on
// EVERY legal draw rather than the typical one.
//
// Why this is a third file rather than part of draw-space.test.ts: the counters there are
// problem-agnostic and fixed in size, while this registry is bespoke and grows by roughly one
// entry per problem — 14 more across Tasks 4-5. Keeping them apart keeps the agnostic file
// small and lets this one be extended by copying a CLAIMS entry, without reading the rest.
//
// TO ADD A TEMPLATE: append one `CLAIMS[slug]` entry. Every claim needs `says` (the sentence
// being checked), `holds` (read off PRINTED values — see P below), and `breaks` (a mutation
// on which `holds` must return false). The falsifier is not optional: Task 2 shipped a
// `() => true` predicate and Task 3 shipped a tautological conjunct, and both reported as
// coverage while checking nothing.

/** What the learner actually sees. Comparing raw floats is how the die-payoff-table defect
 *  survived a sweep that reported all-green: the floats reconciled, the decimals did not. */
const P = (x: number) => Number(fmtNum(x));
/** Two printed quantities render to the same string. */
const same = (a: number, b: number) => fmtNum(a) === fmtNum(b);
const EPS = 1e-9;
/** The float-dirt rounding the statistics templates apply inside `derived`. A claim that
 *  recomputes a value from params has to round the same way, or it compares two renderings of
 *  the SAME number and fails on the boundary draws: 0.3*9/16 is 0.16874999999999998 in floats
 *  and 0.16875 once rounded, which display as 0.1687 and 0.1688. Rounding at the ninth decimal
 *  cannot hide a wrong formula — the 2% mutation is nine orders of magnitude larger. */
const r9 = (x: number) => Math.round(x * 1e9) / 1e9;
/** Half a step of fmtNum's 4-significant-figure display — the most a printed value can differ
 *  from its true value. A "these add back to N" claim is about what the page shows, so its
 *  slack has to be the display's, not a constant guessed at the small end of the range. */
const shown = (v: number) => (v === 0 ? 0 : Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - 3) / 2);
/** Shared C(n,k), for distributions claims that recompute a binomial/Poisson term fresh from
 *  params rather than trusting the template's own derived value. */
const comb = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  const kk = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < kk; i++) r = (r * (n - i)) / (i + 1);
  return r;
};
const poissonPmf = (lam: number, k: number): number => {
  let r = Math.exp(-lam);
  for (let i = 1; i <= k; i++) r = (r * lam) / i;
  return r;
};

interface Claim {
  /** the sentence in the template this predicate is checking */
  says: string;
  /** must hold on every legal draw but the declared exceptions */
  holds: (p: Params, d: Derived) => boolean;
  /** exact number of legal draws on which `holds` may fail, for a deliberately hedged claim */
  exceptions?: number;
  /** must be true somewhere, or `holds` is vacuously true and proves nothing */
  nonVacuous?: (p: Params, d: Derived) => boolean;
  /** a deliberately broken derived on which `holds` must return false */
  breaks: (p: Params, d: Derived) => Derived;
}

const CLAIMS: Record<string, Claim[]> = {
  "ev-variance/two-outcome-bet": [
    { says: "Sanity: the game offers less than the fair payout, so the expectation is negative",
      holds: (p, d) => P(p.w) < P(d.fairWin) && P(d.ev) < 0,
      breaks: (p, d) => ({ ...d, fairWin: p.w / 2 }) },
    { says: "keyInsight: the raw payout sizes say nothing about which way the bet leans",
      holds: (_p, d) => P(d.ev) < 0,
      nonVacuous: (p) => p.w > p.l, // a bet whose win dwarfs its loss and still loses
      breaks: (_p, d) => ({ ...d, ev: 1 }) },
    { says: "commonTrap: the naive win-minus-loss difference is not the expected profit",
      holds: (p, d) => !same(p.w - p.l, d.ev),
      exceptions: 6, // documented in the plan: l = 2w at k = 5, plus one draw at k = 6
      breaks: (p, d) => ({ ...d, ev: p.w - p.l }) },
    // Added because the 2%-perturbation hook found the three claims above pin only the SIGN
    // of the expectation, so a wrong magnitude passed all of them. The identity is asserted
    // on floats, not printed values, on purpose: the template reduces this step over a common
    // denominator precisely because differencing the two PRINTED legs disagrees with the
    // printed answer on 66 of the 289 draws. printed-precision.test.ts owns that half.
    { says: "Combine: the expectation is the probability-weighted win leg less the loss leg",
      holds: (_p, d) => Math.abs(d.winLeg - d.loseLeg - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/die-payoff-table": [
    { says: "Sanity: the equal-weight shortcut lands on the stated side of the expectation",
      holds: (p, d) => (p.mid > p.lo ? P(d.plainAvg) < P(d.ev) : P(d.plainAvg) > P(d.ev)),
      breaks: (_p, d) => ({ ...d, plainAvg: d.ev }) },
    { says: "Sanity: the two numerators differ by exactly the low-to-mid gap, out of six",
      holds: (p, d) => p.lo + d.midNum + d.highNum - d.plainNum === (p.mid > p.lo ? d.gapNum : -d.gapNum),
      breaks: (_p, d) => ({ ...d, gapNum: d.gapNum + 1 }) },
    { says: "keyInsight: each row is weighted by how many of the six faces fall into it",
      holds: (p, d) => d.midNum === 3 * p.mid && d.highNum === 2 * p.hi
        && Math.abs((p.lo + d.midNum + d.highNum) / 6 - d.ev) < EPS,
      breaks: (p, d) => ({ ...d, midNum: 2 * p.mid }) },
    { says: "commonTrap: averaging the rows lands on a different number entirely",
      holds: (_p, d) => P(d.plainAvg) !== P(d.ev),
      breaks: (_p, d) => ({ ...d, plainAvg: d.ev }) },
  ],
  "ev-variance/raffle-fair-price": [
    { says: "Sanity: the price sits between the grand-prize-only value and the per-winner share",
      holds: (_p, d) => P(d.legGrand) < P(d.price) && P(d.price) < P(d.perWinner),
      breaks: (_p, d) => ({ ...d, price: d.legGrand / 2 }) },
    { says: "keyInsight: the whole fund over the tickets sold prices one ticket",
      holds: (p, d) => d.pool === p.grand + d.runnersVoucher && Math.abs(d.pool / p.tickets - d.price) < EPS,
      breaks: (p, d) => ({ ...d, pool: p.grand }) },
    { says: "commonTrap: pricing off the headline prize understates by exactly the vouchers' share",
      holds: (p, d) => P(d.legGrand) < P(d.price)
        && Math.abs(d.price - d.legGrand - d.runnersVoucher / p.tickets) < EPS,
      breaks: (_p, d) => ({ ...d, legGrand: d.price }) },
  ],
  "ev-variance/sum-of-two-draws": [
    { says: "Sanity: the midpoint of the total's range is the mean total the dice gave",
      holds: (_p, d) => Math.abs((2 + d.maxTotal) / 2 - d.meanTotal) < EPS
        && Math.abs(d.meanRed + d.meanBlue - d.meanTotal) < EPS,
      breaks: (_p, d) => ({ ...d, meanTotal: d.meanTotal + 1 }) },
    { says: "keyInsight: the rate applies to the summed averages as one final multiplication",
      holds: (p, d) => Math.abs(p.rate * d.meanTotal - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 2 }) },
    { says: "commonTrap: a die averages half a point above half its face count, and that is paid at the rate",
      holds: (p, d) => Math.abs(d.meanRed - p.red / 2 - 0.5) < EPS && Math.abs(d.meanBlue - p.blue / 2 - 0.5) < EPS
        && P(p.rate * (p.red / 2 + p.blue / 2)) !== P(d.ev),
      breaks: (p, d) => ({ ...d, meanRed: p.red / 2 }) },
  ],
  "ev-variance/labeled-tickets-draw": [
    { says: "Sanity: totalling every label the long way and dividing gives the same mean",
      holds: (p, d) => d.total === p.n * p.first + d.sumIncr && Math.abs(d.total / p.n - d.mean) < EPS,
      breaks: (p, d) => ({ ...d, total: d.total + p.n }) },
    { says: "keyInsight: evenly spaced labels average to the midpoint of their two ends",
      holds: (p, d) => Math.abs((p.first + d.last) / 2 - d.mean) < EPS,
      breaks: (_p, d) => ({ ...d, mean: d.mean + 1 }) },
    { says: "commonTrap: one step per ticket overshoots the top label and drags the average up",
      holds: (p, d) => d.steps === p.n - 1 && p.first + p.gap * p.n > d.last
        && (p.first + (p.first + p.gap * p.n)) / 2 > d.mean,
      breaks: (p, d) => ({ ...d, steps: p.n, last: p.first + p.gap * p.n }) },
  ],
  "ev-variance/profit-net-of-cost": [
    { says: "Sanity: the dealer's price sits on the stated side of the expected contents",
      holds: (p, d) => (d.ev > 0 ? P(p.cost) < P(d.payoutLeg) : P(p.cost) > P(d.payoutLeg)),
      breaks: (p, d) => ({ ...d, payoutLeg: p.cost }) },
    { says: "Sanity: charging the price inside each branch reaches the same expectation",
      holds: (p, d) => d.losers === p.slots - p.winners
        && Math.abs((p.winners * (p.prize - p.cost) - d.losers * p.cost) / p.slots - d.ev) < EPS,
      breaks: (p, d) => ({ ...d, losers: p.slots }) },
    { says: "commonTrap: charging the price only on winning plays overstates the profit",
      holds: (p, d) => (p.winners * (p.prize - p.cost)) / p.slots > d.ev + EPS,
      breaks: (p, d) => ({ ...d, ev: (p.winners * (p.prize - p.cost)) / p.slots }) },
  ],
  "ev-variance/binomial-mean": [
    { says: "Sanity: a fill rate off half puts the expected count on the same side of half the bids",
      holds: (p, d) => (p.fillPct > 50 ? P(d.ev) > P(d.half) : P(d.ev) < P(d.half)),
      breaks: (_p, d) => ({ ...d, ev: d.half }) },
    { says: "keyInsight: the expected count is the trials times the per-trial chance",
      holds: (p, d) => Math.abs(p.bids * d.p - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.5 }) },
    { says: "commonTrap: the answer is never a whole number, so rounding reports a figure it never equals",
      holds: (_p, d) => !Number.isInteger(d.ev) && Math.abs(Math.round(d.ev) - d.ev) > EPS,
      breaks: (_p, d) => ({ ...d, ev: Math.round(d.ev) }) },
  ],
  "ev-variance/indicator-match-count": [
    { says: "Sanity: counting orderings reaches the same kitty as the indicator argument",
      holds: (p, d) => Math.abs((p.bounty * p.friends * d.waysFixed) / d.waysAll - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, waysAll: d.waysAll * 2 }) },
    { says: "Sanity: the kitty lands below a single bounty, the whole party's average",
      holds: (p, d) => P(d.ev) < P(p.bounty),
      breaks: (p, d) => ({ ...d, ev: p.bounty * 2 }) },
    { says: "commonTrap: the group's share of the one-match average shrinks in proportion to its size",
      holds: (p, d) => Math.abs(d.ev / p.bounty - p.friends / p.guests) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 2 }) },
  ],
  "ev-variance/two-outcome-variance": [
    { says: "Sanity and commonTrap: the variance comes in under the even-match ceiling of a quarter of the squared gap",
      holds: (_p, d) => P(d.varProfit) < P(d.capVar),
      breaks: (_p, d) => ({ ...d, varProfit: d.capVar }) },
    { says: "keyInsight: the win and loss sizes reach the spread only through their sum",
      holds: (p, d) => Math.abs((p.winPct * d.losePct * d.gap * d.gap) / 10000 - d.varProfit) < EPS
        && d.gap === p.w + p.l,
      nonVacuous: (p) => p.w !== p.l, // the two amounts genuinely differ, so "only their sum" bites
      breaks: (_p, d) => ({ ...d, varProfit: d.varProfit * 1.1 }) },
    { says: "prose: each branch lies its stated distance from the printed mean",
      holds: (p, d) => same(P(p.w) - P(d.mean), P(d.devWin)) && same(P(d.mean) + P(p.l), P(d.devLose)),
      breaks: (_p, d) => ({ ...d, devWin: d.devWin + 0.5 }) },
  ],
  "ev-variance/spinner-pmf-variance": [
    { says: "Sanity: the pairwise-distance identity reaches the same variance",
      holds: (_p, d) => Math.abs((d.tA * d.tB * d.dAB * d.dAB + d.tA * d.tC * d.dAC * d.dAC
        + d.tB * d.tC * d.dBC * d.dBC) / 100 - d.varPay) < EPS,
      breaks: (_p, d) => ({ ...d, varPay: d.varPay * 1.1 }) },
    { says: "keyInsight: the mean of the squares sits strictly above the square of the mean",
      holds: (_p, d) => d.meanSq > d.mean * d.mean + EPS,
      breaks: (_p, d) => ({ ...d, meanSq: d.mean * d.mean }) },
    { says: "commonTrap: treating the two totals as interchangeable answers zero, never the truth",
      holds: (_p, d) => P(d.varPay) !== 0 && same(P(d.meanSq) - P(d.mean) * P(d.mean), d.varPay),
      breaks: (_p, d) => ({ ...d, varPay: 0 }) },
  ],
  "ev-variance/affine-scaling-sd": [
    { says: "Sanity: the answer sits between a quarter and a half of the payout range",
      holds: (_p, d) => P(d.quarterSpread) < P(d.sd) && P(d.sd) < P(d.halfSpread),
      breaks: (_p, d) => ({ ...d, sd: d.halfSpread * 2 }) },
    { says: "keyInsight: the flat add-on leaves the spread untouched, recomputed from the outcomes",
      holds: (p, d) => {
        const spreadOf = (bonus: number) => {
          const xs = Array.from({ length: p.n }, (_, k) => p.scale * (k + 1) + bonus);
          const m = xs.reduce((a, b) => a + b, 0) / xs.length;
          return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length);
        };
        return Math.abs(spreadOf(p.bonus) - spreadOf(0)) < EPS && Math.abs(spreadOf(p.bonus) - d.sd) < EPS;
      },
      nonVacuous: (p) => p.bonus > 0, // there is an add-on to be invariant to
      breaks: (_p, d) => ({ ...d, sd: d.sd * 1.1 }) },
    { says: "keyInsight and commonTrap: the sd carries one factor of the multiplier and none of the add-on",
      holds: (p, d) => Math.abs(d.sd / p.scale - Math.sqrt((p.n * p.n - 1) / 12)) < EPS
        && P(d.sd + p.bonus) !== P(d.sd),
      breaks: (p, d) => ({ ...d, sd: d.sd + p.bonus }) },
  ],
  "ev-variance/push-branch-bet": [
    { says: "Sanity: the offered payout sits on the stated side of the break-even payout",
      holds: (p, d) => (d.ev > 0 ? P(p.payout) > P(d.fairPayout) : P(p.payout) < P(d.fairPayout)),
      breaks: (p, d) => ({ ...d, fairPayout: p.payout }) },
    { says: "keyInsight: the refund branch carries real probability while contributing nothing",
      holds: (p, d) => p.drawPct > 0 && d.lossPct === 100 - p.winPct - p.drawPct
        && Math.abs((p.winPct * p.payout - d.lossPct * p.stake) / 100 - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, lossPct: d.lossPct + 1 }) },
    { says: "commonTrap: dropping the push and rescaling moves the answer further from zero, same sign",
      holds: (p, d) => {
        const renorm = (p.winPct * p.payout - d.lossPct * p.stake) / (p.winPct + d.lossPct);
        return Math.sign(renorm) === Math.sign(d.ev) && Math.abs(renorm) > Math.abs(d.ev) + EPS;
      },
      breaks: (_p, d) => ({ ...d, ev: d.ev * 3 }) },
  ],
  "ev-variance/sum-of-bets-variance": [
    { says: "Sanity and commonTrap: the combined spread is strictly under the sum of the two spreads",
      holds: (_p, d) => P(d.sdTotal) < P(d.sdSum),
      breaks: (_p, d) => ({ ...d, sdTotal: d.sdSum }) },
    { says: "keyInsight: variance is what adds, and the two legs are each strictly positive",
      holds: (_p, d) => d.var1 > 0 && d.var2 > 0 && same(P(d.var1) + P(d.var2), d.varTotal),
      breaks: (_p, d) => ({ ...d, varTotal: d.varTotal * 1.1 }) },
    { says: "keyInsight: squaring is what makes the pieces additive — the dollar spreads do not add",
      holds: (_p, d) => Math.abs(d.sdTotal * d.sdTotal - d.varTotal) < EPS
        && d.sdSum * d.sdSum > d.varTotal + EPS,
      breaks: (_p, d) => ({ ...d, sdSum: d.sdTotal }) },
  ],
  "ev-variance/urn-choice-total-expectation": [
    { says: "Sanity: the answer lands strictly between the two box values",
      holds: (_p, d) => P(d.ev) > Math.min(P(d.evA), P(d.evB)) && P(d.ev) < Math.max(P(d.evA), P(d.evB)),
      breaks: (_p, d) => ({ ...d, ev: d.evA }) },
    { says: "Sanity: the answer is dragged off the even-split figure toward the favoured box",
      holds: (p, d) => {
        const favoured = p.boxPct > 50 ? d.evA : d.evB;
        return favoured > d.plainAvg ? P(d.ev) > P(d.plainAvg) : P(d.ev) < P(d.plainAvg);
      },
      breaks: (_p, d) => ({ ...d, ev: d.plainAvg }) },
    { says: "keyInsight and commonTrap: the box reached more often is the nearer value, so the even split is never the answer",
      holds: (p, d) => {
        const favoured = p.boxPct > 50 ? d.evA : d.evB;
        const other = p.boxPct > 50 ? d.evB : d.evA;
        return Math.abs(d.ev - favoured) < Math.abs(d.ev - other) && P(d.plainAvg) !== P(d.ev);
      },
      breaks: (_p, d) => ({ ...d, ev: d.plainAvg }) },
    { says: "Average the two: the answer is the box values weighted by how often each is reached",
      holds: (p, d) => Math.abs((p.boxPct * d.evA + d.otherPct * d.evB) / 100 - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/max-of-two-dice": [
    { says: "Sanity: the higher and lower dice's point totals add to the whole, in integers",
      holds: (p, d) => d.topNumer + d.lowNumer === (p.faces + 1) * p.faces * p.faces,
      breaks: (_p, d) => ({ ...d, lowNumer: d.lowNumer + 1 }) },
    { says: "Sanity: the lower die falls short of a single die's average, and the answer beats the single-die version",
      holds: (_p, d) => P(d.lowMean) < P(d.singleMean) && P(d.ev) > P(d.evSingle),
      breaks: (_p, d) => ({ ...d, ev: d.evSingle }) },
    { says: "keyInsight and commonTrap: the higher of two draws averages strictly above one die",
      holds: (_p, d) => P(d.topMean) > P(d.singleMean),
      breaks: (_p, d) => ({ ...d, topMean: d.singleMean }) },
    { says: "Average and net off the fee: the answer is the rate on the pooled maxima less the fee",
      holds: (p, d) => Math.abs((p.rate * d.topNumer) / (p.faces * p.faces) - p.fee - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/one-optional-reroll": [
    { says: "Sanity: pricing the rule as an option reaches the same points average",
      holds: (p, d) => Math.abs(d.freshMean + (d.tossCount * d.standCount) / (2 * p.faces) - d.points) < EPS,
      breaks: (_p, d) => ({ ...d, points: d.points * 1.1 }) },
    { says: "Sanity: the rule beats what a plain roll would pay",
      holds: (_p, d) => P(d.ev) > P(d.evNoRule),
      breaks: (_p, d) => ({ ...d, ev: d.evNoRule }) },
    { says: "keyInsight and commonTrap: a roll known to have cleared the threshold beats one about which nothing is known",
      holds: (_p, d) => P(d.standMean) > P(d.freshMean),
      breaks: (_p, d) => ({ ...d, standMean: d.freshMean }) },
    { says: "Weight and scale: the answer is the rate on the pooled points numerator",
      holds: (p, d) => Math.abs((p.rate * d.pointsNumer) / (2 * p.faces) - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/geometric-waiting-time": [
    { says: "Sanity: one more ending face would cost strictly less than the answer",
      holds: (_p, d) => P(d.evEasier) < P(d.spend),
      breaks: (_p, d) => ({ ...d, evEasier: d.spend }) },
    { says: "Sanity: the spend clears the price of the single roll that ends the game",
      holds: (p, d) => P(d.spend) > P(p.cost),
      breaks: (p, d) => ({ ...d, spend: p.cost }) },
    { says: "Count the faces: the misses and the enders partition the die",
      holds: (p, d) => d.missFaces + d.winFaces === p.faces && Math.abs(d.pEnd - d.winFaces / p.faces) < EPS,
      breaks: (_p, d) => ({ ...d, missFaces: d.missFaces + 1 }) },
    // The three above pin only the direction of the spend, so a wrong magnitude would pass all
    // of them; this one pins the wait against the ending chance and the money against the wait.
    { says: "keyInsight: the wait inverts the chance one roll ends it, and the spend is that wait priced",
      holds: (p, d) => Math.abs(d.pEnd * d.rolls - 1) < EPS && Math.abs(p.cost * d.rolls - d.spend) < EPS,
      nonVacuous: (_p, d) => d.winFaces === 1, // the longest wait, where the reciprocal bites hardest
      breaks: (_p, d) => ({ ...d, spend: d.spend * 1.02 }) },
  ],
  "ev-variance/hypergeometric-mean": [
    { says: "Sanity: the winners and the blanks drawn account for every ticket pulled",
      holds: (p, d) => Math.abs(d.meanWin + d.meanPlain - p.draws) < EPS && d.plain === p.pool - p.special,
      breaks: (_p, d) => ({ ...d, meanPlain: d.meanPlain + 1 }) },
    { says: "Sanity: the payout falls short of every drawn ticket coming up a winner",
      holds: (_p, d) => P(d.ev) < P(d.maxPay),
      breaks: (_p, d) => ({ ...d, ev: d.maxPay }) },
    { says: "keyInsight: each ticket carries the box's own proportion, and the count is those chances added up",
      holds: (p, d) => Math.abs(d.perDraw - p.special / p.pool) < EPS
        && Math.abs(p.draws * d.perDraw - d.meanWin) < EPS && Math.abs(p.rate * d.meanWin - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "commonTrap: what a single ticket is worth falls short by exactly the factor of the number drawn",
      holds: (p, d) => P(p.rate * d.perDraw) < P(d.ev) && Math.abs(p.draws * p.rate * d.perDraw - d.ev) < EPS,
      breaks: (p, d) => ({ ...d, ev: p.rate * d.perDraw }) },
  ],
  "ev-variance/capped-payoff": [
    { says: "Sanity: the cap can only take money away from the uncapped average",
      holds: (_p, d) => P(d.ev) < P(d.evUncapped),
      breaks: (_p, d) => ({ ...d, ev: d.evUncapped }) },
    { says: "Sanity: the average payout sits below the cap itself",
      holds: (_p, d) => P(d.ev) < P(d.cap),
      breaks: (_p, d) => ({ ...d, ev: d.cap }) },
    { says: "keyInsight and commonTrap: capping the average overstates the average of the capped payouts",
      holds: (_p, d) => Math.min(d.evUncapped, d.cap) > d.ev + EPS,
      nonVacuous: (_p, d) => d.cap < d.evUncapped, // the draws where the trap trims to the cap, not to the plain average
      breaks: (_p, d) => ({ ...d, ev: Math.min(d.evUncapped, d.cap) }) },
    { says: "Average over the die: the two regional totals pool and divide",
      holds: (p, d) => d.cappedFaces === p.faces - p.capFace && d.cap === p.rate * p.capFace
        && d.lowTotal === (p.rate * p.capFace * (p.capFace + 1)) / 2 && d.highTotal === d.cappedFaces * d.cap
        && Math.abs((d.lowTotal + d.highTotal) / p.faces - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/insurance-break-even-premium": [
    // The ledger is an integer identity on both sides, so it is asserted exactly rather than on
    // printed values: every leg is a whole dollar by construction of the param steps.
    { says: "Sanity: the hundred-policy ledger balances to the dollar",
      holds: (_p, d) => d.collect100 === d.payOut100 && Math.abs(d.collect100 - 100 * d.premium) < EPS,
      breaks: (_p, d) => ({ ...d, payOut100: d.payOut100 + 100 }) },
    { says: "Sanity and keyInsight: the price lands far below a single total loss and above the paperwork",
      // "far below" is the keyInsight's word, so it is pinned as the half-bound it actually
      // holds to rather than left as an unenumerated universal.
      holds: (p, d) => P(d.premium) < P(p.total) / 2 && P(d.premium) > P(p.admin),
      breaks: (p, d) => ({ ...d, premium: p.admin }) },
    { says: "commonTrap: charging only the paperwork understates the premium by the expected claims",
      holds: (p, d) => d.expPayout > EPS && Math.abs(d.premium - p.admin - d.expPayout) < EPS,
      breaks: (_p, d) => ({ ...d, premium: d.premium * 1.02 }) },
    { says: "keyInsight: each branch is weighted by how often it arrives, and the quiet years carry none",
      holds: (p, d) => d.noClaimPct === 100 - p.minorPct - p.totalPct
        && Math.abs(d.minorLeg - (p.minorPct * p.minor) / 100) < EPS
        && Math.abs(d.totalLeg - (p.totalPct * p.total) / 100) < EPS
        && Math.abs(d.minorLeg + d.totalLeg - d.expPayout) < EPS,
      breaks: (_p, d) => ({ ...d, minorLeg: d.minorLeg + 1 }) },
  ],

  "ev-variance/distinct-types-collected": [
    { says: "Sanity: the designs held and the designs missing account for the whole set",
      holds: (p, d) => Math.abs(d.distinct + d.missing - p.types) < EPS
        && d.allNumer === p.types ** p.draws && d.missNumer === (p.types - 1) ** p.draws,
      breaks: (_p, d) => ({ ...d, missing: d.missing + 1 }) },
    { says: "Sanity: the payout falls short of the most the promotion can ever pay",
      holds: (p, d) => P(d.ev) < P(d.capPay)
        && d.mostHeld === Math.min(p.types, p.draws) && d.capPay === p.rate * d.mostHeld,
      breaks: (_p, d) => ({ ...d, ev: d.capPay }) },
    { says: "keyInsight: a design is missed only when every pack misses it, and the haul adds one indicator per design",
      holds: (p, d) => Math.abs(d.pMiss - d.missNumer / d.allNumer) < EPS
        && Math.abs(p.types * (1 - d.pMiss) - d.distinct) < EPS
        && Math.abs(p.rate * d.distinct - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "commonTrap: counting one new design per pack overstates the haul on every draw",
      holds: (p, d) => P(p.rate * p.draws) > P(d.ev) && d.distinct < p.draws - EPS,
      nonVacuous: (p) => p.draws > p.types, // more packs than designs, where the trap is not even possible
      breaks: (p, d) => ({ ...d, ev: p.rate * p.draws }) },
  ],
  "ev-variance/binomial-variance": [
    { says: "Sanity: the spread comes in strictly under the even-odds ceiling",
      holds: (_p, d) => P(d.varCount) < P(d.capVar),
      breaks: (_p, d) => ({ ...d, varCount: d.capVar }) },
    // The Sanity check prints the same product with the two percentages swapped, which is the
    // losses-carry-the-same-spread argument. Float multiplication of three operands is not
    // associative, so this is a real check on what the swapped chain renders, not commutativity.
    { says: "Sanity: swapping the two percentages renders the identical figure",
      holds: (p, d) => same((p.trials * d.lossPct * p.winPct) / 10000, d.varCount),
      breaks: (_p, d) => ({ ...d, varCount: d.varCount * 1.01 }) },
    { says: "keyInsight: one trial's spread is the product of its two chances, and independence multiplies it up",
      holds: (p, d) => d.lossPct === 100 - p.winPct
        && Math.abs(d.oneVar - (p.winPct * d.lossPct) / 10000) < EPS
        && Math.abs(p.trials * d.oneVar - d.varCount) < EPS,
      breaks: (_p, d) => ({ ...d, varCount: d.varCount * 1.02 }) },
    { says: "commonTrap: the expected count is a different number from the spread on every draw",
      holds: (_p, d) => P(d.mean) !== P(d.varCount),
      breaks: (_p, d) => ({ ...d, varCount: d.mean }) },
  ],
  "ev-variance/equal-ev-sd-comparison": [
    { says: "Setup: the two games really do pay the same on average, in whole dollars",
      holds: (p, d) => same(d.coinPay / 2, p.m) && same((p.k * d.prize) / p.faces, p.m) && Number.isInteger(d.prize),
      breaks: (_p, d) => ({ ...d, prize: d.prize + 1 }) },
    { says: "Sanity and commonTrap: the die is the riskier game, so neither the coin's spread nor the shared mean is the answer",
      holds: (p, d) => P(d.sdDie) > P(p.m),
      breaks: (p, d) => ({ ...d, sdDie: p.m }) },
    { says: "Sanity: the squared-deviation definition rebuilds the same variance",
      holds: (p, d) => d.blankFaces === p.faces - p.k
        && Math.abs((p.k * (d.prize - p.m) * (d.prize - p.m) + d.blankFaces * p.m * p.m) / p.faces - d.varDie) < EPS,
      breaks: (_p, d) => ({ ...d, varDie: d.varDie * 1.02 }) },
    // The blanks-stay-put half of that sentence is pinned by the decomposition claim above,
    // whose `blankFaces * m * m` term IS the assertion that a blank sits m from the mean in
    // both games. What needs its own predicate is the half that could be false.
    { says: "Sanity and keyInsight: only the paying side moves out — the die throws it past the coin's winning side",
      holds: (_p, d) => d.prize > d.coinPay + EPS,
      breaks: (_p, d) => ({ ...d, prize: d.coinPay }) },
    { says: "Spread of the die: the answer is the root of the mean square less the squared mean",
      holds: (p, d) => Math.abs(d.meanSqDie - (p.k * d.prize * d.prize) / p.faces) < EPS
        && Math.abs(d.varCoin - p.m * p.m) < EPS
        && Math.abs(d.varDie - (d.meanSqDie - d.varCoin)) < EPS
        && Math.abs(d.sdDie * d.sdDie - d.varDie) < EPS,
      breaks: (_p, d) => ({ ...d, sdDie: d.sdDie * 1.02 }) },
  ],

  "ev-variance/conditional-expectation-given-event": [
    // The bracket is checked as printed and from both sides. A one-sided version was dropped
    // in review: the natural companion — putting the forbidden points back to recover the
    // plain average — is an identity by construction here, since totalGood is defined as
    // totalAll less totalLow, so it holds however wrong the answer is.
    { says: "Sanity: the payout sits above the untouched pair and below a pair both known to have cleared the threshold",
      holds: (p, d) => same(p.rate * (p.faces + 1), d.evPlain) && same(p.rate * (p.k + p.faces), d.evBoth)
        && P(d.evPlain) < P(d.ev) && P(d.ev) < P(d.evBoth),
      breaks: (_p, d) => ({ ...d, ev: d.evPlain }) },
    { says: "Sanity: the upper bound bites because surviving combinations still hold a low die",
      holds: (p, d) => P(d.ev) < P(d.evBoth) && d.goodPairs > (p.faces - p.k + 1) * (p.faces - p.k + 1),
      breaks: (_p, d) => ({ ...d, ev: d.evBoth }) },
    { says: "Pool the points: the forbidden group averages the threshold, which is below the untouched average",
      holds: (p, d) => d.totalLow === d.lowPairs * p.k && p.k < d.plainPoints && P(d.meanGiven) > P(d.plainPoints),
      breaks: (_p, d) => ({ ...d, totalLow: 0 }) },
    // The three above pin only the direction the news moves the payout, so a wrong magnitude
    // would pass all of them; this one pins the answer against the surviving pool itself.
    { says: "keyInsight: the answer is the surviving points spread over the surviving combinations, priced",
      holds: (p, d) => d.lowPairs === (p.k - 1) * (p.k - 1) && d.goodPairs === d.pairs - d.lowPairs
        && Math.abs((p.rate * d.totalGood) / d.goodPairs - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/matching-indicators-variance": [
    { says: "Sanity: the mean-of-squares route rebuilds the same count variance",
      holds: (p, d) => p.party * p.diners * (p.diners - 1) + d.pairs * p.diners
          - p.party * p.party * (p.diners - 1) === d.numer
        && Math.abs(d.numer / d.denom - d.varCount) < EPS,
      breaks: (_p, d) => ({ ...d, numer: d.numer + 1 }) },
    { says: "Sanity: dropping every covariance leaves strictly less than the answer, as printed",
      holds: (p, d) => same((p.rate * p.rate * p.party * (p.diners - 1)) / (p.diners * p.diners), d.indepPay)
        && P(d.indepPay) < P(d.varPay),
      breaks: (_p, d) => ({ ...d, indepPay: d.varPay }) },
    { says: "keyInsight: the covariance is positive, and the count is the individual spreads plus one per ordered pair",
      holds: (p, d) => d.cov > 0 && Math.abs(d.pBoth - d.pSelf * d.pSelf - d.cov) < EPS
        && d.pairs === p.party * (p.party - 1)
        && Math.abs(p.party * d.oneVar + d.pairs * d.cov - d.varCount) < EPS,
      breaks: (_p, d) => ({ ...d, cov: 0 }) },
    { says: "Price the count: the rate enters the variance squared",
      holds: (p, d) => Math.abs(p.rate * p.rate * d.varCount - d.varPay) < EPS,
      breaks: (_p, d) => ({ ...d, varPay: d.varPay * 1.02 }) },
  ],
  "ev-variance/pattern-waiting-hh-ht": [
    { says: "Sanity: the bill clears the price of the two runs the pair takes at minimum",
      holds: (p, d) => d.twoRuns === 2 * p.cost && P(d.twoRuns) < P(d.spend),
      breaks: (_p, d) => ({ ...d, spend: d.twoRuns }) },
    // The prose reads its own comparison off the two figures, so what needs pinning is that the
    // comparison is decidable at printed precision and says the same thing the floats do.
    { says: "Sanity: the mixed pair's bill sits on the side of the answer the prose reports",
      holds: (_p, d) => P(d.mixSpend) !== P(d.spend)
        && Math.sign(d.mixSpend - d.spend) === Math.sign(P(d.mixSpend) - P(d.spend)),
      nonVacuous: (_p, d) => d.mixSpend > d.spend, // the draws where the repeated pair is the CHEAPER wait
      breaks: (_p, d) => ({ ...d, mixSpend: d.spend }) },
    { says: "keyInsight and commonTrap: the reciprocal of the pair's own chance understates the repeated wait, and is exact for the mixed one",
      holds: (_p, d) => 10000 / (d.rPct * d.rPct) < d.flips - EPS
        && Math.abs(d.mixFlips - 10000 / (d.rPct * d.oPct)) < EPS,
      breaks: (_p, d) => ({ ...d, flips: 10000 / (d.rPct * d.rPct) }) },
    { says: "Wait for the first one, then price the runs: the wait inverts the chance and the bill is that wait charged",
      holds: (p, d) => Math.abs(d.firstWait * d.rPct - 100) < EPS
        && Math.abs(d.flips - (100 * (d.rPct + 100)) / (d.rPct * d.rPct)) < EPS
        && Math.abs(p.cost * d.flips - d.spend) < EPS,
      breaks: (_p, d) => ({ ...d, spend: d.spend * 1.02 }) },
  ],
  "ev-variance/two-reroll-stopping-value": [
    { says: "Sanity: the two-spin game is worth strictly less, an option you may decline cannot hurt",
      holds: (p, d) => same((p.rate * d.midNumer) / (2 * p.sectors), d.evMid) && P(d.evMid) < P(d.ev),
      breaks: (_p, d) => ({ ...d, evMid: d.ev }) },
    // The clairvoyant figure is re-enumerated here rather than re-typed: the prose claims what
    // someone seeing all three spins would collect, so the predicate takes the best of three
    // over the whole spinner and checks the printed bracket against it.
    { says: "Sanity and commonTrap: the best of three seen in advance is a strictly larger figure",
      holds: (p, d) => {
        let bestOfThree = 0;
        for (let x = 1; x <= p.sectors; x++) bestOfThree += x * (x ** 3 - (x - 1) ** 3);
        bestOfThree = (p.rate * bestOfThree) / p.sectors ** 3;
        return Math.abs(bestOfThree - d.evBest) < EPS && P(d.ev) < P(d.evBest);
      },
      breaks: (_p, d) => ({ ...d, evBest: d.ev }) },
    { says: "keyInsight: each stage's threshold is the next stage's value, and the stages rise",
      holds: (_p, d) => d.midLow === Math.floor(d.lastMean) && d.topLow === Math.floor(d.midValue)
        && d.midKeep === d.midLow + 1 && d.topKeep === d.topLow + 1
        && d.lastMean < d.midValue - EPS && d.midValue < d.topValue - EPS,
      breaks: (_p, d) => ({ ...d, topLow: d.topLow + 1 }) },
    { says: "Value the spins and price them: each stage pools the kept sectors with the rejected ones valued at the next stage",
      holds: (p, d) => d.midTopSum === (p.sectors * (p.sectors + 1) - d.midLow * (d.midLow + 1)) / 2
        && d.midNumer === 2 * d.midTopSum + d.midLow * (p.sectors + 1)
        && d.topTopSum === (p.sectors * (p.sectors + 1) - d.topLow * (d.topLow + 1)) / 2
        && d.topNumer === 2 * p.sectors * d.topTopSum + d.topLow * d.midNumer
        && Math.abs(p.rate * d.topValue - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/truncated-doubling-game": [
    { says: "Sanity: capping one round shorter is worth exactly half a stake less, as printed",
      holds: (p, d) => Math.abs(d.evShorter - ((p.rounds + 1) * p.stake) / 2) < EPS
        && same(d.evShorter + p.stake / 2, d.ev),
      breaks: (_p, d) => ({ ...d, evShorter: d.evShorter + 1 }) },
    { says: "Sanity and commonTrap: the answer beats the bare stake and falls far short of the fully doubled pot",
      holds: (p, d) => P(p.stake) < P(d.ev) && P(d.ev) < P(d.maxPay),
      breaks: (_p, d) => ({ ...d, ev: d.maxPay }) },
    { says: "keyInsight: every round contributes half a stake and the all-heads branch contributes exactly one",
      holds: (p, d) => Math.abs(d.half - p.stake / 2) < EPS
        && Math.abs(d.ladder - p.rounds * d.half) < EPS
        && Math.abs(d.maxPay * d.pAll - p.stake) < EPS
        && Math.abs(d.ladder + p.stake - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "The branch that runs the whole way: the pot multiplier, its chance and the top pot agree with the cap",
      holds: (p, d) => d.potMult === 2 ** p.rounds && Math.abs(d.pAll * d.potMult - 1) < EPS
        && d.maxPay === p.stake * d.potMult,
      breaks: (_p, d) => ({ ...d, potMult: d.potMult * 2 }) },
  ],
  "ev-variance/wald-random-sum": [
    { says: "Sanity: the midpoint of the one-box and full-load values is the answer, as printed",
      holds: (p, d) => same((p.rate * (p.items + 1)) / 2, d.lowTotal)
        && same((p.rate * p.boxes * (p.items + 1)) / 2, d.highTotal)
        && same((d.lowTotal + d.highTotal) / 2, d.ev),
      breaks: (_p, d) => ({ ...d, highTotal: d.highTotal * 2 }) },
    { says: "Sanity and commonTrap: pricing every delivery at full size overstates the takings",
      holds: (_p, d) => P(d.ev) < P(d.highTotal),
      breaks: (_p, d) => ({ ...d, ev: d.highTotal }) },
    // The prose claims the conditional totals are evenly spaced, which is what makes the
    // midpoint argument sound; this walks every delivery size rather than taking that on trust.
    { says: "Sanity: averaging over every delivery size one at a time reaches the same figure",
      holds: (p, d) => {
        let sum = 0;
        for (let n = 1; n <= p.boxes; n++) sum += (p.rate * n * (p.items + 1)) / 2;
        return Math.abs(sum / p.boxes - d.ev) < EPS;
      },
      breaks: (_p, d) => ({ ...d, ev: d.ev + 1 }) },
    { says: "keyInsight: the expected total is the expected count times the expected box-load, priced",
      holds: (p, d) => Math.abs(d.meanBoxes - (p.boxes + 1) / 2) < EPS
        && Math.abs(d.meanItems - (p.items + 1) / 2) < EPS
        && Math.abs(d.meanBoxes * d.meanItems - d.meanTotalItems) < EPS
        && Math.abs(p.rate * d.meanTotalItems - d.ev) < EPS,
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
  ],
  "ev-variance/sampling-without-replacement-variance": [
    { says: "Sanity: the pairwise rebuild reaches the same variance, in integers",
      holds: (p, d) => d.pairsDrawn === p.draws * (p.draws - 1)
        && p.draws * p.faulty * d.sound * (p.pool - 1) - d.pairsDrawn * p.faulty * d.sound
          === p.draws * p.faulty * d.sound * (p.pool - p.draws)
        && Math.abs((p.draws * p.faulty * d.sound * (p.pool - p.draws)) / d.denom - d.varCount) < EPS,
      breaks: (_p, d) => ({ ...d, pairsDrawn: d.pairsDrawn + 1 }) },
    { says: "Sanity and commonTrap: the answer comes in strictly under the independent-draw figure",
      holds: (p, d) => same((p.draws * p.faulty * d.sound) / (p.pool * p.pool), d.withRepl)
        && P(d.varCount) < P(d.withRepl),
      breaks: (_p, d) => ({ ...d, varCount: d.withRepl }) },
    { says: "keyInsight: the whole effect is one factor set by how much of the drawer was taken, and the mean is untouched",
      holds: (p, d) => Math.abs(d.fpc - (p.pool - p.draws) / (p.pool - 1)) < EPS && d.fpc < 1 - EPS
        && Math.abs(d.withRepl * d.fpc - d.varCount) < EPS
        && Math.abs(d.mean - (p.draws * p.faulty) / p.pool) < EPS,
      breaks: (_p, d) => ({ ...d, varCount: d.varCount * 1.02 }) },
    // The three above never leave the template's own algebra, so the answer is also held
    // against the distribution of the count itself, built from binomial coefficients.
    { says: "Statement: the answer is the spread of the count's own distribution",
      holds: (p, d) => {
        const ch = (a: number, b: number) => {
          if (b < 0 || b > a) return 0;
          let r = 1;
          for (let j = 0; j < b; j++) r = (r * (a - j)) / (j + 1);
          return Math.round(r);
        };
        const all = ch(p.pool, p.draws);
        let mu = 0, sq = 0;
        for (let k = 0; k <= p.draws; k++) {
          const w = (ch(p.faulty, k) * ch(d.sound, p.draws - k)) / all;
          mu += k * w;
          sq += k * k * w;
        }
        return Math.abs(mu - d.mean) < EPS && Math.abs(sq - mu * mu - d.varCount) < EPS;
      },
      breaks: (_p, d) => ({ ...d, varCount: d.varCount * 1.01 }) },
  ],

  "distributions/binomial-exact-count": [
    { says: "Sanity: for k=0 the exact-count and at-least-one-failure probabilities are complements summing to 1; for k>=1 the exact-count probability sits at or below at-least-one-failure",
      holds: (p, d) => p.k === 0
        ? Math.abs(P(d.pmf) + P(d.atLeastOne) - 1) < 1e-4 // printed-precision sum, not raw floats — measured worst gap 5e-5 across the legal space
        : P(d.pmf) <= P(d.atLeastOne),
      breaks: (_p, d) => ({ ...d, atLeastOne: 0 }) },
    { says: "Combine: the answer is the arrangement count times one arrangement's probability, exactly",
      holds: (p, d) => Math.abs(d.combNK * (d.prob ** p.k) * (d.q ** d.nMinusK) - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the per-board fail rate alone, or that rate times the trial count, is not the exact-count probability",
      holds: (p, d) => P(d.pmf) !== P(p.n * d.prob) && P(d.pmf) !== P(d.prob),
      breaks: (p, d) => ({ ...d, pmf: p.n * d.prob }) },
  ],

  "distributions/binomial-at-most": [
    { says: "Sanity: the cumulative probability up to k and the tail probability above k partition every outcome and sum to 1",
      holds: (p, d) => Math.abs(P(d.cdf) + P(d.tailProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, tailProb: 0 }) },
    { says: "Combine: the cumulative probability is the sum of the PMF over every count from 0 through k, exactly",
      holds: (p, d) => {
        let s = 0;
        for (let i = 0; i <= p.k; i++) s += comb(p.n, i) * d.prob ** i * d.q ** (p.n - i);
        return Math.abs(s - d.cdf) < 1e-9;
      },
      breaks: (_p, d) => ({ ...d, cdf: d.cdf * 1.5 }) },
    { says: "commonTrap: the cumulative probability is never less than the single PMF term at k alone",
      holds: (p, d) => d.cdf >= comb(p.n, p.k) * d.prob ** p.k * d.q ** (p.n - p.k) - EPS,
      breaks: (_p, d) => ({ ...d, cdf: 0 }) },
  ],

  "distributions/binomial-at-least-one": [
    { says: "Sanity: the zero-failure event and the at-least-one event partition every outcome and sum to 1",
      holds: (p, d) => Math.abs(P(d.zeroFails) + P(d.atLeastOne) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, zeroFails: 0 }) },
    { says: "Combine: the at-least-one probability equals one minus the all-succeed probability, exactly",
      holds: (p, d) => Math.abs(1 - (1 - d.prob) ** p.n - d.atLeastOne) < 1e-9,
      breaks: (_p, d) => ({ ...d, atLeastOne: d.atLeastOne * 1.5 }) },
    { says: "commonTrap: the at-least-one probability is not the per-trial rate times the trial count",
      holds: (p, d) => P(d.atLeastOne) !== P(p.n * d.prob) && P(d.atLeastOne) !== P(d.prob),
      breaks: (p, d) => ({ ...d, atLeastOne: p.n * d.prob }) },
  ],

  "distributions/binomial-fit-then-pmf": [
    { says: "Sanity: the fitted p reproduces the stated zero-event probability c",
      holds: (p, d) => Math.abs(P(d.q ** p.n) - P(p.c)) < 1e-4,
      breaks: (_p, d) => ({ ...d, q: d.q * 1.02 }) },
    { says: "Combine: P(X=1) is n times the fitted p times q to the n-1, exactly",
      holds: (p, d) => Math.abs(p.n * d.fittedP * d.q ** d.nMinus1 - d.pmf1) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf1: d.pmf1 * 1.5 }) },
    { says: "commonTrap: P(X=1) is not the stated zero-event probability, nor the fitted rate alone",
      holds: (p, d) => P(d.pmf1) !== P(p.c) && P(d.pmf1) !== P(d.fittedP),
      breaks: (p, d) => ({ ...d, pmf1: p.c }) },
  ],

  "distributions/poisson-exact-count": [
    { says: "Sanity: the PMF at k equals the PMF at k-1 times lambda over k, the Poisson recurrence",
      holds: (p, d) => Math.abs(d.pPrev * (p.lam / p.k) - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pPrev: d.pPrev * 1.5 }) },
    { says: "Combine: the PMF equals the direct closed form e^-lambda times lambda^k over k!, exactly",
      holds: (p, d) => {
        let fact = 1;
        for (let i = 2; i <= p.k; i++) fact *= i;
        return Math.abs((Math.exp(-p.lam) * p.lam ** p.k) / fact - d.pmf) < 1e-9;
      },
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the PMF is not the rate itself, nor the bare exponential decay factor",
      // At lambda=1, k=1, the PMF (lambda*e^-lambda) IS algebraically identical to e^-lambda —
      // a real mathematical coincidence at that single point, not a floating-point artefact.
      holds: (p, d) => P(d.pmf) !== P(p.lam) && P(d.pmf) !== P(Math.exp(-p.lam)),
      exceptions: 1,
      breaks: (p, d) => ({ ...d, pmf: p.lam }) },
  ],

  "distributions/poisson-at-most": [
    { says: "Sanity: the cumulative probability equals the running sum through the previous count plus this count's own term",
      holds: (p, d) => Math.abs(d.cdfPrev + d.pmfAtK - d.cdf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmfAtK: 0 }) },
    { says: "Combine: the cumulative probability equals the direct sum of the closed-form PMF over every count from 0 through k",
      holds: (p, d) => {
        let s = 0;
        for (let i = 0; i <= p.k; i++) {
          let fact = 1;
          for (let j = 2; j <= i; j++) fact *= j;
          s += (Math.exp(-p.lam) * p.lam ** i) / fact;
        }
        return Math.abs(s - d.cdf) < 1e-9;
      },
      breaks: (_p, d) => ({ ...d, cdf: d.cdf * 1.5 }) },
    { says: "commonTrap: the cumulative probability is never less than the single PMF term at k alone",
      holds: (p, d) => d.cdf >= d.pmfAtK - EPS,
      breaks: (_p, d) => ({ ...d, cdf: 0 }) },
  ],

  "distributions/poisson-rescaled-at-least-one": [
    { says: "Sanity: the zero-event probability and the at-least-one probability partition every outcome and sum to 1",
      holds: (p, d) => Math.abs(P(d.zeroEvents) + P(d.atLeastOne) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, zeroEvents: 0 }) },
    { says: "Combine: the at-least-one probability equals one minus e to the negative rescaled rate, exactly",
      holds: (p, d) => Math.abs(1 - Math.exp((-p.lam0 * p.w1) / p.w0) - d.atLeastOne) < 1e-9,
      breaks: (_p, d) => ({ ...d, atLeastOne: d.atLeastOne * 1.5 }) },
    { says: "commonTrap: the at-least-one probability is not the unrescaled rate itself, nor the bare window ratio",
      holds: (p, d) => P(d.atLeastOne) !== P(p.lam0) && P(d.atLeastOne) !== P(p.w1 / p.w0),
      breaks: (p, d) => ({ ...d, atLeastOne: p.lam0 }) },
  ],

  "distributions/poisson-fit-then-tail": [
    { says: "Sanity: zero, exactly one, and at least two events partition every outcome and sum to 1",
      // Three independently-printed 4-sig-fig terms occasionally drift a hair past 1e-4 —
      // measured max 1.0000000000021e-4 across the full legal space — so the bound allows a
      // little headroom rather than chasing the exact float boundary.
      holds: (p, d) => Math.abs(P(d.pZero) + P(d.pOne) + P(d.atLeastTwo) - 1) < 2e-4,
      breaks: (_p, d) => ({ ...d, pZero: 0 }) },
    { says: "Combine: the at-least-two probability equals one minus the zero- and one-event probabilities, recomputed fresh from the fitted rate",
      holds: (p, d) => {
        const lam = -Math.log(p.c) / p.t;
        const lamP = lam * p.t2;
        return Math.abs(1 - Math.exp(-lamP) * (1 + lamP) - d.atLeastTwo) < 1e-9;
      },
      breaks: (_p, d) => ({ ...d, atLeastTwo: d.atLeastTwo * 1.5 }) },
    { says: "commonTrap: the at-least-two probability is not the stated zero-event probability, nor the fitted rate alone",
      holds: (p, d) => P(d.atLeastTwo) !== P(p.c) && P(d.atLeastTwo) !== P(d.lam),
      breaks: (p, d) => ({ ...d, atLeastTwo: p.c }) },
  ],

  "distributions/geometric-exact-trial": [
    { says: "Sanity: no-conversion-in-k-1-calls splits into converting on call k and still no conversion after k, which recombine to the same total",
      holds: (p, d) => Math.abs(d.pmf + d.tailAtK - d.tailAtKMinus1) < 1e-9,
      breaks: (_p, d) => ({ ...d, tailAtK: 0 }) },
    { says: "Combine: the PMF equals q to the k-1 times p, exactly",
      holds: (p, d) => Math.abs(d.q ** d.kMinus1 * d.prob - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the PMF is not the success rate alone",
      holds: (p, d) => P(d.pmf) !== P(d.prob),
      breaks: (_p, d) => ({ ...d, pmf: d.prob }) },
  ],

  "distributions/geometric-more-than-k": [
    { says: "Sanity: the tail probability never exceeds q itself, since each additional required tick multiplies by another factor of q",
      holds: (p, d) => d.tailProb <= d.q + EPS,
      breaks: (_p, d) => ({ ...d, tailProb: d.tailProb * 1.5 + 1 }) },
    { says: "Combine: the tail probability equals q to the k, exactly",
      holds: (p, d) => Math.abs(d.q ** p.k - d.tailProb) < 1e-9,
      breaks: (_p, d) => ({ ...d, tailProb: d.tailProb * 1.5 }) },
    { says: "commonTrap: for k>1 the tail probability is strictly below q — at k=1 the two are algebraically identical",
      holds: (p, d) => p.k === 1 ? P(d.tailProb) === P(d.q) : d.tailProb < d.q - 1e-9,
      breaks: (p, d) => ({ ...d, tailProb: p.k === 1 ? d.tailProb * 0.5 : d.q }) },
  ],

  "distributions/geometric-conditional-memoryless": [
    { says: "Combine: the answer equals q to the k, recomputed fresh — the elapsed wait j never enters the formula",
      holds: (p, d) => Math.abs(d.q ** p.k - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "Sanity: the answer is NOT the unconditional tail measured from the very start (q to the j+k), the memoryless-violating shortcut",
      holds: (p, d) => p.j === 0 || P(d.answer) !== P(d.q ** (p.j + p.k)),
      breaks: (p, d) => ({ ...d, answer: d.q ** (p.j + p.k) }) },
    { says: "commonTrap: the answer never exceeds q, since each additional further-tick requirement multiplies by another factor of q — equality only at k=1",
      holds: (p, d) => d.answer <= d.q + EPS,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 + 1 }) },
  ],

  "distributions/negbinom-exact-trial": [
    { says: "Sanity: the negative-binomial PMF equals r/k times the plain binomial PMF at the same (k,r) — a known combinatorial identity, checked via an independently-computed C(k,r)",
      holds: (p, d) => {
        const combKfullR = comb(p.k, p.r);
        const binomPmf = combKfullR * d.prob ** p.r * d.q ** d.kMinusR;
        return Math.abs((p.r / p.k) * binomPmf - d.pmf) < 1e-9;
      },
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "Combine: the PMF equals C(k-1,r-1) times p^r times q^(k-r), exactly",
      holds: (p, d) => Math.abs(d.combKR * d.prob ** p.r * d.q ** d.kMinusR - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the PMF is not the plain binomial PMF for r successes in k trials, which allows the r-th success to land anywhere rather than exactly on trial k",
      // p.k > p.r is enforced by the constraint (the k=r boundary is negbinom-fit-p's own
      // territory, where the two formulas are algebraically identical), so this comparison is
      // never vacuous.
      holds: (p, d) => {
        const binomPmf = comb(p.k, p.r) * d.prob ** p.r * d.q ** (p.k - p.r);
        return P(d.pmf) !== P(binomPmf);
      },
      breaks: (p, d) => ({ ...d, pmf: comb(p.k, p.r) * d.prob ** p.r * d.q ** (p.k - p.r) }) },
  ],

  "distributions/negbinom-fit-p": [
    { says: "Sanity: the fitted p raised to the r reproduces the stated c",
      holds: (p, d) => Math.abs(P(d.fittedP ** p.r) - P(p.c)) < 1e-4,
      breaks: (_p, d) => ({ ...d, fittedP: d.fittedP * 1.02 }) },
    { says: "Combine: the fitted p equals c to the 1/r, exactly",
      holds: (p, d) => Math.abs(p.c ** (1 / p.r) - d.fittedP) < 1e-9,
      breaks: (_p, d) => ({ ...d, fittedP: d.fittedP * 1.5 }) },
    { says: "commonTrap: the fitted p is not the stated c itself",
      holds: (p, d) => P(d.fittedP) !== P(p.c),
      breaks: (p, d) => ({ ...d, fittedP: p.c }) },
  ],

  "distributions/hypergeom-exact-draw": [
    { says: "Sanity: the favorable count never exceeds the total count",
      holds: (p, d) => d.combKk * d.combRest <= d.combTotal + EPS,
      breaks: (_p, d) => ({ ...d, combTotal: 1 }) },
    { says: "Combine: the PMF equals C(K,k) times C(N-K,n-k) over C(N,n), exactly",
      holds: (p, d) => Math.abs((d.combKk * d.combRest) / d.combTotal - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the PMF is not the with-replacement binomial approximation at rate K/N",
      // A handful of (N,K,n,k) combos make the hypergeometric and with-replacement-binomial
      // values coincide at printed precision by chance, not by any formula relationship —
      // measured 2 of 1912 legal draws.
      holds: (p, d) => {
        const rate = p.K / p.N;
        const approx = comb(p.n, p.k) * rate ** p.k * (1 - rate) ** (p.n - p.k);
        return P(d.pmf) !== P(approx);
      },
      exceptions: 2,
      breaks: (p, d) => {
        const rate = p.K / p.N;
        return { ...d, pmf: comb(p.n, p.k) * rate ** p.k * (1 - rate) ** (p.n - p.k) };
      } },
  ],

  "distributions/hypergeom-zero-successes": [
    { says: "Sanity: the all-unqualified count never exceeds the total count",
      holds: (p, d) => d.combZero <= d.combTotal + EPS,
      breaks: (_p, d) => ({ ...d, combTotal: 1 }) },
    { says: "Combine: the PMF equals C(N-K,n) over C(N,n), exactly",
      holds: (p, d) => Math.abs(d.combZero / d.combTotal - d.pmf) < 1e-9,
      breaks: (_p, d) => ({ ...d, pmf: d.pmf * 1.5 }) },
    { says: "commonTrap: the PMF is not the with-replacement binomial approximation (1-K/N)^n",
      holds: (p, d) => {
        const approx = (1 - p.K / p.N) ** p.n;
        return P(d.pmf) !== P(approx);
      },
      breaks: (p, d) => ({ ...d, pmf: (1 - p.K / p.N) ** p.n }) },
  ],

  "distributions/duniform-subrange": [
    { says: "Sanity: the favorable count never exceeds the total range",
      holds: (p, d) => d.subrangeSize <= p.N + EPS,
      breaks: (p, d) => ({ ...d, subrangeSize: d.subrangeSize * 2 + p.N }) },
    { says: "Combine: the probability equals d-c+1 over N, exactly",
      holds: (p, d) => Math.abs((p.d - p.c + 1) / p.N - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the probability is not d-c over N, the off-by-one omission of the inclusive endpoint",
      holds: (p, d) => P(d.answer) !== P((p.d - p.c) / p.N),
      breaks: (p, d) => ({ ...d, answer: (p.d - p.c) / p.N }) },
  ],

  "distributions/duniform-fit-range": [
    { says: "Sanity: the fitted N times the stated ratio c reproduces M",
      holds: (p, d) => Math.abs(P(d.answer * d.c) - P(p.M)) < 1e-4,
      breaks: (_p, d) => ({ ...d, c: d.c * 1.02 }) },
    { says: "Combine: N equals M over c, exactly",
      holds: (p, d) => Math.abs(p.M / d.c - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: N is not the stated ratio c itself",
      holds: (p, d) => P(d.answer) !== P(d.c),
      breaks: (_p, d) => ({ ...d, answer: d.c }) },
  ],

  "distributions/cuniform-below-threshold": [
    { says: "Sanity: the probability lands strictly between 0 and 1, since the threshold sits strictly inside the span by construction",
      holds: (p, d) => d.answer > 0 && d.answer < 1,
      breaks: (_p, d) => ({ ...d, answer: 1.5 }) },
    { says: "Combine: the probability equals (t-a) over (b-a), exactly",
      holds: (p, d) => Math.abs((p.t - p.a) / d.range - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the probability is not the threshold's raw distance from zero over the span, which ignores the lower endpoint a",
      holds: (p, d) => P(d.answer) !== P(p.t / d.range),
      breaks: (p, d) => ({ ...d, answer: p.t / d.range }) },
  ],

  "distributions/exponential-cdf-threshold": [
    { says: "Sanity: the survival probability and the arrival probability are complements and sum to 1",
      holds: (p, d) => Math.abs(P(d.survival) + P(d.answer) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, survival: 0 }) },
    { says: "Combine: the probability equals one minus e to the negative rate times threshold, exactly",
      holds: (p, d) => Math.abs(1 - Math.exp(-p.lam * p.t) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the arrival probability is not the survival probability itself",
      holds: (p, d) => P(d.answer) !== P(d.survival),
      breaks: (_p, d) => ({ ...d, answer: d.survival }) },
  ],

  "distributions/exponential-fit-rate": [
    { says: "Sanity: the survival share is the complement of the stated arrival probability",
      holds: (p, d) => Math.abs(P(d.survival) + P(p.c) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, survival: d.survival * 1.02 }) },
    { says: "Combine: the fitted rate equals negative log of the survival share over t, exactly",
      holds: (p, d) => Math.abs(-Math.log(d.survival) / p.t - d.fittedLam) < 1e-9,
      breaks: (_p, d) => ({ ...d, fittedLam: d.fittedLam * 1.5 }) },
    { says: "commonTrap: the fitted rate is not negative log of the stated probability c itself, which skips taking its complement first",
      holds: (p, d) => P(d.fittedLam) !== P(-Math.log(p.c) / p.t),
      breaks: (p, d) => ({ ...d, fittedLam: -Math.log(p.c) / p.t }) },
  ],

  "distributions/exponential-memoryless": [
    { says: "Combine: the answer equals e to the negative rate times t, recomputed fresh — the elapsed wait s never enters the formula",
      holds: (p, d) => Math.abs(Math.exp(-p.lam * p.t) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "Sanity: the answer is NOT the unconditional survival probability measured from the very start (e to the negative rate times s+t), the memoryless-violating shortcut",
      holds: (p, d) => p.s === 0 || P(d.answer) !== P(Math.exp(-p.lam * (p.s + p.t))),
      breaks: (p, d) => ({ ...d, answer: Math.exp(-p.lam * (p.s + p.t)) }) },
    { says: "commonTrap: the answer is not the elapsed-wait survival probability alone, which conflates the already-observed wait with the further wait actually being asked about",
      holds: (p, d) => P(d.answer) !== P(Math.exp(-p.lam * p.s)),
      breaks: (p, d) => ({ ...d, answer: Math.exp(-p.lam * p.s) }) },
  ],

  "distributions/normal-below": [
    { says: "Sanity: the answer sits at or above one half exactly when the threshold sits at or above the mean",
      holds: (p, d) => (d.z >= 0) === (d.answer >= 0.5),
      breaks: (_p, d) => ({ ...d, answer: d.z >= 0 ? 0.1 : 0.9 }) },
    { says: "Combine: the answer equals the standard normal CDF at the standardized z-score, exactly",
      holds: (p, d) => Math.abs(normalCdf(p.x, p.mu, p.sigma) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the answer is not the z-score itself",
      holds: (p, d) => P(d.answer) !== P(d.z),
      breaks: (_p, d) => ({ ...d, answer: d.z }) },
  ],

  "distributions/normal-above": [
    { says: "Sanity: the below-threshold and above-threshold probabilities partition every outcome and sum to 1",
      holds: (p, d) => Math.abs(P(d.below) + P(d.answer) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, below: 0 }) },
    { says: "Combine: the answer equals one minus the standard normal CDF at the standardized z-score, exactly",
      holds: (p, d) => Math.abs(1 - normalCdf(p.x, p.mu, p.sigma) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the answer is not the below-threshold CDF itself",
      holds: (p, d) => P(d.answer) !== P(d.below),
      breaks: (_p, d) => ({ ...d, answer: d.below }) },
  ],

  "distributions/normal-between": [
    { says: "Sanity: the lower endpoint's CDF never exceeds the upper endpoint's, since a<b",
      holds: (p, d) => d.cdfA <= d.cdfB + EPS,
      breaks: (_p, d) => ({ ...d, cdfA: d.cdfB + 0.05 }) },
    { says: "Combine: the answer equals the difference of the two endpoint CDFs, exactly",
      holds: (p, d) => Math.abs(normalCdf(p.b, p.mu, p.sigma) - normalCdf(p.a, p.mu, p.sigma) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the answer is not the upper endpoint's CDF alone, which forgets to subtract the lower endpoint's CDF",
      holds: (p, d) => P(d.answer) !== P(d.cdfB),
      breaks: (_p, d) => ({ ...d, answer: d.cdfB }) },
  ],

  "distributions/normal-quantile-then-range": [
    { says: "Sanity: the threshold found in stage one matches the quantile function's own independent computation",
      holds: (p, d) => Math.abs(normalQuantile(1 - p.c, p.mu, p.sigma) - d.x) < 1e-6,
      breaks: (_p, d) => ({ ...d, x: d.x * 1.05 }) },
    { says: "Combine: the answer equals the difference of the two stage-two endpoint CDFs, exactly",
      holds: (p, d) => Math.abs(normalCdf(d.x + p.d, p.mu, p.sigma) - normalCdf(d.x - p.d, p.mu, p.sigma) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "commonTrap: the answer is not the first-stage tail probability c reused directly",
      holds: (p, d) => P(d.answer) !== P(p.c),
      breaks: (p, d) => ({ ...d, answer: p.c }) },
  ],

  "ruin/fair-reach-goal": [
    { says: "Sanity: sweeping the table and busting are complements whose printed probabilities sum to 1",
      holds: (_p, d) => Math.abs(P(d.frac) + P(d.ruinProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, ruinProb: d.ruinProb * 0.5 }) },
    { says: "Read off the line: the reach probability equals the starting share, recomputed fresh from raw params",
      holds: (p, d) => same(d.frac, p.startChips / p.goalChips),
      breaks: (_p, d) => ({ ...d, frac: d.frac * 1.02 }) },
    { says: "The bust probability is one minus the very same share",
      holds: (p, d) => same(d.ruinProb, 1 - p.startChips / p.goalChips),
      breaks: (_p, d) => ({ ...d, ruinProb: 1 }) },
  ],

  "ruin/unfair-reach-goal": [
    { says: "Sanity: one extra chip strictly raises the reach chance",
      holds: (_p, d) => P(d.successNext) > P(d.success),
      breaks: (_p, d) => ({ ...d, successNext: d.success * 0.9 }) },
    { says: "Solve: with r=q/p the answer recomputed fresh from params matches the printed value",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const r = (1 - prob) / prob;
        return Math.abs((1 - r ** p.startChips) / (1 - r ** p.goalChips) - d.success) < 1e-6;
      },
      breaks: (_p, d) => ({ ...d, success: d.success * 1.02 }) },
    { says: "The complement is the bust chance and both sit inside the unit interval",
      holds: (_p, d) => Math.abs(P(d.success) + P(1 - d.success) - 1) < 1e-4 && P(d.success) > 0 && P(d.success) < 1,
      breaks: (_p, d) => ({ ...d, success: 2 }) },
  ],

  "ruin/walk-hit-upper-first": [
    { says: "Sanity: touching the top first and the bottom first are complements summing to 1",
      holds: (_p, d) => Math.abs(P(d.frac) + P(d.mirrorFrac) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, mirrorFrac: d.mirrorFrac * 0.5 }) },
    { says: "Read off the line: the answer equals downBarrier over total width, fresh from raw params",
      holds: (p, d) => same(d.frac, p.downBarrier / (p.upBarrier + p.downBarrier)),
      breaks: (_p, d) => ({ ...d, frac: d.frac * 1.02 }) },
    { says: "The corridor width printed in Setup equals the sum of the two barriers from raw params",
      holds: (p, d) => same(d.total, p.upBarrier + p.downBarrier),
      breaks: (_p, d) => ({ ...d, total: d.total * 2 }) },
  ],

  "ruin/walk-hit-loss-first": [
    { says: "Sanity: cut-first and bank-first exits account for the whole walk",
      holds: (_p, d) => Math.abs(P(d.frac) + P(d.gainFirst) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, gainFirst: d.gainFirst + 0.5 }) },
    { says: "The cut-first chance equals reboundTarget over corridor width, recomputed from raw params",
      holds: (p, d) => same(d.frac, p.reboundTarget / (p.dropLimit + p.reboundTarget)),
      breaks: (_p, d) => ({ ...d, frac: d.frac * 0.98 }) },
    { says: "The corridor width printed in Setup equals the sum of the two levels from raw params",
      holds: (p, d) => same(d.total, p.dropLimit + p.reboundTarget),
      breaks: (_p, d) => ({ ...d, total: d.total + 1 }) },
  ],

  "ruin/fair-expected-duration": [
    { says: "Setup fit: the parabola form k*(N-k) reproduces the printed duration from raw params",
      holds: (p, d) => same(d.duration, p.stake * (p.target - p.stake)),
      breaks: (_p, d) => ({ ...d, duration: d.duration * 1.05 }) },
    { says: "Sanity: the average sits at or above both clean-run bounds",
      holds: (_p, d) => P(d.duration) >= P(d.straightLoss) && P(d.duration) >= P(d.straightWin),
      breaks: (_p, d) => ({ ...d, duration: Math.min(d.straightLoss, d.straightWin) - 1 }) },
    { says: "Monotonicity: pushing the target one chip higher strictly lengthens the expected session",
      holds: (p, d) => {
        const grown = p.stake * (p.target + 1 - p.stake);
        return P(grown) > P(d.duration);
      },
      breaks: (p, d) => ({ ...d, duration: p.stake * (p.target + 1 - p.stake) }) },
  ],

  "ruin/unfair-expected-duration": [
    { says: "Sanity: expected play stays strictly inside the positive integers",
      holds: (_p, d) => P(d.duration) >= 1 && P(d.duration) <= P(d.fairDuration) + P(d.fairDuration),
      breaks: (_p, d) => ({ ...d, duration: -1 }) },
    { says: "Success first: Pi from the odds ratio recomputes fresh from raw params",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const r = (1 - prob) / prob;
        return Math.abs((1 - r ** p.stake) / (1 - r ** p.target) - d.success) < 1e-6;
      },
      breaks: (_p, d) => ({ ...d, success: d.success * 1.02 }) },
    { says: "Monotonicity: pushing the target one chip higher strictly lengthens expected play",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const q = 1 - prob;
        const r = q / prob;
        const pi = (1 - r ** p.stake) / (1 - r ** (p.target + 1));
        const grown = (p.stake - (p.target + 1) * pi) / (q - prob);
        return grown - d.duration > 1e-4; // measured min growth 1.5e-3 across the legal space
      },
      breaks: (p, d) => {
        const prob = p.winPct / 100;
        const q = 1 - prob;
        const r = q / prob;
        const pi = (1 - r ** p.stake) / (1 - r ** (p.target + 1));
        return { ...d, duration: (p.stake - (p.target + 1) * pi) / (q - prob) };
      } },
  ],

  "ruin/drift-touch-downside": [
    { says: "Solve: the touch chance equals the odds ratio to the distance, fresh from raw params",
      holds: (p, d) => Math.abs(((1 - p.winPct / 100) / (p.winPct / 100)) ** (p.startLevel + p.depth) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.03 }) },
    { says: "Sanity: a hole one deeper gives a strictly smaller touch chance",
      holds: (_p, d) => P(d.oneDeeper) < P(d.answer),
      breaks: (_p, d) => ({ ...d, oneDeeper: d.answer * 1.5 }) },
    { says: "The touch chance stays a strict probability inside the band",
      holds: (_p, d) => P(d.answer) >= 0.1 && P(d.answer) < 1,
      breaks: (_p, d) => ({ ...d, answer: 1.0000001 }) },
  ],

  "ruin/adverse-drift-reach-upside": [
    { says: "Solve: the reach chance equals the inverted odds ratio to the distance, fresh from raw params",
      holds: (p, d) => Math.abs((p.winPct / 100 / (1 - p.winPct / 100)) ** (p.hole + p.height) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.97 }) },
    { says: "Sanity: a target one lower gives a strictly larger reach chance",
      holds: (_p, d) => P(d.oneLower) > P(d.answer),
      breaks: (_p, d) => ({ ...d, oneLower: d.answer * 0.5 }) },
    { says: "Bounds chain: the answer sits at or below the one-lower reach, which stays a probability",
      holds: (_p, d) => P(d.answer) <= P(d.oneLower) && P(d.oneLower) <= 1,
      breaks: (_p, d) => ({ ...d, oneLower: 0 }) },
  ],

  "ruin/complement-ruin-first": [
    { says: "Take the complement: the bust chance is exactly one minus the printed reach chance",
      holds: (_p, d) => Math.abs(P(d.success) + P(d.ruinProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, ruinProb: d.ruinProb * 0.5 }) },
    { says: "Reach chance recomputes fresh from the odds ratio and the raw barriers",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const r = (1 - prob) / prob;
        return Math.abs((1 - r ** p.startChips) / (1 - r ** p.goalChips) - d.success) < 1e-6;
      },
      breaks: (_p, d) => ({ ...d, success: d.success * 1.02 }) },
    { says: "Buying in one chip deeper strictly raises the bust probability",
      holds: (_p, d) => P(d.nextRuin) > P(d.ruinProb),
      breaks: (_p, d) => ({ ...d, nextRuin: d.ruinProb * 0.9 }) },
  ],

  "ruin/fit-capital-fair": [
    { says: "Round up: the achieved share clears the target percentage",
      holds: (p, d) => P(d.achieved) >= p.targetPct / 100,
      breaks: (_p, d) => ({ ...d, achieved: d.below }) },
    { says: "One chip less sits at or below the target while the answer clears it",
      holds: (p, d) => P(d.below) <= P(p.targetPct / 100) && P(d.achieved) >= P(p.targetPct / 100),
      breaks: (_p, d) => ({ ...d, achieved: d.below }) },
    { says: "The raw requirement recomputes from the printed literals",
      holds: (p, d) => same(d.need, (p.targetPct / 100) * p.goalChips),
      breaks: (_p, d) => ({ ...d, need: d.need * 1.05 }) },
    { says: "The answer is exactly the ceiling of the raw requirement",
      holds: (_p, d) => d.capital === Math.ceil(d.need),
      breaks: (_p, d) => ({ ...d, capital: d.capital * 1.02 }) },
  ],

  "ruin/fit-capital-unfair": [
    { says: "Round up: the fitted stack clears the promise and one chip less does not",
      holds: (p, d) => P(d.achieved) >= P(p.targetPct / 100) && P(d.below) < P(d.achieved),
      breaks: (_p, d) => ({ ...d, achieved: d.below }) },
    { says: "Adverse edges demand at least the fair linear share; favorable ones at most",
      holds: (p, d) => p.winPct < 50 ? P(d.capital) >= P(d.fairNeed) : P(d.capital) <= P(d.fairNeed),
      breaks: (p, d) => ({ ...d, capital: p.winPct < 50 ? d.fairNeed - 1 : d.fairNeed + 1 }) },
    { says: "The odds ratio against you exceeds one exactly when the edge is negative",
      holds: (p, d) => (p.winPct < 50 ? P(d.ratio) > 1 : P(d.ratio) < 1),
      breaks: (p, d) => ({ ...d, ratio: p.winPct < 50 ? d.ratio * 0.5 : d.ratio * 2 }) },
    { says: "The fitted stack is exactly the log-inversion ceiling recomputed from raw params",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const r = (1 - prob) / prob;
        const rn = r ** p.goalChips;
        return d.capital === Math.ceil(Math.log(1 - (p.targetPct / 100) * (1 - rn)) / Math.log(r));
      },
      breaks: (_p, d) => ({ ...d, capital: d.capital * 1.02 }) },
  ],

  "ruin/doubling-strategy": [
    { says: "Ruin path: the streak probability recomputes fresh as q to the rounds",
      holds: (p, d) => Math.abs((1 - p.winPct / 100) ** p.rounds - d.streakProb) < 1e-9,
      breaks: (_p, d) => ({ ...d, streakProb: d.streakProb * 1.02 }) },
    { says: "Success side: the session win chance is the exact complement of the streak",
      holds: (_p, d) => Math.abs(P(d.winSession) + P(d.streakProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, winSession: d.streakProb }) },
    { says: "One more round strictly shrinks the ruin tail",
      holds: (_p, d) => P(d.nextStreak) < P(d.streakProb),
      breaks: (_p, d) => ({ ...d, nextStreak: d.streakProb * 2 }) },
  ],

  "ruin/fit-goal-from-duration-fair": [
    { says: "Invert the parabola: stake plus average-over-stake reproduces the target",
      holds: (p, d) => same(d.goalFit, p.stake + d.avgSession / p.stake),
      breaks: (_p, d) => ({ ...d, goalFit: d.goalFit + 3 }) },
    { says: "Reading the parabola back reproduces the stated average exactly",
      holds: (p, d) => same(d.avgSession, p.stake * (d.goalFit - p.stake)),
      breaks: (_p, d) => ({ ...d, avgSession: d.avgSession * 1.02 }) },
    { says: "Both clean exits are shorter than the measured average session",
      holds: (_p, d) => P(d.avgSession) > P(d.straightLoss) && P(d.avgSession) > P(d.straightWin),
      breaks: (_p, d) => ({ ...d, avgSession: Math.min(d.straightLoss, d.straightWin) - 1 }) },
  ],

  "ruin/stake-rescale": [
    { says: "The scrip-unit share equals the original share — invariance checked from raw params",
      holds: (p, d) => same(d.frac, p.startChips / p.goalChips) && same(d.scaledFrac, d.frac),
      breaks: (_p, d) => ({ ...d, scaledFrac: d.frac * 1.02 }) },
    { says: "The rescaled stacks print back as scale times the originals",
      holds: (p, d) => same(d.bigStart, (p.scalePct / 100) * p.startChips) && same(d.bigGoal, (p.scalePct / 100) * p.goalChips),
      breaks: (_p, d) => ({ ...d, bigStart: d.bigStart + 1 }) },
    { says: "The share stays a strict probability inside the band",
      holds: (_p, d) => P(d.frac) >= 0.01 && P(d.frac) <= 0.99,
      breaks: (_p, d) => ({ ...d, frac: 1.5 }) },
  ],

  "ruin/restart-after-survival": [
    { says: "Restart: the fresh reach chance recomputes from the current level alone",
      holds: (p, d) => {
        const prob = p.winPct / 100;
        const r = (1 - prob) / prob;
        return Math.abs((1 - r ** p.reachedLevel) / (1 - r ** p.goalChips) - d.success) < 1e-6;
      },
      breaks: (_p, d) => ({ ...d, success: d.success * 1.02 }) },
    { says: "Remaining climb equals goal minus current level",
      holds: (p, d) => same(d.remaining, p.goalChips - p.reachedLevel),
      breaks: (_p, d) => ({ ...d, remaining: d.remaining + 2 }) },
    { says: "The updated chance is a strict probability inside the band",
      holds: (_p, d) => P(d.success) >= 0.01 && P(d.success) <= 0.99,
      breaks: (_p, d) => ({ ...d, success: 0 }) },
  ],

  "ruin/drift-one-sided-duration": [
    { says: "Drain rate: expected periods equal reserve over the per-period edge",
      holds: (p, d) => same(d.duration, p.reserve / d.edge),
      breaks: (_p, d) => ({ ...d, duration: d.duration * 1.05 }) },
    { says: "Twice the cushion takes twice as long",
      holds: (p, d) => same(d.doubleReserve, (p.reserve * 2) / d.edge),
      breaks: (_p, d) => ({ ...d, doubleReserve: d.duration * 3 }) },
    { says: "The adverse edge recomputes from the raw win percentage",
      holds: (p, d) => same(d.edge, (100 - p.winPct) / 100 - p.winPct / 100),
      breaks: (_p, d) => ({ ...d, edge: d.edge * 0.5 }) },
  ],

  "ruin/fit-then-duration": [
    { says: "Stage one recovers the stake as the target percentage of the goal",
      holds: (p, d) => same(d.stake, (p.reachPct / 100) * p.goalChips),
      breaks: (_p, d) => ({ ...d, stake: d.stake + 2 }) },
    { says: "Stage two prices the session off the recovered stake alone",
      holds: (p, d) => same(d.duration, d.stake * (p.goalChips - d.stake)),
      breaks: (_p, d) => ({ ...d, duration: d.duration * 1.05 }) },
    { says: "A 2 percent perturbation of the duration breaks the parabola read-back",
      holds: (p, d) => Math.abs(p.reachPct / 100 * p.goalChips * (p.goalChips - p.reachPct / 100 * p.goalChips) - d.duration) < 1e-6,
      breaks: (_p, d) => ({ ...d, duration: d.duration * 1.02 }) },
  ],

  "ruin/infer-capital-then-new-goal": [
    { says: "Stage one: the buy-in is the first share of the first goal",
      holds: (p, d) => same(d.stake, (p.firstSharePct / 100) * p.firstGoal),
      breaks: (_p, d) => ({ ...d, stake: d.stake + 1 }) },
    { says: "Stage two: the new chance is the stake over the raised goal",
      holds: (p, d) => same(d.newChance, d.stake / d.secondGoal),
      breaks: (_p, d) => ({ ...d, newChance: d.newChance * 1.02 }) },
    { says: "Raising the barrier with fixed capital strictly lowers a fair share",
      holds: (p, d) => d.secondGoal > p.firstGoal ? P(d.newChance) < P(d.oldChance) : P(d.newChance) === P(d.oldChance),
      breaks: (p, d) => ({ ...d, newChance: d.oldChance * 1.01 }) },
  ],

  "ruin/doubling-fit-then-duration": [
    { says: "Stage one: the fitted loss rate raised to the rounds reproduces the stated streak",
      holds: (p, d) => Math.abs(d.q ** p.rounds - p.streakPct / 100) < 1e-9,
      breaks: (_p, d) => ({ ...d, q: d.q * 1.02 }) },
    { says: "The per-hand win rate is one minus the fitted loss rate",
      holds: (_p, d) => same(d.prob, 1 - d.q),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 0.5 }) },
    { says: "Stage two: the expected grind recomputes as winSession over win rate",
      holds: (_p, d) => same(d.duration, d.winSession / d.prob),
      breaks: (_p, d) => ({ ...d, duration: d.duration + 3 }) },
  ],

  "ruin/survive-then-remaining-duration": [
    { says: "Restart the parabola at the current stack",
      holds: (p, d) => same(d.remaining, p.currentStack * (p.goalChips - p.currentStack)),
      breaks: (_p, d) => ({ ...d, remaining: d.remaining * 1.02 }) },
    { says: "Elapsed hands never enter the conditional answer",
      holds: (p, d) => {
        const alt = p.currentStack * (p.goalChips - p.currentStack);
        return same(alt, d.remaining);
      },
      breaks: (p, d) => ({ ...d, remaining: d.remaining + Math.round(p.elapsedHands / 10) }) },
    { says: "Mid-corridor fresh sessions bound the remainder from above",
      holds: (p, d) => P(d.remaining) <= P(d.fromZero),
      breaks: (_p, d) => ({ ...d, remaining: 10 ** 6 }) },
  ],

  "geometric/segment-subinterval": [
    { says: "Sanity: before and after shares reassemble the window",
      holds: (p, d) => same(d.frac + d.complement, p.endMark / p.trailLength + (p.trailLength - p.endMark) / p.trailLength),
      breaks: (_p, d) => ({ ...d, complement: d.frac }) },
    { says: "The after-share recomputes fresh from raw params",
      holds: (p, d) => same(d.complement, 1 - p.endMark / p.trailLength),
      breaks: (_p, d) => ({ ...d, complement: d.complement * 1.02 }) },
    { says: "The remaining stretch prints back as length minus mark",
      holds: (p, d) => same(d.windowLeft, p.trailLength - p.endMark),
      breaks: (_p, d) => ({ ...d, windowLeft: d.windowLeft + 5 }) },
  ],

  "geometric/two-points-gap": [
    { says: "Close and far chances fill the square",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.farProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, farProb: d.farProb * 0.5 }) },
    { says: "The corner leg is the stick short of the gap",
      holds: (p, d) => same(d.cornerLeg, p.stickLength - p.gapUnits),
      breaks: (_p, d) => ({ ...d, cornerLeg: d.cornerLeg * 1.05 }) },
    { says: "The answer recomputes as one minus the squared shortfall ratio",
      holds: (p, d) => Math.abs(1 - Math.pow(1 - p.gapUnits / p.stickLength, 2) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.98 }) },
  ],

  "geometric/meeting-window": [
    { says: "Meeting plus missing fills the arrival square",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.missProb) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, missProb: d.missProb + 0.5 }) },
    { says: "The miss triangle legs are the window short of the patience",
      holds: (p, d) => same(d.missLeg, p.windowMinutes - p.waitMinutes),
      breaks: (_p, d) => ({ ...d, missLeg: d.missLeg + 7 }) },
    { says: "The meeting chance recomputes fresh from the two times",
      holds: (p, d) => Math.abs(1 - Math.pow((p.windowMinutes - p.waitMinutes) / p.windowMinutes, 2) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
  ],

  "geometric/square-inner-disk": [
    { says: "Areas: pi r-squared over width-times-height reproduces the printed chance",
      holds: (p, d) => same(d.answer, (Math.PI * p.diskR * p.diskR) / (p.boardW * p.boardH)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.03 }) },
    { says: "The disk fits inside the board and its share stays a probability",
      holds: (p, d) => 2 * p.diskR <= Math.min(p.boardW, p.boardH) && P(d.answer) <= 0.99,
      breaks: (_p, d) => ({ ...d, answer: 2 }) },
    { says: "A square board would cap any inscribed circle's share at a quarter of pi",
      holds: (p, d) => p.boardW !== p.boardH || P(d.answer) <= P(Math.PI / 4),
      breaks: (_p, d) => ({ ...d, answer: Math.PI / 3 }) },
  ],

  "geometric/concentric-circles": [
    { says: "Bullseye share equals squared radius ratio, fresh from raw params",
      holds: (p, d) => same(d.answer, Math.pow(p.bullR / p.boardR, 2)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Ring and bullseye partition the board",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.ringShare) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, ringShare: d.ringShare * 0.9 }) },
    { says: "The radius ratio itself prints back from raw params",
      holds: (p, d) => same(d.ratio, p.bullR / p.boardR),
      breaks: (_p, d) => ({ ...d, ratio: d.ratio * 1.05 }) },
  ],

  "geometric/broken-stick-left-share": [
    { says: "Qualifying stretch is the stick past the threshold mark",
      holds: (p, d) => same(d.qualifying, p.stickCm - (p.sharePct / 100) * p.stickCm),
      breaks: (_p, d) => ({ ...d, qualifying: d.qualifying + 4 }) },
    { says: "Answer is one minus the demanded share",
      holds: (p, d) => same(d.answer, 1 - d.shareFrac),
      breaks: (_p, d) => ({ ...d, answer: d.shareFrac }) },
    { says: "Threshold sits at the demanded share of full length",
      holds: (p, d) => same(d.threshold, (p.sharePct / 100) * p.stickCm),
      breaks: (_p, d) => ({ ...d, threshold: d.threshold * 1.04 }) },
  ],

  "geometric/border-band": [
    { says: "Interior keeps positive room and the band stays a strict share",
      holds: (p, d) => 2 * p.bandWidth < Math.min(p.boardW, p.boardH) && P(d.answer) < 1,
      breaks: (_p, d) => ({ ...d, answer: 1 }) },
    { says: "Band share is one minus interior over whole",
      holds: (p, d) => same(d.answer, 1 - d.innerArea / d.boardArea),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Interior dimensions print back from raw params",
      holds: (p, d) => same(d.innerW, p.boardW - 2 * p.bandWidth) && same(d.innerH, p.boardH - 2 * p.bandWidth),
      breaks: (_p, d) => ({ ...d, innerW: d.innerW + 6 }) },
  ],

  "geometric/chord-angle-cap": [
    { says: "Answer is the cap fraction itself",
      holds: (p, d) => same(d.answer, p.capPct / 100),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Complement covers pairings beyond the cap",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.complement) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, complement: 1 }) },
    { says: "Caps stay within the foldable half-turn range",
      holds: (_p, d) => P(d.answer) >= 0.1 && P(d.answer) <= 0.99,
      breaks: (_p, d) => ({ ...d, answer: 1.5 }) },
  ],

  "geometric/meeting-inverse-fit": [
    { says: "The fitted wait sits inside the window",
      holds: (p, d) => P(d.wait) > 0 && P(d.wait) < p.windowMinutes,
      breaks: (p, d) => ({ ...d, wait: p.windowMinutes + 5 }) },
    { says: "Reading the square back puts the miss share at the exact complement of the target",
      holds: (p, d) => Math.abs(P(d.missProb) - (1 - p.targetPct / 100)) < 1e-4,
      breaks: (_p, d) => ({ ...d, missProb: d.missProb * 0.8 }) },
    { says: "Miss legs equal window minus wait, fresh from printed values",
      holds: (p, d) => same(d.missLeg, p.windowMinutes - d.wait),
      breaks: (_p, d) => ({ ...d, missLeg: d.missLeg + 9 }) },
  ],

  "geometric/stick-triangle-conditional": [
    { says: "Conditional chance is left share over right share, fresh from params",
      holds: (p, d) => same(d.answer, (p.firstBreakPct / 100) / (1 - p.firstBreakPct / 100)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.97 }) },
    { says: "Remainder percentage prints back as one hundred minus the first break",
      holds: (p, d) => same(d.remainderPct, 100 - p.firstBreakPct),
      breaks: (_p, d) => ({ ...d, remainderPct: d.remainderPct + 4 }) },
    { says: "The unconditional sequential value sits strictly under a quarter",
      holds: (_p, d) => P(d.seqUnconditional) < 0.25,
      breaks: (_p, d) => ({ ...d, seqUnconditional: 0.3 }) },
  ],

  "geometric/buffon-short-needle": [
    { says: "Crossing chance recomputes as twice the ratio over pi",
      holds: (p, d) => Math.abs((2 * p.needleCm) / (Math.PI * p.boardCm) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.05 }) },
    { says: "Short regime holds and the chance stays a probability",
      holds: (p, d) => p.needleCm <= p.boardCm && P(d.answer) <= 0.99,
      breaks: (_p, d) => ({ ...d, answer: 1.2 }) },
    { says: "The length-to-spacing ratio prints back from raw params",
      holds: (p, d) => same(d.ratio, p.needleCm / p.boardCm),
      breaks: (_p, d) => ({ ...d, ratio: d.ratio * 2 }) },
  ],

  "geometric/three-points-spacing": [
    { says: "Consumed space is twice the demanded gap",
      holds: (p, d) => same(d.consumed, 2 * p.gapUnits),
      breaks: (p, d) => ({ ...d, consumed: p.gapUnits }) },
    { says: "Effective span is the stick short of the consumed space",
      holds: (p, d) => same(d.t, (p.stickLength - d.consumed) / p.stickLength),
      breaks: (_p, d) => ({ ...d, t: d.t * 1.02 }) },
    { says: "The answer is that span cubed and stays inside the band",
      holds: (p, d) => Math.abs(Math.pow((p.stickLength - 2 * p.gapUnits) / p.stickLength, 3) - d.answer) < 1e-9 && P(d.answer) >= 0.1,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.03 }) },
  ],

  "geometric/corner-quarter-disk": [
    { says: "Zone area is pi r-squared over four",
      holds: (p, d) => same(d.zoneArea, (Math.PI * p.zoneR * p.zoneR) / 4),
      breaks: (_p, d) => ({ ...d, zoneArea: d.zoneArea * 2 }) },
    { says: "The zone stays on the lawn and its share remains a probability",
      holds: (p, d) => p.zoneR <= Math.min(p.boardW, p.boardH) && P(d.answer) <= 0.99,
      breaks: (_p, d) => ({ ...d, answer: 1.1 }) },
    { says: "The share recomputes as zone over board",
      holds: (p, d) => same(d.answer, d.zoneArea / d.boardArea),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.95 }) },
  ],

  "geometric/disk-in-rect-complement": [
    { says: "The disk fits on the table and the miss share stays a probability",
      holds: (p, d) => 2 * p.diskR <= Math.min(p.boardW, p.boardH) && P(d.answer) >= 0.1,
      breaks: (_p, d) => ({ ...d, answer: -0.5 }) },
    { says: "Disk share is pure area over table, position-free",
      holds: (p, d) => same(d.diskShare, (Math.PI * p.diskR * p.diskR) / (p.boardW * p.boardH)),
      breaks: (_p, d) => ({ ...d, diskShare: d.diskShare * 1.04 }) },
    { says: "Missing is the exact complement of the stain share",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.diskShare) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, answer: d.diskShare }) },
  ],

  "geometric/buffon-fit-length-inverse": [
    { says: "Fitted needle respects the short-needle regime",
      holds: (p, d) => P(d.ratio) <= 1 && same(d.ratio, d.needle / p.boardCm),
      breaks: (p, d) => ({ ...d, needle: p.boardCm * 1.5 }) },
    { says: "Needle is target times board times two-over-pi",
      holds: (p, d) => same(d.needle, (p.targetPct / 100) * p.boardCm * (Math.PI / 2)),
      breaks: (_p, d) => ({ ...d, needle: d.needle * 1.03 }) },
    { says: "Feeding the ratio forward returns the target probability",
      holds: (p, d) => Math.abs((2 * d.ratio) / Math.PI - p.targetPct / 100) < 1e-9,
      breaks: (_p, d) => ({ ...d, ratio: d.ratio * 0.9 }) },
  ],

  "geometric/triangle-parallel-cut": [
    { says: "Top piece is the depth fraction squared",
      holds: (p, d) => same(d.topShare, Math.pow(p.cutPct / 100, 2)),
      breaks: (_p, d) => ({ ...d, topShare: d.topShare * 0.5 }) },
    { says: "Below the cut takes everything else",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.topShare) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, answer: d.topShare }) },
    { says: "Cutting five points deeper toward the base strictly shrinks the below-cut share",
      holds: (p, d) => {
        const deeperCut = 1 - Math.pow((p.cutPct + 5) / 100, 2);
        return P(deeperCut) < P(d.answer);
      },
      breaks: (p, d) => ({ ...d, answer: 1 - Math.pow((p.cutPct + 5) / 100, 2) }) },
  ],

  "geometric/fit-window-then-other-window": [
    { says: "Stage one wait recomputes from the old window and target",
      holds: (p, d) => same(d.wait, p.firstWindow * (1 - Math.sqrt(1 - p.targetPct / 100))),
      breaks: (_p, d) => ({ ...d, wait: d.wait * 1.05 }) },
    { says: "Stage two legs are the new window short of the carried-over wait",
      holds: (p, d) => same(d.missLeg, p.secondWindow - d.wait),
      breaks: (_p, d) => ({ ...d, missLeg: d.missLeg + 6 }) },
    { says: "The new chance recomputes from the carried wait inside the second window",
      holds: (p, d) => Math.abs(1 - Math.pow((p.secondWindow - d.wait) / p.secondWindow, 2) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.98 }) },
    { says: "The shorter window improves on the original staged-in chance",
      holds: (p, d) => P(d.answer) > p.targetPct / 100,
      breaks: (p, d) => ({ ...d, answer: p.targetPct / 100 }) },
  ],

  "geometric/buffon-fit-then-other-board": [
    { says: "Fitted needle is target share of old spacing times two-over-pi",
      holds: (p, d) => same(d.needle, (p.targetPct / 100) * p.firstBoardCm * (Math.PI / 2)),
      breaks: (_p, d) => ({ ...d, needle: d.needle * 1.04 }) },
    { says: "New board prints back as its percentage of the old",
      holds: (p, d) => same(d.secondBoard, (p.secondBoardPct / 100) * p.firstBoardCm),
      breaks: (_p, d) => ({ ...d, secondBoard: d.secondBoard + 7 }) },
    { says: "Answer is twice the fitted needle over pi times the new spacing",
      holds: (p, d) => Math.abs((2 * d.needle) / (Math.PI * d.secondBoard) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.98 }) },
    { says: "Tighter lines raise the crossing chance above the original target",
      holds: (p, d) => P(d.answer) > p.targetPct / 100,
      breaks: (p, d) => ({ ...d, answer: p.targetPct / 100 }) },
  ],

  "geometric/delayed-arrival-meeting": [
    { says: "Full sweep is the window short of both delay and patience",
      holds: (p, d) => same(d.fullSpan, p.windowMinutes - p.delayMinutes - p.waitMinutes),
      breaks: (_p, d) => ({ ...d, fullSpan: d.fullSpan + 8 }) },
    { says: "Answer is stripe width times untouched sweep over the square",
      holds: (p, d) => Math.abs((2 * p.waitMinutes * (p.windowMinutes - p.delayMinutes)) / (p.windowMinutes ** 2) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, answer: d.answer * 0.96 }) },
    { says: "Extra delay minutes eat exactly two waits of area per minute",
      holds: (p, d) => same(d.answer - (2 * p.waitMinutes * (p.windowMinutes - p.delayMinutes - 5)) / (p.windowMinutes ** 2), (2 * p.waitMinutes * 5) / (p.windowMinutes ** 2)),
      breaks: (p, d) => ({ ...d, answer: d.answer * 1.02 }) },
  ],

  "geometric/concentric-fit-then-ring": [
    { says: "Bullseye radius is board radius times root of its share",
      holds: (p, d) => same(d.bullR, p.boardR * Math.sqrt(p.bullseyePct / 100)),
      breaks: (_p, d) => ({ ...d, bullR: d.bullR * 1.05 }) },
    { says: "Outer edge prints back at its percentage of the board",
      holds: (p, d) => same(d.outerR, (p.outerPct / 100) * p.boardR),
      breaks: (_p, d) => ({ ...d, outerR: d.outerR + 3 }) },
    { says: "Ring share is outer squared share minus bullseye share",
      holds: (p, d) => Math.abs(Math.pow(p.outerPct / 100, 2) - p.bullseyePct / 100 - d.ringShare) < 1e-9,
      breaks: (_p, d) => ({ ...d, ringShare: d.ringShare * 0.9 }) },
  ],

  // ---- B6 markov batch. Every answer was also confirmed against a Monte-Carlo simulation of
  // the chain itself; these claims guard the prose that no other gate reads.
  "markov/deuce-win-by-two": [
    { says: "Solve: the game probability recomputed fresh from the raw point counts matches the printed value",
      holds: (p, d) => same(d.answer, (p.pointsWon * p.pointsWon) / (p.pointsWon * p.pointsWon + (p.pointsPlayed - p.pointsWon) * (p.pointsPlayed - p.pointsWon))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: winning by two amplifies the per-point edge, so the game sits at least as far from a coin flip as the point does",
      holds: (_p, d) => Math.abs(P(d.answer) - 0.5) >= Math.abs(P(d.prob) - 0.5) - EPS,
      breaks: (_p, d) => ({ ...d, answer: 0.5 }) },
    { says: "The split that returns to deuce and the two deciding pairs exhaust the next two points",
      holds: (_p, d) => Math.abs(P(d.splitProb) + P(d.decidedProb) - 1) < 1e-3,
      breaks: (_p, d) => ({ ...d, splitProb: d.splitProb * 2 }) },
  ],

  "markov/machine-uptime-stationary": [
    { says: "Solve: expected live days recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.days * p.fixPct) / (p.failPct + p.fixPct)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: repair outpaces failure here, so more than half the horizon is live",
      holds: (p, d) => P(d.answer) > p.days / 2,
      breaks: (p, d) => ({ ...d, answer: p.days / 4 }) },
    { says: "Live and stalled days account for the whole horizon",
      holds: (p, d) => Math.abs(P(d.answer) + P(d.stalledDays) - p.days) <= shown(d.answer) + shown(d.stalledDays) + EPS,
      breaks: (_p, d) => ({ ...d, stalledDays: d.stalledDays + 1 }) },
  ],

  "markov/maze-food-before-trap": [
    { says: "Solve: the food probability recomputed fresh from door counts matches the printed value",
      holds: (p, d) => same(d.answer, p.doorsB / (p.doorsA + p.doorsB - 1)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the equal-door case named in the prose is above a coin flip, because the mouse starts nearer the food",
      holds: (p, d) => same(d.equalDoorCase, p.doorsA / (2 * p.doorsA - 1)) && P(d.equalDoorCase) > 0.5,
      breaks: (_p, d) => ({ ...d, equalDoorCase: 0.4 }) },
    { says: "Read the shape: one more door in room B strictly raises the food probability",
      holds: (p, d) => (p.doorsB + 1) / (p.doorsA + p.doorsB) > d.answer,
      breaks: (_p, d) => ({ ...d, answer: 1 }) },
  ],

  "markov/tunnel-doors-escape": [
    { says: "Solve: the expected escape time is every tunnel time added together, recomputed from params",
      holds: (p, d) => same(d.answer, p.exitHours + p.loopOneHours + p.loopTwoHours),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the mean single-tunnel time printed is a third of the total",
      holds: (_p, d) => same(d.meanStep, d.answer / 3),
      breaks: (_p, d) => ({ ...d, meanStep: d.meanStep * 2 }) },
    { says: "Sanity: the expected wait exceeds walking straight out, since the exit is not found first every time",
      holds: (p, d) => P(d.answer) > p.exitHours,
      breaks: (p, d) => ({ ...d, answer: p.exitHours / 2 }) },
  ],

  "markov/switching-coins-share": [
    { says: "Solve: coin A's long-run share recomputed fresh from the two heads rates matches the printed value",
      holds: (p, d) => same(d.answer, (100 - p.headsBPct) / (200 - p.headsAPct - p.headsBPct)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the heads-heavier coin is the one held more often",
      holds: (p, d) => (p.headsAPct > p.headsBPct ? P(d.answer) > 0.5 : P(d.answer) < 0.5),
      breaks: (_p, d) => ({ ...d, answer: 0.5 }) },
    { says: "The two coins' shares account for every flip",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.shareB) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, shareB: d.shareB / 2 }) },
  ],

  "markov/system-days-to-failure": [
    { says: "Solve: expected days to failure recomputed fresh from the three rates matches the printed value",
      holds: (p, d) => same(d.answer, (100 * (p.breakPct + p.wearPct + p.repairPct)) / (p.wearPct * p.breakPct)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: starting worn is strictly shorter than starting new, by exactly the wait to wear out",
      holds: (p, d) => P(d.fromWorn) < P(d.answer) && Math.abs(d.answer - d.fromWorn - 100 / p.wearPct) < 1e-9,
      breaks: (_p, d) => ({ ...d, fromWorn: d.answer * 2 }) },
    { says: "The printed wait to wear out is the reciprocal of the wear rate",
      holds: (p, d) => same(d.daysToWear, 100 / p.wearPct),
      breaks: (_p, d) => ({ ...d, daysToWear: d.daysToWear * 2 }) },
  ],

  "markov/consecutive-run-wait": [
    { says: "Solve: the expected wait recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.outOf * (d.nk - d.wk)) / (d.wk * (p.outOf - p.hitsPer))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the wait strictly exceeds the reciprocal of the run probability, because failed attempts also cost trials",
      holds: (_p, d) => P(d.answer) > P(d.nk / d.wk),
      breaks: (_p, d) => ({ ...d, answer: d.wk / d.nk }) },
    { says: "Sanity: the wait cannot be shorter than the run itself",
      holds: (p, d) => P(d.answer) > p.runLength,
      breaks: (_p, d) => ({ ...d, answer: 1 }) },
  ],

  "markov/two-state-after-k-days": [
    { says: "Solve: the k-step calm probability recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.returnPct * d.pk + p.leavePct * d.lk) / ((p.leavePct + p.returnPct) * d.pk)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: starting calm can only help, so the finite-horizon answer sits strictly above the long-run share",
      holds: (_p, d) => P(d.answer) > P(d.stationary),
      breaks: (_p, d) => ({ ...d, answer: d.stationary }) },
    { says: "The long-run share printed in step one recomputes from the raw switching rates",
      holds: (p, d) => same(d.stationary, p.returnPct / (p.leavePct + p.returnPct)),
      breaks: (_p, d) => ({ ...d, stationary: d.stationary * 1.5 }) },
  ],


  // ---- B6 symmetry batch. Formulas confirmed against simulation, and the three rare-event ones
  // (all-wins-before-loss, relative-order, friends-together) against exhaustive enumeration.
  "symmetry/all-wins-before-loss": [
    { says: "Solve: expected successes recomputed fresh from the face counts matches the printed value",
      holds: (p, d) => { let c = 1; for (let i = 0; i < p.good; i++) c = (c * (p.good + p.bad - i)) / (i + 1); return same(d.answer, p.rounds / Math.round(c)); },
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "A single round succeeds with one over the number of interleavings",
      holds: (_p, d) => same(d.prob, 1 / d.ways),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 2 }) },
    { says: "Sanity: the mirrored question counts the same interleavings, so the count is symmetric in the two labels",
      holds: (p, d) => { let c = 1; for (let i = 0; i < p.bad; i++) c = (c * (p.good + p.bad - i)) / (i + 1); return Math.round(c) === d.ways; },
      breaks: (_p, d) => ({ ...d, ways: d.ways + 1 }) },
  ],

  "symmetry/first-ace-position": [
    { says: "Solve: the expected first-ace position recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.cards + 1) / (p.aces + 1)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Every gap holds the same expected number of non-aces",
      holds: (p, d) => same(d.gapSize, (p.cards - p.aces) / (p.aces + 1)),
      breaks: (_p, d) => ({ ...d, gapSize: d.gapSize * 1.5 }) },
    { says: "Sanity: the last ace is as far from the end of the deck as the first is from the start",
      holds: (p, d) => Math.abs((p.cards + 1 - d.lastAce) - d.answer) < 1e-9,
      breaks: (_p, d) => ({ ...d, lastAce: d.lastAce * 1.1 }) },
  ],

  "symmetry/ballot-always-ahead": [
    { says: "Solve: the always-ahead probability recomputed fresh from the vote counts matches the printed value",
      holds: (p, d) => same(d.answer, (p.votesA - p.votesB) / (p.votesA + p.votesB)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: leading throughout and touching a tie are complements",
      holds: (_p, d) => Math.abs(P(d.answer) + P(d.tieAtSomePoint) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, tieAtSomePoint: d.tieAtSomePoint / 2 }) },
    { says: "The tie probability printed is twice the losing candidate's share",
      holds: (p, d) => same(d.tieAtSomePoint, (2 * p.votesB) / (p.votesA + p.votesB)),
      breaks: (_p, d) => ({ ...d, tieAtSomePoint: d.tieAtSomePoint + 0.1 }) },
  ],

  "symmetry/last-ball-colour": [
    { says: "Solve: expected red endings recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.trials * p.red) / (p.red + p.blue)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The last-ball probability is exactly the starting red share",
      holds: (p, d) => same(d.share, p.red / (p.red + p.blue)),
      breaks: (_p, d) => ({ ...d, share: d.share * 1.3 }) },
    { says: "Sanity: red and blue endings account for every trial",
      holds: (p, d) => Math.abs(P(d.answer) + P(d.blueEnds) - p.trials) <= shown(d.answer) + shown(d.blueEnds) + EPS,
      breaks: (_p, d) => ({ ...d, blueEnds: d.blueEnds + 1 }) },
  ],

  "symmetry/standing-table-legs": [
    { says: "Solve: expected standing tables recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, p.tables * (1 - p.legs / Math.pow(2, p.legs - 1))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Standing and falling are complements",
      holds: (_p, d) => Math.abs(P(d.stands) + P(d.falls) - 1) < 1e-4,
      breaks: (_p, d) => ({ ...d, falls: d.falls * 2 }) },
    { says: "The semicircle denominator doubles with every extra leg",
      holds: (p, d) => d.half === Math.pow(2, p.legs - 1),
      breaks: (_p, d) => ({ ...d, half: d.half * 2 }) },
  ],

  "symmetry/beat-every-rival": [
    { says: "Solve: expected wins recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, p.rounds / (p.rivals + 1)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Every desk in the field holds an equal share of the wins",
      holds: (p, d) => same(d.prob, 1 / (p.rivals + 1)),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 1.5 }) },
    { says: "Sanity: your wins and the rivals' wins account for every auction",
      holds: (p, d) => Math.abs(P(d.answer) + P(d.rivalWins) - p.rounds) <= shown(d.answer) + shown(d.rivalWins) + EPS,
      breaks: (_p, d) => ({ ...d, rivalWins: d.rivalWins + 1 }) },
  ],

  "symmetry/friends-together-round-table": [
    { says: "Solve: expected successful dinners recomputed fresh from params matches the printed value",
      holds: (p, d) => { let b = 1; for (let i = 2; i <= p.friends; i++) b *= i; let f = 1; for (let i = 1; i <= p.friends - 1; i++) f *= p.seats - i; return same(d.answer, (p.parties * b) / f); },
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The per-dinner chance is the block orderings over the falling seat product",
      holds: (_p, d) => same(d.prob, d.blockWays / d.falling),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 1.4 }) },
    { says: "Sanity: it is a probability, so it never reaches 1",
      holds: (_p, d) => P(d.prob) < 1 && P(d.prob) > 0,
      breaks: (_p, d) => ({ ...d, prob: 1.5 }) },
  ],

  "symmetry/relative-order-of-picks": [
    { says: "Solve: expected matches recomputed fresh from params matches the printed value",
      holds: (p, d) => { let o = 1; for (let i = 2; i <= p.picked; i++) o *= i; return same(d.answer, p.rounds / o); },
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "One named ordering out of all of them",
      holds: (_p, d) => same(d.prob, 1 / d.orders),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 2 }) },
    { says: "Sanity: the orderings you did not name are all the rest",
      holds: (_p, d) => d.wrongOrders === d.orders - 1,
      breaks: (_p, d) => ({ ...d, wrongOrders: d.orders }) },
  ],
  "symmetry/decisive-face-wait": [
    { says: "Solve: expected spend recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.spend, (p.cost * p.sides) / 2),
      breaks: (_p, d) => ({ ...d, spend: d.spend * 1.02 }) },
    { says: "A spin is decisive when it shows either of the two marked sectors",
      holds: (p, d) => same(d.pSpecial, 2 / p.sides),
      breaks: (_p, d) => ({ ...d, pSpecial: d.pSpecial * 1.5 }) },
    { says: "The expected wait is the reciprocal of the decisive-spin chance",
      holds: (_p, d) => same(d.eRolls, 1 / d.pSpecial),
      breaks: (_p, d) => ({ ...d, eRolls: d.eRolls * 1.1 }) },
    { says: "Sanity: the spend is the per-spin cost times the expected number of spins",
      holds: (p, d) => Math.abs(P(d.spend) - p.cost * P(d.eRolls)) <= shown(d.spend) + p.cost * shown(d.eRolls) + EPS,
      breaks: (_p, d) => ({ ...d, spend: d.spend + 1 }) },
  ],
  "symmetry/ants-circle-directions": [
    { says: "Solve: expected total payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.bounty * p.replays) / Math.pow(2, p.ants - 1)),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Each ant contributes two independent choices, so the assignments are two to the colony size",
      holds: (p, d) => same(d.assignments, Math.pow(2, p.ants)),
      breaks: (_p, d) => ({ ...d, assignments: d.assignments * 2 }) },
    { says: "Exactly two of those assignments are clean",
      holds: (_p, d) => same(d.prob, 2 / d.assignments),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 1.5 }) },
    { says: "Sanity: the expectation stays under the payment for an all-clean run",
      holds: (_p, d) => P(d.ev) <= P(d.payout) + shown(d.ev) + shown(d.payout) + EPS,
      breaks: (_p, d) => ({ ...d, ev: d.payout * 2 }) },
  ],

  // ---- B6 brainteasers batch. Every answer was checked against an independent brute force
  // (toggling every bulb, solving the pirate game backward, Dijkstra over bridge states, an
  // event-driven ant simulation); two formulas were wrong before that check and are fixed.
  "brainteasers/clock-hands-angle": [
    { says: "Solve: the angle recomputed from both hand positions in degrees matches the printed value",
      holds: (p, d) => { const raw = Math.abs((30 * (p.hour % 12) + 0.5 * p.minute) - 6 * p.minute); return same(d.answer, Math.min(raw, 360 - raw)); },
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the smaller angle always lies between 0 and 180 degrees",
      holds: (_p, d) => P(d.answer) >= 0 && P(d.answer) <= 180,
      breaks: (_p, d) => ({ ...d, answer: 200 }) },
    { says: "The minute hand sits six degrees per minute past twelve",
      holds: (p, d) => same(d.minuteDeg, 6 * p.minute),
      breaks: (_p, d) => ({ ...d, minuteDeg: d.minuteDeg + 10 }) },
  ],

  "brainteasers/light-switches-left-on": [
    { says: "Solve: the lit count recomputed fresh from the row length matches the printed value",
      holds: (p, d) => same(d.answer, Math.floor(Math.sqrt(p.bulbs))),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 2 }) },
    { says: "Sanity: the printed squares bracket the row length, which is what pins the count",
      holds: (p, d) => d.square <= p.bulbs && p.bulbs < d.nextSquare,
      breaks: (_p, d) => ({ ...d, square: d.nextSquare * 4 }) },
    { says: "The bracketing squares really are consecutive squares",
      holds: (_p, d) => d.square === d.root * d.root && d.nextSquare === (d.root + 1) * (d.root + 1),
      breaks: (_p, d) => ({ ...d, nextSquare: d.nextSquare + 1 }) },
  ],

  "brainteasers/trailing-zeros-factorial": [
    { says: "Solve: the zero count recomputed fresh from the three tiers matches the printed value",
      holds: (p, d) => same(d.answer, Math.floor(p.n / 5) + Math.floor(p.n / 25) + Math.floor(p.n / 125)),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 2 }) },
    { says: "Sanity: the count exceeds one per multiple of five, because 25 and 125 contribute extras",
      holds: (p, d) => P(d.answer) >= p.n / 5,
      breaks: (_p, d) => ({ ...d, answer: 1 }) },
    { says: "Twos are strictly in surplus, which is why only the fives are counted",
      holds: (p, d) => d.byTwo === Math.floor(p.n / 2) && d.byTwo > d.byFive,
      breaks: (_p, d) => ({ ...d, byTwo: 0 }) },
  ],

  "brainteasers/pirates-gold-split": [
    { says: "Solve: the proposer's take recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, p.coins - Math.floor((p.pirates - 1) / 2)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The bought votes plus the proposer's own reach a tie, which passes",
      holds: (p, d) => d.votesNeeded === d.bribes + 1 && 2 * d.votesNeeded >= p.pirates,
      breaks: (_p, d) => ({ ...d, votesNeeded: 0 }) },
    { says: "Sanity: bribes are one coin each, so the proposer keeps the clear majority of the gold",
      holds: (p, d) => P(d.answer) > p.coins / 2,
      breaks: (p, d) => ({ ...d, answer: p.coins / 4 }) },
  ],

  "brainteasers/egg-drop-min-trials": [
    { says: "Solve: the drop count recomputed fresh from the floor count matches the printed value",
      holds: (p, d) => same(d.answer, Math.ceil((Math.sqrt(8 * p.floors + 1) - 1) / 2)),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "Sanity: the building is covered by this many drops but not by one fewer",
      holds: (p, d) => d.shortOf < p.floors && p.floors <= d.reach,
      breaks: (_p, d) => ({ ...d, reach: 0 }) },
    { says: "The reach printed is the triangular number of the drop count",
      holds: (_p, d) => d.reach === (d.answer * (d.answer + 1)) / 2,
      breaks: (_p, d) => ({ ...d, reach: d.reach + 1 }) },
  ],

  "brainteasers/ants-pole-collisions": [
    { says: "Solve: expected collisions recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.trials * p.ants * (p.ants - 1)) / 8),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Each of the pairs meets a quarter of the time — the factor the first draft got wrong",
      holds: (_p, d) => Math.abs(d.perTrial - d.pairs / 4) < 1e-9,
      breaks: (_p, d) => ({ ...d, perTrial: d.pairs / 2 }) },
    { says: "The pair count is the number of unordered ant pairs",
      holds: (p, d) => d.pairs === (p.ants * (p.ants - 1)) / 2,
      breaks: (_p, d) => ({ ...d, pairs: d.pairs + 1 }) },
  ],

  "brainteasers/bridge-crossing-time": [
    { says: "Solve: the optimum recomputed fresh from the four times matches the printed value",
      holds: (p, d) => same(d.answer, Math.min(2 * p.fastest + p.second + p.third + p.slowest, p.fastest + 3 * p.second + p.slowest)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Sanity: the answer is the better of the two named plans and beats neither of them",
      holds: (_p, d) => P(d.answer) <= P(d.shuttle) && P(d.answer) <= P(d.pairSlow),
      breaks: (_p, d) => ({ ...d, answer: d.shuttle + d.pairSlow }) },
    { says: "The printed saving is the gap between the two plans",
      holds: (_p, d) => Math.abs(d.saving - Math.abs(d.shuttle - d.pairSlow)) < 1e-9,
      breaks: (_p, d) => ({ ...d, saving: d.saving + 1 }) },
  ],

  "brainteasers/frog-well-escape": [
    { says: "Solve: the escape day recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, Math.ceil((p.depth - p.climb) / (p.climb - p.slip)) + 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "Sanity: dropping the final slide never makes the escape slower than the naive division",
      holds: (_p, d) => P(d.answer) <= P(d.naive),
      breaks: (_p, d) => ({ ...d, answer: d.naive + 5 }) },
    { says: "The net daily gain is the climb less the slide",
      holds: (p, d) => d.net === p.climb - p.slip,
      breaks: (_p, d) => ({ ...d, net: d.net + 1 }) },
  ],

  "symmetry/comparing-heads-counts": [
    { says: "Solve: the expected total recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, r9((p.contests * p.bounty * (Math.pow(2, 2 * p.flipsEach) - comb(2 * p.flipsEach, p.flipsEach))) / (2 * Math.pow(2, 2 * p.flipsEach)))),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "The sum over matching head counts collapses to one coefficient on the pooled flips",
      holds: (p, d) => {
        let sum = 0;
        for (let k = 0; k <= p.flipsEach; k++) sum += comb(p.flipsEach, k) * comb(p.flipsEach, k);
        return same(d.tieWays, sum) && same(d.tieWays, comb(d.sumFlips, p.flipsEach));
      },
      breaks: (_p, d) => ({ ...d, tieWays: d.tieWays * 2 }) },
    { says: "Both players flip the same number of fair independent coins",
      holds: (p, d) => d.sumFlips === 2 * p.flipsEach && same(d.totalWays, Math.pow(2, d.sumFlips)),
      breaks: (_p, d) => ({ ...d, totalWays: d.totalWays * 2 }) },
    { says: "Ties are real, so a lead is strictly less likely than a half — and the three events exhaust the space",
      holds: (_p, d) => P(d.leadProb) < 0.5 && P(d.tieProb) > 0 && same(r9(2 * d.leadProb + d.tieProb), 1),
      breaks: (_p, d) => ({ ...d, leadProb: 0.5 }) },
    { says: "Sanity: the total falls short of what winning every contest would pay",
      holds: (p, d) => P(d.ev) < P(p.contests * p.bounty),
      breaks: (p, d) => ({ ...d, ev: p.contests * p.bounty }) },
  ],
  "symmetry/disjoint-subsets": [
    { says: "Solve: expected payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.bounty * p.rounds * Math.pow(3, p.items)) / Math.pow(4, p.items)),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Three of the four per-dish states leave the round clean",
      holds: (p, d) => same(d.prob, Math.pow(0.75, p.items)),
      breaks: (_p, d) => ({ ...d, prob: d.prob * 1.2 }) },
    { says: "Each dish is decided four ways, independently across dishes",
      holds: (p, d) => same(d.p4n, Math.pow(4, p.items)) && same(d.p3n, Math.pow(3, p.items)),
      breaks: (_p, d) => ({ ...d, p4n: d.p4n * 4 }) },
    { says: "Sanity: the total stays under the payment for an all-clean run",
      holds: (_p, d) => P(d.ev) <= P(d.payout) + shown(d.ev) + shown(d.payout) + EPS,
      breaks: (_p, d) => ({ ...d, ev: d.payout * 2 }) },
  ],
  "ev-variance/median-of-three": [
    { says: "Solve: the ticket value recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, r9((p.rate * (p.sectors + 1)) / 2)),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "The midpoint is the centre of the wheel, strictly inside the extreme faces",
      holds: (p, d) => same(d.mid, r9((p.sectors + 1) / 2)) && P(d.mid) > 1 && P(d.mid) < p.sectors,
      breaks: (p, d) => ({ ...d, mid: p.sectors + 5 }) },
    { says: "The ticket pays the rate on that midpoint — the rate is not left out and not applied twice",
      holds: (p, d) => same(d.ev, r9(p.rate * d.mid)),
      breaks: (_p, d) => ({ ...d, ev: d.mid }) },
    { says: "Sanity: the ticket is worth more than the worst face pays and less than the best",
      holds: (p, d) => P(d.ev) > p.rate && P(d.ev) < P(p.rate * p.sectors),
      breaks: (p, d) => ({ ...d, ev: p.rate * p.sectors * 2 }) },
  ],
  "ev-variance/chord-crossings": [
    { says: "Solve: expected payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.bounty * ((p.chords * (p.chords - 1)) / 2)) / 3),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Every crossing belongs to exactly one pair of chords",
      holds: (p, d) => d.pairs === (p.chords * (p.chords - 1)) / 2,
      breaks: (_p, d) => ({ ...d, pairs: d.pairs + 1 }) },
    { says: "Sanity: only a third of the pairs cross, so the payment falls short of paying every pair",
      holds: (p, d) => P(d.ev) < P(p.bounty * d.pairs),
      breaks: (p, d) => ({ ...d, ev: p.bounty * d.pairs * 2 }) },
  ],
  "ev-variance/spread-of-three-spins": [
    { says: "Solve: expected payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.rate * (p.sectors * p.sectors - 1)) / (2 * p.sectors)),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Relabelling the spinner swaps largest with smallest, so the two sit symmetrically about the midpoint",
      holds: (p, d) => Math.abs(P(d.meanMax) + P(d.meanMin) - (p.sectors + 1)) <= shown(d.meanMax) + shown(d.meanMin) + EPS,
      breaks: (_p, d) => ({ ...d, meanMax: d.meanMax + 1 }) },
    { says: "The expected gap is the expected largest minus the expected smallest",
      holds: (_p, d) => same(d.meanRange, d.meanMax - d.meanMin),
      breaks: (_p, d) => ({ ...d, meanRange: d.meanRange * 1.1 }) },
    { says: "Sanity: the expected gap comes in below the widest gap the spinner allows",
      holds: (_p, d) => P(d.meanRange) < P(d.maxGap),
      breaks: (_p, d) => ({ ...d, meanRange: d.maxGap + 1 }) },
  ],
  "ev-variance/local-maxima": [
    { says: "Solve: expected payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.bounty * (p.days - 2)) / 3),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Only the interior days can be swing highs, the two ends having one neighbour each",
      holds: (p, d) => d.interior === p.days - 2,
      breaks: (_p, d) => ({ ...d, interior: d.interior + 2 }) },
    { says: "Sanity: a third of the interior days peak, so the payment falls short of paying every interior day",
      holds: (p, d) => P(d.ev) < P(p.bounty * d.interior),
      breaks: (p, d) => ({ ...d, ev: p.bounty * d.interior * 2 }) },
  ],
  "ev-variance/covariance-sum-difference": [
    { says: "Solve: the covariance recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.cov, (p.facesA * p.facesA - p.facesB * p.facesB) / 12),
      breaks: (_p, d) => ({ ...d, cov: d.cov * 1.02 }) },
    { says: "The cross terms vanish, leaving the first variance minus the second",
      holds: (_p, d) => same(d.cov, d.varA - d.varB),
      breaks: (_p, d) => ({ ...d, cov: d.cov + 1 }) },
    { says: "A uniform whole number from one to m has variance m squared less one, over twelve",
      holds: (p, d) => same(d.varA, (p.facesA * p.facesA - 1) / 12),
      breaks: (_p, d) => ({ ...d, varA: d.varA * 1.1 }) },
    { says: "Sanity: the sign follows whichever counter carries more faces",
      holds: (p, d) => (d.cov > 0) === (p.facesA > p.facesB),
      breaks: (_p, d) => ({ ...d, cov: -d.cov }) },
  ],
  "distributions/max-serial-draw": [
    { says: "Solve: the expected largest tag recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.answer, (p.picked * (p.stock + 1)) / (p.picked + 1)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The sampled tags cut the unsampled ones into one more stretch than there are picks",
      holds: (p, d) => d.gaps === p.picked + 1,
      breaks: (_p, d) => ({ ...d, gaps: d.gaps + 1 }) },
    { says: "The largest tag is the stock less whatever sits above it",
      holds: (p, d) => Math.abs(P(d.answer) + P(d.topGap) - p.stock) <= shown(d.answer) + shown(d.topGap) + EPS,
      breaks: (_p, d) => ({ ...d, topGap: d.topGap + 1 }) },
    { says: "Sanity: more picks push the expected maximum towards the stock without reaching it",
      holds: (p, d) => P(d.answer) < p.stock,
      breaks: (p, d) => ({ ...d, answer: p.stock + 1 }) },
  ],
  "distributions/spare-chain-uptime": [
    { says: "Solve: expected earnings recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, p.earnings * p.units * p.meanLife),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Expectation adds over the chain, so the cell means add",
      holds: (p, d) => same(d.uptime, p.units * p.meanLife),
      breaks: (_p, d) => ({ ...d, uptime: d.uptime * 1.1 }) },
    { says: "Sanity: a chain of cells outlasts a single cell",
      holds: (p, d) => P(d.uptime) > p.meanLife,
      breaks: (_p, d) => ({ ...d, uptime: 0 }) },
  ],
  "distributions/first-contact-race": [
    { says: "Solve: expected email-first days recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, (p.days * p.emailRate) / (p.emailRate + p.callRate)),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "Superimposing the two streams adds their rates",
      holds: (p, d) => d.merged === p.emailRate + p.callRate,
      breaks: (_p, d) => ({ ...d, merged: d.merged + 1 }) },
    { says: "The first contact is an email with that stream's share of the total rate",
      holds: (p, d) => same(d.share, p.emailRate / d.merged),
      breaks: (_p, d) => ({ ...d, share: d.share * 1.1 }) },
    { says: "Sanity: an email cannot come first on more days than there are days",
      holds: (p, d) => P(d.ev) <= p.days + shown(d.ev) + EPS,
      breaks: (p, d) => ({ ...d, ev: p.days * 2 }) },
  ],
  "geometric/unit-square-product": [
    { says: "Solve: expected payment recomputed fresh from params matches the printed value",
      holds: (p, d) => same(d.ev, p.bounty * (p.threshold - p.threshold * Math.log(p.threshold))),
      breaks: (_p, d) => ({ ...d, ev: d.ev * 1.02 }) },
    { says: "The winning area is the free strip plus the hyperbolic tail",
      holds: (_p, d) => same(d.area, d.strip + d.curved),
      breaks: (_p, d) => ({ ...d, area: d.area * 1.05 }) },
    { says: "The strip is exactly the threshold, since the other coordinate is at most one",
      holds: (p, d) => same(d.strip, p.threshold),
      breaks: (_p, d) => ({ ...d, strip: d.strip * 1.1 }) },
    { says: "Sanity: the winning area beats the threshold itself and still never fills the board",
      holds: (p, d) => P(d.area) > p.threshold && P(d.area) < 1,
      breaks: (_p, d) => ({ ...d, area: 1.5 }) },
  ],
  "brainteasers/subtraction-game-last-wins": [
    { says: "Solve: the winner recomputed fresh from params matches the printed choice",
      holds: (p, d) => d.answer === (p.counters % (p.maxTake + 1) === 0 ? 2 : 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
    { says: "The remainder and the largest safe pile reconstruct the counters exactly",
      holds: (p, d) => same(d.lastSafe + d.rem, p.counters) && d.lastSafe % d.period === 0,
      breaks: (_p, d) => ({ ...d, lastSafe: d.lastSafe + d.period }) },
    { says: "Sanity: Bob wins exactly when the pile is already a multiple of the period",
      holds: (_p, d) => (d.answer === 2) === (d.rem === 0),
      breaks: (_p, d) => ({ ...d, rem: d.rem === 0 ? 1 : 0 }) },
    { says: "The period is one more than the cap, never the cap itself",
      holds: (p, d) => d.period === p.maxTake + 1,
      breaks: (_p, d) => ({ ...d, period: d.period + 1 }) },
  ],
  "brainteasers/subtraction-game-last-loses": [
    { says: "Solve: the winner recomputed fresh from params matches the printed choice",
      holds: (p, d) => d.answer === (p.counters % (p.maxTake + 1) === 1 ? 2 : 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
    { says: "Sanity: Bob wins exactly on the piles sitting one above a multiple of the period",
      holds: (_p, d) => (d.answer === 2) === (d.rem === 1),
      breaks: (_p, d) => ({ ...d, rem: d.rem === 1 ? 0 : 1 }) },
    { says: "The target square is always one above a multiple of the period, and never past the pile",
      // Stated unconditionally on purpose: an "if Alice can move" guard short-circuits to true
      // on any lost draw, and a claim that is vacuous on the draw the falsifier uses cannot be
      // made to fail — which the predicate self-test catches rather than tolerates.
      holds: (p, d) => d.target % d.period === 1 % d.period && d.target <= p.counters,
      breaks: (_p, d) => ({ ...d, target: d.target + 1 }) },
    { says: "Misere and normal play disagree on exactly the remainders zero and one",
      holds: (p, d) => (d.answer === (p.counters % d.period === 0 ? 2 : 1)) === !(d.rem === 0 || d.rem === 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
  ],
  "finance/book-overround-arbitrage": [
    { says: "Solve: the locked profit recomputed fresh from the odds matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.bank / (1 / p.o1 + 1 / p.o2 + 1 / p.o3) - p.bank)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The three implied prices are the reciprocals of the odds and add to the printed book",
      holds: (p, d) => same(d.p1, r9(1 / p.o1)) && same(d.p2, r9(1 / p.o2)) && same(d.p3, r9(1 / p.o3)) && same(r9(d.p1 + d.p2 + d.p3), d.book),
      breaks: (_p, d) => ({ ...d, book: d.book + 0.05 }) },
    { says: "Sanity: every branch returns the same payout, and the stakes exhaust the bank",
      holds: (p, d) => same(r9(d.stake1 * p.o1), d.payout) && same(r9(d.stake2 * p.o2), d.payout) && same(r9(d.stake3 * p.o3), d.payout) && same(r9(d.stake1 + d.stake2 + d.stake3), p.bank),
      breaks: (_p, d) => ({ ...d, stake1: d.stake1 * 2 }) },
    { says: "The arbitrage exists only because the book comes in under one, and the profit follows its shortfall",
      holds: (p, d) => P(d.book) < 1 && P(d.payout) > p.bank && P(d.answer) > 0,
      breaks: (_p, d) => ({ ...d, book: 1.2 }) },
  ],
  "finance/triangular-fx-arbitrage": [
    { says: "Solve: the closing balance recomputed fresh from the rates matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.start * p.r1 * p.r2 * p.r3)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The loop factor is the product of the three quoted rates",
      holds: (p, d) => same(d.factor, r9(p.r1 * p.r2 * p.r3)) && same(d.perDollar, r9(d.factor - 1)),
      breaks: (_p, d) => ({ ...d, factor: 1 / d.factor }) },
    { says: "Sanity: the closing balance is the starting balance scaled by the loop factor, and the loop is never fair",
      holds: (p, d) => same(d.answer, r9(p.start * d.factor)) && Math.abs(P(d.factor) - 1) >= 0.02,
      breaks: (_p, d) => ({ ...d, factor: 1 }) },
    { says: "A loop above one profits and a loop below one loses, by the same per-dollar amount either way",
      holds: (p, d) => (P(d.factor) > 1) === (P(d.answer) > p.start) && (P(d.factor) > 1) === (P(d.perDollar) > 0),
      breaks: (_p, d) => ({ ...d, perDollar: -d.perDollar }) },
  ],
  "finance/put-call-parity": [
    { says: "Solve: the put price recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.call - p.spot + p.strike * p.df)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The bond leg is the strike discounted, and it never exceeds the strike itself",
      holds: (p, d) => same(d.pvK, r9(p.strike * p.df)) && P(d.pvK) < p.strike,
      breaks: (p, d) => ({ ...d, pvK: p.strike * 1.1 }) },
    { says: "Sanity: the two time values differ by exactly the interest on the strike — NOT by zero",
      // The claim this replaces asserted they were equal, which is the textbook line for zero
      // rates and false for every draw here. The gate rejected it on all 6090.
      holds: (p, d) => same(r9(d.callTimeValue - d.putTimeValue), d.carry) && same(d.carry, r9(p.strike * (1 - p.df))) && P(d.carry) > 0,
      breaks: (_p, d) => ({ ...d, carry: d.carry * 2 }) },
    { says: "Both quoted prices are positive, and the call's intrinsic value never exceeds its price",
      holds: (p, d) => P(d.answer) > 0 && P(d.intrinsic) <= p.call,
      breaks: (_p, d) => ({ ...d, intrinsic: 1e6 }) },
  ],
  "finance/growing-perpetuity-value": [
    { says: "Solve: the valuation recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.cf / ((p.yieldPct - p.growthPct) / 100))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The printed gap is the required return less the growth rate, in whole percent and as a decimal",
      holds: (p, d) => d.spread === p.yieldPct - p.growthPct && same(d.spreadDec, r9(d.spread / 100)),
      breaks: (_p, d) => ({ ...d, spread: d.spread + 1 }) },
    { says: "Sanity: growth is worth something, so the growing stream is worth at least the flat one",
      holds: (p, d) => P(d.answer) >= P(d.flatValue) && same(d.flatValue, r9(p.cf / (p.yieldPct / 100))),
      nonVacuous: (p) => p.growthPct > 0,
      breaks: (_p, d) => ({ ...d, flatValue: d.flatValue * 3 }) },
    { says: "The series converges — the required return strictly beats the growth rate",
      holds: (p, d) => p.yieldPct > p.growthPct && d.spread > 0 && P(d.answer) > 0,
      breaks: (_p, d) => ({ ...d, spread: 0, answer: -1 }) },
  ],
  "finance/butterfly-max-profit": [
    { says: "Solve: the maximum profit recomputed fresh from the quotes matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.width - (p.cLow - 2 * p.cMid + p.cHigh))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The strikes are evenly spaced and the debit is the alternating sum of the three quotes",
      holds: (p, d) => d.k2 === p.k1 + p.width && d.k3 === d.k2 + p.width && same(d.debit, r9(p.cLow - 2 * p.cMid + p.cHigh)),
      breaks: (_p, d) => ({ ...d, k3: d.k3 + 1 }) },
    { says: "Sanity: the breakevens sit symmetrically about the middle strike, one debit inside each wing",
      holds: (p, d) => same(r9(d.breakevenLow - p.k1), d.debit) && same(r9(d.k3 - d.breakevenHigh), d.debit) && same(r9((d.breakevenLow + d.breakevenHigh) / 2), d.k2),
      breaks: (_p, d) => ({ ...d, breakevenHigh: d.breakevenHigh + 1 }) },
    { says: "The structure is paid for up front and still has room to profit",
      holds: (p, d) => P(d.debit) > 0 && P(d.answer) > 0 && P(d.debit) < p.width,
      breaks: (_p, d) => ({ ...d, debit: -1 }) },
  ],
  "finance/payment-stream-present-value": [
    { says: "Solve: the present value recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.pmt * (p.n === 3 ? p.df1 + r9(p.df1 - p.drop) + r9(p.df1 - 2 * p.drop) : p.df1 + r9(p.df1 - p.drop) + r9(p.df1 - 2 * p.drop) + r9(p.df1 - 3 * p.drop)))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The curve steps down one drop per year, so the later the date the cheaper the bond",
      holds: (p, d) => same(d.df2, r9(p.df1 - p.drop)) && same(d.df3, r9(p.df1 - 2 * p.drop)) && same(d.df4, r9(p.df1 - 3 * p.drop)) && P(d.df4) < P(d.df3) && P(d.df3) < P(d.df2) && P(d.df2) < p.df1,
      breaks: (p, d) => ({ ...d, df3: p.df1 }) },
    { says: "Only the dates that are paid on enter the sum — the fourth quote is real but idle at three years",
      holds: (p, d) => same(d.sumUsed, r9(p.n === 3 ? p.df1 + d.df2 + d.df3 : p.df1 + d.df2 + d.df3 + d.df4)) && P(d.sumUsed) < p.n,
      breaks: (_p, d) => ({ ...d, sumUsed: d.sumUsed * 1.05 }) },
    { says: "Sanity: every quote is below one, so the value comes in under the nominal total and the gap is what waiting costs",
      holds: (p, d) => same(d.nominal, r9(p.pmt * p.n)) && P(d.answer) < P(d.nominal) && same(d.timeCost, r9(d.nominal - d.answer)) && P(d.timeCost) > 0,
      breaks: (_p, d) => ({ ...d, timeCost: -d.timeCost }) },
  ],
  "finance/put-hedge-from-parity": [
    { says: "Solve: the share hedge recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.n * (1 - p.dc))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The put's delta is the call's less one, and it is negative on every draw",
      holds: (p, d) => same(d.putDelta, r9(p.dc - 1)) && P(d.putDelta) < 0,
      breaks: (_p, d) => ({ ...d, putDelta: 0.5 }) },
    { says: "Sanity: the put hedge and the call hedge add to one share per option — parity, not coincidence",
      holds: (p, d) => same(d.callHedge, r9(p.n * p.dc)) && same(r9(d.answer + d.callHedge), p.n),
      breaks: (_p, d) => ({ ...d, callHedge: d.callHedge * 2 }) },
    { says: "Each short put carries a positive share exposure of less than one share",
      holds: (p, d) => same(d.perPut, r9(1 - p.dc)) && P(d.perPut) > 0 && P(d.perPut) < 1,
      breaks: (_p, d) => ({ ...d, perPut: 2 }) },
  ],
  "finance/covered-call-max-profit": [
    { says: "Solve: the maximum profit recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.strike - p.spot + p.call)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The call is struck above where the share was bought, so being called away is itself a gain",
      holds: (p, d) => same(d.upside, r9(p.strike - p.spot)) && P(d.upside) > 0,
      breaks: (_p, d) => ({ ...d, upside: -1 }) },
    { says: "The best case beats the premium alone — the share contributes too",
      holds: (_p, d) => P(d.answer) > P(d.upside) && P(d.answer) > 0,
      breaks: (p, d) => ({ ...d, answer: p.call }) },
    { says: "Sanity: the cushion below is the premium, so the position turns loss-making below the share price less it",
      holds: (p, d) => same(d.breakeven, r9(p.spot - p.call)) && P(d.breakeven) < p.spot && P(d.breakeven) < p.strike,
      breaks: (p, d) => ({ ...d, breakeven: p.spot + p.call }) },
  ],
  "finance/call-lower-bound-arbitrage": [
    { says: "Solve: the riskless profit recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.spot - p.strike * p.df - p.call)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The bond leg is the strike discounted, so it costs less than the strike itself",
      holds: (p, d) => same(d.pvK, r9(p.strike * p.df)) && P(d.pvK) < p.strike,
      breaks: (p, d) => ({ ...d, pvK: p.strike * 1.1 }) },
    { says: "The quote sits strictly below the floor, and the profit is exactly that gap",
      holds: (p, d) => same(d.floor, r9(p.spot - d.pvK)) && P(d.floor) > p.call && same(d.answer, r9(d.floor - p.call)),
      breaks: (p, d) => ({ ...d, floor: p.call }) },
    { says: "Sanity: the discounted floor is strictly above intrinsic value — NOT equal to it, which is why intrinsic misses this arbitrage",
      holds: (p, d) => same(d.intrinsic, r9(Math.max(p.spot - p.strike, 0))) && P(d.floor) > P(d.intrinsic),
      breaks: (_p, d) => ({ ...d, intrinsic: 1e6 }) },
  ],
  "finance/box-spread-arbitrage": [
    { says: "Solve: the riskless profit recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.width * p.df - (p.callSpread + p.putSpread))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The box is bought for the two spreads together, and that cost is below the width it pays",
      holds: (p, d) => same(d.cost, r9(p.callSpread + p.putSpread)) && P(d.cost) < p.width,
      breaks: (p, d) => ({ ...d, cost: p.width + 1 }) },
    { says: "A certain payout is worth the width discounted — below the width, and above what the box cost",
      holds: (p, d) => same(d.fairValue, r9(p.width * p.df)) && P(d.fairValue) < p.width && P(d.fairValue) > P(d.cost),
      breaks: (_p, d) => ({ ...d, fairValue: d.cost / 2 }) },
    { says: "The upper strike is the lower one plus the width, so the two spreads really do span it",
      holds: (p, d) => d.k2 === p.k1 + p.width && P(d.k2) > p.k1,
      breaks: (p, d) => ({ ...d, k2: p.k1 }) },
  ],
  "statistics/adjusted-r-squared-from-sums": [
    { says: "Solve: the adjusted figure recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(1 - (p.sse / (p.ssr + p.sse)) * ((p.n - 1) / (p.n - p.k - 1)))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The two sums partition the total, so the explained and unexplained shares add to one",
      holds: (p, d) => d.sst === p.ssr + p.sse && same(d.r2, r9(p.ssr / d.sst)) && same(r9(d.r2 + d.unexplained), 1),
      breaks: (_p, d) => ({ ...d, unexplained: d.unexplained * 2 }) },
    { says: "Sanity: the adjusted figure comes in strictly BELOW the plain one, as printed, on every draw",
      holds: (_p, d) => P(d.answer) < P(d.r2),
      breaks: (_p, d) => ({ ...d, answer: d.r2 }) },
    { says: "The residual degrees of freedom are the count less the regressors and the intercept, and fewer than the total's",
      holds: (p, d) => d.dfRes === p.n - p.k - 1 && d.dfTot === p.n - 1 && d.dfRes < d.dfTot && d.dfRes >= 1,
      breaks: (_p, d) => ({ ...d, dfRes: d.dfTot }) },
  ],
  "statistics/duplicated-sample-slope-variance": [
    { says: "Solve: the doubled-sample slope variance recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.s2 / (2 * p.sxx))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The printed answer is exactly half the printed variance before duplication",
      holds: (p, d) => same(d.varBefore, r9(p.s2 / p.sxx)) && same(r9(2 * d.answer), d.varBefore),
      breaks: (_p, d) => ({ ...d, varBefore: d.answer }) },
    { says: "Duplicating doubles both the row count and the predictor's spread, and the answer re-derives through the new spread",
      holds: (p, d) => d.sxxNew === 2 * p.sxx && d.rowsNew === 2 * p.n && same(r9(d.answer * d.sxxNew), p.s2),
      breaks: (p, d) => ({ ...d, sxxNew: p.sxx }) },
    { says: "The variance stays positive and inside the window the emitter can print",
      holds: (_p, d) => P(d.answer) > 0 && Math.abs(d.answer) > 1e-6,
      breaks: (_p, d) => ({ ...d, answer: -d.answer }) },
  ],
  "statistics/overlapping-window-sums": [
    { says: "Solve: the variance of the summed windows recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, p.v * (p.a + p.b + 2 * p.ov)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Each window's own variance is its length times the daily variance, and the shared days are fewer than either window",
      holds: (p, d) => d.varX === p.v * p.a && d.varY === p.v * p.b && d.cov === p.v * p.ov && P(d.cov) < P(d.varX) && P(d.cov) < P(d.varY),
      breaks: (_p, d) => ({ ...d, cov: d.varX }) },
    { says: "The covariance enters the total exactly twice",
      holds: (_p, d) => d.crossTerm === 2 * d.cov && same(d.answer, r9(d.varX + d.varY + d.crossTerm)),
      breaks: (_p, d) => ({ ...d, crossTerm: d.cov }) },
    { says: "Sanity: overlapping windows are strictly riskier than disjoint ones of the same lengths",
      holds: (_p, d) => P(d.answer) > P(d.varX + d.varY),
      breaks: (_p, d) => ({ ...d, answer: d.varX + d.varY }) },
  ],
  "statistics/reverse-regression-slope": [
    { says: "Solve: the reverse slope recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9((p.rho * p.rho) / p.byx)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The squared correlation is the correlation times itself and stays strictly inside zero and one",
      holds: (p, d) => same(d.r2, r9(p.rho * p.rho)) && P(d.r2) > 0 && P(d.r2) < 1,
      breaks: (_p, d) => ({ ...d, r2: 2 }) },
    { says: "The two slopes multiply to the squared correlation — the relation the answer is read off",
      holds: (p, d) => same(r9(p.byx * d.answer), d.r2),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.5 }) },
    { says: "Sanity: the reverse slope is strictly below the reciprocal of the forward one, as printed",
      holds: (p, d) => same(d.reciprocal, r9(1 / p.byx)) && P(d.answer) < P(d.reciprocal),
      breaks: (_p, d) => ({ ...d, reciprocal: d.answer / 2 }) },
  ],
  "statistics/sample-size-for-margin": [
    { says: "Solve: the required count recomputed fresh from params matches the printed answer",
      holds: (p, d) => d.answer === Math.ceil(r9(((d.z * p.sd) / p.margin) ** 2)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The multiplier printed is the one that belongs to the confidence level printed",
      holds: (p, d) => d.z === (p.conf === 90 ? 1.645 : p.conf === 95 ? 1.96 : 2.576) && same(d.zsd, r9(d.z * p.sd)),
      breaks: (_p, d) => ({ ...d, z: 1 }) },
    { says: "The answer is the ceiling of the exact requirement — at least it, and by less than one whole measurement",
      holds: (p, d) => same(d.raw, r9(((d.z * p.sd) / p.margin) ** 2)) && d.answer >= d.raw && d.answer - d.raw < 1,
      breaks: (_p, d) => ({ ...d, answer: d.answer + 5 }) },
    { says: "Sanity: halving the margin costs four times the measurements, not twice",
      holds: (p, d) => same(r9(((d.z * p.sd) / (p.margin / 2)) ** 2), r9(4 * d.raw)),
      breaks: (_p, d) => ({ ...d, raw: d.raw * 2 }) },
  ],
  "statistics/portfolio-variance-two-asset": [
    { says: "Solve: the variance recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.w ** 2 * p.varA + (1 - p.w) ** 2 * p.varB + 2 * p.w * (1 - p.w) * p.cov)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The three printed terms add back to the answer, and the weights add to one",
      holds: (p, d) => same(r9(d.termA + d.termB + d.cross), d.answer) && same(r9(p.w + d.wB), 1),
      breaks: (_p, d) => ({ ...d, cross: d.cross + 1 }) },
    { says: "Sanity: dropping the cross term misses by exactly the cross term, in the direction of its sign",
      holds: (_p, d) => same(r9(d.answer - d.noCross), d.cross) && (d.cross < 0 ? P(d.answer) < P(d.noCross) : P(d.answer) > P(d.noCross)),
      nonVacuous: (p) => p.cov < 0,   // a hedged book, where the naive sum overstates the risk
      breaks: (_p, d) => ({ ...d, noCross: d.noCross + 2 * d.cross }) },
    { says: "The covariance matrix is a legal one, so the implied correlation stays inside its range and the variance is positive",
      holds: (_p, d) => Math.abs(d.rho) < 1 && d.answer > 0,
      breaks: (_p, d) => ({ ...d, rho: 1.5 }) },
  ],
  "statistics/min-variance-weight": [
    { says: "Solve: the minimising weight recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9((p.varB - p.cov) / (p.varA + p.varB - 2 * p.cov))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The printed numerator and denominator are the ones the ratio is taken over",
      holds: (p, d) => d.num === p.varB - p.cov && d.den === p.varA + p.varB - d.twoCov && d.twoCov === 2 * p.cov,
      breaks: (_p, d) => ({ ...d, den: d.den + 1 }) },
    { says: "Sanity: the minimum beats both single-asset books, and the two weights add to one",
      holds: (p, d) => P(d.minVar) < P(p.varA) && P(d.minVar) < P(p.varB) && same(r9(d.answer + d.other), 1),
      breaks: (p, d) => ({ ...d, minVar: p.varA }) },
    { says: "The weight is an interior split — both legs are held long",
      holds: (_p, d) => d.answer > 0 && d.answer < 1 && d.other > 0,
      breaks: (_p, d) => ({ ...d, answer: 1.4, other: -0.4 }) },
  ],
  "statistics/correlation-bound-third-pair": [
    { says: "Solve: the bound recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9(p.rhoXY * p.rhoYZ + (p.want === 1 ? 1 : -1) * Math.sqrt((1 - p.rhoXY ** 2) * (1 - p.rhoYZ ** 2)))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The interval is centred on the product of the two given correlations, with the residual product as its half-width",
      holds: (_p, d) => same(r9(d.upper - d.lower), r9(2 * d.spread)) && same(r9((d.upper + d.lower) / 2), d.prod),
      breaks: (_p, d) => ({ ...d, upper: d.upper + 0.1 }) },
    { says: "Sanity: the interval never escapes the range a correlation is allowed",
      holds: (_p, d) => P(d.lower) >= -1 && P(d.upper) <= 1,
      breaks: (_p, d) => ({ ...d, upper: 1.3 }) },
    { says: "Each residual variance is one less the squared correlation, and both stay positive",
      holds: (p, d) => same(d.residXY, r9(1 - p.rhoXY ** 2)) && same(d.residYZ, r9(1 - p.rhoYZ ** 2)) && d.residXY > 0 && d.residYZ > 0,
      breaks: (_p, d) => ({ ...d, residXY: d.residXY + 0.1 }) },
  ],
  "statistics/regression-slope-from-moments": [
    { says: "Solve: the slope recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9((p.rho * p.sdY) / p.sdX)),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The slope is the correlation times the ratio of spreads, Y's over X's",
      holds: (p, d) => same(d.ratio, r9(p.sdY / p.sdX)) && same(d.answer, r9(p.rho * d.ratio)),
      breaks: (_p, d) => ({ ...d, ratio: 1 / d.ratio }) },
    { says: "Sanity: the two regressions are not reciprocals — their slopes multiply to the squared correlation",
      holds: (p, d) => same(r9(d.answer * d.reverseSlope), d.r2) && same(d.r2, r9(p.rho ** 2)),
      breaks: (_p, d) => ({ ...d, reverseSlope: 1 / d.answer }) },
    { says: "Explained and unexplained shares of variance add to the whole",
      holds: (_p, d) => same(r9(d.r2 + d.unexplained), 1) && d.r2 >= 0 && d.r2 <= 1,
      breaks: (_p, d) => ({ ...d, unexplained: d.unexplained + 0.1 }) },
  ],
  "statistics/sharpe-time-scaling": [
    { says: "Solve: the horizon Sharpe recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9((p.edge / p.sd) * Math.sqrt(p.periods))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "Total edge over total standard deviation is the same ratio the answer states",
      holds: (p, d) => same(r9(d.totalEdge / d.totalSd), d.answer) && d.totalEdge === p.edge * p.periods,
      breaks: (_p, d) => ({ ...d, totalSd: d.totalSd * 2 }) },
    { says: "Sanity: the horizon Sharpe beats the per-day Sharpe, by the square root of the horizon and no more",
      holds: (p, d) => P(d.answer) > P(d.perDay) && same(d.answer, r9(d.perDay * d.root)) && same(d.root, r9(Math.sqrt(p.periods))),
      breaks: (_p, d) => ({ ...d, root: d.root * d.root }) },
    { says: "Variance scales with the horizon while the deviation scales with its square root",
      holds: (p, d) => same(d.totalVar, p.sd ** 2 * p.periods) && same(d.totalSd, r9(Math.sqrt(d.totalVar))),
      breaks: (_p, d) => ({ ...d, totalSd: d.totalVar }) },
  ],
  "brainteasers/painted-block-one-face": [
    { says: "Solve: the one-face count recomputed fresh from the dimensions matches the printed answer",
      holds: (p, d) => d.answer === 2 * ((p.a - 2) * (p.b - 2) + (p.a - 2) * (p.c - 2) + (p.b - 2) * (p.c - 2)),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 2 }) },
    { says: "Each side's interior is the dimension less two in both directions",
      holds: (p, d) => d.ia === p.a - 2 && d.ib === p.b - 2 && d.ic === p.c - 2 && d.faceAB === d.ia * d.ib,
      breaks: (_p, d) => ({ ...d, ia: d.ia + 1 }) },
    { says: "Sanity: the one-face and no-face cubes together fall short of the block, the rest being edges and corners",
      holds: (p, d) => d.total === p.a * p.b * p.c && d.hidden === d.ia * d.ib * d.ic && d.answer + d.hidden < d.total,
      breaks: (_p, d) => ({ ...d, hidden: d.total }) },
    { says: "The six sides pair up, so the count is exactly twice the three distinct panels",
      holds: (_p, d) => d.answer === 2 * d.panelSum && d.panelSum === d.faceAB + d.faceAC + d.faceBC,
      breaks: (_p, d) => ({ ...d, panelSum: d.panelSum + 1 }) },
  ],
  "brainteasers/divisor-count-factorisation": [
    { says: "Solve: the divisor count recomputed fresh from the exponents matches the printed answer",
      holds: (p, d) => d.answer === (p.a + 1) * (p.b + 1) * (p.c + 1) * (p.d + 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "The printed number really is the product of the four prime powers",
      holds: (p, d) => d.n === 2 ** p.a * 3 ** p.b * 5 ** p.c * 7 ** p.d,
      breaks: (_p, d) => ({ ...d, n: d.n * 2 }) },
    { says: "Sanity: each exponent contributes one MORE choice than its own value, since taking none is allowed",
      holds: (p, d) => d.ea === p.a + 1 && d.eb === p.b + 1 && d.ec === p.c + 1 && d.ed === p.d + 1 && d.answer > p.a * p.b * p.c * p.d,
      breaks: (_p, d) => ({ ...d, ea: d.ea - 1 }) },
    { says: "The count covers both ends — one and the number itself are among the divisors",
      holds: (p, d) => d.answer >= 2 && d.n % 1 === 0 && d.answer === d.ea * d.eb * d.ec * d.ed,
      breaks: (_p, d) => ({ ...d, ed: d.ed + 1 }) },
  ],
  "brainteasers/average-speed-round-trip": [
    { says: "Solve: the average speed recomputed fresh from the two legs matches the printed answer",
      holds: (p, d) => same(d.answer, r9((2 * p.v1 * p.v2) / (p.v1 + p.v2))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The printed numerator and denominator are twice the product and the sum",
      holds: (p, d) => d.num === 2 * p.v1 * p.v2 && d.den === p.v1 + p.v2 && d.twiceDist === 2 * p.dist,
      breaks: (_p, d) => ({ ...d, den: d.den + 1 }) },
    { says: "Sanity: the answer sits below the straight average and above the slower leg",
      holds: (p, d) => P(d.answer) < P(d.arithmeticMean) && P(d.answer) > p.v1 && P(d.answer) < p.v2,
      breaks: (_p, d) => ({ ...d, answer: d.arithmeticMean }) },
    { says: "The distance cancels — the answer depends on the two speeds alone",
      holds: (p, d) => same(d.answer, r9((2 * (p.v1 * p.v2)) / (p.v1 + p.v2))) && same(d.arithmeticMean, r9((p.v1 + p.v2) / 2)),
      breaks: (p, d) => ({ ...d, answer: d.answer * (p.dist / 100) }) },
  ],
  "brainteasers/bird-between-trains": [
    { says: "Solve: the distance flown recomputed fresh from params matches the printed answer",
      holds: (p, d) => same(d.answer, r9((p.vb * p.d) / (p.v1 + p.v2))),
      breaks: (_p, d) => ({ ...d, answer: d.answer * 1.02 }) },
    { says: "The closing rate is the sum of the train speeds, and the meeting time follows from it",
      holds: (p, d) => d.closing === p.v1 + p.v2 && same(d.hours, r9(p.d / d.closing)),
      breaks: (_p, d) => ({ ...d, closing: d.closing + 1 }) },
    { says: "Sanity: the bird outflies both trains, since it is faster and airborne the whole time",
      holds: (p, d) => P(d.answer) > P(r9(p.v1 * d.hours)) && P(d.answer) > P(r9(p.v2 * d.hours)),
      breaks: (p, d) => ({ ...d, answer: p.v1 * d.hours }) },
    { says: "The first leg alone is shorter than the whole flight — the series route would have more to add",
      holds: (p, d) => P(d.firstLeg) < P(d.answer) && same(d.firstLeg, r9((p.vb * p.d) / (p.vb + p.v2))),
      breaks: (_p, d) => ({ ...d, firstLeg: d.answer * 2 }) },
  ],
  "brainteasers/chocolate-bar-breaks": [
    { says: "Solve: the winner recomputed fresh from params matches the printed choice",
      holds: (p, d) => d.answer === ((p.rows * p.cols - p.pieces) % 2 === 1 ? 1 : 2),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
    { says: "The snap count is the square total less the pieces already on the table",
      holds: (p, d) => same(d.snaps, d.squares - p.pieces) && d.squares === p.rows * p.cols,
      breaks: (_p, d) => ({ ...d, snaps: d.snaps + 1 }) },
    { says: "Sanity: Alice wins exactly when an odd number of snaps remain",
      holds: (_p, d) => (d.answer === 1) === (d.snaps % 2 === 1),
      breaks: (_p, d) => ({ ...d, snaps: d.snaps + 1 }) },
    { says: "Every snap adds exactly one piece, so pieces plus snaps is the square total and a move always exists",
      holds: (p, d) => d.snaps + p.pieces === d.squares && d.snaps >= 1,
      breaks: (_p, d) => ({ ...d, squares: d.squares + 1 }) },
  ],
  "brainteasers/mutilated-board-tiling": [
    { says: "Solve: the verdict recomputed fresh from the two coordinates matches the printed choice",
      holds: (p, d) => d.answer === (((p.r1 + p.c1) % 2 !== (p.r2 + p.c2) % 2) ? 1 : 2),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
    { says: "The two colour counts add back to the squares left after the cuts",
      holds: (_p, d) => d.darkLeft + d.lightLeft === d.remaining && d.remaining === d.squares - 2,
      breaks: (_p, d) => ({ ...d, darkLeft: d.darkLeft + 1 }) },
    { says: "Sanity: a covering exists exactly when the two colour counts are equal",
      holds: (_p, d) => (d.answer === 1) === (d.darkLeft === d.lightLeft),
      breaks: (_p, d) => ({ ...d, darkLeft: d.darkLeft + 2 }) },
    { says: "Two same-coloured cuts leave the counts two apart, never one — a domino takes one of each",
      holds: (_p, d) => Math.abs(d.darkLeft - d.lightLeft) === (d.answer === 1 ? 0 : 2),
      breaks: (_p, d) => ({ ...d, darkLeft: d.darkLeft + 1 }) },
  ],
  "brainteasers/josephus-every-second": [
    { says: "Solve: the survivor recomputed fresh from params matches the printed badge",
      holds: (p, d) => d.answer === p.first + 2 * (p.n - 2 ** Math.floor(Math.log2(p.n))),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 2 }) },
    { says: "The power of two and the excess reconstruct the ring, and the power is the largest one under it",
      holds: (p, d) => d.power + d.excess === p.n && d.power <= p.n && 2 * d.power > p.n,
      breaks: (_p, d) => ({ ...d, power: d.power / 2 }) },
    { says: "Sanity: the survivor shares the starting badge's parity and never runs past the last badge",
      holds: (p, d) => (d.answer - p.first) % 2 === 0 && d.answer <= d.last && d.answer >= p.first,
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "Twice the excess is what the count eats before it settles, and it stays inside the ring",
      holds: (p, d) => d.twiceExcess === 2 * d.excess && d.twiceExcess < p.n,
      breaks: (p, d) => ({ ...d, twiceExcess: p.n }) },
  ],
  "brainteasers/coin-row-take-ends": [
    { says: "Solve: the guaranteed total recomputed fresh from the row matches the printed answer",
      holds: (p, d) => {
        let odd = 0, even = 0;
        for (let i = 0; i < p.n; i++) (i % 2 === 0 ? (odd += p.v + i * p.d) : (even += p.v + i * p.d));
        return d.answer === Math.max(odd, even);
      },
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "The two position classes add back to the whole row",
      holds: (p, d) => same(d.odd + d.even, d.total) && same(d.total, (p.n / 2) * (2 * p.v + (p.n - 1) * p.d)),
      breaks: (_p, d) => ({ ...d, odd: d.odd * 1.05 }) },
    { says: "Sanity: Alice takes the heavier class, so she never ends below half the row",
      holds: (_p, d) => d.answer === Math.max(d.odd, d.even) && 2 * d.answer >= d.total,
      breaks: (_p, d) => ({ ...d, answer: Math.min(d.odd, d.even) }) },
    { says: "The gap between the classes is the step size times the number of pairs",
      holds: (p, d) => d.gap === Math.abs(p.d) * d.half && d.half === p.n / 2,
      breaks: (_p, d) => ({ ...d, gap: d.gap + 1 }) },
  ],
  "brainteasers/nim-three-pile-move": [
    { says: "Solve: the move recomputed fresh from the piles matches the printed count",
      holds: (p, d) => d.answer === p.big - (p.mid ^ p.small),
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "The balance point sits below the largest pile, so the move is legal and takes at least one counter",
      holds: (p, d) => d.balance < p.big && d.answer >= 1 && d.answer === p.big - d.balance,
      breaks: (p, d) => ({ ...d, balance: p.big + 1 }) },
    { says: "Sanity: after the move the three piles balance column by column",
      holds: (p, d) => (((p.big - d.answer) ^ p.mid) ^ p.small) === 0,
      breaks: (_p, d) => ({ ...d, answer: d.answer + 1 }) },
    { says: "The printed binary renderings really are the piles written in base two",
      holds: (p, d) => d.binBig === Number(p.big.toString(2)) && d.binBalance === Number(d.balance.toString(2)),
      breaks: (_p, d) => ({ ...d, binBig: d.binBig + 1 }) },
  ],
  "brainteasers/two-pile-nim": [
    { says: "Solve: the winner recomputed fresh from params matches the printed choice",
      holds: (p, d) => d.answer === (p.base === p.base + p.offset ? 2 : 1),
      breaks: (_p, d) => ({ ...d, answer: d.answer === 1 ? 2 : 1 }) },
    { says: "Sanity: Bob wins exactly when the two piles are already balanced",
      holds: (_p, d) => (d.answer === 2) === (d.gap === 0),
      breaks: (_p, d) => ({ ...d, gap: d.gap === 0 ? 1 : 0 }) },
    { says: "The gap is the difference of the piles and the total is their sum",
      holds: (p, d) => same(d.gap, d.larger - d.smaller) && same(d.total, p.base + d.other),
      breaks: (_p, d) => ({ ...d, gap: d.gap + 1 }) },
    { says: "A balanced position always carries an even total",
      holds: (_p, d) => d.gap !== 0 || d.total % 2 === 0,
      breaks: (_p, d) => ({ ...d, gap: 0, total: d.total % 2 === 0 ? d.total + 1 : d.total }) },
  ],
};

const firstLegalDraw = (t: ProblemTemplate) => {
  let first: Params | null = null;
  forEachLegalDraw(t, (p) => { first ??= p; });
  return first!;
};

describe("prose claims hold on every legal draw", () => {
  for (const [slug, claims] of Object.entries(CLAIMS)) {
    it(`${slug} — ${claims.length} claims`, () => {
      const t = byId.get(slug) as ProblemTemplate;
      expect(t, `no template registered for ${slug}`).toBeDefined();
      const failed = claims.map(() => 0);
      const covered = claims.map(() => 0);
      let draws = 0;
      forEachLegalDraw(t, (p) => {
        draws++;
        const d = t.derived(p);
        claims.forEach((c, i) => {
          if (!c.holds(p, d)) failed[i]++;
          if (c.nonVacuous?.(p, d)) covered[i]++;
        });
      });
      expect(draws).toBeGreaterThan(0);
      claims.forEach((c, i) => {
        expect(failed[i], `${slug} / ${c.says} — failing draws of ${draws}`).toBe(c.exceptions ?? 0);
        if (c.nonVacuous) expect(covered[i], `${slug} / ${c.says} — never exercised, so it proves nothing`).toBeGreaterThan(0);
      });
    });
  }
});

describe("the prose-claim predicates fail when they should", () => {
  it("every claim's own falsifier makes it false, and the sound draw makes it true", () => {
    for (const [slug, claims] of Object.entries(CLAIMS)) {
      const t = byId.get(slug) as ProblemTemplate;
      const p = firstLegalDraw(t);
      const d = t.derived(p);
      for (const c of claims) {
        expect(c.holds(p, d), `${slug} / ${c.says} — rejects a sound draw`).toBe(true);
        expect(c.holds(p, c.breaks(p, d)), `${slug} / ${c.says} — cannot be made to fail`).toBe(false);
      }
    }
  });

  it("a wrong answer is caught on every template — 2 percent off, or the wrong option", () => {
    // End-to-end: not "some predicate somewhere fails", but every template detects a wrong
    // answer through at least one of its own claims. A template that survives this has
    // claims that never touch what it is actually asked for.
    const undetected: string[] = [];
    for (const [slug, claims] of Object.entries(CLAIMS)) {
      const t = byId.get(slug) as ProblemTemplate;
      const p = firstLegalDraw(t);
      const d = t.derived(p);
      // A choice answer is a 1-based index, and scaling an index by 1.02 is not a wrong
      // answer — it is a nonsense one. The real mutation for those is picking a DIFFERENT
      // legal option, which is exactly the mistake a student makes.
      const bent = t.choices
        ? { ...d, [t.answerKey]: (d[t.answerKey] % t.choices.length) + 1 }
        : { ...d, [t.answerKey]: d[t.answerKey] * 1.02 };
      if (!claims.some((c) => !c.holds(p, bent))) undetected.push(`${slug} (${t.answerKey})`);
    }
    expect(undetected, "a 2% wrong answer passes every claim on these templates").toEqual([]);
  });

  it("covers every ev-variance/distributions template, with no claim left unstated", () => {
    const CLAIMED_TOPICS = ["probability/ev-variance", "probability/distributions", "probability/ruin", "probability/geometric", "probability/markov", "probability/symmetry", "brainteasers/logic", "statistics/moments", "finance/pricing"];
    const shipped = PROBLEMS.filter((t) => CLAIMED_TOPICS.includes(t.topic)).map((t) => t.id).sort();
    expect(Object.keys(CLAIMS).sort()).toEqual(shipped);
    for (const [slug, claims] of Object.entries(CLAIMS))
      expect(claims.length, `${slug} has too few claims to cover its prose`).toBeGreaterThanOrEqual(3);
  });
});
