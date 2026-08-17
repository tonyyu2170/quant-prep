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
  accepted: { tolerance: Tolerance };          // explicit rel OR abs (spec §6)
  solution: (p: Params, d: Derived) => SolutionStep[];
  keyInsight: string;                          // number-free by design
  commonTrap: string;                          // number-free by design
  expectedPaceS: number;
  verify: { method: "montecarlo" | "brute-force" | "symbolic" };
  constants?: readonly number[];               // structural numbers allowed in text (e.g. 0.5)
}

export function drawParams(t: ProblemTemplate, seed: number): Params {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 100; attempt++) {
    const p: Params = {};
    // Sorted keys: adding/removing a param reshuffles every other param's draw — bump template version when the param set changes.
    for (const key of Object.keys(t.params).sort()) {
      const spec = t.params[key];
      if (spec.choices) {
        if (spec.choices.length === 0) throw new Error(`drawParams: invalid spec for '${key}' in ${t.id}`);
        p[key] = spec.choices[Math.floor(rng() * spec.choices.length)];
      } else if (spec.range) {
        const { min, max, step } = spec.range;
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
