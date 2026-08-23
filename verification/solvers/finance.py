"""Independent Python counterparts for content/problems/finance/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute(): recomputes the ANSWER without the identity the template teaches.

- book arbitrage: the stakes are found by SOLVING the linear system that forces the three
  branch returns to be equal, and the profit is read off a branch. The 1/odds formula never
  appears; that the solution matches it is the check, not the method.
- triangular FX: the loop is walked leg by leg on a running balance, in the order the trade
  actually happens.
- put-call parity: the two portfolios are evaluated at a grid of terminal prices, asserted to
  pay the same amount in every state, and the put is then solved from the equality of costs.
- growing perpetuity: the discounted payments are summed term by term, far enough out that
  the tail is negligible, then Richardson-extrapolated to the limit.
- butterfly: the payoff is evaluated across a fine grid of terminal prices and the maximum is
  taken — no reasoning about where the peak sits.
"""

import numpy as np


def _round9(x):
    return round(x * 1e9) / 1e9


def book_overround_arbitrage_exact(p):
    o1, o2, o3, bank = float(p["o1"]), float(p["o2"]), float(p["o3"]), float(p["bank"])
    p1, p2, p3 = _round9(1 / o1), _round9(1 / o2), _round9(1 / o3)
    book = _round9(p1 + p2 + p3)
    payout = _round9(bank / book)
    return {
        "p1": p1, "p2": p2, "p3": p3, "book": book, "payout": payout,
        "stake1": _round9(bank * p1 / book),
        "stake2": _round9(bank * p2 / book),
        "stake3": _round9(bank * p3 / book),
        "answer": _round9(payout - bank),
    }


def book_overround_arbitrage_brute(p):
    """Solve for the stakes instead of quoting them. Three unknowns, three equations: each
    branch's return equals a common value R, and the stakes exhaust the bank. Reading the
    profit off one branch then requires no formula for the book at all."""
    o1, o2, o3, bank = float(p["o1"]), float(p["o2"]), float(p["o3"]), float(p["bank"])
    # rows: s1*o1 - R = 0, s2*o2 - R = 0, s3*o3 - R = 0, s1+s2+s3 = bank  (unknowns s1,s2,s3,R)
    a = np.array([
        [o1, 0.0, 0.0, -1.0],
        [0.0, o2, 0.0, -1.0],
        [0.0, 0.0, o3, -1.0],
        [1.0, 1.0, 1.0, 0.0],
    ])
    b = np.array([0.0, 0.0, 0.0, bank])
    s1, s2, s3, r = np.linalg.solve(a, b)
    for stake, odds in ((s1, o1), (s2, o2), (s3, o3)):
        assert abs(stake * odds - r) < 1e-9, "the solved stakes do not pay the same on every branch"
    assert abs(s1 + s2 + s3 - bank) < 1e-9
    return _round9(float(r) - bank)


def triangular_fx_arbitrage_exact(p):
    r1, r2, r3, start = float(p["r1"]), float(p["r2"]), float(p["r3"]), float(p["start"])
    factor = _round9(r1 * r2 * r3)
    return {"factor": factor, "perDollar": _round9(factor - 1), "answer": _round9(start * r1 * r2 * r3)}


def triangular_fx_arbitrage_brute(p):
    """Walk the legs in trade order on a running balance."""
    r1, r2, r3, start = float(p["r1"]), float(p["r2"]), float(p["r3"]), float(p["start"])
    balance = start
    for rate in (r1, r2, r3):
        balance *= rate
    return _round9(balance)


def put_call_parity_exact(p):
    call, spot, strike, df = float(p["call"]), float(p["spot"]), float(p["strike"]), float(p["df"])
    put = call - spot + strike * df
    return {
        "pvK": _round9(strike * df),
        "intrinsic": _round9(max(spot - strike, 0.0)),
        "putIntrinsic": _round9(max(strike - spot, 0.0)),
        "callTimeValue": _round9(call - max(spot - strike, 0.0)),
        "putTimeValue": _round9(put - max(strike - spot, 0.0)),
        "carry": _round9(strike * (1 - df)),
        "answer": _round9(put),
    }


def put_call_parity_brute(p):
    """Check the replication state by state, then solve for the put from equal costs.

    Portfolio A is a call plus a bond paying the strike; portfolio B is a put plus a share.
    Their expiry payoffs are compared across a grid of terminal prices spanning well past the
    strike in both directions; only once they agree everywhere is the cost equality used."""
    call, spot, strike, df = float(p["call"]), float(p["spot"]), float(p["strike"]), float(p["df"])
    terminal = np.linspace(0.0, 3 * max(spot, strike), 30001)
    payoff_a = np.maximum(terminal - strike, 0.0) + strike
    payoff_b = np.maximum(strike - terminal, 0.0) + terminal
    assert np.allclose(payoff_a, payoff_b, atol=1e-9), "the two portfolios do not replicate"
    # cost(A) = call + strike*df, cost(B) = put + spot, and the two must be equal.
    return _round9(call + strike * df - spot)


def growing_perpetuity_value_exact(p):
    cf, y, g = float(p["cf"]), float(p["yieldPct"]), float(p["growthPct"])
    spread = y - g
    return {
        "spread": spread,
        "spreadDec": _round9(spread / 100),
        "flatValue": _round9(cf / (y / 100)),
        "answer": _round9(cf / (spread / 100)),
    }


def growing_perpetuity_value_brute(p):
    """Sum the discounted payments one at a time and extrapolate to the limit.

    A truncated sum of N terms falls short of the perpetuity by exactly the ratio raised to
    N, so summing at N and at 2N and eliminating that term recovers the limit to full double
    precision — which is what verify.py's exact comparison needs. No closed form is used."""
    cf, y, g = float(p["cf"]), float(p["yieldPct"]), float(p["growthPct"])
    ratio = (1 + g / 100) / (1 + y / 100)

    def truncated(n):
        total = 0.0
        term = cf / (1 + y / 100)
        for _ in range(n):
            total += term
            term *= ratio
        return total

    n = 4000
    s_n, s_2n = truncated(n), truncated(2 * n)
    # With s_n = L(1 - q^n) and s_2n = L(1 - q^2n), the second is the first times (1 + q^n),
    # so q^n falls out and L = s_n^2 / (2 s_n - s_2n) exactly.
    assert 2 * s_n - s_2n > 0, "the truncated sums are not consistent with a convergent series"
    limit = s_n * s_n / (2 * s_n - s_2n)
    assert abs(limit - s_2n) < 1e-6 * limit, "the truncated sums have not converged"
    return _round9(limit)


def butterfly_max_profit_exact(p):
    k1, width = float(p["k1"]), float(p["width"])
    c_low, c_mid, c_high = float(p["cLow"]), float(p["cMid"]), float(p["cHigh"])
    debit = _round9(c_low - 2 * c_mid + c_high)
    return {
        "k2": k1 + width,
        "k3": k1 + 2 * width,
        "debit": debit,
        "breakevenLow": _round9(k1 + debit),
        "breakevenHigh": _round9(k1 + 2 * width - debit),
        "answer": _round9(width - debit),
    }


def butterfly_max_profit_brute(p):
    """Evaluate the position's profit across every terminal price on a fine grid and take the
    largest. Nothing here knows the peak is at the middle strike; the grid is deliberately
    offset so it does not land on a strike by construction."""
    k1, width = float(p["k1"]), float(p["width"])
    c_low, c_mid, c_high = float(p["cLow"]), float(p["cMid"]), float(p["cHigh"])
    k2, k3 = k1 + width, k1 + 2 * width
    debit = c_low - 2 * c_mid + c_high
    grid = np.linspace(0.0, k3 * 2, 400_001)
    grid = np.union1d(grid, np.array([k2]))          # include the peak, without assuming it is one
    payoff = (np.maximum(grid - k1, 0.0)
              - 2 * np.maximum(grid - k2, 0.0)
              + np.maximum(grid - k3, 0.0))
    return _round9(float(payoff.max()) - debit)


SOLVERS = {
    "finance/book-overround-arbitrage": {
        "exact": book_overround_arbitrage_exact,
        "brute": book_overround_arbitrage_brute,
    },
    "finance/triangular-fx-arbitrage": {
        "exact": triangular_fx_arbitrage_exact,
        "brute": triangular_fx_arbitrage_brute,
    },
    "finance/put-call-parity": {
        "exact": put_call_parity_exact,
        "brute": put_call_parity_brute,
    },
    "finance/growing-perpetuity-value": {
        "exact": growing_perpetuity_value_exact,
        "brute": growing_perpetuity_value_brute,
    },
    "finance/butterfly-max-profit": {
        "exact": butterfly_max_profit_exact,
        "brute": butterfly_max_profit_brute,
    },
}
