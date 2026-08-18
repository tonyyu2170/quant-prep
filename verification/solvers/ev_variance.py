"""Independent Python counterparts for content/problems/ev-variance/*.
exact(): re-derives every TS `derived` value in plain float arithmetic (double-entry).
It is MEANT to mirror the template — that mirroring is the check — so it stays in
floats; a Fraction-based exact() would absorb a template that loses precision.
brute(): recomputes the ANSWER by enumerating the sample space, never by re-calling
the template's closed form. Only brute() carries the independence requirement, works
in Fraction where the space is rational, and returns float() explicitly."""

from fractions import Fraction


def two_outcome_bet_exact(p):
    k, w, loss = int(p["k"]), int(p["w"]), int(p["l"])
    win_faces = 7 - k
    lose_faces = k - 1
    p_win = win_faces / 6
    p_lose = lose_faces / 6
    win_leg = p_win * w
    lose_leg = p_lose * loss
    return {
        "winFaces": win_faces,
        "loseFaces": lose_faces,
        "pWin": p_win,
        "pLose": p_lose,
        "winLeg": win_leg,
        "loseLeg": lose_leg,
        "fairWin": lose_faces * loss / win_faces,
        "ev": (win_faces * w - lose_faces * loss) / 6,
    }


def two_outcome_bet_brute(p):
    """Walk the six faces and average the profit. No probabilities are formed and
    nothing is multiplied by a weight — the template's p*payoff structure never
    appears here, which is what makes this a second derivation."""
    k, w, loss = int(p["k"]), int(p["w"]), int(p["l"])
    total = Fraction(0)
    for face in range(1, 7):
        total += Fraction(w) if face >= k else Fraction(-loss)
    return float(total / 6)


SOLVERS = {
    "ev-variance/two-outcome-bet": {"exact": two_outcome_bet_exact, "brute": two_outcome_bet_brute},
}
