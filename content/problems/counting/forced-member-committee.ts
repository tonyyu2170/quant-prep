import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A required member is not a choice: strip the person and their seat, then count
// an ordinary combination on the reduced pool. The Sanity check splits every
// possible team by whether it contains that person — Pascal's rule, in words.
export const forcedMemberCommittee: ProblemTemplate = {
  id: "counting/forced-member-committee",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "flow", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic constrained-committee count: a designated member must be included" },
  params: {
    n: { range: { min: 6, max: 12, step: 1 } },
    k: { range: { min: 3, max: 6, step: 1 } },
  },
  // k <= n-3 keeps the leftover pool large enough that the Sanity check's
  // "teams without the chief" class stays substantial rather than a single team.
  constraint: (p) => p.k <= p.n - 3,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    return {
      pool: p.n - 1,
      slots: p.k - 1,
      ways: choose(p.n - 1, p.k - 1),
      totalTeams: choose(p.n, p.k),
      withoutChief: choose(p.n - 1, p.k),
    };
  },
  statement: (p) =>
    `A hospital ward rosters an on-call team of ${fmtNum(p.k)} doctors, drawn from the ${fmtNum(p.n)} doctors on the ward. The team has no ranks — only who is on it matters. ` +
    `Ward policy says the chief resident, who is one of those ${fmtNum(p.n)} doctors, must be on every on-call team. How many different teams satisfy the policy?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `The chief resident is on the team no matter what, so she is not something the roster gets to decide. Deciding is what we are counting, so take her out of the decision entirely.` },
    { title: "Shrink the problem", body: `Seat the chief first. That uses up one of the ${fmtNum(p.k)} places, leaving ${fmtNum(d.slots)} places to fill, and she is no longer available to fill them, leaving ${fmtNum(d.pool)} other doctors to choose from.` },
    { title: "Count the reduced choice", body: `What remains is a plain unordered selection: $\\binom{${fmtNum(d.pool)}}{${fmtNum(d.slots)}}=${fmtNum(d.ways)}$ teams satisfy the policy.` },
    { title: "Sanity check", body: `Count every team the ward could form ignoring policy: $\\binom{${fmtNum(p.n)}}{${fmtNum(p.k)}}=${fmtNum(d.totalTeams)}$. Each of those either has the chief or does not, and the teams without her are drawn entirely from the other ${fmtNum(d.pool)} doctors: $\\binom{${fmtNum(d.pool)}}{${fmtNum(p.k)}}=${fmtNum(d.withoutChief)}$. The two classes are disjoint and cover everything, so they must add back to the whole: $${fmtNum(d.ways)}+${fmtNum(d.withoutChief)}=${fmtNum(d.totalTeams)}$.` },
    ],
  keyInsight: "A forced member is not a choice at all — delete that person and the seat they occupy, and what is left is an ordinary unrestricted selection from a smaller pool, with no correction factor anywhere.",
  commonTrap: "Multiplying by the number of ways to pick the required member, as though seating her were one more decision; she was never a decision, so that factor counts every team once per way of naming its chief.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [],
};
