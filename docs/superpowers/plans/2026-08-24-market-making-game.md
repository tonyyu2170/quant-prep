# Market-Making Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable timed game where the player quotes a two-way market on a problem-bank quantity and a bot picks them off when the quote is wrong.

**Architecture:** The scoring rule is a pure function in the engine package with no React, clock, or storage — the same shape as `grade.ts`. Bank-facing metadata (quote units, round selection) lives in `content/problems/market.ts` because the engine package must not import content. The UI is one client component holding a per-round clock, plus a small round-indexed sparkline.

**Tech Stack:** TypeScript, Next.js App Router, React 19, Vitest + Testing Library, existing `@qp/engine` workspace package.

**Spec:** `docs/superpowers/specs/2026-08-24-market-making-game-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/engine/src/market.ts` | Scoring rule and session summary. Pure — knows nothing about the bank or React. |
| `packages/engine/test/market.test.ts` | Every scoring branch, plus the summary diagnosis. |
| `content/problems/market.ts` | Quote-unit derivation over the draw space; round selection. Needs `PROBLEMS`, so it cannot live in the engine. |
| `content/problems/market.test.ts` | Every eligible template resolves to a finite unit; the round mix holds. |
| `components/charts/PnlSparkline.tsx` | Round-indexed cumulative P&L with a zero line. |
| `components/MarketRunner.tsx` | Per-round clock, quote entry, in-place settlement, session end. |
| `components/MarketRunner.test.tsx` | Timeout penalty, submit-settles, inverted quote rejected. |
| `app/game/market-maker/page.tsx` | Route; picks the seed client-side like `app/test/[preset]/page.tsx`. |
| `app/page.tsx` | Replace the "Coming next" line with a real link. |

---

## Task 1: The scoring rule

**Files:**
- Create: `packages/engine/src/market.ts`
- Test: `packages/engine/test/market.test.ts`
- Modify: `packages/engine/src/index.ts` (add one export line)

- [ ] **Step 1: Write the failing test**

Create `packages/engine/test/market.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CREDIT_CAP, isValidQuote, settle, summarizeMarket } from "../src/market";

describe("settle", () => {
  // unit 1 throughout unless stated, so "units" and raw numbers coincide and the
  // arithmetic in these expectations is readable.
  it("pays credit that shrinks with width when truth lands inside", () => {
    expect(settle({ bid: 16, ask: 20 }, 18, 1).pnl).toBe(CREDIT_CAP - 4);
    expect(settle({ bid: 10, ask: 30 }, 18, 1).pnl).toBe(CREDIT_CAP - 20);
    expect(settle({ bid: 16, ask: 20 }, 18, 1).traded).toBe(false);
  });

  it("floors credit at zero rather than going negative on an absurdly wide market", () => {
    const r = settle({ bid: -1000, ask: 1000 }, 18, 1);
    expect(r.pnl).toBe(0);
    expect(r.traded).toBe(false);
  });

  it("loses the distance when the bot lifts the offer", () => {
    const r = settle({ bid: 16, ask: 20 }, 24, 1);
    expect(r.traded).toBe("lifted");
    expect(r.pnl).toBe(-4);
  });

  it("loses the distance when the bot hits the bid", () => {
    const r = settle({ bid: 16, ask: 20 }, 11, 1);
    expect(r.traded).toBe("hit");
    expect(r.pnl).toBe(-5);
  });

  it("charges the full credit cap for not quoting at all", () => {
    expect(settle(null, 18, 1).pnl).toBe(-CREDIT_CAP);
    expect(settle(null, 18, 1).quoted).toBe(false);
  });

  it("treats a zero-width quote as legal — full credit on an exact hit, picked off otherwise", () => {
    expect(settle({ bid: 18, ask: 18 }, 18, 1).pnl).toBe(CREDIT_CAP);
    expect(settle({ bid: 18, ask: 18 }, 19, 1).pnl).toBe(-1);
  });

  it("measures width, centre error and P&L in units, not raw values", () => {
    // unit 0.01: a probability quoted in percentage points.
    const r = settle({ bid: 0.38, ask: 0.46 }, 0.628, 0.01);
    expect(r.widthUnits).toBeCloseTo(8, 9);
    expect(r.pnl).toBeCloseTo(-16.8, 9);
    expect(r.centreErrorUnits).toBeCloseTo(20.8, 9);
  });

  it("rejects inverted quotes and non-finite ones", () => {
    expect(isValidQuote(20, 16)).toBe(false);
    expect(isValidQuote(16, 16)).toBe(true);
    expect(isValidQuote(16, 20)).toBe(true);
    expect(isValidQuote(NaN, 20)).toBe(false);
  });
});

describe("summarizeMarket", () => {
  const inside = () => settle({ bid: 17, ask: 19 }, 18, 1);        // tight, right
  const missed = () => settle({ bid: 17, ask: 19 }, 40, 1);        // tight, badly wrong

  it("totals P&L and counts pick-offs", () => {
    const s = summarizeMarket([inside(), inside(), missed()]);
    expect(s.rounds).toBe(3);
    expect(s.pickedOff).toBe(1);
    expect(s.totalPnl).toBeCloseTo(2 * (CREDIT_CAP - 2) - 21, 9);
  });

  it("names the failure when markets are too tight for the centring", () => {
    const s = summarizeMarket([missed(), missed(), missed(), inside()]);
    expect(s.diagnosis).toContain("too tight");
  });

  it("names the failure when markets are well centred but too wide to earn", () => {
    const wide = settle({ bid: -30, ask: 70 }, 18, 1);   // never picked off, zero credit
    const s = summarizeMarket([wide, wide, wide, wide]);
    expect(s.pickedOff).toBe(0);
    expect(s.diagnosis).toContain("too wide");
  });

  it("summarises an empty session without dividing by zero", () => {
    const s = summarizeMarket([]);
    expect(s.rounds).toBe(0);
    expect(s.totalPnl).toBe(0);
    expect(Number.isFinite(s.avgWidthUnits)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/engine/test/market.test.ts`
Expected: FAIL — `Failed to resolve import "../src/market"`.

- [ ] **Step 3: Write the implementation**

Create `packages/engine/src/market.ts`:

```ts
/** The player's two-way quote, in the quantity's own scale (not scaled units). */
export interface Quote { bid: number; ask: number }

export interface MarketResult {
  /** false when no trade happened — either truth landed inside, or no quote was made. */
  traded: false | "lifted" | "hit";
  /** Distinguishes "quoted a market nobody traded" from "never quoted". */
  quoted: boolean;
  widthUnits: number;
  centreErrorUnits: number;
  pnl: number;
}

// MEASURED, NOT INVENTED (spec §5). Under the unit rule in content/problems/market.ts the
// median inter-quartile answer spread across the 219 eligible templates is 35.8 units. A cap
// at 40 therefore makes a market as wide as the typical uncertainty worth nothing, so credit
// is earned only by quoting tighter than the quantity's own spread.
//
// This value is what keeps the two degenerate strategies unattractive without banning them:
// quoting absurdly wide floors at 0 (legal, worthless), and refusing to quote costs a full 40
// (strictly worse than quoting wide, which is the point — a market maker who will not quote is
// worse than one who quotes badly).
//
// It is the only free parameter in the game. Revisit after real play.
export const CREDIT_CAP = 40;

/** Inverted quotes are refused at the input rather than scored. Zero width is legal. */
export function isValidQuote(bid: number, ask: number): boolean {
  return Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid;
}

export function settle(quote: Quote | null, truth: number, unit: number): MarketResult {
  if (quote === null) {
    return { traded: false, quoted: false, widthUnits: 0, centreErrorUnits: 0, pnl: -CREDIT_CAP };
  }
  const { bid, ask } = quote;
  const widthUnits = (ask - bid) / unit;
  const centreErrorUnits = Math.abs((bid + ask) / 2 - truth) / unit;
  const base = { quoted: true as const, widthUnits, centreErrorUnits };
  if (truth > ask) return { ...base, traded: "lifted", pnl: (ask - truth) / unit };
  if (truth < bid) return { ...base, traded: "hit", pnl: (truth - bid) / unit };
  return { ...base, traded: false, pnl: Math.max(0, CREDIT_CAP - widthUnits) };
}

export interface MarketSummary {
  rounds: number;
  totalPnl: number;
  pickedOff: number;
  avgWidthUnits: number;
  avgCentreErrorUnits: number;
  diagnosis: string;
}

// A bare P&L cannot distinguish the two opposite mistakes, which have opposite fixes. The
// thresholds: a third is the pick-off rate above which width is not paying for the risk it
// takes, and a market only earns anything at all below CREDIT_CAP wide.
export function summarizeMarket(results: readonly MarketResult[]): MarketSummary {
  const rounds = results.length;
  const mean = (f: (r: MarketResult) => number) =>
    rounds === 0 ? 0 : results.reduce((a, r) => a + f(r), 0) / rounds;
  const pickedOff = results.filter((r) => r.traded !== false).length;
  const avgWidthUnits = mean((r) => r.widthUnits);
  const avgCentreErrorUnits = mean((r) => r.centreErrorUnits);
  const rate = rounds === 0 ? 0 : pickedOff / rounds;

  let diagnosis =
    "Balanced — your width is roughly matched to how well you are centred. Push tighter and watch the pick-off rate.";
  if (rounds === 0) {
    diagnosis = "No rounds played.";
  } else if (rate > 1 / 3) {
    diagnosis = `Your markets are too tight for how well you are centred. A width of ${avgWidthUnits.toFixed(1)} only pays if your centre is usually within ${(avgWidthUnits / 2).toFixed(1)} — yours is off by ${avgCentreErrorUnits.toFixed(1)}. Widen until the pick-off rate falls under a third, then work on centring.`;
  } else if (avgWidthUnits >= CREDIT_CAP) {
    diagnosis = `You are rarely picked off, but at an average width of ${avgWidthUnits.toFixed(1)} you earn nothing for it — credit runs out at ${CREDIT_CAP}. Tighten until you start getting picked off about a third of the time.`;
  }

  return {
    rounds,
    totalPnl: results.reduce((a, r) => a + r.pnl, 0),
    pickedOff,
    avgWidthUnits,
    avgCentreErrorUnits,
    diagnosis,
  };
}
```

- [ ] **Step 4: Export it from the package**

Modify `packages/engine/src/index.ts` — add after the `export * from "./srs";` line:

```ts
export * from "./market";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run packages/engine/test/market.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 6: Watch the gate fail — required by the repo's standing rule**

Temporarily invert the pick-off branch in `market.ts`: change `if (truth > ask)` to `if (truth < ask)`.
Run: `npx vitest run packages/engine/test/market.test.ts`
Expected: FAIL on "loses the distance when the bot lifts the offer".
Then **revert the change** and re-run to confirm PASS. A checker nobody has watched fail is not evidence.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/market.ts packages/engine/src/index.ts packages/engine/test/market.test.ts
git commit -m "feat(market): the scoring rule — free width, paid for"
```

---

## Task 2: Quote units and round selection

**Files:**
- Create: `content/problems/market.ts`
- Test: `content/problems/market.test.ts`

- [ ] **Step 1: Write the failing test**

Create `content/problems/market.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MARKET_TEMPLATES, marketRounds, unitOf } from "./market";
import { PROBLEMS } from ".";

describe("quote units", () => {
  it("excludes multiple-choice templates and keeps everything else", () => {
    expect(MARKET_TEMPLATES.length).toBe(PROBLEMS.filter((t) => !t.choices).length);
    expect(MARKET_TEMPLATES.some((t) => t.choices)).toBe(false);
  });

  it("gives every eligible template a finite, positive unit", () => {
    // The unit rule targets a p5-p95 spread near 100 units. Measured across the bank on
    // 2026-08-24 the real range was 36-280. A template whose answers stop scaling like the
    // rest is one where a single CREDIT_CAP has stopped meaning the same thing — which is
    // what this test exists to catch.
    for (const t of MARKET_TEMPLATES) {
      const u = unitOf(t);
      expect(Number.isFinite(u), `${t.id}: unit is not finite`).toBe(true);
      expect(u, `${t.id}: unit must be positive`).toBeGreaterThan(0);
    }
  });

  it("quotes a probability in percentage points", () => {
    // Any template whose answers all live in 0-1 must come out at 0.01.
    const p = MARKET_TEMPLATES.find((t) => t.id === "bayes/base-rate-test")!;
    expect(p, "expected bayes/base-rate-test to exist").toBeTruthy();
    expect(unitOf(p)).toBeCloseTo(0.01, 12);
  });
});

describe("marketRounds", () => {
  it("draws 12 rounds in a 3/6/3 difficulty mix with no repeated template", () => {
    const rounds = marketRounds(4242);
    expect(rounds.length).toBe(12);
    const byDiff = (d: 1 | 2 | 3) => rounds.filter((r) => r.template.difficulty === d).length;
    expect([byDiff(1), byDiff(2), byDiff(3)]).toEqual([3, 6, 3]);
    expect(new Set(rounds.map((r) => r.template.id)).size).toBe(12);
  });

  it("is deterministic in the seed, and different across seeds", () => {
    expect(marketRounds(7).map((r) => r.template.id)).toEqual(marketRounds(7).map((r) => r.template.id));
    expect(marketRounds(7).map((r) => r.template.id)).not.toEqual(marketRounds(8).map((r) => r.template.id));
  });

  it("carries a finite truth, a positive unit and a non-empty statement on every round", () => {
    for (const r of marketRounds(99)) {
      expect(Number.isFinite(r.truth), `${r.template.id}: truth not finite`).toBe(true);
      expect(r.unit).toBeGreaterThan(0);
      expect(r.statement.length).toBeGreaterThan(10);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/problems/market.test.ts`
Expected: FAIL — cannot resolve `./market`.

- [ ] **Step 3: Write the implementation**

Create `content/problems/market.ts`:

```ts
import { drawParams, makeRng, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from ".";
import { forEachLegalDraw } from "./draw-space";

/** Choice templates have no quantity to quote on — `answerKey` resolves to a label index. */
export const MARKET_TEMPLATES: ProblemTemplate[] = PROBLEMS.filter((t) => !t.choices);

const quantile = (sorted: readonly number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

// Sweeping a template's whole legal space is O(tuples) and some are large, so the answers are
// computed at most once per template. A session touches twelve of them.
const answerCache = new Map<string, number[]>();

function answersOf(t: ProblemTemplate): number[] {
  const hit = answerCache.get(t.id);
  if (hit) return hit;
  const out: number[] = [];
  forEachLegalDraw(t, (p) => out.push(t.derived(p)[t.answerKey] as number));
  out.sort((a, b) => a - b);
  answerCache.set(t.id, out);
  return out;
}

/**
 * The unit the player quotes in — percentage points for a probability, whole counts for a
 * count, a power of ten for money.
 *
 * Derived from the template's WHOLE legal draw space, never from the drawn answer: that is
 * what keeps it from leaking the magnitude of the specific question, and what makes it stable
 * enough to be worth caching. Normalising every template to a spread near 100 units is the
 * only reason one CREDIT_CAP can mean the same thing on a probability and on a four-figure
 * expected value.
 */
export function unitOf(t: ProblemTemplate): number {
  const a = answersOf(t);
  const spread = quantile(a, 0.95) - quantile(a, 0.05);
  if (!(spread > 0)) return 1; // a template with a single answer has no scale to derive
  return 10 ** Math.round(Math.log10(spread / 100));
}

export interface MarketRound {
  template: ProblemTemplate;
  params: Params;
  statement: string;
  truth: number;
  unit: number;
}

/** 3 L1, 6 L2, 3 L3 — the shape the existing sim ladders use. */
const MIX: readonly (1 | 2 | 3)[] = [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3];

export function marketRounds(seed: number): MarketRound[] {
  const rng = makeRng(seed);
  const used = new Set<string>();
  return MIX.map((d) => {
    const pool = MARKET_TEMPLATES.filter((t) => t.difficulty === d && !used.has(t.id));
    const t = pool[Math.floor(rng() * pool.length)];
    used.add(t.id);
    const params = drawParams(t, Math.floor(rng() * 2 ** 31));
    const derived = t.derived(params);
    return {
      template: t,
      params,
      statement: t.statement(params, derived),
      truth: derived[t.answerKey] as number,
      unit: unitOf(t),
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/problems/market.test.ts`
Expected: PASS, 6 tests.

If the `bayes/base-rate-test` assertion fails because that template's answer is not a
probability, swap the id for one whose answers all lie in 0–1 (find one with
`npx tsx tools/probe.ts bayes` and check its answers) and keep the assertion — the claim being
pinned is that probabilities come out at 0.01, not that one specific template exists.

- [ ] **Step 5: Watch the gate fail**

Temporarily change `MIX` to `[1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3]` (four L1, five L2).
Run: `npx vitest run content/problems/market.test.ts`
Expected: FAIL on the 3/6/3 assertion. Revert and re-run to confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add content/problems/market.ts content/problems/market.test.ts
git commit -m "feat(market): quote units derived from the draw space, and round selection"
```

---

## Task 3: The P&L sparkline

**Files:**
- Create: `components/charts/PnlSparkline.tsx`

No separate test file. This component has one branch (empty series) and otherwise renders SVG
geometry with no logic worth pinning; `MarketRunner.test.tsx` in Task 4 renders it as a child,
which catches a crash. Do not add a snapshot test — snapshots of generated SVG break on every
cosmetic change and assert nothing about behaviour.

- [ ] **Step 1: Write the component**

Create `components/charts/PnlSparkline.tsx`:

```tsx
"use client";

/**
 * Cumulative P&L across the rounds of one session. Deliberately NOT a reuse of
 * components/charts/LineChart.tsx: that one is date-indexed (SeriesPoint, Date.parse, and an
 * empty state about "two days of drilling"), while this is round-indexed and needs a zero
 * line, because P&L crosses zero and a stats series never does.
 */
export default function PnlSparkline({ pnls, totalRounds }: { pnls: readonly number[]; totalRounds: number }) {
  const W = 220, H = 56, PAD = 4;
  const cum: number[] = [];
  let run = 0;
  for (const p of pnls) { run += p; cum.push(run); }

  const lo = Math.min(0, ...cum), hi = Math.max(0, ...cum);
  const span = hi - lo || 1;
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - 2 * PAD);
  const x = (i: number) => PAD + (totalRounds <= 1 ? 0 : (i / (totalRounds - 1)) * (W - 2 * PAD));
  const last = cum.length ? cum[cum.length - 1] : 0;
  const stroke = last >= 0 ? "var(--teal)" : "var(--bad)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
         aria-label={`Cumulative profit and loss over ${pnls.length} rounds`} style={{ display: "block" }}>
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--card-border)" strokeWidth={1} />
      {cum.length > 1 && (
        <polyline fill="none" stroke={stroke} strokeWidth={2}
                  points={cum.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      )}
      {cum.length > 0 && <circle cx={x(cum.length - 1)} cy={y(last)} r={2.5} fill={stroke} />}
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean exit, no output.

- [ ] **Step 3: Commit**

```bash
git add components/charts/PnlSparkline.tsx
git commit -m "feat(market): round-indexed P&L sparkline with a zero line"
```

---

## Task 4: The runner

**Files:**
- Create: `components/MarketRunner.tsx`
- Test: `components/MarketRunner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/MarketRunner.test.tsx`:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MarketRunner from "./MarketRunner";
import { CREDIT_CAP } from "@qp/engine";

afterEach(() => vi.useRealTimers());

describe("MarketRunner", () => {
  it("settles a submitted quote in place and shows the round P&L", () => {
    render(<MarketRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: "-99999" } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: "99999" } });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    // An absurdly wide market is never picked off and floors at zero credit.
    expect(screen.getByTestId("round-pnl")).toHaveTextContent("0");
    expect(screen.getByTestId("settlement")).toHaveTextContent(/no trade/i);
  });

  it("refuses an inverted quote without consuming the round", () => {
    render(<MarketRunner seed={4242} />);
    const round = screen.getByTestId("round-counter").textContent;
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    expect(screen.getByTestId("quote-hint")).toBeInTheDocument();
    expect(screen.getByTestId("round-counter").textContent).toBe(round);
    expect(screen.queryByTestId("settlement")).not.toBeInTheDocument();
  });

  it("charges the full credit cap when the clock runs out with no quote", () => {
    vi.useFakeTimers();
    render(<MarketRunner seed={4242} />);
    act(() => { vi.advanceTimersByTime(26_000); });
    expect(screen.getByTestId("round-pnl")).toHaveTextContent(String(-CREDIT_CAP));
    expect(screen.getByTestId("settlement")).toHaveTextContent(/did not quote/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/MarketRunner.test.tsx`
Expected: FAIL — cannot resolve `./MarketRunner`.

- [ ] **Step 3: Write the implementation**

Create `components/MarketRunner.tsx`:

```tsx
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isValidQuote, settle, summarizeMarket, type MarketResult } from "@qp/engine";
import { marketRounds } from "@/content/problems/market";
import PnlSparkline from "./charts/PnlSparkline";

const ROUND_S = 25;

const unitLabel = (unit: number) =>
  unit === 0.01 ? "percentage points" : unit === 1 ? "whole units" : `units of ${unit}`;
const inUnits = (value: number, unit: number) => (value / unit).toFixed(1);

export default function MarketRunner({ seed }: { seed: number }) {
  const rounds = useMemo(() => marketRounds(seed), [seed]);
  const [index, setIndex] = useState(0);
  const [bid, setBid] = useState("");
  const [ask, setAsk] = useState("");
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [settled, setSettled] = useState<MarketResult | null>(null);
  const [remaining, setRemaining] = useState(ROUND_S);
  const endAt = useRef(Date.now() + ROUND_S * 1000);

  const done = index >= rounds.length;
  const round = done ? rounds[rounds.length - 1] : rounds[index];

  const commit = useCallback((r: MarketResult) => {
    setSettled(r);
    setResults((rs) => [...rs, r]);
  }, []);

  // The clock runs only while a round is unsettled. Reading a deadline from a ref rather than
  // counting ticks keeps it honest when the tab is backgrounded and setInterval throttles.
  useEffect(() => {
    if (done || settled) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) commit(settle(null, round.truth, round.unit));
    }, 250);
    return () => clearInterval(t);
  }, [done, settled, round, commit]);

  function submit() {
    const b = Number(bid), a = Number(ask);
    if (bid.trim() === "" || ask.trim() === "" || !isValidQuote(b, a)) { setHint(true); return; }
    // The player types in units; the rule settles in the quantity's own scale.
    commit(settle({ bid: b * round.unit, ask: a * round.unit }, round.truth, round.unit));
  }

  function next() {
    setIndex((i) => i + 1);
    setSettled(null); setBid(""); setAsk(""); setHint(false);
    endAt.current = Date.now() + ROUND_S * 1000;
    setRemaining(ROUND_S);
  }

  if (done) {
    const s = summarizeMarket(results);
    return (
      <div className="container" style={{ padding: "56px 24px", maxWidth: 720 }}>
        <p className="microlabel">Session complete</p>
        <h1 className="mono" style={{ fontSize: 38, margin: "8px 0 20px" }} data-testid="total-pnl">
          {s.totalPnl >= 0 ? "+" : ""}{s.totalPnl.toFixed(1)}
        </h1>
        <PnlSparkline pnls={results.map((r) => r.pnl)} totalRounds={rounds.length} />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", margin: "22px 0" }}>
          <div><p className="microlabel">Picked off</p><b className="mono" style={{ fontSize: 22 }}>{s.pickedOff} / {s.rounds}</b></div>
          <div><p className="microlabel">Avg width</p><b className="mono" style={{ fontSize: 22 }}>{s.avgWidthUnits.toFixed(1)}</b></div>
          <div><p className="microlabel">Avg centre error</p><b className="mono" style={{ fontSize: 22 }}>{s.avgCentreErrorUnits.toFixed(1)}</b></div>
        </div>
        <p style={{ maxWidth: "60ch", color: "var(--body)" }} data-testid="diagnosis">{s.diagnosis}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="microlabel" data-testid="round-counter">Round {index + 1} of {rounds.length}</span>
        <span className="mono" style={{ fontSize: 22 }}>{settled ? "—" : `0:${String(remaining).padStart(2, "0")}`}</span>
        <span className="microlabel">P&amp;L <b className="mono">{results.reduce((a, r) => a + r.pnl, 0).toFixed(1)}</b></span>
      </div>
      <PnlSparkline pnls={results.map((r) => r.pnl)} totalRounds={rounds.length} />
      <p style={{ fontSize: 17, margin: "20px 0", lineHeight: 1.5 }}>{round.statement}</p>

      {settled ? (
        <div>
          <p data-testid="settlement" style={{ fontSize: 16 }}>
            {!settled.quoted
              ? "You did not quote."
              : settled.traded === "lifted" ? `Bot lifts your offer. Truth ${inUnits(round.truth, round.unit)}.`
              : settled.traded === "hit" ? `Bot hits your bid. Truth ${inUnits(round.truth, round.unit)}.`
              : `No trade — truth ${inUnits(round.truth, round.unit)} landed inside your market.`}
          </p>
          <p className="mono" style={{ fontSize: 30, margin: "10px 0" }} data-testid="round-pnl">
            {settled.pnl >= 0 ? "+" : ""}{settled.pnl.toFixed(1)}
          </p>
          <button onClick={next} style={{ padding: "8px 18px" }}>
            {index + 1 === rounds.length ? "See results" : "Next round"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <label><span className="microlabel">Your bid</span><br />
            <input aria-label="bid" className="mono" value={bid} inputMode="decimal"
                   onChange={(e) => { setBid(e.target.value); setHint(false); }} style={{ width: 90 }} /></label>
          <span style={{ opacity: 0.4, paddingBottom: 6 }}>@</span>
          <label><span className="microlabel">Your ask</span><br />
            <input aria-label="ask" className="mono" value={ask} inputMode="decimal"
                   onChange={(e) => { setAsk(e.target.value); setHint(false); }} style={{ width: 90 }} /></label>
          <button onClick={submit} style={{ padding: "8px 18px" }}>Quote</button>
          <span className="microlabel" style={{ paddingBottom: 6 }}>in {unitLabel(round.unit)}</span>
        </div>
      )}
      <p data-testid={hint ? "quote-hint" : undefined} aria-live="polite" className="mono"
         style={{ color: "var(--bad)", fontSize: 12, minHeight: 18, marginTop: 10 }}>
        {hint ? "bid and ask must both be numbers, and the ask cannot be below the bid" : ""}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/MarketRunner.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Watch the gate fail**

In `MarketRunner.tsx`, temporarily change the timeout line
`if (left === 0) commit(settle(null, round.truth, round.unit));`
to `if (left === 0) commit(settle({ bid: round.truth, ask: round.truth }, round.truth, round.unit));`
Run: `npx vitest run components/MarketRunner.test.tsx`
Expected: FAIL on "charges the full credit cap when the clock runs out". Revert and re-run to confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add components/MarketRunner.tsx components/MarketRunner.test.tsx
git commit -m "feat(market): the runner — 25s round clock, in-place settlement"
```

---

## Task 5: Route and landing page

**Files:**
- Create: `app/game/market-maker/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the route**

Create `app/game/market-maker/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import MarketRunner from "@/components/MarketRunner";

export default function MarketMakerPage() {
  // Seed is picked on the client only, so server and client markup agree on first paint —
  // the same reason app/test/[preset]/page.tsx defers it.
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => { setSeed(Math.floor(Math.random() * 2 ** 31)); }, []);
  if (seed === null) return null;
  return <MarketRunner seed={seed} />;
}
```

- [ ] **Step 2: Link it from the landing page**

Modify `app/page.tsx`. Add to the `sims` array, after the `sequences-sprint` entry:

```ts
  { href: "/game/market-maker", label: "Market-making game", sub: "Quote a two-way market · 12 rounds · 25s each" },
```

Then remove the now-paid promise. Change these two lines:

```tsx
        Missed problems come back on a spaced schedule in <Link href="/review">Review</Link> ·
        {" "}Coming next: market-making game
```

to:

```tsx
        Missed problems come back on a spaced schedule in <Link href="/review">Review</Link>
```

- [ ] **Step 3: Verify the whole suite and the build**

```bash
npx vitest run
npx tsc --noEmit
npx next build
```

Expected: every test file passes, typecheck silent, build completes.

- [ ] **Step 4: Play it once — this is the CREDIT_CAP experiment**

```bash
npm run dev
```

Open `http://localhost:3000/game/market-maker` and play a full session. Confirm: the clock
counts down and letting it expire charges −40; a submitted quote settles in place; the
sparkline crosses the zero line when P&L goes negative; the end-screen diagnosis matches how
you actually played.

**`CREDIT_CAP` has been waiting for exactly this.** If good play cannot clear zero, or if
quoting maximally wide feels like the best strategy, record the observation and change the
constant — that is what it is there for, and the comment beside it says so.

- [ ] **Step 5: Commit**

```bash
git add app/game/market-maker/page.tsx app/page.tsx
git commit -m "feat(market): the route, and the landing page promise finally paid"
```

---

## Task 6: Guard against silent content drift

**Files:**
- Modify: `content/problems/registry.test.ts`

- [ ] **Step 1: Add the pin**

The market game silently loses a template whenever a new one ships as a choice template. Add
this test inside the existing top-level `describe` in `content/problems/registry.test.ts`:

```ts
  it("every non-choice template is playable in the market game", () => {
    // MARKET_TEMPLATES is derived so it cannot drift out of sync — but the COUNT can fall,
    // and a sudden drop is how we would learn that a batch shipped as choice templates by
    // accident. 219 was the count on 2026-08-24, at a bank of 224.
    expect(MARKET_TEMPLATES.length).toBe(PROBLEMS.length - PROBLEMS.filter((t) => t.choices).length);
    expect(MARKET_TEMPLATES.length).toBeGreaterThanOrEqual(219);
  });
```

Add to that file's imports:

```ts
import { MARKET_TEMPLATES } from "./market";
```

- [ ] **Step 2: Run the suite**

Run: `npx vitest run content/problems/registry.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add content/problems/registry.test.ts
git commit -m "test(market): pin the playable-template count against silent drift"
```

---

## Self-review notes

**Spec coverage.** §3 scoring → Task 1. §4 units → Task 2. §5 `CREDIT_CAP` → measured before
this plan was written (40, from a median inter-quartile spread of 35.8 units across the 219
eligible templates) and recorded in the constant's own comment in Task 1, with Task 5 Step 4 as
the stated re-tuning experiment. §6 round and session → Task 2 (3/6/3 mix, no repeats) and
Task 4 (clock, early submit advancing immediately, in-place settlement). §7 sparkline →
Task 3, including the recorded reason for not reusing `LineChart`. §8 files and watched-fail →
Tasks 1–6, with explicit fail-watching steps in Tasks 1, 2 and 4. §9 deferrals → nothing in
this plan touches the leaderboard, `/stats`, or Supabase.

**Naming consistency.** `settle`, `isValidQuote`, `summarizeMarket`, `CREDIT_CAP`, `Quote`,
`MarketResult`, `MarketSummary`, `MARKET_TEMPLATES`, `unitOf`, `marketRounds`, `MarketRound`,
`PnlSparkline`, `MarketRunner` are spelled identically in every task that uses them. The
`quoted` flag on `MarketResult` is defined in Task 1 and consumed in Task 4.

**Resolved during self-review.** An earlier draft distinguished "did not quote" from "quoted
but nobody traded" by testing `widthUnits === 0 && pnl === -CREDIT_CAP`, which a zero-width
quote wrong by exactly 40 units would also match. `MarketResult.quoted` replaces that inference
with a fact.
