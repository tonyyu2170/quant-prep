import { describe, expect, it } from "vitest";
import { fmtNum, type Derived, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from "./index";
import { forEachLegalDraw } from "./draw-space.test";

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
  "two-outcome-bet": [
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
  "die-payoff-table": [
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
  "raffle-fair-price": [
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
  "sum-of-two-draws": [
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
  "labeled-tickets-draw": [
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
  "profit-net-of-cost": [
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
  "binomial-mean": [
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
  "indicator-match-count": [
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
  "two-outcome-variance": [
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
  "spinner-pmf-variance": [
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
  "affine-scaling-sd": [
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
  "push-branch-bet": [
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
  "sum-of-bets-variance": [
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
  "urn-choice-total-expectation": [
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
  "max-of-two-dice": [
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
  "one-optional-reroll": [
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
  "geometric-waiting-time": [
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
  "hypergeometric-mean": [
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
  "capped-payoff": [
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
  "insurance-break-even-premium": [
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

  "distinct-types-collected": [
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
  "binomial-variance": [
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
  "equal-ev-sd-comparison": [
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

  "conditional-expectation-given-event": [
    { says: "Sanity: putting the forbidden combinations back recovers the untouched pair average",
      holds: (p, d) => d.totalLow + d.totalGood === d.totalAll && d.plainPoints === p.faces + 1
        && Math.abs((d.totalLow + d.totalGood) / d.pairs - d.plainPoints) < EPS,
      breaks: (_p, d) => ({ ...d, totalGood: d.totalGood + d.pairs }) },
    { says: "Sanity: the payout can only have moved up from the untouched figure, as printed",
      holds: (p, d) => same(p.rate * (p.faces + 1), d.evPlain) && P(d.evPlain) < P(d.ev),
      breaks: (_p, d) => ({ ...d, ev: d.evPlain }) },
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
  "matching-indicators-variance": [
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
  "pattern-waiting-hh-ht": [
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
};

const templateFor = (slug: string) =>
  PROBLEMS.find((t) => t.id === `ev-variance/${slug}`) as ProblemTemplate;
const firstLegalDraw = (t: ProblemTemplate) => {
  let first: Params | null = null;
  forEachLegalDraw(t, (p) => { first ??= p; });
  return first!;
};

describe("prose claims hold on every legal draw", () => {
  for (const [slug, claims] of Object.entries(CLAIMS)) {
    it(`${slug} — ${claims.length} claims`, () => {
      const t = templateFor(slug);
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
      const t = templateFor(slug);
      const p = firstLegalDraw(t);
      const d = t.derived(p);
      for (const c of claims) {
        expect(c.holds(p, d), `${slug} / ${c.says} — rejects a sound draw`).toBe(true);
        expect(c.holds(p, c.breaks(p, d)), `${slug} / ${c.says} — cannot be made to fail`).toBe(false);
      }
    }
  });

  it("a 2 percent error in the answer is caught on every template", () => {
    // End-to-end: not "some predicate somewhere fails", but every template detects a wrong
    // answer through at least one of its own claims. A template that survives this has
    // claims that never touch what it is actually asked for.
    const undetected: string[] = [];
    for (const [slug, claims] of Object.entries(CLAIMS)) {
      const t = templateFor(slug);
      const p = firstLegalDraw(t);
      const d = t.derived(p);
      const bent = { ...d, [t.answerKey]: d[t.answerKey] * 1.02 };
      if (!claims.some((c) => !c.holds(p, bent))) undetected.push(`${slug} (${t.answerKey})`);
    }
    expect(undetected, "a 2% wrong answer passes every claim on these templates").toEqual([]);
  });

  it("covers every ev-variance template, with no claim left unstated", () => {
    const shipped = PROBLEMS.filter((t) => t.topic === "probability/ev-variance")
      .map((t) => t.id.replace("ev-variance/", "")).sort();
    expect(Object.keys(CLAIMS).sort()).toEqual(shipped);
    for (const [slug, claims] of Object.entries(CLAIMS))
      expect(claims.length, `${slug} has too few claims to cover its prose`).toBeGreaterThanOrEqual(3);
  });
});
