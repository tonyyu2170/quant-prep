import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Monotone lattice paths through a marked junction. The Sanity check recounts the
// routes reaching the junction by splitting on the direction of the last block —
// two different binomials that must add back to the first factor, which is exactly
// where an off-by-one in the arguments shows up.
export const latticePathsGrid: ProblemTemplate = {
  id: "counting/lattice-paths-grid",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "monotone grid paths, asked as the chance a uniformly random shortest route hits a given junction" },
  params: {
    across: { range: { min: 3, max: 7, step: 1 } },
    up: { range: { min: 3, max: 7, step: 1 } },
    cornerAcross: { range: { min: 1, max: 4, step: 1 } },
    cornerUp: { range: { min: 1, max: 4, step: 1 } },
  },
  // The junction must sit strictly inside the grid: on an edge every route would
  // pass it or the last-block split would lose one of its two cases.
  constraint: (p) => p.cornerAcross <= p.across - 1 && p.cornerUp <= p.up - 1,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const steps = p.across + p.up;
    const total = choose(steps, p.across);
    const cornerSteps = p.cornerAcross + p.cornerUp;
    const toCorner = choose(cornerSteps, p.cornerAcross);
    const restAcross = p.across - p.cornerAcross;
    const restUp = p.up - p.cornerUp;
    const fromCorner = choose(restAcross + restUp, restAcross);
    const through = toCorner * fromCorner;
    const viaWest = choose(cornerSteps - 1, p.cornerAcross - 1);
    const viaSouth = choose(cornerSteps - 1, p.cornerAcross);
    return {
      steps,
      total,
      cornerSteps,
      toCorner,
      restAcross,
      restUp,
      restSteps: restAcross + restUp,
      fromCorner,
      through,
      prob: through / total,
      viaWest,
      viaSouth,
      entrySum: viaWest + viaSouth,
    };
  },
  statement: (p, d) =>
    `A courier rides from the depot to a client ${fmtNum(p.across)} blocks east and ${fmtNum(p.up)} blocks north across a regular street grid. Every shortest route is ${fmtNum(d.steps)} blocks long and uses only eastward and northward blocks, ` +
    `and the courier picks one shortest route at random, each equally likely. What is the probability the route passes the junction ${fmtNum(p.cornerAcross)} blocks east and ${fmtNum(p.cornerUp)} blocks north of the depot?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `A shortest route is a sequence of ${fmtNum(d.steps)} blocks of which ${fmtNum(p.across)} go east; choosing which ones go east fixes the route entirely, so there are $\\binom{${fmtNum(d.steps)}}{${fmtNum(p.across)}}=${fmtNum(d.total)}$ routes.` },
    { title: "Count the routes through the junction", body: `Such a route splits at the junction into an independent first leg and second leg. The first leg covers ${fmtNum(d.cornerSteps)} blocks of which ${fmtNum(p.cornerAcross)} go east: $\\binom{${fmtNum(d.cornerSteps)}}{${fmtNum(p.cornerAcross)}}=${fmtNum(d.toCorner)}$ ways. The second covers the remaining ${fmtNum(d.restSteps)} blocks of which ${fmtNum(d.restAcross)} go east: $\\binom{${fmtNum(d.restSteps)}}{${fmtNum(d.restAcross)}}=${fmtNum(d.fromCorner)}$ ways.` },
    { title: "Multiply and divide", body: `Any first leg pairs with any second leg, so ${fmtNum(d.toCorner)} times ${fmtNum(d.fromCorner)} gives ${fmtNum(d.through)} routes through the junction, and the probability is $${fmtNum(d.through)}/${fmtNum(d.total)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Recount the first leg by asking which block enters the junction. Arriving from the west, the leg before it ran to the junction one block east-shy: $${fmtNum(d.viaWest)}$ ways. Arriving from the south: $${fmtNum(d.viaSouth)}$ ways. No route does both and every route does one, so they must add to the first-leg count: $${fmtNum(d.viaWest)}+${fmtNum(d.viaSouth)}=${fmtNum(d.entrySum)}$. An argument slipped by one block would break this.` },
  ],
  keyInsight: "A shortest grid route is determined by which of its blocks go east, so routes are selections; a route through a fixed junction is an independent pair of selections, one per leg, and the two multiply.",
  commonTrap: "Adding the two leg counts instead of multiplying them, which treats reaching the junction and continuing from it as alternatives rather than as two stages of the same route.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
