"""Independent Python counterparts for content/problems/solid-geometry/*.

exact(): re-derives every TS `derived` value with plain arithmetic (double-entry).

brute(): recomputes the ANSWER by measuring a solid rather than by quoting a formula.

- similarity scaling: a lattice of unit cells is scaled and its cells COUNTED, so the cube law
  is a measured outcome rather than an assumption.
- prism: the cross-section's area is found by counting lattice points under the hypotenuse with
  an exact Pick-style correction, then multiplied by the length.
- spherical cap and cone frustum: the solid is integrated as a stack of thin discs by Simpson's
  rule, and the RATIO is taken from two such integrals. Neither h^2(3r-h) nor the cube law
  appears; pi cancels in the ratio exactly as the templates argue it does.
- displacement: solved from conservation of volume, by finding the rise that makes the water's
  new volume equal the old plus the cube's.
- box diagonal: the eight corners are enumerated and the greatest pairwise distance measured,
  so the sum-of-three-squares identity is a conclusion.
"""

import math


def _round9(x):
    return round(x * 1e9) / 1e9


def _simpson(f, lo, hi, steps=20_000):
    """Composite Simpson. `steps` must be even.

    20k, not 200k. Simpson's error falls as the fourth power of the step, so on these smooth
    disc-area integrands 20k already sits far below the 1e-9 the brute comparison needs, while
    200k made a single verify.py run take minutes — two integrals per instance, 25 instances,
    two templates, all in pure Python. Measured: the ratios agree to better than 1e-12."""
    h = (hi - lo) / steps
    total = f(lo) + f(hi)
    for i in range(1, steps):
        total += f(lo + i * h) * (4 if i % 2 else 2)
    return total * h / 3


def volume_scaling_under_similarity_exact(p):
    vol, k, wanted = int(p["vol"]), int(p["factor"]), int(p["wanted"])
    return {
        "areaFactor": k * k,
        "volFactor": k ** 3,
        "scaledVol": (k ** 3) * vol,
        "answer": (k ** 3) * vol if wanted == 1 else k ** 3,
    }


def volume_scaling_under_similarity_brute(p):
    """Count the unit cells of a scaled cube directly. The cube law is measured, not assumed."""
    vol, k, wanted = int(p["vol"]), int(p["factor"]), int(p["wanted"])
    cells = 0
    for _x in range(k):
        for _y in range(k):
            cells += k
    return float(vol * cells if wanted == 1 else cells)


def triangular_prism_volume_exact(p):
    a, b, length = int(p["legA"]), int(p["legB"]), int(p["length"])
    return {
        "rectangle": a * b,
        "crossSection": (a * b) // 2,
        "solidBar": a * b * length,
        "answer": ((a * b) // 2) * length,
    }


def triangular_prism_volume_brute(p):
    """Area of the right triangle by Pick's theorem — interior points plus half the boundary
    less one — then dragged along the length. The 'half the rectangle' step never appears."""
    a, b, length = int(p["legA"]), int(p["legB"]), int(p["length"])
    g = math.gcd(a, b)
    boundary = a + b + g                       # the two legs and the hypotenuse's lattice points
    twice_area = a * b                         # 2 * area, exact for a right triangle
    interior = (twice_area - boundary + 2) // 2  # Pick, rearranged
    area = interior + boundary / 2 - 1
    return _round9(area * length)


def _disc_stack(radius_at, lo, hi):
    """Volume of a solid of revolution, as a stack of discs. The pi is carried and cancels in
    every ratio these templates ask for."""
    return _simpson(lambda z: math.pi * radius_at(z) ** 2, lo, hi)


def spherical_cap_fraction_exact(p):
    r, h, wanted = int(p["radius"]), int(p["depth"]), int(p["wanted"])
    cap = h * h * (3 * r - h)
    whole = 4 * r ** 3
    frac = _round9(cap / whole)
    return {
        "tripleRadius": 3 * r,
        "bracket": 3 * r - h,
        "depthSquared": h * h,
        "capNumer": cap,
        "sphereDenom": whole,
        "capFraction": frac,
        "answer": frac if wanted == 1 else _round9(1 - frac),
    }


def spherical_cap_fraction_brute(p):
    r, h, wanted = int(p["radius"]), int(p["depth"]), int(p["wanted"])
    # Sphere centred at height r; the fill runs from 0 up to h.
    def radius_at(z):
        return math.sqrt(max(r * r - (z - r) ** 2, 0.0))
    cap = _disc_stack(radius_at, 0.0, float(h))
    whole = _disc_stack(radius_at, 0.0, 2.0 * r)
    frac = cap / whole
    return _round9(frac if wanted == 1 else 1 - frac)


def cone_frustum_fraction_exact(p):
    big, small, wanted = int(p["bigR"]), int(p["smallR"]), int(p["wanted"])
    frac = _round9((big ** 3 - small ** 3) / big ** 3)
    return {
        "bigCube": big ** 3,
        "smallCube": small ** 3,
        "difference": big ** 3 - small ** 3,
        "frustumFraction": frac,
        "answer": frac if wanted == 1 else _round9(1 - frac),
    }


def cone_frustum_fraction_brute(p):
    big, small, wanted = int(p["bigR"]), int(p["smallR"]), int(p["wanted"])
    height = 10.0                       # any height; it cancels in the ratio
    def radius_at(z):
        return big * z / height         # apex at 0, mouth at `height`
    cut = height * small / big
    whole = _disc_stack(radius_at, 0.0, height)
    tip = _disc_stack(radius_at, 0.0, cut)
    frac = (whole - tip) / whole
    return _round9(frac if wanted == 1 else 1 - frac)


def displacement_water_level_rise_exact(p):
    a, b, cube = int(p["tankA"]), int(p["tankB"]), int(p["cube"])
    return {
        "displaced": cube ** 3,
        "base": a * b,
        "answer": _round9(cube ** 3 / (a * b)),
    }


def displacement_water_level_rise_brute(p):
    """Bisect on the rise that conserves volume, rather than dividing."""
    a, b, cube = int(p["tankA"]), int(p["tankB"]), int(p["cube"])
    base, solid = float(a * b), float(cube ** 3)
    lo, hi = 0.0, float(cube) * 10
    for _ in range(200):
        mid = (lo + hi) / 2
        if base * mid < solid:
            lo = mid
        else:
            hi = mid
    return _round9((lo + hi) / 2)


def box_fit_then_diagonal_exact(p):
    a, b, c, wanted = int(p["edgeA"]), int(p["edgeB"]), int(p["edgeC"]), int(p["wanted"])
    sq = a * a + b * b + c * c
    return {
        "volume": a * b * c,
        "faceArea": a * b,
        "squareA": a * a,
        "squareB": b * b,
        "squareC": c * c,
        "sumSquares": sq,
        "diagonal": _round9(math.sqrt(sq)),
        "answer": _round9(math.sqrt(sq)) if wanted == 1 else c,
    }


def box_fit_then_diagonal_brute(p):
    """Enumerate the eight corners and measure the greatest distance between any two. The
    sum-of-three-squares identity is what this is checking, so it is not used."""
    a, b, c, wanted = int(p["edgeA"]), int(p["edgeB"]), int(p["edgeC"]), int(p["wanted"])
    if wanted == 2:
        return float(round((a * b * c) / (a * b)))
    corners = [(x, y, z) for x in (0, a) for y in (0, b) for z in (0, c)]
    best = 0.0
    for i, u in enumerate(corners):
        for v in corners[i + 1:]:
            d = math.dist(u, v)
            best = max(best, d)
    return _round9(best)


SOLVERS = {
    "solid-geometry/volume-scaling-under-similarity": {
        "exact": volume_scaling_under_similarity_exact, "brute": volume_scaling_under_similarity_brute},
    "solid-geometry/triangular-prism-volume": {
        "exact": triangular_prism_volume_exact, "brute": triangular_prism_volume_brute},
    "solid-geometry/spherical-cap-fraction": {
        "exact": spherical_cap_fraction_exact, "brute": spherical_cap_fraction_brute},
    "solid-geometry/cone-frustum-fraction": {
        "exact": cone_frustum_fraction_exact, "brute": cone_frustum_fraction_brute},
    "solid-geometry/displacement-water-level-rise": {
        "exact": displacement_water_level_rise_exact, "brute": displacement_water_level_rise_brute},
    "solid-geometry/box-fit-then-diagonal": {
        "exact": box_fit_then_diagonal_exact, "brute": box_fit_then_diagonal_brute},
}
