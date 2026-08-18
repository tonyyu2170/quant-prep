import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// "At least two of a kind" by complement: all teams minus the ones that break the
// rule. The Sanity check prices the tempting reserve-two-seats shortcut, which
// double counts every team holding three or more partners and therefore must come
// out strictly larger than the answer — the exact failure the trap describes.
export const atLeastKCommittee: ProblemTemplate = {
  id: "counting/at-least-k-committee",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic at-least-k selection resolved through the complement rather than a sum over cases" },
  params: {
    partners: { range: { min: 4, max: 9, step: 1 } },
    associates: { range: { min: 4, max: 9, step: 1 } },
    team: { range: { min: 4, max: 7, step: 1 } },
  },
  // Enough associates to staff a team without a single partner keeps the
  // rule-breaking side of the complement non-empty (both subtracted terms are real
  // counts), and the headcount cap keeps the Python enumeration of every possible
  // team under a hundred thousand.
  constraint: (p) => p.associates >= p.team && p.partners + p.associates <= 18,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const staff = p.partners + p.associates;
    const allTeams = choose(staff, p.team);
    const noPartner = choose(p.associates, p.team);
    const onePartner = p.partners * choose(p.associates, p.team - 1);
    const pairPick = choose(p.partners, 2);
    const fillRest = choose(staff - 2, p.team - 2);
    return {
      staff,
      allTeams,
      noPartner,
      onePartner,
      barred: noPartner + onePartner,
      ways: allTeams - noPartner - onePartner,
      teamLess1: p.team - 1,
      teamLess2: p.team - 2,
      staffLess2: staff - 2,
      pairPick,
      fillRest,
      shortcut: pairPick * fillRest,
    };
  },
  statement: (p, d) =>
    `An accounting firm staffs an audit team of ${fmtNum(p.team)} people from a pool of ${fmtNum(p.partners)} partners and ${fmtNum(p.associates)} associates, ${fmtNum(d.staff)} in all. ` +
    `The team has no ranks — only who is on it matters — but regulation requires at least two partners on every audit team. ` +
    `How many different teams satisfy the regulation?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `"At least two partners" covers teams with two, three, four and so on — a stack of cases to count separately. Its opposite covers only two: no partner at all, and exactly one. Count those and subtract.` },
    { title: "Count every team, ignoring the rule", body: `Any ${fmtNum(p.team)} of the ${fmtNum(d.staff)} people form a team: $\\binom{${fmtNum(d.staff)}}{${fmtNum(p.team)}}=${fmtNum(d.allTeams)}$ of them.` },
    { title: "Count the teams that break the rule", body: `A team with no partner is drawn entirely from the ${fmtNum(p.associates)} associates: $\\binom{${fmtNum(p.associates)}}{${fmtNum(p.team)}}=${fmtNum(d.noPartner)}$. A team with exactly one partner picks which partner in ${fmtNum(p.partners)} ways and fills the other ${fmtNum(d.teamLess1)} seats from associates: $${fmtNum(p.partners)}\\times\\binom{${fmtNum(p.associates)}}{${fmtNum(d.teamLess1)}}=${fmtNum(d.onePartner)}$. Together ${fmtNum(d.barred)} teams are barred.` },
    { title: "Subtract", body: `Every team either breaks the rule or satisfies it, so the count is $${fmtNum(d.allTeams)}-${fmtNum(d.barred)}=${fmtNum(d.ways)}$.` },
    { title: "Sanity check", body: `Try the shortcut that suggests itself: reserve two seats for partners, filling them in $\\binom{${fmtNum(p.partners)}}{2}=${fmtNum(d.pairPick)}$ ways, then fill the remaining ${fmtNum(d.teamLess2)} seats from anyone left, $\\binom{${fmtNum(d.staffLess2)}}{${fmtNum(d.teamLess2)}}=${fmtNum(d.fillRest)}$ ways, for ${fmtNum(d.shortcut)}. A team holding three partners gets produced once for each pair of partners inside it, so that figure must overshoot: the true count has to sit strictly below it, and $${fmtNum(d.ways)} < ${fmtNum(d.shortcut)}$.` },
  ],
  keyInsight: "A quota phrased as at least is a union of cases, while its opposite is usually a short list — counting everything and removing the few violating configurations replaces a sum over cases with a single subtraction.",
  commonTrap: "Reserving seats for the required members and filling the rest freely, which manufactures the same team once for every way its qualifying members could have filled the reserved seats and badly overcounts.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [2],
};
