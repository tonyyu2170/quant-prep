import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Monotone paths avoiding one blocked node: total minus the paths through it. The
// Sanity check recounts the second leg by splitting on the direction of the first
// aisle leaving the blockage, so the two halves of the blocked product are checked
// by different binomials rather than by restating the subtraction.
export const latticePathsForbiddenNode: ProblemTemplate = {
  id: "counting/lattice-paths-forbidden-node",
  version: 1,
  topic: "probability/counting",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "monotone grid paths with one forbidden lattice point, by complementary counting" },
  params: {
    east: { range: { min: 4, max: 8, step: 1 } },
    north: { range: { min: 4, max: 8, step: 1 } },
    blockEast: { range: { min: 1, max: 4, step: 1 } },
    blockNorth: { range: { min: 1, max: 4, step: 1 } },
  },
  // The blockage sits strictly inside the grid, so both legs are real journeys: on
  // an edge one of the two directions leaving it does not exist and the last-aisle
  // split in the Sanity check loses a case. The span cap keeps the Python grid walk
  // small.
  constraint: (p) =>
    p.blockEast <= p.east - 1 && p.blockNorth <= p.north - 1 && p.east + p.north <= 14,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const aisles = p.east + p.north;
    const total = choose(aisles, p.east);
    const toBlock = choose(p.blockEast + p.blockNorth, p.blockEast);
    const restEast = p.east - p.blockEast;
    const restNorth = p.north - p.blockNorth;
    const restAisles = restEast + restNorth;
    const fromBlock = choose(restAisles, restEast);
    const outEast = choose(restAisles - 1, restEast - 1);
    const outNorth = choose(restAisles - 1, restEast);
    return {
      aisles,
      total,
      blockAisles: p.blockEast + p.blockNorth,
      toBlock,
      restEast,
      restNorth,
      restAisles,
      fromBlock,
      blocked: toBlock * fromBlock,
      ways: total - toBlock * fromBlock,
      outEast,
      outNorth,
      exitSum: outEast + outNorth,
    };
  },
  statement: (p, d) =>
    `A warehouse robot drives from the loading dock to a picking station ${fmtNum(p.east)} aisles east and ${fmtNum(p.north)} aisles north, moving only east or north, so every route it can take is ${fmtNum(d.aisles)} aisles long. ` +
    `A spill has closed the junction ${fmtNum(p.blockEast)} aisles east and ${fmtNum(p.blockNorth)} aisles north of the dock, and the robot may not pass through it. How many routes remain open?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `A route is fixed by which of its ${fmtNum(d.aisles)} aisles run east, so there are $\\binom{${fmtNum(d.aisles)}}{${fmtNum(p.east)}}=${fmtNum(d.total)}$ routes before the closure. Counting the surviving routes directly is awkward, so count the ones the spill kills and subtract.` },
    { title: "Count the routes through the closed junction", body: `Such a route reaches the junction in $\\binom{${fmtNum(d.blockAisles)}}{${fmtNum(p.blockEast)}}=${fmtNum(d.toBlock)}$ ways and finishes from there in $\\binom{${fmtNum(d.restAisles)}}{${fmtNum(d.restEast)}}=${fmtNum(d.fromBlock)}$ ways. The legs are independent, so ${fmtNum(d.blocked)} routes are killed.` },
    { title: "Subtract", body: `Every route either passes the junction or avoids it, so the open routes number $${fmtNum(d.total)}-${fmtNum(d.blocked)}=${fmtNum(d.ways)}$.` },
    { title: "Sanity check", body: `Recount the second leg by which aisle the robot would take out of the junction. Leaving east, the rest of the trip runs one aisle east-shy: $${fmtNum(d.outEast)}$ ways. Leaving north: $${fmtNum(d.outNorth)}$ ways. Every finishing leg does exactly one of the two, so they must add to the leg count: $${fmtNum(d.outEast)}+${fmtNum(d.outNorth)}=${fmtNum(d.exitSum)}$. A binomial written with the wrong pair of arguments would fail this test.` },
  ],
  keyInsight: "A forbidden point splits complementary counting cleanly: routes through it factor into an arrival and a departure that can be counted separately and multiplied, and everything else survives.",
  commonTrap: "Subtracting the routes that reach the blocked junction rather than the routes that pass through it, which forgets that each arrival continues in many ways and removes far too few.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [],
};
