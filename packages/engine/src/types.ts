export type Topic = "arithmetic" | "sequences" | "missing-operand";

export interface Item {
  id: string;
  topic: Topic;
  prompt: string;            // e.g. "47 × 83" or "2, 5, 11, 23, ?"
  answer: number;
  rule?: string;             // sequences: human explanation, revealed post-answer
  options?: readonly number[]; // missing-operand: the four shuffled choices, answer included
  meta: Record<string, number | string>; // operands/family for independent verification
}

export interface Tolerance { rel?: number; abs?: number } // explicit semantics (spec §6)

export interface Scoring { correct: number; wrong: number; skip: number }

export interface Preset {
  id: string;
  title: string;
  topic: Topic;
  count: number;
  durationS: number;
  scoring: Scoring;
  difficulty: (index: number) => 1 | 2 | 3;
}

export type Rng = () => number;
