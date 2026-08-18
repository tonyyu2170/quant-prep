import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Onto assignments by inclusion–exclusion over which vans are left empty. The term
// list depends on the van count, so `derived` carries one key per term. The Sanity
// check rebuilds the same number from the Stirling recurrence — grouping first,
// labelling second — which shares no arithmetic with the alternating sum.
export const surjectionsNoEmptyBin: ProblemTemplate = {
  id: "counting/surjections-no-empty-bin",
  version: 1,
  topic: "probability/counting",
  difficulty: 3,
  firms: [{ firm: "citadel-securities", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "surjection count by inclusion–exclusion over the empty bins" },
  params: {
    parcels: { range: { min: 5, max: 10, step: 1 } },
    vans: { range: { min: 3, max: 5, step: 1 } },
  },
  // Two more parcels than vans: with parcels equal to vans every onto assignment is
  // a plain permutation and the problem loses its point, and the surplus keeps the
  // grouping in the Sanity check non-trivial.
  constraint: (p) => p.parcels >= p.vans + 2,
  derived: (p) => {
    const fact = (m: number) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      return num / fact(j);
    };
    const out: Record<string, number> = {};
    let ways = 0;
    // Terms beyond vans - 1 empty every van and contribute nothing, so they stop here.
    for (let i = 0; i < p.vans; i++) {
      const term = choose(p.vans, i) * Math.pow(p.vans - i, p.parcels);
      out[`term${i}`] = term;
      ways += (i % 2 === 0 ? 1 : -1) * term;
    }
    // Stirling numbers of the second kind by the standard recurrence: S(i, b) counts
    // the ways to split i parcels into b unlabelled non-empty groups.
    let row = [1];
    for (let i = 1; i <= p.parcels; i++) {
      const next = [0];
      for (let b = 1; b <= p.vans; b++) next[b] = b * (row[b] ?? 0) + (row[b - 1] ?? 0);
      row = next;
    }
    out.allMaps = Math.pow(p.vans, p.parcels);
    out.barOne = Math.pow(p.vans - 1, p.parcels);
    out.ways = ways;
    out.groupings = row[p.vans];
    out.vanOrders = fact(p.vans);
    out.labelled = row[p.vans] * fact(p.vans);
    out.vansLess1 = p.vans - 1;
    return out;
  },
  statement: (p) =>
    `A depot must load ${fmtNum(p.parcels)} distinct parcels onto ${fmtNum(p.vans)} distinct delivery vans. Every parcel goes on exactly one van, the vans are told apart by their routes, ` +
    `and no van may leave empty. In how many ways can the parcels be loaded?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => {
    const terms: number[] = [];
    for (let i = 0; i < p.vans; i++) terms.push(d[`term${i}`]);
    const sumText = terms.map((v, i) => (i === 0 ? fmtNum(v) : `${i % 2 === 1 ? "-" : "+"}${fmtNum(v)}`)).join("");
    return [
      { title: "Setup", body: `Ignoring the no-empty rule, each parcel picks a van independently: $${fmtNum(p.vans)}^{${fmtNum(p.parcels)}}=${fmtNum(d.allMaps)}$ loadings. The rule rules some of those out, so count the offenders and remove them.` },
      { title: "Remove the loadings that leave a van empty", body: `Bar one named van and the parcels spread over the other ${fmtNum(d.vansLess1)}: $${fmtNum(d.vansLess1)}^{${fmtNum(p.parcels)}}=${fmtNum(d.barOne)}$ loadings. Any of the ${fmtNum(p.vans)} vans could be the barred one, so those removals come to ${fmtNum(d.term1)}. Barring two vans shrinks the power again, and the pattern continues while at least one van is left to take parcels.` },
      { title: "Alternate the signs", body: `A loading that leaves two vans empty was removed once for each of them, so it must be added back once for the pair — and the pattern continues, giving $${sumText}=${fmtNum(d.ways)}$ loadings that use every van.` },
      { title: "Sanity check", body: `Count it the other way round: first split the parcels into ${fmtNum(p.vans)} unlabelled non-empty groups, which the Stirling recurrence builds up to ${fmtNum(d.groupings)}, then hand the groups to the actual vans in $${fmtNum(p.vans)}!=${fmtNum(d.vanOrders)}$ ways. That route never subtracts anything, and $${fmtNum(d.groupings)}\\times${fmtNum(d.vanOrders)}=${fmtNum(d.labelled)}$ matches the alternating sum.` },
    ];
  },
  keyInsight: "Onto assignments are what is left after the assignments that skip a bin are removed, and since a loading can skip several bins at once the removals overlap — which is exactly the situation inclusion–exclusion is built for.",
  commonTrap: "Subtracting one count per empty van and stopping, which removes a loading that leaves two vans idle twice over and undercounts; the overlaps have to be added back size by size.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [],
};
