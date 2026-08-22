"""Independent Python counterparts for content/problems/ruin/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry), same
convention as bayes/counting/ev_variance/distributions.
brute()/simulate(): recompute the ANSWER by an independent path per spec §5 (as corrected by
plan constraint 1) — a numpy absorption-system solve for two-barrier probabilities, Monte
Carlo walkers for durations, drift touches, and doubling sessions."""

import numpy as np


def fair_reach_goal_exact(p):
    start, goal = int(p["startChips"]), int(p["goalChips"])
    frac = start / goal
    return {"frac": frac, "ruinProb": 1 - frac, "oppStack": goal - start}


def fair_reach_goal_brute(p):
    """Solve x = Qx + R over interior states 1..goal-1 numerically — matrix inversion rather
    than the difference-equation algebra behind start/goal, which is what makes this
    independent of exact()."""
    start, goal = int(p["startChips"]), int(p["goalChips"])
    m = goal - 1
    A = np.eye(m)
    b = np.zeros(m)
    for row in range(1, m):
        A[row, row - 1] -= 0.5
    for row in range(m - 1):
        A[row, row + 1] -= 0.5
    b[m - 1] = 0.5  # neighbour above the top interior state is the absorbing goal
    return float(np.linalg.solve(A, b)[start - 1])


SOLVERS = {
    "ruin/fair-reach-goal": {"exact": fair_reach_goal_exact, "brute": fair_reach_goal_brute},
}
