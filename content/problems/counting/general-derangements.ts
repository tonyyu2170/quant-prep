import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Inclusion–exclusion over a marked subset: count the matchings in which none of
// the starred questions is right. The term list is built per draw, so `derived`
// carries one key per term. The Sanity check brackets the answer between the full
// derangement count, built from its own recurrence, and the unrestricted total.
export const generalDerangements: ProblemTemplate = {
  id: "counting/general-derangements",
  version: 1,
  topic: "probability/counting",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "derangement generalised to a marked subset, counted by inclusion–exclusion over which marked items land correctly" },
  params: {
    questions: { range: { min: 6, max: 12, step: 1 } },
    starred: { range: { min: 2, max: 4, step: 1 } },
  },
  // At least two unstarred questions, so the marked subset is a strict part of the
  // quiz and the answer sits strictly above the full derangement count the Sanity
  // check compares against.
  constraint: (p) => p.starred <= p.questions - 2,
  derived: (p) => {
    const fact = (m: number) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      return num / fact(j);
    };
    const out: Record<string, number> = {};
    let ways = 0;
    for (let i = 0; i <= p.starred; i++) {
      const term = choose(p.starred, i) * fact(p.questions - i);
      out[`term${i}`] = term;
      ways += (i % 2 === 0 ? 1 : -1) * term;
    }
    // Full derangement of the whole quiz, by the standard recurrence.
    let prev = 1;
    let cur = 0;
    for (let j = 2; j <= p.questions; j++) { const next = (j - 1) * (cur + prev); prev = cur; cur = next; }
    out.totalArr = fact(p.questions);
    out.questionsLess1 = p.questions - 1;
    out.questionsLess2 = p.questions - 2;
    out.restArr1 = fact(p.questions - 1);
    out.restArr2 = fact(p.questions - 2);
    out.starredPairs = choose(p.starred, 2);
    out.ways = ways;
    out.fullDerange = cur;
    return out;
  },
  statement: (p) =>
    `A matching quiz asks a student to pair ${fmtNum(p.questions)} questions with ${fmtNum(p.questions)} answers, one answer per question. A student who has not studied pairs them at random. ` +
    `The examiner grades only the ${fmtNum(p.starred)} starred questions. In how many of the possible pairings does the student get every starred question wrong?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => {
    const terms: number[] = [];
    for (let i = 0; i <= p.starred; i++) terms.push(d[`term${i}`]);
    const sumText = terms.map((v, i) => (i === 0 ? fmtNum(v) : `${i % 2 === 1 ? "-" : "+"}${fmtNum(v)}`)).join("");
    return [
      { title: "Setup", body: `There are $${fmtNum(p.questions)}!=${fmtNum(d.totalArr)}$ pairings in all. Counting the ones where every starred question is wrong head on means chasing many patterns at once, so count the pairings where at least one starred question is right and remove them.` },
      { title: "Count the pairings that get a chosen set of starred questions right", body: `Pin one starred question to its own answer and the other ${fmtNum(d.questionsLess1)} questions are free, in $${fmtNum(d.questionsLess1)}!=${fmtNum(d.restArr1)}$ ways; any of the starred questions could be the pinned one, so $${fmtNum(p.starred)}\\times${fmtNum(d.restArr1)}=${fmtNum(d.term1)}$. Pin two instead and ${fmtNum(d.questionsLess2)} stay free, $${fmtNum(d.questionsLess2)}!=${fmtNum(d.restArr2)}$ ways, so $\\binom{${fmtNum(p.starred)}}{2}\\times${fmtNum(d.restArr2)}=${fmtNum(d.term2)}$. Each further pin would strip one more question from the free block.` },
      { title: "Alternate the signs", body: `A pairing with several starred questions right is removed once for each of them, added back once for each pair of them, and so on, so the sizes alternate in sign: $${sumText}=${fmtNum(d.ways)}$.` },
      { title: "Sanity check", body: `Bracket the answer. Every pairing in which nobody at all is matched correctly certainly has all starred questions wrong, and those number ${fmtNum(d.fullDerange)} by the derangement recurrence, seeded at none for a single question and one for a pair. And the answer cannot reach the unrestricted ${fmtNum(d.totalArr)}. So it must sit strictly between them: $${fmtNum(d.fullDerange)} < ${fmtNum(d.ways)} < ${fmtNum(d.totalArr)}$.` },
    ];
  },
  keyInsight: "Requiring several things to all fail is inclusion–exclusion territory: count the pairings where a chosen set of them succeeds, sum over sets of each size, and alternate the signs so every pairing ends up counted exactly once.",
  commonTrap: "Subtracting the pairings that get one starred question right and stopping, which removes a pairing with two starred questions right twice and leaves the count too low.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [2],
};
