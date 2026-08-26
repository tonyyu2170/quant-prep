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



# --- B22 --------------------------------------------------------------------------------
# Every brute below assembles a real matrix and measures it. Where the answer is an integer
# the measurement is Bareiss elimination (exact); where it is not, LAPACK is used and the
# quantity stays small enough that 1e-9 absolute is comfortable.

_PAIR = {
    1: ([2, 1, 1], [1, -1, -1]),
    2: ([2, 1, 2], [1, -2, 0]),
    3: ([2, 1, 0], [-1, 2, 0]),
    4: ([3, 2, 2], [2, -3, 0]),
    5: ([3, 1, 1], [-1, 3, 0]),
    6: ([2, 2, 1], [1, -1, 0]),
    7: ([4, 1, 2], [1, -2, -1]),
    8: ([2, 3, 1], [3, -2, 0]),
}

_MPAIR = {1: (1, 2), 2: (2, 3), 3: (3, 4), 4: (-2, -1), 5: (-3, -2)}


def solve_two_by_two_system_exact(p):
    x, y = int(p["x"]), int(p["y"])
    a1, b1, a2, b2 = int(p["a1"]), int(p["b1"]), int(p["a2"]), int(p["b2"])
    c1, c2 = a1 * x + b1 * y, a2 * x + b2 * y
    return {
        "c1": c1, "c2": c2,
        "det": a1 * b2 - a2 * b1,
        "numer": c1 * b2 - c2 * b1,
        "b1Abs": abs(b1), "b2Abs": abs(b2),
        "answer": x,
    }


def solve_two_by_two_system_brute(p):
    """numpy.linalg.solve returns the whole solution vector by LU, never forming the two
    determinants Cramer's rule is built from."""
    e = solve_two_by_two_system_exact(p)
    a = np.array([[float(p["a1"]), float(p["b1"])], [float(p["a2"]), float(p["b2"])]])
    rhs = np.array([float(e["c1"]), float(e["c2"])])
    return _round9(float(np.linalg.solve(a, rhs)[0]))


def singular_matrix_missing_entry_exact(p):
    a, k, c = int(p["a"]), int(p["k"]), int(p["c"])
    return {"b": a * k, "cross": a * k * c, "answer": k * c}


def singular_matrix_missing_entry_brute(p):
    """The determinant is a straight line in the missing entry, so measuring it at two points
    with Bareiss and extrapolating to its root finds the entry without ever writing bc/a."""
    a, k, c = int(p["a"]), int(p["k"]), int(p["c"])
    b = a * k
    at0 = _int_det([[a, b], [c, 0]])
    at1 = _int_det([[a, b], [c, 1]])
    slope = at1 - at0
    return _round9(-at0 / slope)


def projection_first_component_exact(p):
    a, r = _PAIR[int(p["shape"])]
    c, s = int(p["c"]), int(p["s"])
    aa = sum(v * v for v in a)
    b = [c * a[i] + s * r[i] for i in range(3)]
    return {
        "a1": a[0], "a2": a[1], "a3": a[2],
        "b1": b[0], "b2": b[1], "b3": b[2],
        "aa": aa, "ab": c * aa,
        "residual1": s * r[0],
        "answer": c * a[0],
    }


def projection_first_component_brute(p):
    """Least squares on a one-column design: lstsq minimises the distance directly and never
    forms the ratio of dot products the template teaches."""
    e = projection_first_component_exact(p)
    a = np.array([[float(e["a1"])], [float(e["a2"])], [float(e["a3"])]])
    b = np.array([float(e["b1"]), float(e["b2"]), float(e["b3"])])
    coef = np.linalg.lstsq(a, b, rcond=None)[0][0]
    return _round9(float(coef * e["a1"]))


def orthogonal_residual_squared_exact(p):
    a, r = _PAIR[int(p["shape"])]
    c, s = int(p["c"]), int(p["s"])
    aa = sum(v * v for v in a)
    rr = sum(v * v for v in r)
    b = [c * a[i] + s * r[i] for i in range(3)]
    return {
        "a1": a[0], "a2": a[1], "a3": a[2],
        "b1": b[0], "b2": b[1], "b3": b[2],
        "aa": aa, "rr": rr,
        "ab": c * aa,
        "bb": sum(v * v for v in b),
        "projSq": c * c * aa,
        "answer": s * s * rr,
    }


def orthogonal_residual_squared_brute(p):
    """A QR projection: the residual is b less its reconstruction from an orthonormal basis
    for the direction, and Pythagoras is never invoked."""
    e = orthogonal_residual_squared_exact(p)
    a = np.array([[float(e["a1"])], [float(e["a2"])], [float(e["a3"])]])
    b = np.array([float(e["b1"]), float(e["b2"]), float(e["b3"])])
    q, _ = np.linalg.qr(a)
    resid = b - q @ (q.T @ b)
    return _round9(float(resid @ resid))


def quadratic_through_three_points_exact(p):
    y1, y2, y3, t = int(p["y1"]), int(p["y2"]), int(p["y3"]), int(p["t"])
    d1 = y2 - y1
    d2 = y3 - 2 * y2 + y1
    return {
        "d1": d1,
        "dSecond": y3 - y2,
        "d2": d2,
        "steps": t - 1,
        "stepsLess": t - 2,
        "pairs": ((t - 1) * (t - 2)) // 2,
        "linearOnly": y1 + (t - 1) * d1,
        "answer": y1 + (t - 1) * d1 + (((t - 1) * (t - 2)) // 2) * d2,
    }


def quadratic_through_three_points_brute(p):
    """The Vandermonde system is actually solved for the three coefficients and the polynomial
    evaluated. No difference table is ever built."""
    y1, y2, y3, t = int(p["y1"]), int(p["y2"]), int(p["y3"]), int(p["t"])
    v = np.array([[1.0, 1.0, 1.0], [4.0, 2.0, 1.0], [9.0, 3.0, 1.0]])
    coef = np.linalg.solve(v, np.array([float(y1), float(y2), float(y3)]))
    return _round9(float(coef[0] * t * t + coef[1] * t + coef[2]))


def block_triangular_determinant_exact(p):
    return {"traceAll": int(p["t1"]) + int(p["t2"]), "answer": int(p["d1"]) * int(p["d2"])}


def block_triangular_determinant_brute(p):
    """A real 4x4 is assembled from companion blocks — with a deliberately non-zero top-right
    block — and Bareiss takes its determinant. The factorisation rule is what is under test,
    so it is never used, and the unstated block being irrelevant is demonstrated rather than
    assumed."""
    t1, d1, t2, d2 = int(p["t1"]), int(p["d1"]), int(p["t2"]), int(p["d2"])
    a = [[0, -d1], [1, t1]]
    dd = [[0, -d2], [1, t2]]
    top_right = [[7, -3], [2, 5]]
    m = [
        [a[0][0], a[0][1], top_right[0][0], top_right[0][1]],
        [a[1][0], a[1][1], top_right[1][0], top_right[1][1]],
        [0, 0, dd[0][0], dd[0][1]],
        [0, 0, dd[1][0], dd[1][1]],
    ]
    return _int_det(m)


def eigenvector_component_ratio_exact(p):
    m, lam, b, d = int(p["m"]), int(p["lam"]), int(p["b"]), int(p["d"])
    a = lam - b * m
    return {
        "a": a,
        "c": m * (lam - d),
        "gap": lam - a,
        "lamLessD": lam - d,
        "answer": m,
    }


def eigenvector_component_ratio_brute(p):
    """numpy.linalg.eig returns eigenvectors directly; the matching one is picked by its
    eigenvalue and its two components divided. The shifted system is never written down."""
    e = eigenvector_component_ratio_exact(p)
    lam = float(p["lam"])
    m = np.array([[float(e["a"]), float(p["b"])], [float(e["c"]), float(p["d"])]])
    vals, vecs = np.linalg.eig(m)
    idx = int(np.argmin(np.abs(vals.real - lam)))
    v = vecs[:, idx].real
    return _round9(float(v[1] / v[0]))


def determinant_after_row_operations_exact(p):
    return {"sign": -1, "scaled": int(p["det"]) * int(p["k"]), "answer": -int(p["det"]) * int(p["k"])}


def determinant_after_row_operations_brute(p):
    """A matrix with the stated determinant is built, the three operations are actually
    PERFORMED on its rows, and Bareiss measures what comes out. None of the three rules is
    used — they are what is being tested."""
    det, k, n, swaps = int(p["det"]), int(p["k"]), int(p["n"]), int(p["swaps"])
    m = [[det if (i == 0 and j == 0) else (1 if i == j else 0) for j in range(n)] for i in range(n)]
    for s in range(swaps):
        i, j = s % n, (s + 1) % n
        m[i], m[j] = m[j], m[i]
    m[0] = [k * v for v in m[0]]
    m[1] = [m[1][c] + 3 * m[0][c] for c in range(n)]
    return _int_det(m)


def matrix_power_times_a_vector_exact(p):
    m1, m2 = _MPAIR[int(p["shape"])]
    l1, l2 = int(p["lam1"]), int(p["lam2"])
    al, be, k = int(p["alpha"]), int(p["beta"]), int(p["k"])
    return {
        "m1": m1, "m2": m2,
        "a": l1 * m2 - l2 * m1,
        "b": l2 - l1,
        "c": m1 * m2 * (l1 - l2),
        "d": l2 * m2 - l1 * m1,
        "trace": l1 + l2,
        "det": l1 * l2,
        "x0": al + be,
        "y0": al * m1 + be * m2,
        "firstMode": al * l1 ** k,
        "secondMode": be * l2 ** k,
        "answer": al * l1 ** k + be * l2 ** k,
    }


def matrix_power_times_a_vector_brute(p):
    """The integer matrix is raised to the power by repeated multiplication and applied to the
    start vector. No eigenvalue, eigenvector or change of basis appears anywhere."""
    e = matrix_power_times_a_vector_exact(p)
    m = [[e["a"], e["b"]], [e["c"], e["d"]]]
    pw = _int_matpow(m, int(p["k"]))
    return pw[0][0] * e["x0"] + pw[0][1] * e["y0"]


def tridiagonal_determinant_exact(p):
    d, b, n = int(p["d"]), int(p["b"]), int(p["n"])
    bb = b * b
    prev, cur = 1, d
    for _ in range(2, n + 1):
        prev, cur = cur, d * cur - bb * prev
    return {
        "bb": bb,
        "two": d * d - bb,
        "three": d * (d * d - bb) - bb * d,
        "sizeLess": n - 1,
        "answer": cur,
    }


def tridiagonal_determinant_brute(p):
    """The band matrix is assembled entry by entry and Bareiss eliminates it. The continuant
    recursion the template teaches is never run."""
    d, b, n = int(p["d"]), int(p["b"]), int(p["n"])
    m = [[d if i == j else (b if abs(i - j) == 1 else 0) for j in range(n)] for i in range(n)]
    return _int_det(m)


SOLVERS = {
    "linear-algebra/solve-two-by-two-system": {
        "exact": solve_two_by_two_system_exact,
        "brute": solve_two_by_two_system_brute,
    },
    "linear-algebra/singular-matrix-missing-entry": {
        "exact": singular_matrix_missing_entry_exact,
        "brute": singular_matrix_missing_entry_brute,
    },
    "linear-algebra/projection-first-component": {
        "exact": projection_first_component_exact,
        "brute": projection_first_component_brute,
    },
    "linear-algebra/orthogonal-residual-squared": {
        "exact": orthogonal_residual_squared_exact,
        "brute": orthogonal_residual_squared_brute,
    },
    "linear-algebra/quadratic-through-three-points": {
        "exact": quadratic_through_three_points_exact,
        "brute": quadratic_through_three_points_brute,
    },
    "linear-algebra/block-triangular-determinant": {
        "exact": block_triangular_determinant_exact,
        "brute": block_triangular_determinant_brute,
    },
    "linear-algebra/eigenvector-component-ratio": {
        "exact": eigenvector_component_ratio_exact,
        "brute": eigenvector_component_ratio_brute,
    },
    "linear-algebra/determinant-after-row-operations": {
        "exact": determinant_after_row_operations_exact,
        "brute": determinant_after_row_operations_brute,
    },
    "linear-algebra/matrix-power-times-a-vector": {
        "exact": matrix_power_times_a_vector_exact,
        "brute": matrix_power_times_a_vector_brute,
    },
    "linear-algebra/tridiagonal-determinant": {
        "exact": tridiagonal_determinant_exact,
        "brute": tridiagonal_determinant_brute,
    },
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
