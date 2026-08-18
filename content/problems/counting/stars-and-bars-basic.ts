import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Stars and bars for identical items into distinct bins, empties allowed. The
// Sanity check re-counts under the "no bin empty" rule using the gaps-between-
// stars encoding, which must give strictly fewer hand-outs.
export const starsAndBarsBasic: ProblemTemplate = {
  id: "counting/stars-and-bars-basic",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "akuna", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic stars-and-bars: identical objects distributed into distinct bins" },
  params: {
    passes: { range: { min: 4, max: 10, step: 1 } },
    bands: { range: { min: 3, max: 5, step: 1 } },
  },
  // More passes than bands: with passes <= bands the "every band gets one"
  // comparison in the Sanity check degenerates to a single hand-out or to none.
  constraint: (p) => p.bands < p.passes,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const bars = p.bands - 1;
    const symbols = p.passes + p.bands - 1;
    return {
      bars,
      symbols,
      ways: choose(symbols, bars),
      gaps: p.passes - 1,
      strictWays: choose(p.passes - 1, bars),
    };
  },
  statement: (p) =>
    `A festival organiser has ${fmtNum(p.passes)} backstage passes to give out among ${fmtNum(p.bands)} bands on the bill. The passes are identical, so all that matters is how many each band ends up with; ` +
    `the bands are not identical, and a band is allowed to end up with none. In how many different ways can the passes be given out?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `A hand-out is fully described by the list of how many passes each of the ${fmtNum(p.bands)} bands receives. Since the passes are interchangeable, nothing else distinguishes one hand-out from another.` },
    { title: "Encode with stars and bars", body: `Write the ${fmtNum(p.passes)} passes as a row of stars, then drop in ${fmtNum(d.bars)} dividers to cut the row into ${fmtNum(p.bands)} stretches — the first stretch is the first band's share, and so on. A band with no passes shows up as two dividers with nothing between them, which is allowed.` },
    { title: "Count the arrangements", body: `The row now holds $${fmtNum(p.passes)}+${fmtNum(d.bars)}=${fmtNum(d.symbols)}$ symbols, and a hand-out is pinned down the moment you say which of those positions hold the dividers. That is $\\binom{${fmtNum(d.symbols)}}{${fmtNum(d.bars)}}=${fmtNum(d.ways)}$ hand-outs.` },
    { title: "Sanity check", body: `Now demand that every band gets at least one pass. Then no divider may sit at either end or share a spot with another, so the ${fmtNum(d.bars)} dividers must go into distinct gaps between neighbouring stars — and there are ${fmtNum(d.gaps)} such gaps, giving $\\binom{${fmtNum(d.gaps)}}{${fmtNum(d.bars)}}=${fmtNum(d.strictWays)}$ hand-outs. Those are a strict subset of what we counted (they leave out, for instance, giving every pass to one band), so ${fmtNum(d.strictWays)} had better be smaller than ${fmtNum(d.ways)} — and it is.` },
  ],
  keyInsight: "Identical objects into distinct bins is a question about the dividers, not the objects: lay the objects in a row and every placement of the separators names exactly one distribution, which turns the whole thing into a single choice of positions.",
  commonTrap: "Treating the passes as distinguishable and raising the band count to the pass count — that counts labelled hand-outs, where swapping which particular pass went where makes a new outcome, and it inflates the total badly.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
