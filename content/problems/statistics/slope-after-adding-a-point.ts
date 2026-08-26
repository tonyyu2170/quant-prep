import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The rank-one update is carried in CLEARED form. The honest algebra is
// (S_xy + w*dx*dy)/(S_xx + w*dx^2) with w = n/(n+1), but w does not terminate at n = 11
// (11/12 = 0.91666…) or n = 14, so printing it as a label and then multiplying by it would put
// a four-figure rendering in as an operand. Multiplying numerator and denominator by n+1
// instead leaves ((n+1)S_xy + n*dx*dy) / ((n+1)S_xx + n*dx^2) — every operand an exact integer,
// the quotient unchanged, and w never printed as a number at all. It is also how the
// arithmetic is actually done by hand. The alternative on offer was to thin `n` down to the
// values where n/(n+1) terminates, which would have cut the draw space to buy something the
// clearing gives for free.
//
// `params` lists EXACTLY the values `constraint` can admit, and that is a production
// requirement rather than tidiness. `drawParams` retries a rejected tuple 100 times and then
// THROWS (packages/engine/src/problem.ts:46), and neither caller catches it —
// components/ProblemRunner.tsx:41 draws inside a useMemo off a random nonce, and
// content/problems/market.ts:66 off an arbitrary rng seed. At the drafted grid this constraint
// admitted 812 of 15840 tuples, 5.13%, and threw on 1099 of 200000 arbitrary seeds: an uncaught
// render exception roughly one serve in two hundred, and by far the worst in the corpus. `n`
// never reached 24 and `dx` never reached 4, 5 or 6 on any legal draw, so dropping those from
// the grid leaves the legal set BIT-IDENTICAL — same 812 draws, same answers, same trap margins
// — while acceptance rises to 12.82% and the throw rate falls to 1 seed in 200000. No gate sees
// this: registry.test.ts uses 50 seeds, emit.ts uses 0-99, and `emittedSpread` seeds off an
// FNV hash of the id, so a rename would have been a coin flip on the suite.
//
// `constraint` is four conjuncts, measured over the 6336-tuple grid through the engine's own
// grade() — which compares with <=, and a trap sitting exactly on the tolerance boundary counts
// as a WIN, so a scratch harness using < undercounts by one:
//
//  * The MEAN-SHIFT GAP is how far the answer moves between w = 1 and w = n/(n+1) — that is,
//    how much the n/(n+1) factor is worth. Left ungated it is worth nothing on a fifth of the
//    space: a candidate who never notices that adding a point moves the two means grades
//    correct on 1368 of the 6336 tuples. Drop this conjunct alone and 410 of the 2350 draws
//    that survive grade that trap correct, along with 167 for a plain average of the old slope
//    and the new point's own. Keep it and every trap in the audit misses by at least 6.0
//    tolerances.
//  * The DENOMINATOR CORRECTION, dx^2/denom, is the same factor's effect on the predictor's
//    spread alone. It is what rejects the low-leverage dx values, and so it is the conjunct
//    that shaped the grid above — which is why, on that grid, dropping it now readmits 1019
//    draws and none of them grades a trap correct. It stays because the legal set is defined
//    by all four together and the whole trap audit was measured under them; and because it is
//    what guarantees the mean shift is visible in the predictor's spread on every draw served.
//  * |answer| >= 0.145 keeps the refitted slope off zero, where a rel tolerance is exact
//    equality in disguise; the numerator really does reach zero on this grid. It also removes
//    the last draw on which the half-application slip — weighting the cross-product but not the
//    sum of squares — still graded correct.
//  * exact4 is the guarantee, not the grid: b steps in fifths against a multiple of ten, so
//    every cross-product is a whole number today, and this fails loud if that changes.
//
// None of the three thresholds is landable. 0.145 sits between the reachable answers 0.14482759
// and 0.14634146 (0.15, 0.2 and 0.25 are all hit exactly, which is why none of them is used);
// no draw comes within 1e-12 of either 0.03 floor, the nearest being 1.8e-6 away.
//
// `dy` draws negative on three of eight choices, so every printed product parenthesises it —
// the emit tokenizer is sign-blind and the printed-precision reader cannot read "8--12".
export const slopeAfterAddingAPoint: ProblemTemplate = {
  id: "statistics/slope-after-adding-a-point",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the rank-one update to a least-squares slope, and what leverage buys a single point" },
  params: {
    n: { choices: [9, 11, 14, 19] },
    sxx: { choices: [100, 120, 150, 200, 240, 300] },
    b: { range: { min: 0.4, max: 2.4, step: 0.2 } },
    dx: { choices: [8, 10, 12] },
    dy: { choices: [-12, -8, -6, 6, 8, 12, 16, 20] },
  },
  constraint: (p) => {
    const w = p.n / (p.n + 1);
    const updated = (p.b * p.sxx + w * p.dx * p.dy) / (p.sxx + w * p.dx * p.dx);
    const unshifted = (p.b * p.sxx + p.dx * p.dy) / (p.sxx + p.dx * p.dx);
    const denom = (p.n + 1) * p.sxx + p.n * p.dx * p.dx;
    const answer = Math.round(((p.n + 1) * p.b * p.sxx + p.n * p.dx * p.dy) / denom * 1e9) / 1e9;
    return Math.abs(unshifted - updated) / Math.abs(updated) >= 0.03 &&
      (p.dx * p.dx) / denom >= 0.03 &&
      Math.abs(answer) >= 0.145 &&
      exact4(p.b * p.sxx) && Number.isInteger(Math.round(p.b * p.sxx * 1e9) / 1e9);
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const nPlus = p.n + 1;
    const sxy = round(p.b * p.sxx);
    const numer = round(nPlus * p.b * p.sxx + p.n * p.dx * p.dy);
    const denom = nPlus * p.sxx + p.n * p.dx * p.dx;
    return {
      nPlus,
      sxy,
      numer,
      denom,
      pointSlope: round(p.dy / p.dx),
      answer: round((nPlus * p.b * p.sxx + p.n * p.dx * p.dy) / denom),   // from the exact operands, not from `numer`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A dry-bulk shipping desk fits a least-squares line predicting the weekly change in a freight rate, in dollars per tonne, from the same week's change in the iron-ore price, also in dollars per tonne, over ${fmtNum(p.n)} weeks. The fitted slope is ${fmtNum(p.b)}, and the ore changes have a sum of squared deviations about their own mean, $S_{xx}$, of ${fmtNum(p.sxx)}. ` +
    `One more week is then observed: the ore change came in ${fmtNum(p.dx)} dollars above the mean of those ${fmtNum(p.n)} weeks and the freight change ${fmtNum(Math.abs(p.dy))} dollars ${p.dy > 0 ? "above" : "below"} theirs. Refitting over all ${fmtNum(d.nPlus)} weeks, what is the new slope?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "Adding a point moves the means as well as the sums", body: `The slope is $\\dfrac{S_{xy}}{S_{xx}}$, both sums taken about the sample means — and those means shift when the new observation lands. Work through that shift and the new point does not contribute its raw deviations $d_x$ and $d_y$ to the two sums but a fraction $w$ of each, with $w=\\dfrac{n}{n+1}$: part of its distance from the old mean is spent dragging the mean itself toward it. So the refitted slope is $\\dfrac{S_{xy}+wd_xd_y}{S_{xx}+wd_x^{2}}$, and both sums move, not just the top one.` },
      { title: "The cross-product the old fit implies", body: `The old slope was the old cross-product over the old sum of squares, so the cross-product is the slope times that sum: $${fmtNum(p.b)}\\times${fmtNum(p.sxx)}=${fmtNum(d.sxy)}$.` },
      { title: "Clear the fraction before doing any arithmetic", body: `Multiplying the top and the bottom of the ratio by ${fmtNum(d.nPlus)} turns every $w$ into a whole number and leaves the slope untouched. The numerator becomes $${fmtNum(d.nPlus)}\\times${fmtNum(d.sxy)}+${fmtNum(p.n)}\\times${fmtNum(p.dx)}\\times${paren(p.dy)}=${fmtNum(d.numer)}$.` },
      { title: "The same clearing on the bottom", body: `The predictor's spread gains the new point's squared deviation, carried at the same weight: $${fmtNum(d.nPlus)}\\times${fmtNum(p.sxx)}+${fmtNum(p.n)}\\times${fmtNum(p.dx)}^{2}=${fmtNum(d.denom)}$.` },
      { title: "Answer", body: `The refitted slope is the ratio of the two: $\\dfrac{${fmtNum(d.numer)}}{${fmtNum(d.denom)}}=${fmtNum(d.answer)}$ dollars of freight per dollar of ore. One week has taken the slope from ${fmtNum(p.b)} to ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `Read the ratio again and it is a weighted average of two slopes: the old one, carrying weight $S_{xx}$, and the new point's own slope $\\dfrac{d_y}{d_x}$ — here ${fmtNum(d.pointSlope)} — carrying weight $wd_x^{2}$. The answer therefore always lands between the two, and the weight the newcomer carries goes with the SQUARE of how far out in the predictor it sits: at twice this week's distance from the ore mean it would count for four times as much against $S_{xx}$. That weight is only half the story, though — a week that lands exactly on the old line moves the slope not at all, however far out it sits. Pair the distance with a miss and one week can rewrite a fit that ${fmtNum(p.n)} ordinary ones agreed on.` },
    ];
  },
  keyInsight: "A least-squares fit remembers its observations only through two sums, so one more point updates it in closed form — and the update is a weighted average of the old slope and the newcomer's own, in which the newcomer's weight is the square of its distance from the predictor's mean. That distance is leverage, and leverage is not influence: it moves the slope only in proportion to how far the new point falls from the old line. A point lying exactly on that line changes nothing however extreme its predictor, and a point sitting at the predictor's mean changes nothing however wild its response — which is why an influential observation has to be diagnosed on leverage and residual together, and never on either one alone.",
  commonTrap: "Adding the new point's raw deviations to both sums and forgetting that the means themselves shift, which overweights the newcomer by a factor of n+1 over n. The subtler version applies that factor to the cross-product but not to the sum of squares, updating half of the fit. The third slip is to leave the denominator alone entirely, as though only the response had moved.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
