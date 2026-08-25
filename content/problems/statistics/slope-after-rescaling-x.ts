import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// A slope under a change of units on BOTH axes. The question asks for the new slope and never
// for the factor it moved by: a factor answers the same number on every seed, which no
// diversity floor passes and no mutation check detects, because a broken answer expression
// still returns the constant.
//
// `ybarScale` drops the 1 the roster stub carried, 660 tuples down to 440. On a draw with the
// response factor at 1 this template's own commonTrap — rescaling the predictor and forgetting
// the response — produces the CORRECT answer, so a third of the space made the trap
// unpunishable. The same draw also makes the cover story unwriteable: "one old tick is now
// 1 new tick" is not a re-spec of anything.
//
// The re-spec is stated as "one old unit is now N new units" rather than as "units N times
// smaller" because only the concrete form fixes the direction unambiguously: both variables
// here are re-expressed in SMALLER units, so both sets of numbers get bigger, and the slope
// picks up the response factor and loses the predictor factor.
//
// `exact4` is the guarantee, not the grid: a slope stepping in fifths against an integer
// factor happens to make the numerator exact today, and this fails loud if that changes.
export const slopeAfterRescalingX: ProblemTemplate = {
  id: "statistics/slope-after-rescaling-x",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "how a regression slope transforms under a change of units on either axis" },
  params: {
    b: { range: { min: 1.2, max: 9.6, step: 0.4 } },
    k: { choices: [4, 5, 8, 10, 12, 16, 20, 25, 40, 50] },
    ybarScale: { choices: [2, 5] },
  },
  // `k !== ybarScale` removes the 22 draws where the two re-specs cancel and the new slope is
  // the quoted one back again: there a student who does nothing at all is graded correct, and
  // the answer is readable straight off the statement. It is the identity transformation
  // wearing the question's clothes, and the audit over the full legal space is what found it.
  constraint: (p) => p.k !== p.ybarScale && exact4(p.b * p.ybarScale),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      numer: round(p.b * p.ybarScale),
      answer: round((p.b * p.ybarScale) / p.k),   // from the exact operands, not from `numer`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `An exchange's impact model for a futures contract fits a least-squares line predicting the price move over a trade from the trade's size, and quotes the fitted slope as ${fmtNum(p.b)} ticks of price move per lot. ` +
    `The exchange then re-specs the contract: one old tick is now ${fmtNum(p.ybarScale)} new ticks, and one old lot is now ${fmtNum(p.k)} new lots. The same trades are refitted with both variables read off in the new units. What slope does that fit report, in new ticks per new lot?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "A slope carries units, and nothing else in the fit does", body: `A slope is a change in the response over a change in the predictor, so it is quoted in units of response per unit of predictor. Write $c$ for the tick factor and $k$ for the lot factor. Re-expressing the response so that every value is multiplied by $c$ multiplies the slope by $c$; re-expressing the predictor so that every value is multiplied by $k$ divides it by $k$. Least squares is being refitted on the same data in new clothes, so nothing about which line is best has moved: the new slope is $g=\\dfrac{cb}{k}$.` },
    { title: "The tick split multiplies it", body: `Every price move is now ${fmtNum(p.ybarScale)} times the number it was, so measured in new ticks against unchanged lots the slope is $${fmtNum(p.ybarScale)}\\times${fmtNum(p.b)}=${fmtNum(d.numer)}$ new ticks per old lot.` },
    { title: "Answer", body: `Every size is now ${fmtNum(p.k)} times the number it was, so the same move is credited to ${fmtNum(p.k)} times as many lots: $\\dfrac{${fmtNum(d.numer)}}{${fmtNum(p.k)}}=${fmtNum(d.answer)}$ new ticks per new lot.` },
    { title: "Sanity check", body: `Nothing about the strength of the relationship has changed. The correlation between size and price move is the same number before and after the re-spec, and so is the share of the variation the line explains — both are ratios in which the units cancel. Only the slope moved, which is the reason a slope on its own never says how good a fit is.` },
  ],
  keyInsight: "A regression slope is the one summary of a fit that carries units, so it is the one summary a change of units moves — multiplied by whatever multiplies the response, divided by whatever multiplies the predictor. Correlation and the explained share are pure ratios and sit still through the same relabelling.",
  commonTrap: "Rescaling the predictor and forgetting the response: dividing by the lot factor and stopping, which is out by the tick factor on every draw. The other slip is multiplying by the lot factor rather than dividing — a predictor whose numbers get bigger makes the slope smaller, because each unit of it now buys less.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
