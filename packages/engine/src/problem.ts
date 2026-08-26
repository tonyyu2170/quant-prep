import { makeRng } from "./rng";
import type { Tolerance } from "./types";

export interface ParamSpec {
  choices?: readonly number[];
  range?: { min: number; max: number; step: number };
}

export interface SolutionStep { title: string; body: string } // body may hold $...$ inline TeX

export type Params = Record<string, number>;
export type Derived = Record<string, number>;

export interface ProblemTemplate {
  id: string;                        // "bayes/base-rate-test" — the attempt problemId
  version: number;
  topic: string;                     // "probability/bayes"
  difficulty: 1 | 2 | 3;
  firms: readonly { firm: string; weight: number }[];
  source: { kind: "original" | "free-resource" | "textbook" | "paid-sample"; inspiration: string };
  params: Record<string, ParamSpec>;
  constraint?: (p: Params) => boolean;         // cross-param rejection rule
  derived: (p: Params) => Derived;             // EVERY intermediate number lives here
  statement: (p: Params, d: Derived) => string;
  answerKey: string;                           // derived key that is the answer
  // Present => this is a CHOICE problem: `answerKey` resolves to a 1-based index into these
  // labels rather than to a quantity, and the runner shows buttons instead of a number field.
  // Deliberately a constant array, not (p, d) => string[]: if the labels could move with the
  // draw, index 2 would mean different things on different seeds and a stored problemId+seed
  // would no longer replay to the same semantic answer. 1-based, not 0-based, for two reasons
  // — ChoiceGrid already keys off 1-4, and a 0 answer is a fixed point of the relative
  // perturbation the verify.py mutation check uses, so an option-0 template would ship with a
  // verifier that structurally cannot catch a wrong answer.
  choices?: readonly string[];
  accepted: { tolerance: Tolerance };          // explicit rel OR abs (spec §6)
  solution: (p: Params, d: Derived) => SolutionStep[];
  keyInsight: string;                          // number-free by design
  commonTrap: string;                          // number-free by design
  expectedPaceS: number;
  verify: { method: "montecarlo" | "brute-force" | "symbolic" };
  constants?: readonly number[];               // structural numbers allowed in text (e.g. 0.5)
}

/**
 * How many rejected tuples `drawParams` re-rolls before it gives up and throws.
 *
 * This is a crash budget, not a tuning knob. The throw lands inside ProblemRunner's `useMemo`
 * during render, and the app has no error boundary — so exhausting it is a blank page for
 * whoever happened to draw that seed, not a caught error. Raising a rejected tuple's re-roll
 * count changes nothing about which tuples are drawn: the rng sequence is identical and only
 * the give-up point moves, so no emitted instance changes.
 *
 * It was 100, which put the tightest shipped template (`distributions/normal-between`, whose
 * constraint accepts 9.25% of its space) at a throw every ~16k draws. At 1000 the same
 * template is at 8e-43, and the floor in draw-space.test.ts pins the whole corpus under 1e-9.
 */
export const DRAW_ATTEMPTS = 1000;

export function drawParams(t: ProblemTemplate, seed: number): Params {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < DRAW_ATTEMPTS; attempt++) {
    const p: Params = {};
    // Sorted keys: adding/removing a param reshuffles every other param's draw — bump template version when the param set changes.
    for (const key of Object.keys(t.params).sort()) {
      const spec = t.params[key];
      if (spec.choices) {
        if (spec.choices.length === 0) throw new Error(`drawParams: invalid spec for '${key}' in ${t.id}`);
        p[key] = spec.choices[Math.floor(rng() * spec.choices.length)];
      } else if (spec.range) {
        const { min, max, step } = spec.range;
        if (step <= 0 || Math.abs(Math.round((max - min) / step) * step - (max - min)) > 1e-9)
          throw new Error(`drawParams: invalid spec for '${key}' in ${t.id}`);
        const steps = Math.round((max - min) / step);
        p[key] = Math.round((min + step * Math.floor(rng() * (steps + 1))) * 1e10) / 1e10;
      } else {
        throw new Error(`drawParams: invalid spec for '${key}' in ${t.id}`);
      }
    }
    if (!t.constraint || t.constraint(p)) return p;
  }
  throw new Error(`drawParams: constraint unsatisfiable for ${t.id}`);
}

export function answerOf(t: ProblemTemplate, d: Derived): number {
  return d[t.answerKey];
}

/** The label a choice problem's answer selects. Throws on a non-choice template or a
 *  out-of-range index — both are authoring errors that registry.test.ts pins. */
export function answerLabel(t: ProblemTemplate, d: Derived): string {
  if (!t.choices) throw new Error(`answerLabel: ${t.id} is not a choice problem`);
  const i = answerOf(t, d);
  if (!Number.isInteger(i) || i < 1 || i > t.choices.length)
    throw new Error(`answerLabel: ${t.id} answer ${i} outside 1..${t.choices.length}`);
  return t.choices[i - 1];
}
