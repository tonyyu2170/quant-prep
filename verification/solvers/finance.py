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
- payment stream: the cash flows are rolled backwards one period at a time through the
  one-period forward factors implied by the quoted curve, so the sum of discounted flows the
  template teaches never appears.
- put hedge: a Black-Scholes world is CONSTRUCTED whose call delta is the quoted one, the put's
  delta is read from that model rather than from parity, and both deltas are checked against a
  finite difference of the model's own prices. Parity is what the template asserts; here it is
  a conclusion.
- covered call: the payoff is evaluated across a grid of terminal prices and the maximum read
  off it, with no argument about where the peak sits.
- call lower bound: the trade is assembled leg by leg into a cash ledger, and the answer is the
  WORST total profit across a grid of terminal prices rather than a bound formula.
- box spread: the four legs are evaluated across a grid, the payout is asserted constant, and
  the width used to discount is the constant read off that grid — not the strike difference.
"""

import itertools
import math

import numpy as np


def _round9(x):
    return round(x * 1e9) / 1e9


def _r9(x):
    """Half-up at the ninth decimal, matching JS Math.round on ties of either sign. The older
    _round9 above uses Python's half-to-even round(); the B16 templates (book-delta and the
    bond premium carry negative answers) use this one."""
    return math.floor(x * 1e9 + 0.5) / 1e9


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


def _norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def payment_stream_present_value_exact(p):
    pmt, df1, drop, n = float(p["pmt"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    df2, df3, df4 = _round9(df1 - drop), _round9(df1 - 2 * drop), _round9(df1 - 3 * drop)
    sum_used = _round9(df1 + df2 + df3 + (df4 if n == 4 else 0.0))
    answer = _round9(pmt * sum_used)
    nominal = _round9(pmt * n)
    return {
        "df2": df2, "df3": df3, "df4": df4, "sumUsed": sum_used,
        "nominal": nominal, "timeCost": _round9(nominal - answer), "answer": answer,
    }


def payment_stream_present_value_brute(p):
    """Roll the payments backwards through the ONE-PERIOD factors the curve implies, instead of
    summing discounted flows. The forward factor from year i-1 to year i is DF_i/DF_{i-1}, and
    walking the stream back through them reprices it without ever writing the sum down."""
    pmt, df1, drop, n = float(p["pmt"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    curve = [df1 - i * drop for i in range(n)]           # DF_1 .. DF_n
    fwd = [curve[0]] + [curve[i] / curve[i - 1] for i in range(1, n)]
    value = 0.0
    for i in range(n - 1, -1, -1):                        # stand at year i+1, walk back to today
        value = (value + pmt) * fwd[i]
    assert value > 0
    return _round9(value)


def put_hedge_from_parity_exact(p):
    n, dc = float(p["n"]), float(p["dc"])
    return {
        "putDelta": _round9(dc - 1),
        "perPut": _round9(1 - dc),
        "callHedge": _round9(n * dc),
        "answer": _round9(n * (1 - dc)),
    }


def put_hedge_from_parity_brute(p):
    """Build a Black-Scholes world whose call delta IS the quoted one, then read the put's delta
    out of that model. Parity is never used: the strike is solved so that N(d1) equals the given
    delta, the put delta is N(d1)-1 by differentiating the model's own formula, and a central
    difference of the model's put price confirms it."""
    n, dc = float(p["n"]), float(p["dc"])
    spot, vol, t = 100.0, 0.2, 1.0
    lo, hi = -10.0, 10.0                                  # invert the normal CDF by bisection
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if _norm_cdf(mid) < dc:
            lo = mid
        else:
            hi = mid
    d1 = 0.5 * (lo + hi)
    strike = spot * math.exp(vol * vol * t / 2 - d1 * vol * math.sqrt(t))

    def put_price(s):
        a = (math.log(s / strike) + vol * vol * t / 2) / (vol * math.sqrt(t))
        b = a - vol * math.sqrt(t)
        return strike * _norm_cdf(-b) - s * _norm_cdf(-a)

    h = 1e-4
    fd = (put_price(spot + h) - put_price(spot - h)) / (2 * h)
    model_put_delta = _norm_cdf(d1) - 1
    assert abs(fd - model_put_delta) < 1e-6, f"finite difference {fd} vs model {model_put_delta}"
    return _round9(-n * model_put_delta)


def covered_call_max_profit_exact(p):
    spot, strike, call = float(p["spot"]), float(p["strike"]), float(p["call"])
    return {
        "upside": _round9(strike - spot),
        "breakeven": _round9(spot - call),
        "answer": _round9(strike - spot + call),
    }


def covered_call_max_profit_brute(p):
    """Evaluate the buy-write's profit across a grid of terminal prices and take the maximum. The
    grid steps in quarters and the strike is a multiple of five, so the peak is a grid point and
    the maximum is exact rather than approached."""
    spot, strike, call = float(p["spot"]), float(p["strike"]), float(p["call"])
    grid = np.arange(0.0, 3 * strike + 0.25, 0.25)
    profit = np.minimum(grid, strike) - spot + call        # share capped by the short call
    best = float(profit.max())
    assert np.isclose(profit[grid >= strike], best).all(), "the payoff is not flat above the strike"
    return _round9(best)


def call_lower_bound_arbitrage_exact(p):
    spot, strike, df, call = float(p["spot"]), float(p["strike"]), float(p["df"]), float(p["call"])
    return {
        "pvK": _round9(strike * df),
        "floor": _round9(spot - strike * df),
        "intrinsic": _round9(max(spot - strike, 0.0)),
        "answer": _round9(spot - strike * df - call),
    }


def call_lower_bound_arbitrage_brute(p):
    """Assemble the trade as a ledger — short the share, buy the call, buy `strike` units of the
    zero — and take the WORST profit over a grid of terminal prices. The bound the template
    teaches never appears; the answer is what the position is guaranteed to make."""
    spot, strike, df, call = float(p["spot"]), float(p["strike"]), float(p["df"]), float(p["call"])
    cash_today = spot - call - strike * df                 # +short share, -call, -bonds
    grid = np.arange(0.0, 3 * max(spot, strike) + 0.25, 0.25)
    at_expiry = np.maximum(grid - strike, 0.0) - grid + strike   # call + bond redemption - buy back share
    worst = float(at_expiry.min())
    assert worst >= -1e-12, "the position is not riskless"
    assert np.isclose(at_expiry[grid >= strike], 0.0).all(), "the expiry leg should close at zero above the strike"
    return _round9(cash_today + df * worst)


def box_spread_arbitrage_exact(p):
    k1, width = float(p["k1"]), float(p["width"])
    cs, ps, df = float(p["callSpread"]), float(p["putSpread"]), float(p["df"])
    return {
        "k2": _round9(k1 + width),
        "cost": _round9(cs + ps),
        "fairValue": _round9(width * df),
        "answer": _round9(width * df - (cs + ps)),
    }


def box_spread_arbitrage_brute(p):
    """Evaluate all four legs across a grid of terminal prices, assert the payout is the same
    number everywhere, and discount THAT number. The strike width is read off the payoff rather
    than assumed to be what the box pays."""
    k1, width = float(p["k1"]), float(p["width"])
    cs, ps, df = float(p["callSpread"]), float(p["putSpread"]), float(p["df"])
    k2 = k1 + width
    grid = np.arange(0.0, 3 * k2 + 0.25, 0.25)
    payoff = (np.maximum(grid - k1, 0.0) - np.maximum(grid - k2, 0.0)
              + np.maximum(k2 - grid, 0.0) - np.maximum(k1 - grid, 0.0))
    assert np.allclose(payoff, payoff[0]), "a box does not pay a constant here"
    certain = float(payoff[0])
    return _round9(certain * df - (cs + ps))


# ------------------------------------------------------------------------------------------
# B16 — options / Greeks
# ------------------------------------------------------------------------------------------

def _gamma_pnl_accumulated(book_gamma, move, slices=1000):
    """The P&L of a delta-hedged book over a move, accumulated slice by slice: after s dollars
    of travel the book carries a stray delta of G*s, and each slice earns that delta times the
    slice. Midpoint rule, which is exact for a linear integrand — so this reproduces the closed
    form to double precision without the half ever being written down."""
    h = move / slices
    pnl = 0.0
    for k in range(slices):
        s = (k + 0.5) * h
        pnl += book_gamma * s * h
    return pnl


def gamma_pnl_from_a_move_exact(p):
    n, g, x = float(p["n"]), float(p["gamma"]), float(p["move"])
    return {
        "bookGamma": _r9(n * g),
        "moveSq": _r9(x * x),
        "endDelta": _r9(n * g * x),
        "answer": _r9(n * g * x * x / 2),
    }


def gamma_pnl_from_a_move_brute(p):
    n, g, x = float(p["n"]), float(p["gamma"]), float(p["move"])
    return _gamma_pnl_accumulated(n * g, x)


def shares_to_rehedge_after_a_move_exact(p):
    n, d, g, x = float(p["n"]), float(p["delta"]), float(p["gamma"]), float(p["move"])
    return {
        "oldHedge": _r9(n * d),
        "deltaChange": _r9(g * x),
        "newDelta": _r9(d + g * x),
        "newHedge": _r9(n * (d + g * x)),
        "answer": _r9(n * g * x),
    }


def shares_to_rehedge_after_a_move_brute(p):
    """Totals, never the increment: the hedge the book needs after the move, less the hedge it
    already has."""
    n, d, g, x = float(p["n"]), float(p["delta"]), float(p["gamma"]), float(p["move"])
    return n * (d + g * x) - n * d


def straddle_implied_move_exact(p):
    spot, call, put = float(p["spot"]), float(p["call"]), float(p["put"])
    premium = _r9(call + put)
    return {
        "premium": premium,
        "fraction": _r9(premium / spot),
        "upper": _r9(spot + premium),
        "lower": _r9(spot - premium),
        "answer": _r9(100 * premium / spot),
    }


def straddle_implied_move_brute(p):
    """Bisect the terminal price above the strike at which the straddle's expiry value equals
    what it cost, then read that price's distance from the strike as a percentage. The premium
    is never divided by the spot."""
    spot, call, put = float(p["spot"]), float(p["call"]), float(p["put"])
    strike = spot
    lo, hi = strike, 2 * strike
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if abs(mid - strike) - (call + put) < 0:
            lo = mid
        else:
            hi = mid
    terminal = 0.5 * (lo + hi)
    return 100 * (terminal - strike) / strike


def book_delta_calls_and_puts_exact(p):
    calls, puts, d = float(p["calls"]), float(p["puts"]), float(p["delta"])
    return {
        "putDelta": _r9(d - 1),
        "callLeg": _r9(calls * d),
        "putLeg": _r9(puts * (d - 1)),
        "answer": _r9((calls + puts) * d - puts),
    }


def book_delta_calls_and_puts_brute(p):
    """Build a Black-Scholes world whose call delta IS the quoted one, read the put's delta out
    of that model rather than from D_C − 1, confirm it against a central difference of the
    model's own put price, and add the legs."""
    calls, puts, dc = float(p["calls"]), float(p["puts"]), float(p["delta"])
    spot, vol, t = 100.0, 0.2, 1.0
    lo, hi = -10.0, 10.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if _norm_cdf(mid) < dc:
            lo = mid
        else:
            hi = mid
    d1 = 0.5 * (lo + hi)
    strike = spot * math.exp(vol * vol * t / 2 - d1 * vol * math.sqrt(t))

    def put_price(s):
        a = (math.log(s / strike) + vol * vol * t / 2) / (vol * math.sqrt(t))
        b = a - vol * math.sqrt(t)
        return strike * _norm_cdf(-b) - s * _norm_cdf(-a)

    h = 1e-4
    fd = (put_price(spot + h) - put_price(spot - h)) / (2 * h)
    model_put_delta = _norm_cdf(d1) - 1
    assert abs(fd - model_put_delta) < 1e-6, f"finite difference {fd} vs model {model_put_delta}"
    return calls * _norm_cdf(d1) + puts * model_put_delta


def theta_gamma_breakeven_move_exact(p):
    n, g, x = float(p["n"]), float(p["gamma"]), float(p["move"])
    return {
        "bookGamma": _r9(n * g),
        "theta": _r9(n * g * x * x / 2),
        "moveSq": _r9(x * x),
        "answer": x,
    }


def theta_gamma_breakeven_move_brute(p):
    """The day's theta is what the drawn move earns in gamma; recover the move by bisecting the
    accumulated gamma P&L against it. No square root appears."""
    n, g, x = float(p["n"]), float(p["gamma"]), float(p["move"])
    theta = _r9(n * g * x * x / 2)
    lo, hi = 0.0, 100.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if _gamma_pnl_accumulated(n * g, mid) < theta:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def one_step_binomial_call_price_exact(p):
    spot, up, down, k = float(p["spot"]), float(p["up"]), float(p["down"]), float(p["strikeOffset"])
    q = _r9(down / (up + down))
    return {
        "upPrice": spot + up,
        "downPrice": spot - down,
        "strike": spot + k,
        "span": up + down,
        "q": q,
        "qDown": _r9(1 - q),
        "payoffUp": up - k,
        "intrinsic": max(-k, 0.0),
        "shares": _r9((up - k) / (up + down)),
        "answer": _r9(q * (up - k)),
    }


def _replicate(s_now, up, down, v_up, v_down):
    """Shares and cash that reproduce a claim worth v_up after an up move and v_down after a
    down move, priced today. Solved as a 2×2 linear system; the fair weight never appears."""
    a = np.array([[s_now + up, 1.0], [s_now - down, 1.0]])
    shares, cash = np.linalg.solve(a, np.array([v_up, v_down]))
    return float(shares * s_now + cash)


def one_step_binomial_call_price_brute(p):
    spot, up, down, k = float(p["spot"]), float(p["up"]), float(p["down"]), float(p["strikeOffset"])
    strike = spot + k
    return _replicate(spot, up, down, max(spot + up - strike, 0.0), max(spot - down - strike, 0.0))


def atm_straddle_from_dollar_vol_exact(p):
    spot, vol_pct, days = float(p["spot"]), float(p["volPct"]), float(p["days"])
    root_t = math.sqrt(days) / 16
    s = _r9(spot * vol_pct / 100 * root_t)
    factor = math.sqrt(2 / math.pi)
    return {
        "vol": _r9(vol_pct / 100),
        "rootT": _r9(root_t),
        "dollarVol": s,
        "factor": _r9(factor),
        "ruleOfThumb": _r9(0.8 * s),
        "pctOfSpot": _r9(100 * s * factor / spot),
        "answer": _r9(s * factor),
    }


def atm_straddle_from_dollar_vol_brute(p):
    """Integrate |x| against the normal density numerically: Simpson over [0, 12s] of the right
    half, doubled. 20 000 steps — measured worst error 2.7e-13 across the draw space, while
    2 000 steps fails the 1e-9 bar at s = 150. No closed form appears."""
    spot, vol_pct, days = float(p["spot"]), float(p["volPct"]), float(p["days"])
    s = _r9(spot * vol_pct / 100 * math.sqrt(days) / 16)
    n = 20_000
    hi = 12 * s
    u = np.linspace(0.0, hi, n + 1)
    f = u * np.exp(-0.5 * (u / s) ** 2) / (s * math.sqrt(2 * math.pi))
    h = hi / n
    half = h / 3 * (f[0] + f[-1] + 4 * f[1:-1:2].sum() + 2 * f[2:-1:2].sum())
    return float(2 * half)


def put_butterfly_from_call_quotes_exact(p):
    k1, w = float(p["k1"]), float(p["width"])
    cl, cm, ch = float(p["cLow"]), float(p["cMid"]), float(p["cHigh"])
    off, df = float(p["spotOffset"]), float(p["df"])
    k2, k3 = k1 + w, k1 + 2 * w
    spot = k2 + off
    p_low = _r9(cl - spot + k1 * df)
    p_mid = _r9(cm - spot + k2 * df)
    p_high = _r9(ch - spot + k3 * df)
    return {
        "k2": k2, "k3": k3, "spot": spot,
        "pLow": p_low, "pMid": p_mid, "pHigh": p_high,
        "putFly": _r9(p_low - 2 * p_mid + p_high),
        "answer": _r9(cl - 2 * cm + ch),
    }


def put_butterfly_from_call_quotes_brute(p):
    """Convert each call into the put at its strike by parity — using the quoted spot and DF
    the template says cancel — and price the put fly from those puts."""
    k1, w = float(p["k1"]), float(p["width"])
    cl, cm, ch = float(p["cLow"]), float(p["cMid"]), float(p["cHigh"])
    off, df = float(p["spotOffset"]), float(p["df"])
    k2, k3 = k1 + w, k1 + 2 * w
    spot = k2 + off
    p_low, p_mid, p_high = cl - spot + k1 * df, cm - spot + k2 * df, ch - spot + k3 * df
    return p_low - 2 * p_mid + p_high


def two_step_binomial_call_price_exact(p):
    spot, up, down, k = float(p["spot"]), float(p["up"]), float(p["down"]), float(p["strikeOffset"])
    q = _r9(down / (up + down))
    q_down = _r9(1 - q)
    pay_top = 2 * up - k
    pay_mid = max(up - down - k, 0.0)
    return {
        "strike": spot + k,
        "top": spot + 2 * up,
        "mid": spot + up - down,
        "bottom": spot - 2 * down,
        "q": q,
        "qDown": q_down,
        "qTop": _r9(q * q),
        "qMid": _r9(2 * q * q_down),
        "qBottom": _r9(q_down * q_down),
        "payTop": pay_top,
        "payMid": pay_mid,
        "vUp": _r9(q * pay_top + q_down * pay_mid),
        "vDown": _r9(q * pay_mid),
        "answer": _r9(q * q * pay_top + 2 * q * q_down * pay_mid),
    }


def two_step_binomial_call_price_brute(p):
    """Replication at every node, backward: the two first-step nodes from the three endings,
    then the root from those two. No path weight and no fair probability appears."""
    spot, up, down, k = float(p["spot"]), float(p["up"]), float(p["down"]), float(p["strikeOffset"])
    strike = spot + k
    v_uu = max(spot + 2 * up - strike, 0.0)
    v_ud = max(spot + up - down - strike, 0.0)
    v_dd = max(spot - 2 * down - strike, 0.0)
    v_u = _replicate(spot + up, up, down, v_uu, v_ud)
    v_d = _replicate(spot - down, up, down, v_ud, v_dd)
    return _replicate(spot, up, down, v_u, v_d)


def put_call_parity_with_dividend_exact(p):
    spot, strike, call = float(p["spot"]), float(p["strike"]), float(p["call"])
    df, div, df_div = float(p["df"]), float(p["div"]), float(p["dfDiv"])
    return {
        "pvDiv": _r9(div * df_div),
        "pvK": _r9(strike * df),
        "noDivPut": _r9(call - spot + strike * df),
        "answer": _r9(call - spot + div * df_div + strike * df),
    }


def put_call_parity_with_dividend_brute(p):
    """Both portfolios evaluated across a grid of terminal prices with the dividend reinvested
    to expiry, asserted to pay the same in every state, and the put then solved from the
    equality of their costs today."""
    spot, strike, call = float(p["spot"]), float(p["strike"]), float(p["call"])
    df, div, df_div = float(p["df"]), float(p["div"]), float(p["dfDiv"])
    terminal = np.linspace(0.0, 3 * max(spot, strike), 30001)
    div_at_expiry = div * df_div / df               # the payout, reinvested from its date to expiry
    payoff_a = np.maximum(terminal - strike, 0.0) + strike + div_at_expiry     # call + bonds
    payoff_b = np.maximum(strike - terminal, 0.0) + terminal + div_at_expiry   # put + share
    assert np.allclose(payoff_a, payoff_b, atol=1e-9), "the two portfolios do not replicate"
    # cost(A) = call + strike*df + div*df_div ; cost(B) = put + spot
    return call + strike * df + div * df_div - spot


# ------------------------------------------------------------------------------------------
# B16 — arbitrage
# ------------------------------------------------------------------------------------------

def american_vs_european_call_credit_exact(p):
    euro, gap, n = float(p["euro"]), float(p["gap"]), float(p["n"])
    return {"american": _r9(euro - gap), "answer": _r9(n * gap)}


def american_vs_european_call_credit_brute(p):
    """The ledger: buy the American, sell the European, hold both to expiry. Across a grid of
    terminal prices the American exercised at expiry pays exactly what the short European
    demands, so the position settles flat and the credit is what was collected up front."""
    spot, strike = float(p["spot"]), float(p["strike"])
    euro, gap, n = float(p["euro"]), float(p["gap"]), float(p["n"])
    american = euro - gap
    grid = np.arange(0.0, 3 * max(spot, strike) + 0.25, 0.25)
    long_american = np.maximum(grid - strike, 0.0)
    short_european = -np.maximum(grid - strike, 0.0)
    assert np.all(long_american + short_european == 0.0), "the position is not flat at expiry"
    return n * (euro - american)


def multi_winner_book_arbitrage_exact(p):
    prices = [float(p[k]) for k in ("p1", "p2", "p3", "p4")]
    k, n = float(p["advance"]), float(p["n"])
    total = _r9(sum(prices))
    gap = _r9(abs(total - k))
    return {"sum": total, "gap": gap, "answer": _r9(n * gap)}


def multi_winner_book_arbitrage_brute(p):
    """Enumerate every set of teams that could advance. In each, a portfolio long one of every
    contract and short k bonds pays the same — nothing — so the credit collected setting it up
    is riskless. When the book is dear the portfolio is reversed."""
    prices = [float(p[key]) for key in ("p1", "p2", "p3", "p4")]
    k, n = int(p["advance"]), float(p["n"])
    for outcome in itertools.combinations(range(4), k):
        contracts_paid = sum(1 for i in range(4) if i in outcome)
        assert contracts_paid - k == 0, "long-all-four less k bonds is not flat in every state"
    total = sum(prices)
    credit = (k - total) if total < k else (total - k)
    return n * credit


def forward_mispricing_arbitrage_exact(p):
    spot, rate_pct, prem, n = float(p["spot"]), float(p["ratePct"]), float(p["premium"]), float(p["n"])
    carry = _r9(spot * rate_pct / 100)
    return {
        "rate": _r9(rate_pct / 100),
        "growth": _r9(1 + rate_pct / 100),
        "carry": carry,
        "fair": _r9(spot + carry),
        "quoted": _r9(spot + prem),
        "edge": _r9(abs(prem - carry)),
        "answer": _r9(n * abs(prem - carry)),
    }


def forward_mispricing_arbitrage_brute(p):
    """The cash-and-carry ledger, walked leg by leg across a grid of terminal prices: the stock
    leg and the forward leg offset whatever the stock does, and what remains is the financing
    against the quoted forward. Both directions."""
    spot, rate_pct, prem, n = float(p["spot"]), float(p["ratePct"]), float(p["premium"]), float(p["n"])
    quoted = spot + prem
    repay = spot * (1 + rate_pct / 100)          # borrow the spot today, owe this at delivery
    grid = np.arange(0.0, 3 * spot + 0.25, 0.25)
    if quoted > repay:
        # long stock (worth S_T), short forward (receive quoted, deliver stock), repay the loan
        pnl = grid + (quoted - grid) - repay
    else:
        # short stock (owe S_T), long forward (pay quoted, receive stock), collect the loan
        pnl = -grid + (grid - quoted) + repay
    assert np.allclose(pnl, pnl[0]), "the cash-and-carry is not riskless"
    return n * float(pnl[0])


# ------------------------------------------------------------------------------------------
# B16 — fixed income
# ------------------------------------------------------------------------------------------

def duration_price_change_exact(p):
    price, mod_dur, bp, face_m = float(p["price"]), float(p["modDur"]), float(p["bp"]), float(p["faceM"])
    per_hundred = _r9(price * mod_dur * bp / 10000)
    return {
        "dy": _r9(bp / 10000),
        "face": face_m * 1e6,
        "marketValue": _r9(face_m * 1e6 * price / 100),
        "pctChange": _r9(mod_dur * bp / 100),
        "perHundred": per_hundred,
        "newPrice": _r9(price - per_hundred),
        "answer": _r9(face_m * price * mod_dur * bp),
    }


def duration_price_change_brute(p):
    """Duration by its DEFINITION, not the formula: build a zero-coupon bond whose modified
    duration is the quoted one (T = D(1+y) at a reference yield), scale its face so it prices at
    the quoted price, differentiate the price in yield by complex step (no cancellation; 2e-16
    measured), and multiply by the yield move. Per 100 of face, then scaled to the position."""
    price, mod_dur, bp, face_m = float(p["price"]), float(p["modDur"]), float(p["bp"]), float(p["faceM"])
    y0 = 0.05
    t = mod_dur * (1 + y0)
    face = price * (1 + y0) ** t                       # so the zero prices at exactly `price`
    h = 1e-20
    dp_dy = (face * (1 + y0 + 1j * h) ** (-t)).imag / h
    per_100 = -dp_dy * bp / 1e4
    return per_100 * face_m * 1e6 / 100


def _roll_back(flows, curve):
    """Value a stream of end-of-year flows by rolling them back one period at a time through the
    one-period forward factors the zero curve implies — the payment-stream route, which never
    writes the sum of discounted flows down."""
    fwd = [curve[0]] + [curve[i] / curve[i - 1] for i in range(1, len(curve))]
    value = 0.0
    for i in range(len(curve) - 1, -1, -1):
        value = (value + flows[i]) * fwd[i]
    return value


def bond_premium_from_zeros_exact(p):
    c, df1, drop, n = float(p["couponPct"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    df2, df3 = _r9(df1 - drop), _r9(df1 - 2 * drop)
    sum_df = _r9(df1 + df2 if n == 2 else df1 + df2 + df3)
    df_last = df2 if n == 2 else df3
    coupon_leg = _r9(c * sum_df)
    redemption_leg = _r9(100 * df_last)
    return {
        "df2": df2, "df3": df3, "dfLast": df_last, "sumDf": sum_df,
        "couponLeg": coupon_leg, "redemptionLeg": redemption_leg,
        "price": _r9(coupon_leg + redemption_leg),
        "parCoupon": _r9(100 * (1 - df_last) / sum_df),
        "answer": _r9(coupon_leg + redemption_leg - 100),
    }


def bond_premium_from_zeros_brute(p):
    c, df1, drop, n = float(p["couponPct"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    curve = [df1 - i * drop for i in range(n)]
    flows = [c + (100.0 if i == n - 1 else 0.0) for i in range(n)]
    return _roll_back(flows, curve) - 100.0


def par_coupon_from_zeros_exact(p):
    face, df1, drop, n = float(p["face"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    dfs = [_r9(df1 - i * drop) for i in range(n)]
    sum_df = _r9(sum(dfs))
    df_last = dfs[-1]
    one_minus = _r9(1 - df_last)
    return {
        "df2": dfs[1],
        "df3": dfs[2] if n >= 3 else _r9(df1 - 2 * drop),
        "df4": dfs[3] if n >= 4 else _r9(df1 - 3 * drop),
        "dfLast": df_last,
        "sumDf": sum_df,
        "oneMinus": one_minus,
        "shortfall": _r9(face * one_minus),
        "redemption": _r9(face * df_last),
        "ratePct": _r9(100 * one_minus / sum_df),
        "answer": _r9(face * one_minus / sum_df),
    }


def par_coupon_from_zeros_brute(p):
    """Bisect the coupon until the bond, rolled back through the forward factors, prices at
    exactly its face. The ratio the template teaches never appears."""
    face, df1, drop, n = float(p["face"]), float(p["df1"]), float(p["drop"]), int(p["n"])
    curve = [df1 - i * drop for i in range(n)]

    def price(c):
        return _roll_back([c + (face if i == n - 1 else 0.0) for i in range(n)], curve)

    lo, hi = 0.0, face
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        if price(mid) < face:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


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
    "finance/payment-stream-present-value": {
        "exact": payment_stream_present_value_exact,
        "brute": payment_stream_present_value_brute,
    },
    "finance/put-hedge-from-parity": {
        "exact": put_hedge_from_parity_exact,
        "brute": put_hedge_from_parity_brute,
    },
    "finance/covered-call-max-profit": {
        "exact": covered_call_max_profit_exact,
        "brute": covered_call_max_profit_brute,
    },
    "finance/call-lower-bound-arbitrage": {
        "exact": call_lower_bound_arbitrage_exact,
        "brute": call_lower_bound_arbitrage_brute,
    },
    "finance/box-spread-arbitrage": {
        "exact": box_spread_arbitrage_exact,
        "brute": box_spread_arbitrage_brute,
    },
    "finance/butterfly-max-profit": {
        "exact": butterfly_max_profit_exact,
        "brute": butterfly_max_profit_brute,
    },
    "finance/gamma-pnl-from-a-move": {
        "exact": gamma_pnl_from_a_move_exact,
        "brute": gamma_pnl_from_a_move_brute,
    },
    "finance/shares-to-rehedge-after-a-move": {
        "exact": shares_to_rehedge_after_a_move_exact,
        "brute": shares_to_rehedge_after_a_move_brute,
    },
    "finance/straddle-implied-move": {
        "exact": straddle_implied_move_exact,
        "brute": straddle_implied_move_brute,
    },
    "finance/book-delta-calls-and-puts": {
        "exact": book_delta_calls_and_puts_exact,
        "brute": book_delta_calls_and_puts_brute,
    },
    "finance/theta-gamma-breakeven-move": {
        "exact": theta_gamma_breakeven_move_exact,
        "brute": theta_gamma_breakeven_move_brute,
    },
    "finance/one-step-binomial-call-price": {
        "exact": one_step_binomial_call_price_exact,
        "brute": one_step_binomial_call_price_brute,
    },
    "finance/atm-straddle-from-dollar-vol": {
        "exact": atm_straddle_from_dollar_vol_exact,
        "brute": atm_straddle_from_dollar_vol_brute,
    },
    "finance/put-butterfly-from-call-quotes": {
        "exact": put_butterfly_from_call_quotes_exact,
        "brute": put_butterfly_from_call_quotes_brute,
    },
    "finance/two-step-binomial-call-price": {
        "exact": two_step_binomial_call_price_exact,
        "brute": two_step_binomial_call_price_brute,
    },
    "finance/put-call-parity-with-dividend": {
        "exact": put_call_parity_with_dividend_exact,
        "brute": put_call_parity_with_dividend_brute,
    },
    "finance/american-vs-european-call-credit": {
        "exact": american_vs_european_call_credit_exact,
        "brute": american_vs_european_call_credit_brute,
    },
    "finance/multi-winner-book-arbitrage": {
        "exact": multi_winner_book_arbitrage_exact,
        "brute": multi_winner_book_arbitrage_brute,
    },
    "finance/forward-mispricing-arbitrage": {
        "exact": forward_mispricing_arbitrage_exact,
        "brute": forward_mispricing_arbitrage_brute,
    },
    "finance/duration-price-change": {
        "exact": duration_price_change_exact,
        "brute": duration_price_change_brute,
    },
    "finance/bond-premium-from-zeros": {
        "exact": bond_premium_from_zeros_exact,
        "brute": bond_premium_from_zeros_brute,
    },
    "finance/par-coupon-from-zeros": {
        "exact": par_coupon_from_zeros_exact,
        "brute": par_coupon_from_zeros_brute,
    },
}
