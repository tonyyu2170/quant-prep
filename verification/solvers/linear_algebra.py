"""Independent Python counterparts for content/problems/linear-algebra/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute(): recomputes the ANSWER without the identity the template teaches. Here that is easy
and unusually convincing: the matrix is BUILT and handed to LAPACK. numpy's eigenvalue,
determinant and inverse routines share no code path with a closed form in eigenvalues, so an
agreement is real evidence rather than the same formula typed twice.

- two-by-two eigenvalues: a matrix with the required trace and determinant is constructed as a
  companion matrix and `numpy.linalg.eigvals` is asked for its spectrum. The quadratic formula
  never appears.
- trace of a power: `numpy.linalg.matrix_power` on that same companion matrix, then a trace.
  The Newton recursion the template teaches is never run.
- constant-plus-diagonal determinant: aI+bJ is assembled entry by entry and `numpy.linalg.det`
  evaluates it. No eigenvalue reasoning.
- determinant scaling and power: a random matrix is RESCALED to have the stated determinant,
  then actually multiplied by the scale and raised to the power, and the determinant of the
  result is measured. The c**n and D**k rules are what is being tested, so neither is used.
- inverse of a constant-plus-diagonal: `numpy.linalg.inv` on the assembled matrix, reading the
  entry off. The two-eigenspace argument never appears.
- equicorrelation fit-then-inverse: the matrix is rebuilt by SEARCHING for the off-diagonal
  whose assembled determinant matches the quoted one, rather than by dividing the determinant
  by an eigenvalue power. The fit the template teaches is thereby re-derived, not copied.
"""

import numpy as np


def _round9(x):
    return round(x * 1e9) / 1e9


def _companion(trace, det):
    """A 2x2 with the given trace and determinant. Its characteristic polynomial is
    x^2 - trace*x + det by construction, which is the only property used."""
    return np.array([[0.0, -float(det)], [1.0, float(trace)]])


def _const_plus_diag(a, b, n):
    return np.full((n, n), float(b)) + float(a) * np.eye(n)


def _int_det(rows):
    """Exact determinant of an integer matrix, by Bareiss elimination.

    verify.py compares a brute result to the answer with an ABSOLUTE 1e-9 tolerance, so a
    float determinant is unusable the moment the answer passes about 1e6 — LAPACK returns
    83740234374.99973 for 83740234375, which is right to fourteen digits and still fails.
    Every brute route in this suite has to be exact, and for determinants that means integers.
    """
    n = len(rows)
    m = [list(map(int, r)) for r in rows]
    sign, prev = 1, 1
    for k in range(n - 1):
        if m[k][k] == 0:
            for i in range(k + 1, n):
                if m[i][k] != 0:
                    m[k], m[i] = m[i], m[k]
                    sign = -sign
                    break
            else:
                return 0
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                m[i][j] = (m[i][j] * m[k][k] - m[i][k] * m[k][j]) // prev
        prev = m[k][k]
    return sign * m[n - 1][n - 1]


def _int_matmul(a, b):
    n = len(a)
    return [[sum(a[i][k] * b[k][j] for k in range(n)) for j in range(n)] for i in range(n)]


def _int_matpow(m, k):
    out = [[1 if i == j else 0 for j in range(len(m))] for i in range(len(m))]
    for _ in range(k):
        out = _int_matmul(out, m)
    return out


def two_by_two_eigenvalues_exact(p):
    lo, hi, shift = int(p["lo"]), int(p["hi"]), int(p["shift"])
    return {
        "trace": lo + hi + 2 * shift,
        "det": (lo + shift) * (hi + shift),
        "disc": (hi - lo) * (hi - lo),
        "gap": hi - lo,
        "smaller": lo + shift,
        "answer": hi + shift,
    }


def two_by_two_eigenvalues_brute(p):
    e = two_by_two_eigenvalues_exact(p)
    vals = np.linalg.eigvals(_companion(e["trace"], e["det"]))
    return _round9(float(np.max(vals.real)))


def trace_of_a_matrix_power_exact(p):
    t, d, k = int(p["trace"]), int(p["det"]), int(p["power"])
    t2 = t * t - 2 * d
    t3 = t * t2 - d * t
    t4 = t * t3 - d * t2
    return {"squareTrace": t2, "cubeTrace": t3, "answer": t2 if k == 2 else t3 if k == 3 else t4}


def trace_of_a_matrix_power_brute(p):
    m = _companion(int(p["trace"]), int(p["det"]))
    return _round9(float(np.trace(np.linalg.matrix_power(m, int(p["power"])))))


def constant_plus_diagonal_determinant_exact(p):
    a, b, n = int(p["a"]), int(p["b"]), int(p["n"])
    return {
        "diagEntry": a + b,
        "offDiagCount": n - 1,
        "shifted": a + b * n,
        "tail": a ** (n - 1),
        "answer": (a ** (n - 1)) * (a + b * n),
    }


def constant_plus_diagonal_determinant_brute(p):
    """Assemble aI+bJ as integers and eliminate. Exact, and no eigenvalue reasoning anywhere."""
    a, b, n = int(p["a"]), int(p["b"]), int(p["n"])
    rows = [[b + (a if i == j else 0) for j in range(n)] for i in range(n)]
    return float(_int_det(rows))


def determinant_scaling_and_power_exact(p):
    n, c, d, k = int(p["n"]), int(p["scale"]), int(p["det"]), int(p["power"])
    return {
        "scaleFactor": c ** n,
        "scaledDet": (c ** n) * d,
        "detPowerAlone": d ** k,
        "answer": ((c ** n) * d) ** k,
    }


def determinant_scaling_and_power_brute(p):
    """Build a DENSE integer matrix whose determinant really is d, then really scale every
    entry and really raise it to the power, and eliminate for the determinant of the result.
    The c**n and D**k rules are the identity under test, so neither may be used to get here.

    The matrix starts as the identity with d in one corner and is then hit with integer row
    operations, which leave a determinant untouched while destroying the triangular shape —
    a triangular matrix would keep its determinant on the diagonal and test almost nothing."""
    n, c, d, k = int(p["n"]), int(p["scale"]), int(p["det"]), int(p["power"])
    m = [[0] * n for _ in range(n)]
    for i in range(n):
        m[i][i] = 1
    m[0][0] = d
    for src, dst, mult in ((0, 1, 2), (1, 2, -1), (2, 0, 3), (1, 0, 1)):
        if src < n and dst < n:
            for j in range(n):
                m[dst][j] += mult * m[src][j]
    assert _int_det(m) == d, "row operations must preserve the determinant"
    scaled = [[c * v for v in row] for row in m]
    return float(_int_det(_int_matpow(scaled, k)))


def inverse_of_a_constant_plus_diagonal_exact(p):
    a, b, n = int(p["a"]), int(p["b"]), int(p["n"])
    shifted = a + b * n
    return {
        "diagEntry": a + b,
        "shifted": shifted,
        "offDiagEntry": _round9(-b / (a * shifted)),
        "answer": _round9((shifted - b) / (a * shifted)),
    }


def inverse_of_a_constant_plus_diagonal_brute(p):
    inv = np.linalg.inv(_const_plus_diag(int(p["a"]), int(p["b"]), int(p["n"])))
    return _round9(float(inv[0, 0]))


def equicorrelation_fit_then_inverse_exact(p):
    a, b, n, wanted = int(p["a"]), int(p["b"]), int(p["n"]), int(p["wanted"])
    shifted = a + b * n
    tail = a ** (n - 1)
    inv_diag = _round9((shifted - b) / (a * shifted))
    inv_off = _round9(-b / (a * shifted))
    return {
        "diagEntry": a + b,
        "tailCount": n - 1,
        "det": tail * shifted,
        "tail": tail,
        "shifted": shifted,
        "recovered": b,
        "invDiag": inv_diag,
        "invOff": inv_off,
        "answer": inv_diag if wanted == 1 else inv_off,
    }


def equicorrelation_fit_then_inverse_brute(p):
    """SEARCH for the off-diagonal that reproduces the quoted determinant, then invert what that
    search built. The template's fit — divide the determinant by the ordinary eigenvalue's power
    — is what this is checking, so it must not be the method."""
    a, n, wanted = int(p["a"]), int(p["n"]), int(p["wanted"])
    target = float(equicorrelation_fit_then_inverse_exact(p)["det"])
    found = None
    for candidate in range(1, 200):
        if abs(np.linalg.det(_const_plus_diag(a, candidate, n)) - target) < 1e-6 * max(1.0, abs(target)):
            found = candidate
            break
    if found is None:
        raise AssertionError("no off-diagonal reproduces the quoted determinant")
    inv = np.linalg.inv(_const_plus_diag(a, found, n))
    return _round9(float(inv[0, 0] if wanted == 1 else inv[0, 1]))


SOLVERS = {
    "linear-algebra/two-by-two-eigenvalues": {
        "exact": two_by_two_eigenvalues_exact,
        "brute": two_by_two_eigenvalues_brute,
    },
    "linear-algebra/trace-of-a-matrix-power": {
        "exact": trace_of_a_matrix_power_exact,
        "brute": trace_of_a_matrix_power_brute,
    },
    "linear-algebra/constant-plus-diagonal-determinant": {
        "exact": constant_plus_diagonal_determinant_exact,
        "brute": constant_plus_diagonal_determinant_brute,
    },
    "linear-algebra/determinant-scaling-and-power": {
        "exact": determinant_scaling_and_power_exact,
        "brute": determinant_scaling_and_power_brute,
    },
    "linear-algebra/inverse-of-a-constant-plus-diagonal": {
        "exact": inverse_of_a_constant_plus_diagonal_exact,
        "brute": inverse_of_a_constant_plus_diagonal_brute,
    },
    "linear-algebra/equicorrelation-fit-then-inverse": {
        "exact": equicorrelation_fit_then_inverse_exact,
        "brute": equicorrelation_fit_then_inverse_brute,
    },
}
