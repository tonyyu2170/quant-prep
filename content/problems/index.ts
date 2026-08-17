import type { ProblemTemplate } from "@qp/engine";
import { baseRateTest } from "./bayes/base-rate-test";
import { twoUrns } from "./bayes/two-urns";

export const PROBLEMS: ProblemTemplate[] = [baseRateTest, twoUrns];

export const byId = new Map(PROBLEMS.map((t) => [t.id, t]));

export function problemsFor(topic?: string, difficulty?: 1 | 2 | 3): ProblemTemplate[] {
  return PROBLEMS.filter((t) => (!topic || t.topic === topic) && (!difficulty || t.difficulty === difficulty));
}

export const TOPIC_LABELS: Record<string, string> = {
  "probability/bayes": "bayes",
  "probability/counting": "counting",
  "probability/ev-variance": "ev & variance",
  "probability/distributions": "distributions",
  "probability/ruin": "ruin & walks",
  "probability/geometric": "geometric",
};
