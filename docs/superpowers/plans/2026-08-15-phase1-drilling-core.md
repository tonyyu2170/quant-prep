# QuantPrep Phase 1 — Drilling Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the publicly deployed drilling core: Optiver-style 80-in-8 timed sim + arithmetic/sequences drills + auth + attempt tracking + benchmark-seeded v4 stats dashboard, at $0.

**Architecture:** Next.js App Router on Vercel; pure-TS `packages/engine` (seeded RNG, grading, timed-session reducer) and `packages/generators` (arithmetic + sequence families with independent-solver tests); Supabase for user activity only (problems never in the DB); localStorage store for anonymous mode with merge-on-sign-in (merged rows flagged, never rankable). Design per spec §4 "Pink Paper"; reference mockups `.superpowers/brainstorm/35997-1786824505/content/key-screens-v2.html` (drill) and `key-screens-v4.html` (dashboard).

**Tech Stack:** Next 15 / React 19 / TypeScript 5, npm workspaces, Vitest + Testing Library, Playwright, @supabase/supabase-js + @supabase/ssr, next/font (Schibsted Grotesk + JetBrains Mono), hand-rolled SVG charts. No chart lib, no KaTeX yet (arrives with authored bank in Phase 1.5), no ESLint config (typecheck gates instead).

**Conventions for every task:** run commands from repo root `/Users/turdy/coding_fun/projects/quant-prep`. Commit after each green step-pair as written. Node ≥ 20 assumed. The spec at `docs/superpowers/specs/2026-08-15-quant-prep-site-design.md` is the source of truth; if plan and spec conflict, stop and flag.

**Deferred to Phase 1.5 by design (do NOT build now):** probability bank + Python `verification/` suite (generator correctness is gated by brute-force TS tests in this phase), user-vs-user leaderboards + server-side integrity checks, review queue writes, streaks table writes (schema ships now, unused), Google OAuth (optional user task at end), remaining sequence families beyond the 8 here (launch target ~30 is cumulative through 1.5).

---

## File Structure

```
quant-prep/
  package.json                    # npm workspaces root
  next.config.ts                  # transpilePackages for @qp/*
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  vercel.json                     # daily keepalive cron
  .github/workflows/ci.yml
  .env.local                      # NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY (user-provided)
  app/
    layout.tsx  globals.css  page.tsx
    login/page.tsx
    auth/callback/route.ts
    test/[preset]/page.tsx        # focus-mode timed runner
    drills/arithmetic/page.tsx
    drills/sequences/page.tsx
    stats/page.tsx
    api/keepalive/route.ts
  components/
    CommandBar.tsx  Footer.tsx
    TestRunner.tsx  DrillRunner.tsx  Results.tsx
    charts/LineChart.tsx  charts/BarChart.tsx
  lib/
    supabase/client.ts  supabase/server.ts
    store/types.ts  store/local.ts  store/supabase.ts  store/merge.ts  store/useStore.ts
  packages/engine/                # @qp/engine — pure TS
    package.json
    src/{index,types,rng,parse,grade,session,presets,stats}.ts
    test/{rng,parse,grade,session,presets,stats}.test.ts
  packages/generators/            # @qp/generators — pure TS
    package.json
    src/{index,arithmetic,sequences}.ts
    test/{arithmetic,sequences}.test.ts
  supabase/migrations/0001_init.sql
  e2e/test-run.spec.ts
```

---

### Task 1: Repo scaffold — workspaces, Next app shell, design tokens, fonts

**Files:** Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `components/CommandBar.tsx`, `components/Footer.tsx`, `packages/engine/package.json`, `packages/engine/src/index.ts`, `packages/generators/package.json`, `packages/generators/src/index.ts`

- [ ] **Step 1: Root package.json**

```json
{
  "name": "quant-prep",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@qp/engine": "*",
    "@qp/generators": "*",
    "@supabase/ssr": "^0.6",
    "@supabase/supabase-js": "^2",
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@playwright/test": "^1.49",
    "@testing-library/jest-dom": "^6",
    "@testing-library/react": "^16",
    "@types/node": "^22",
    "@types/react": "^19",
    "jsdom": "^25",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Workspace package manifests**

`packages/engine/package.json`:
```json
{ "name": "@qp/engine", "version": "0.1.0", "main": "src/index.ts", "types": "src/index.ts" }
```
`packages/generators/package.json`:
```json
{ "name": "@qp/generators", "version": "0.1.0", "main": "src/index.ts", "types": "src/index.ts", "dependencies": { "@qp/engine": "*" } }
```
`packages/engine/src/index.ts` and `packages/generators/src/index.ts` start as:
```ts
export {};
```

- [ ] **Step 3: next.config.ts, tsconfig.json, vitest.config.ts**

`next.config.ts`:
```ts
import type { NextConfig } from "next";
const config: NextConfig = { transpilePackages: ["@qp/engine", "@qp/generators"] };
export default config;
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "es2022"],
    "module": "esnext", "moduleResolution": "bundler",
    "strict": true, "noEmit": true, "esModuleInterop": true,
    "jsx": "preserve", "incremental": true, "isolatedModules": true,
    "resolveJsonModule": true, "skipLibCheck": true, "allowJs": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"], "@qp/engine": ["./packages/engine/src/index.ts"], "@qp/generators": ["./packages/generators/src/index.ts"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "e2e"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "jsdom", include: ["packages/**/test/**/*.test.ts", "lib/**/*.test.ts", "components/**/*.test.tsx"] },
  resolve: { alias: {
    "@qp/engine": path.resolve(__dirname, "packages/engine/src/index.ts"),
    "@qp/generators": path.resolve(__dirname, "packages/generators/src/index.ts"),
    "@": path.resolve(__dirname),
  }},
});
```

- [ ] **Step 4: Design tokens + layout + command bar + footer (spec §4 palette, verbatim hexes)**

`app/globals.css`:
```css
:root {
  --paper: #FFF1E5; --surface: #FFFAF4; --card-border: #F0DFD0; --rule: #EBD9C6;
  --ink: #33302E; --body: #4A453F; --muted: #8C8378; --faint: #A79886;
  --teal: #0D7680; --teal-on-ink: #4FB3BF;
  --good: #147D64; --bad: #B4231F;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--paper); color: var(--ink); }
body { font-family: var(--font-ui), sans-serif; line-height: 1.5; }
.mono { font-family: var(--font-mono), monospace; }
a { color: var(--teal); text-decoration: none; cursor: pointer; }
button { cursor: pointer; font: inherit; }
:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
.microlabel { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
```

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CommandBar from "@/components/CommandBar";
import Footer from "@/components/Footer";

const ui = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-ui" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "QuantPrep — free quant interview prep",
  description: "Free practice for quant trading interviews: timed numerical sims, sequences, probability, and firm-specific prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${mono.variable}`}>
      <body>
        <CommandBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

`components/CommandBar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/drills/arithmetic", label: "Drills" },
  { href: "/test/optiver-80in8", label: "Tests" },
  { href: "/stats", label: "Stats" },
];

export default function CommandBar() {
  const path = usePathname();
  if (path?.startsWith("/test/")) return null; // focus mode: chrome disappears (spec §5)
  const activeFor = (href: string) => path?.startsWith("/" + href.split("/")[1]);
  return (
    <nav style={{ background: "var(--ink)", color: "var(--paper)" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px" }}>
        <Link href="/" style={{ color: "var(--paper)", fontWeight: 800, letterSpacing: "-0.02em" }}>QuantPrep</Link>
        <div className="mono" style={{ fontSize: 13 }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={{ marginLeft: 18, color: activeFor(l.href) ? "var(--paper)" : "#C9BFB4", borderBottom: activeFor(l.href) ? "2px solid var(--teal-on-ink)" : "none", paddingBottom: 2 }}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" style={{ marginLeft: 18, color: "#C9BFB4" }}>Sign in</Link>
        </div>
      </div>
    </nav>
  );
}
```

`components/Footer.tsx` (disclaimer required by spec §5):
```tsx
export default function Footer() {
  return (
    <footer className="container" style={{ borderTop: "1px solid var(--rule)", marginTop: 64, padding: "20px 24px", fontSize: 12, color: "var(--muted)" }}>
      QuantPrep is independent — not affiliated with or endorsed by any firm. Free forever.
    </footer>
  );
}
```

`app/page.tsx` (minimal landing; polish lands in Task 15):
```tsx
import Link from "next/link";
export default function Home() {
  return (
    <div className="container" style={{ padding: "72px 24px" }}>
      <p className="microlabel">Free quant interview prep</p>
      <h1 style={{ fontSize: 44, letterSpacing: "-0.02em", margin: "10px 0 18px", maxWidth: "16ch" }}>Train like the OA is tomorrow.</h1>
      <p style={{ color: "var(--body)", maxWidth: "52ch" }}>Timed numerical sims in real test formats, sequences, and stats that show exactly where you stand. No paywall, ever.</p>
      <p style={{ marginTop: 26 }}>
        <Link href="/test/optiver-80in8" style={{ background: "var(--teal)", color: "#FFF6EC", borderRadius: 999, padding: "12px 24px", fontWeight: 700 }}>Start an 80-in-8 →</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Install and verify dev server**

Run: `npm install` then `npm run dev` — visit http://localhost:3000; expect the landing page with ink command bar, salmon background, footer disclaimer. Ctrl-C afterward.
Run: `npm run typecheck` — Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next app with Pink Paper tokens, command bar, landing shell"
```

---

### Task 2: Engine — types + seeded RNG

**Files:** Create: `packages/engine/src/types.ts`, `packages/engine/src/rng.ts`, `packages/engine/test/rng.test.ts`; Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Write the failing test** — `packages/engine/test/rng.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeRng, randInt, pick } from "../src/rng";

describe("seeded rng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng(42), b = makeRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });
  it("differs across seeds", () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });
  it("randInt stays inclusive within bounds", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = randInt(rng, 3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
  it("pick returns an element", () => {
    const rng = makeRng(7);
    expect(["a", "b", "c"]).toContain(pick(rng, ["a", "b", "c"]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rng`
Expected: FAIL — cannot resolve `../src/rng`.

- [ ] **Step 3: Write minimal implementation**

`packages/engine/src/types.ts`:
```ts
export type Topic = "arithmetic" | "sequences";

export interface Item {
  id: string;
  topic: Topic;
  prompt: string;            // e.g. "47 × 83" or "2, 5, 11, 23, ?"
  answer: number;
  rule?: string;             // sequences: human explanation, revealed post-answer
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
```

`packages/engine/src/rng.ts` (mulberry32):
```ts
import type { Rng } from "./types";

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
```

`packages/engine/src/index.ts`:
```ts
export * from "./types";
export * from "./rng";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- rng`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): types and seeded rng"
```

---

### Task 3: Engine — answer parsing + grading

**Files:** Create: `packages/engine/src/parse.ts`, `packages/engine/src/grade.ts`, `packages/engine/test/parse.test.ts`, `packages/engine/test/grade.test.ts`; Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/engine/test/parse.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseAnswer } from "../src/parse";

describe("parseAnswer", () => {
  it("parses integers, decimals, negatives, commas", () => {
    expect(parseAnswer("3901")).toBe(3901);
    expect(parseAnswer("-4")).toBe(-4);
    expect(parseAnswer("0.0098")).toBeCloseTo(0.0098);
    expect(parseAnswer("3,901")).toBe(3901);
    expect(parseAnswer("  12 ")).toBe(12);
  });
  it("parses simple fractions a/b", () => {
    expect(parseAnswer("1/102")).toBeCloseTo(1 / 102);
    expect(parseAnswer("-3/4")).toBeCloseTo(-0.75);
  });
  it("rejects garbage and division by zero", () => {
    expect(parseAnswer("abc")).toBeNull();
    expect(parseAnswer("")).toBeNull();
    expect(parseAnswer("1/0")).toBeNull();
    expect(parseAnswer("1/2/3")).toBeNull();
  });
});
```

`packages/engine/test/grade.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { grade } from "../src/grade";

describe("grade", () => {
  it("defaults to exact equality when no tolerance", () => {
    expect(grade(3901, 3901)).toBe(true);
    expect(grade(3900, 3901)).toBe(false);
  });
  it("applies relative tolerance", () => {
    expect(grade(0.0098, 1 / 102, { rel: 0.005 })).toBe(true);
    expect(grade(0.012, 1 / 102, { rel: 0.005 })).toBe(false);
  });
  it("applies absolute tolerance", () => {
    expect(grade(10.004, 10, { abs: 0.005 })).toBe(true);
    expect(grade(10.006, 10, { abs: 0.005 })).toBe(false);
  });
  it("uses the max of rel and abs when both given", () => {
    expect(grade(100.4, 100, { rel: 0.005, abs: 0.1 })).toBe(true); // rel bound 0.5 dominates
  });
  it("rejects NaN", () => {
    expect(grade(Number.NaN, 5, { rel: 0.1 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- parse grade`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write minimal implementation**

`packages/engine/src/parse.ts`:
```ts
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (s === "") return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const num = Number(frac[1]), den = Number(frac[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
```

`packages/engine/src/grade.ts`:
```ts
import type { Tolerance } from "./types";

export function grade(given: number, expected: number, tol: Tolerance = {}): boolean {
  if (!Number.isFinite(given)) return false;
  if (tol.rel === undefined && tol.abs === undefined) return given === expected;
  const bound = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(expected));
  return Math.abs(given - expected) <= bound;
}
```

Append to `packages/engine/src/index.ts`:
```ts
export * from "./parse";
export * from "./grade";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- parse grade`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): answer parsing and tolerance-aware grading"
```

---

### Task 4: Generators — arithmetic (difficulty-curved, independently verified)

**Files:** Create: `packages/generators/src/arithmetic.ts`, `packages/generators/test/arithmetic.test.ts`; Modify: `packages/generators/src/index.ts`

- [ ] **Step 1: Write the failing test** — `packages/generators/test/arithmetic.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { arithmeticItem, ARITH_OPS } from "../src/arithmetic";

function recompute(meta: Record<string, number | string>): number {
  const a = Number(meta.a), b = Number(meta.b);
  switch (meta.op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
    case "pct": return (a / 100) * b;
    case "dec": return Math.round(a * b * 100) / 100;
    default: throw new Error("unknown op " + meta.op);
  }
}

describe("arithmeticItem", () => {
  it("is deterministic per seed", () => {
    const x = arithmeticItem(makeRng(9), 2), y = arithmeticItem(makeRng(9), 2);
    expect({ ...x, id: "" }).toEqual({ ...y, id: "" });
  });
  it("answers verify against independent recomputation across 2000 draws and all difficulties", () => {
    const rng = makeRng(1234);
    for (let i = 0; i < 2000; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3;
      const item = arithmeticItem(rng, d);
      expect(item.answer, item.prompt).toBeCloseTo(recompute(item.meta), 10);
      expect(item.topic).toBe("arithmetic");
    }
  });
  it("division is always exact (integer quotient)", () => {
    const rng = makeRng(5);
    for (let i = 0; i < 500; i++) {
      const item = arithmeticItem(rng, 3);
      if (item.meta.op === "div") expect(Number.isInteger(item.answer)).toBe(true);
    }
  });
  it("uses every op over many draws", () => {
    const rng = makeRng(77);
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(String(arithmeticItem(rng, 2).meta.op));
    for (const op of ARITH_OPS) expect(seen.has(op)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- arithmetic`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation** — `packages/generators/src/arithmetic.ts`:

```ts
import { pick, randInt, type Item, type Rng } from "@qp/engine";

export const ARITH_OPS = ["add", "sub", "mul", "div", "pct", "dec"] as const;
export type ArithOp = (typeof ARITH_OPS)[number];

// Difficulty tunes operand sizes, mirroring how the real tests ramp.
const RANGES: Record<1 | 2 | 3, { small: [number, number]; big: [number, number]; mul: [number, number] }> = {
  1: { small: [2, 30], big: [11, 99], mul: [2, 12] },
  2: { small: [11, 99], big: [101, 999], mul: [11, 29] },
  3: { small: [21, 99], big: [101, 999], mul: [31, 99] },
};

let counter = 0;

export function arithmeticItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const r = RANGES[difficulty];
  const op = pick(rng, ARITH_OPS);
  let a: number, b: number, answer: number, prompt: string;
  switch (op) {
    case "add":
      a = randInt(rng, ...r.big); b = randInt(rng, ...r.big);
      answer = a + b; prompt = `${a} + ${b}`; break;
    case "sub":
      a = randInt(rng, ...r.big); b = randInt(rng, ...r.big);
      if (b > a) [a, b] = [b, a];
      answer = a - b; prompt = `${a} − ${b}`; break;
    case "mul":
      a = randInt(rng, ...r.mul); b = randInt(rng, ...r.mul);
      answer = a * b; prompt = `${a} × ${b}`; break;
    case "div": {
      b = randInt(rng, 3, difficulty === 1 ? 12 : 19);
      const q = randInt(rng, ...r.small);
      a = b * q; answer = q; prompt = `${a} ÷ ${b}`; break;
    }
    case "pct":
      a = pick(rng, difficulty === 1 ? [10, 25, 50] : [5, 15, 20, 35, 40, 60, 75, 85]);
      b = randInt(rng, 2, difficulty === 3 ? 96 : 40) * 10;
      answer = (a / 100) * b; prompt = `${a}% of ${b}`; break;
    case "dec":
      a = randInt(rng, 2, difficulty === 3 ? 99 : 40) / 10;
      b = randInt(rng, 2, 9);
      answer = Math.round(a * b * 100) / 100; prompt = `${a} × ${b}`; break;
  }
  return { id: `arith-${counter++}`, topic: "arithmetic", prompt, answer, meta: { op, a, b } };
}
```

Append to `packages/generators/src/index.ts`:
```ts
export * from "./arithmetic";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- arithmetic`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/generators && git commit -m "feat(generators): difficulty-curved arithmetic with independent verification"
```

---

### Task 5: Generators — sequences (8 families + per-family independent solvers)

**Files:** Create: `packages/generators/src/sequences.ts`, `packages/generators/test/sequences.test.ts`; Modify: `packages/generators/src/index.ts`

- [ ] **Step 1: Write the failing test** — `packages/generators/test/sequences.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { sequenceItem, SEQ_FAMILIES } from "../src/sequences";

// Independent verifiers: each re-derives the next term from the shown terms only.
const verify: Record<string, (terms: number[], answer: number) => boolean> = {
  arithmetic: (t, ans) => ans === t[t.length - 1] + (t[1] - t[0]),
  geometric: (t, ans) => ans === t[t.length - 1] * (t[1] / t[0]),
  quadratic: (t, ans) => {
    const d1 = t.slice(1).map((v, i) => v - t[i]);
    const dd = d1[1] - d1[0];
    return ans === t[t.length - 1] + d1[d1.length - 1] + dd;
  },
  interleaved: (t, ans) => {
    const evens = t.filter((_, i) => i % 2 === 0);
    const odds = t.filter((_, i) => i % 2 === 1);
    const stepE = evens[1] - evens[0];
    const stepO = odds[1] - odds[0];
    return t.length % 2 === 0 ? ans === evens[evens.length - 1] + stepE : ans === odds[odds.length - 1] + stepO;
  },
  "recur-linear": (t, ans) => {
    // t[n+1] = a*t[n] + b — solve a,b from first three terms, check the rest, then the answer
    const a = (t[2] - t[1]) / (t[1] - t[0]);
    const b = t[1] - a * t[0];
    for (let i = 1; i < t.length; i++) if (Math.abs(t[i] - (a * t[i - 1] + b)) > 1e-9) return false;
    return Math.abs(ans - (a * t[t.length - 1] + b)) < 1e-9;
  },
  fiblike: (t, ans) => ans === t[t.length - 1] + t[t.length - 2],
  "alt-ops": () => true, // structure verified via the meta-based test below
  "squares-offset": (t, ans) => {
    const c = t[0] - 1; // first term is 1^2 + c
    for (let i = 0; i < t.length; i++) if (t[i] !== (i + 1) ** 2 + c) return false;
    return ans === (t.length + 1) ** 2 + c;
  },
};

describe("sequenceItem", () => {
  it("is deterministic per seed", () => {
    const x = sequenceItem(makeRng(3), 2), y = sequenceItem(makeRng(3), 2);
    expect({ ...x, id: "" }).toEqual({ ...y, id: "" });
  });
  it("every family generates and passes its independent verifier over 1600 draws", () => {
    const rng = makeRng(2024);
    const seen = new Set<string>();
    for (let i = 0; i < 1600; i++) {
      const item = sequenceItem(rng, ((i % 3) + 1) as 1 | 2 | 3);
      const fam = String(item.meta.family);
      seen.add(fam);
      const terms = String(item.meta.terms).split(",").map(Number);
      expect(verify[fam], `no verifier for ${fam}`).toBeDefined();
      expect(verify[fam](terms, item.answer), `${fam}: ${item.prompt} → ${item.answer}`).toBe(true);
      expect(item.rule, "rule reveal must exist").toBeTruthy();
    }
    for (const f of SEQ_FAMILIES) expect(seen.has(f), `family ${f} never drawn`).toBe(true);
  });
  it("alt-ops meta reconstructs: terms alternate +a then ×b", () => {
    const rng = makeRng(11);
    for (let i = 0; i < 300; i++) {
      const item = sequenceItem(rng, 2);
      if (item.meta.family !== "alt-ops") continue;
      const terms = String(item.meta.terms).split(",").map(Number);
      const a = Number(item.meta.a), b = Number(item.meta.b);
      for (let k = 1; k < terms.length; k++) {
        const expected = k % 2 === 1 ? terms[k - 1] + a : terms[k - 1] * b;
        expect(terms[k]).toBe(expected);
      }
      const n = terms.length;
      expect(item.answer).toBe(n % 2 === 1 ? terms[n - 1] + a : terms[n - 1] * b);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- sequences`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation** — `packages/generators/src/sequences.ts`:

```ts
import { pick, randInt, type Item, type Rng } from "@qp/engine";

export const SEQ_FAMILIES = [
  "arithmetic", "geometric", "quadratic", "interleaved",
  "recur-linear", "fiblike", "alt-ops", "squares-offset",
] as const;
export type SeqFamily = (typeof SEQ_FAMILIES)[number];

let counter = 0;

function build(rng: Rng, family: SeqFamily, difficulty: 1 | 2 | 3): { terms: number[]; answer: number; rule: string; extra?: Record<string, number> } {
  const n = difficulty === 1 ? 5 : 6; // shown terms
  switch (family) {
    case "arithmetic": {
      const start = randInt(rng, -20, 60), d = randInt(rng, 2, difficulty * 9);
      const terms = Array.from({ length: n }, (_, i) => start + i * d);
      return { terms, answer: start + n * d, rule: `Arithmetic: +${d} each step` };
    }
    case "geometric": {
      const start = randInt(rng, 1, 6), r = randInt(rng, 2, difficulty === 3 ? 4 : 3);
      const terms = Array.from({ length: n }, (_, i) => start * r ** i);
      return { terms, answer: start * r ** n, rule: `Geometric: ×${r} each step` };
    }
    case "quadratic": {
      const a = randInt(rng, 1, difficulty), b = randInt(rng, -3, 6), c = randInt(rng, -5, 10);
      const f = (i: number) => a * i * i + b * i + c;
      const terms = Array.from({ length: n }, (_, i) => f(i + 1));
      return { terms, answer: f(n + 1), rule: `Second differences constant (+${2 * a})` };
    }
    case "interleaved": {
      const s1 = randInt(rng, 1, 30), d1 = randInt(rng, 2, 9);
      const s2 = randInt(rng, 40, 90), d2 = -randInt(rng, 2, 9);
      const terms = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? s1 + (i / 2) * d1 : s2 + ((i - 1) / 2) * d2));
      const answer = n % 2 === 0 ? s1 + (n / 2) * d1 : s2 + ((n - 1) / 2) * d2;
      return { terms, answer, rule: `Two interleaved streams: +${d1} and ${d2}` };
    }
    case "recur-linear": {
      const a = randInt(rng, 2, 3), b = randInt(rng, 1, 9), len = 5;
      const terms = [randInt(rng, 1, 5)];
      for (let i = 1; i < len; i++) terms.push(a * terms[i - 1] + b);
      return { terms, answer: a * terms[len - 1] + b, rule: `Each term = ${a}×previous + ${b}` };
    }
    case "fiblike": {
      const terms = [randInt(rng, 1, 9), randInt(rng, 1, 9)];
      while (terms.length < n) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
      return { terms, answer: terms[n - 1] + terms[n - 2], rule: "Each term = sum of previous two" };
    }
    case "alt-ops": {
      const a = randInt(rng, 2, 9), b = randInt(rng, 2, 3), len = 5;
      const terms = [randInt(rng, 1, 6)];
      for (let i = 1; i < len; i++) terms.push(i % 2 === 1 ? terms[i - 1] + a : terms[i - 1] * b);
      const answer = len % 2 === 1 ? terms[len - 1] + a : terms[len - 1] * b;
      return { terms, answer, rule: `Alternating: +${a}, then ×${b}`, extra: { a, b } };
    }
    case "squares-offset": {
      const c = randInt(rng, -3, 12);
      const terms = Array.from({ length: n }, (_, i) => (i + 1) ** 2 + c);
      return { terms, answer: (n + 1) ** 2 + c, rule: c === 0 ? "Perfect squares" : `Squares ${c > 0 ? "+" : ""}${c}` };
    }
  }
}

export function sequenceItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const family = pick(rng, SEQ_FAMILIES);
  const { terms, answer, rule, extra } = build(rng, family, difficulty);
  return {
    id: `seq-${counter++}`,
    topic: "sequences",
    prompt: terms.join(", ") + ", ?",
    answer,
    rule,
    meta: { family, terms: terms.join(","), ...(extra ?? {}) },
  };
}
```

Append to `packages/generators/src/index.ts`:
```ts
export * from "./sequences";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- sequences`
Expected: 3 passed. (If a family fails its verifier, the generator is wrong — fix the generator, never the verifier.)

- [ ] **Step 5: Commit**

```bash
git add packages/generators && git commit -m "feat(generators): 8 sequence families with independent solver verification"
```

---

### Task 6: Engine — timed session reducer + presets

**Files:** Create: `packages/engine/src/session.ts`, `packages/engine/src/presets.ts`, `packages/engine/test/session.test.ts`, `packages/engine/test/presets.test.ts`; Modify: `packages/engine/src/index.ts`

The engine can't import generators (would invert the dependency: generators depend on engine). The session takes a pregenerated `Item[]`.

- [ ] **Step 1: Write the failing tests**

`packages/engine/test/session.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { startSession, answerCurrent, skipCurrent, summarize } from "../src/session";
import type { Item, Preset } from "../src/types";

const preset: Preset = {
  id: "t", title: "T", topic: "arithmetic", count: 3, durationS: 60,
  scoring: { correct: 1, wrong: -2, skip: 0 }, difficulty: () => 1,
};
const items: Item[] = [
  { id: "1", topic: "arithmetic", prompt: "2 + 2", answer: 4, meta: {} },
  { id: "2", topic: "arithmetic", prompt: "3 + 3", answer: 6, meta: {} },
  { id: "3", topic: "arithmetic", prompt: "5 + 5", answer: 10, meta: {} },
];

describe("timed session", () => {
  it("advances only forward and grades with +1/−2/0", () => {
    let s = startSession(preset, items, 42);
    s = answerCurrent(s, 4, 1200);     // correct
    s = answerCurrent(s, 99, 800);     // wrong
    s = skipCurrent(s, 300);           // skip
    expect(s.finished).toBe(true);
    const sum = summarize(s);
    expect(sum).toMatchObject({ preset: "t", score: -1, correct: 1, wrong: 1, skipped: 1, seed: 42 });
    expect(sum.timings).toEqual([1200, 800, 300]);
  });
  it("ignores input after finish", () => {
    let s = startSession(preset, items, 1);
    s = skipCurrent(s, 1); s = skipCurrent(s, 1); s = skipCurrent(s, 1);
    const done = s;
    expect(answerCurrent(done, 4, 1)).toBe(done);
  });
  it("records per-question grades in order", () => {
    let s = startSession(preset, items, 1);
    s = answerCurrent(s, 4, 10); s = answerCurrent(s, 6, 10); s = answerCurrent(s, 1, 10);
    expect(s.grades).toEqual([true, true, false]);
  });
});
```

`packages/engine/test/presets.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { PRESETS, getPreset } from "../src/presets";

describe("presets", () => {
  it("optiver-80in8 matches the documented format", () => {
    const p = getPreset("optiver-80in8");
    expect(p).toMatchObject({ count: 80, durationS: 480, topic: "arithmetic", scoring: { correct: 1, wrong: -2, skip: 0 } });
  });
  it("difficulty curves are monotonically non-decreasing", () => {
    for (const p of Object.values(PRESETS)) {
      let prev = 0;
      for (let i = 0; i < p.count; i++) {
        const d = p.difficulty(i);
        expect(d).toBeGreaterThanOrEqual(prev);
        prev = d;
      }
    }
  });
  it("unknown preset returns null", () => {
    expect(getPreset("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- session presets`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write implementation**

`packages/engine/src/session.ts`:
```ts
import { grade } from "./grade";
import type { Item, Preset } from "./types";

export interface SessionState {
  preset: Preset;
  seed: number;
  items: Item[];
  index: number;
  answers: (number | null)[];
  grades: boolean[];   // parallel to progress; a skip records answer=null, grade=false
  timings: number[];   // ms per question, answered or skipped
  finished: boolean;
}

export interface Summary {
  preset: string; seed: number; score: number;
  correct: number; wrong: number; skipped: number;
  timings: number[]; total: number;
}

export function startSession(preset: Preset, items: Item[], seed: number): SessionState {
  return { preset, seed, items: items.slice(0, preset.count), index: 0, answers: [], grades: [], timings: [], finished: items.length === 0 };
}

function advance(s: SessionState, answer: number | null, ok: boolean, elapsedMs: number): SessionState {
  if (s.finished) return s;
  const next: SessionState = {
    ...s,
    answers: [...s.answers, answer],
    grades: [...s.grades, ok],
    timings: [...s.timings, elapsedMs],
    index: s.index + 1,
    finished: s.index + 1 >= s.items.length,
  };
  return next;
}

export function answerCurrent(s: SessionState, value: number, elapsedMs: number): SessionState {
  if (s.finished) return s;
  return advance(s, value, grade(value, s.items[s.index].answer), elapsedMs);
}

export function skipCurrent(s: SessionState, elapsedMs: number): SessionState {
  if (s.finished) return s;
  return advance(s, null, false, elapsedMs);
}

export function summarize(s: SessionState): Summary {
  let correct = 0, wrong = 0, skipped = 0;
  s.grades.forEach((g, i) => {
    if (s.answers[i] === null) skipped++;
    else if (g) correct++;
    else wrong++;
  });
  const { scoring } = s.preset;
  return {
    preset: s.preset.id, seed: s.seed,
    score: correct * scoring.correct + wrong * scoring.wrong + skipped * scoring.skip,
    correct, wrong, skipped, timings: s.timings, total: s.grades.length,
  };
}
```

`packages/engine/src/presets.ts`:
```ts
import type { Preset } from "./types";

export const PRESETS: Record<string, Preset> = {
  "optiver-80in8": {
    id: "optiver-80in8",
    title: "Optiver-style 80 in 8",
    topic: "arithmetic",
    count: 80,
    durationS: 480,
    scoring: { correct: 1, wrong: -2, skip: 0 },
    difficulty: (i) => (i < 20 ? 1 : i < 55 ? 2 : 3),
  },
  "sequences-sprint": {
    id: "sequences-sprint",
    title: "Sequences Sprint (20 in 8)",
    topic: "sequences",
    count: 20,
    durationS: 480,
    scoring: { correct: 1, wrong: 0, skip: 0 },
    difficulty: (i) => (i < 7 ? 1 : i < 14 ? 2 : 3),
  },
};

export function getPreset(id: string): Preset | null {
  return PRESETS[id] ?? null;
}
```

Append to `packages/engine/src/index.ts`:
```ts
export * from "./session";
export * from "./presets";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- session presets` then the full suite `npm test`
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): timed session reducer and test presets"
```

---

### Task 7: Engine — stats aggregations (pure functions the dashboard consumes)

**Files:** Create: `packages/engine/src/stats.ts`, `packages/engine/test/stats.test.ts`; Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Write the failing test** — `packages/engine/test/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { accuracySeries, paceSeries, topicAccuracy, bestScoreSeries, currentStreak, type AttemptLike, type SessionLike } from "../src/stats";

const day = (d: string) => new Date(d + "T12:00:00Z").toISOString();
const attempts: AttemptLike[] = [
  { topic: "arithmetic", correct: true,  timeMs: 5000, createdAt: day("2026-08-01") },
  { topic: "arithmetic", correct: false, timeMs: 7000, createdAt: day("2026-08-01") },
  { topic: "sequences",  correct: true,  timeMs: 9000, createdAt: day("2026-08-02") },
  { topic: "arithmetic", correct: true,  timeMs: 4000, createdAt: day("2026-08-03") },
];

describe("stats aggregations", () => {
  it("accuracySeries buckets by day", () => {
    expect(accuracySeries(attempts)).toEqual([
      { date: "2026-08-01", value: 50, n: 2 },
      { date: "2026-08-02", value: 100, n: 1 },
      { date: "2026-08-03", value: 100, n: 1 },
    ]);
  });
  it("paceSeries averages seconds per question per day", () => {
    expect(paceSeries(attempts)[0]).toEqual({ date: "2026-08-01", value: 6, n: 2 });
  });
  it("topicAccuracy splits by topic", () => {
    expect(topicAccuracy(attempts)).toEqual({ arithmetic: { pct: 66.7, n: 3 }, sequences: { pct: 100, n: 1 } });
  });
  it("bestScoreSeries returns per-session scores for a preset in date order", () => {
    const sessions: SessionLike[] = [
      { preset: "optiver-80in8", score: 41, createdAt: day("2026-08-02") },
      { preset: "optiver-80in8", score: 47, createdAt: day("2026-08-05") },
      { preset: "sequences-sprint", score: 12, createdAt: day("2026-08-03") },
    ];
    expect(bestScoreSeries(sessions, "optiver-80in8").map((s) => s.score)).toEqual([41, 47]);
  });
  it("currentStreak counts consecutive active days ending today", () => {
    const today = "2026-08-15";
    expect(currentStreak(["2026-08-13", "2026-08-14", "2026-08-15"], today)).toBe(3);
    expect(currentStreak(["2026-08-12", "2026-08-14"], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- stats`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation** — `packages/engine/src/stats.ts`:

```ts
export interface AttemptLike { topic: string; correct: boolean; timeMs: number; createdAt: string }
export interface SessionLike { preset: string; score: number; createdAt: string }
export interface SeriesPoint { date: string; value: number; n: number }

const dateOf = (iso: string) => iso.slice(0, 10);
const round1 = (v: number) => Math.round(v * 10) / 10;

function bucketByDay(rows: AttemptLike[], value: (rs: AttemptLike[]) => number): SeriesPoint[] {
  const byDay = new Map<string, AttemptLike[]>();
  for (const r of rows) {
    const d = dateOf(r.createdAt);
    byDay.set(d, [...(byDay.get(d) ?? []), r]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rs]) => ({ date, value: value(rs), n: rs.length }));
}

export function accuracySeries(rows: AttemptLike[]): SeriesPoint[] {
  return bucketByDay(rows, (rs) => round1((100 * rs.filter((r) => r.correct).length) / rs.length));
}

export function paceSeries(rows: AttemptLike[]): SeriesPoint[] {
  return bucketByDay(rows, (rs) => round1(rs.reduce((s, r) => s + r.timeMs, 0) / rs.length / 1000));
}

export function topicAccuracy(rows: AttemptLike[]): Record<string, { pct: number; n: number }> {
  const out: Record<string, { pct: number; n: number }> = {};
  for (const topic of new Set(rows.map((r) => r.topic))) {
    const rs = rows.filter((r) => r.topic === topic);
    out[topic] = { pct: round1((100 * rs.filter((r) => r.correct).length) / rs.length), n: rs.length };
  }
  return out;
}

export function bestScoreSeries(sessions: SessionLike[], preset: string): { score: number; date: string }[] {
  return sessions
    .filter((s) => s.preset === preset)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({ score: s.score, date: dateOf(s.createdAt) }));
}

export function currentStreak(activeDates: string[], today: string): number {
  const set = new Set(activeDates);
  let streak = 0;
  const cursor = new Date(today + "T00:00:00Z");
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
```

Append to `packages/engine/src/index.ts`:
```ts
export * from "./stats";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- stats`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): dashboard stats aggregations"
```

---

### Task 8: Store — types, LocalStore, merge logic

**Files:** Create: `lib/store/types.ts`, `lib/store/local.ts`, `lib/store/merge.ts`, `lib/store/local.test.ts`

- [ ] **Step 1: Write the failing test** — `lib/store/local.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "./local";
import { planMerge } from "./merge";
import type { AttemptRow, TestSessionRow } from "./types";

const attempt = (over: Partial<AttemptRow> = {}): AttemptRow => ({
  problemId: "arith-1", problemVersion: 1, seed: 42, mode: "test",
  topic: "arithmetic", answer: "12", correct: true, timeMs: 4000,
  sessionId: "s1", createdAt: new Date().toISOString(), ...over,
});

describe("LocalStore", () => {
  beforeEach(() => localStorage.clear());
  it("round-trips attempts and sessions", async () => {
    const store = new LocalStore();
    await store.saveAttempts([attempt(), attempt({ problemId: "arith-2" })]);
    expect(await store.listAttempts()).toHaveLength(2);
    const session: TestSessionRow = { id: "s1", preset: "optiver-80in8", score: 41, correct: 45, wrong: 2, skipped: 33, durationS: 480, timings: [1000], createdAt: new Date().toISOString() };
    await store.saveSession(session);
    expect(await store.listSessions()).toHaveLength(1);
  });
  it("caps stored attempts at 5000 most recent", async () => {
    const store = new LocalStore();
    await store.saveAttempts(Array.from({ length: 5100 }, (_, i) => attempt({ problemId: `p${i}` })));
    expect(await store.listAttempts()).toHaveLength(5000);
  });
});

describe("planMerge", () => {
  it("flags every merged row as mergedFromLocal (never rankable, spec §7)", () => {
    const plan = planMerge([attempt()], [{ id: "s1", preset: "optiver-80in8", score: 41, correct: 45, wrong: 2, skipped: 33, durationS: 480, timings: [], createdAt: new Date().toISOString() }]);
    expect(plan.attempts.every((a) => a.mergedFromLocal)).toBe(true);
    expect(plan.sessions.every((s) => s.mergedFromLocal)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- local`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write implementation**

`lib/store/types.ts`:
```ts
export interface AttemptRow {
  problemId: string; problemVersion: number; seed: number;
  mode: "practice" | "test" | "review";
  topic: string; answer: string; correct: boolean; timeMs: number;
  sessionId: string | null; createdAt: string;
  mergedFromLocal?: boolean;
}

export interface TestSessionRow {
  id: string; preset: string; score: number;
  correct: number; wrong: number; skipped: number;
  durationS: number; timings: number[]; createdAt: string;
  mergedFromLocal?: boolean;
}

export interface Store {
  saveAttempts(rows: AttemptRow[]): Promise<void>;
  saveSession(row: TestSessionRow): Promise<void>;
  listAttempts(): Promise<AttemptRow[]>;
  listSessions(): Promise<TestSessionRow[]>;
}
```

`lib/store/local.ts`:
```ts
import type { AttemptRow, Store, TestSessionRow } from "./types";

const A_KEY = "qp.attempts.v1";
const S_KEY = "qp.sessions.v1";
const CAP = 5000;

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}
function write<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

export class LocalStore implements Store {
  async saveAttempts(rows: AttemptRow[]) {
    const all = [...read<AttemptRow>(A_KEY), ...rows];
    write(A_KEY, all.slice(-CAP));
  }
  async saveSession(row: TestSessionRow) {
    write(S_KEY, [...read<TestSessionRow>(S_KEY), row]);
  }
  async listAttempts() { return read<AttemptRow>(A_KEY); }
  async listSessions() { return read<TestSessionRow>(S_KEY); }
  async clear() { localStorage.removeItem(A_KEY); localStorage.removeItem(S_KEY); }
}
```

`lib/store/merge.ts`:
```ts
import type { AttemptRow, TestSessionRow } from "./types";

// Merged local history feeds stats/streaks only — NEVER ranks (spec §7).
export function planMerge(attempts: AttemptRow[], sessions: TestSessionRow[]) {
  return {
    attempts: attempts.map((a) => ({ ...a, mergedFromLocal: true })),
    sessions: sessions.map((s) => ({ ...s, mergedFromLocal: true })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- local`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/store && git commit -m "feat(store): local store with cap and rank-excluded merge planning"
```

---

### Task 9: Timed test runner UI (focus mode) + results

**Files:** Create: `components/TestRunner.tsx`, `components/Results.tsx`, `app/test/[preset]/page.tsx`, `lib/store/useStore.ts`, `components/TestRunner.test.tsx`

- [ ] **Step 1: Write the failing component test** — `components/TestRunner.test.tsx`:

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import TestRunner from "./TestRunner";
import { getPreset } from "@qp/engine";

describe("TestRunner", () => {
  beforeEach(() => localStorage.clear());
  it("advances on Enter, skips on empty Enter, finishes at count, shows score", () => {
    const preset = { ...getPreset("optiver-80in8")!, count: 2, durationS: 60 };
    render(<TestRunner preset={preset} seed={42} onDone={() => {}} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    const q1 = screen.getByTestId("prompt").textContent!;
    fireEvent.change(input, { target: { value: "0.5" } });
    fireEvent.keyDown(input, { key: "Enter" });               // wrong (generated answers are never 0.5)
    expect(screen.getByTestId("prompt").textContent).not.toBe(q1);
    fireEvent.keyDown(screen.getByLabelText("answer"), { key: "Enter" }); // empty = skip
    expect(screen.getByTestId("score")).toBeInTheDocument();  // results view
    expect(screen.getByTestId("score").textContent).toContain("-2"); // 1 wrong × −2, 1 skip × 0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TestRunner`
Expected: FAIL — components not found.

- [ ] **Step 3: Write implementation**

`lib/store/useStore.ts` (first version — local only; Task 12 replaces internals without changing this API):
```ts
import { LocalStore } from "./local";
import type { Store, TestSessionRow } from "./types";
import type { Preset, Summary } from "@qp/engine";

export function getStore(): Store {
  return new LocalStore();
}

export async function saveRun(preset: Preset, summary: Summary): Promise<void> {
  const row: TestSessionRow = {
    id: crypto.randomUUID(),
    preset: preset.id,
    score: summary.score,
    correct: summary.correct,
    wrong: summary.wrong,
    skipped: summary.skipped,
    durationS: preset.durationS,
    timings: summary.timings,
    createdAt: new Date().toISOString(),
  };
  await getStore().saveSession(row);
}
```

`components/TestRunner.tsx`:
```tsx
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { answerCurrent, makeRng, parseAnswer, skipCurrent, startSession, summarize, type Item, type Preset, type SessionState, type Summary } from "@qp/engine";
import { arithmeticItem, sequenceItem } from "@qp/generators";
import Results from "./Results";

function generate(preset: Preset, seed: number): Item[] {
  const rng = makeRng(seed);
  return Array.from({ length: preset.count }, (_, i) =>
    preset.topic === "arithmetic" ? arithmeticItem(rng, preset.difficulty(i)) : sequenceItem(rng, preset.difficulty(i)),
  );
}

export default function TestRunner({ preset, seed, onDone }: { preset: Preset; seed: number; onDone: (s: Summary) => void }) {
  const items = useMemo(() => generate(preset, seed), [preset, seed]);
  const [state, setState] = useState<SessionState>(() => startSession(preset, items, seed));
  const [value, setValue] = useState("");
  const [remaining, setRemaining] = useState(preset.durationS);
  const qStart = useRef(Date.now());
  const endAt = useRef(Date.now() + preset.durationS * 1000);
  const doneRef = useRef(false);

  const finish = useCallback((s: SessionState) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(summarize(s));
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setState((s) => (s.finished ? s : { ...s, finished: true }));
    }, 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (state.finished) finish(state); }, [state, finish]);

  if (state.finished) return <Results summary={summarize(state)} preset={preset} items={items} state={state} />;

  const item = state.items[state.index];
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  function submit() {
    const elapsed = Date.now() - qStart.current;
    qStart.current = Date.now();
    const parsed = parseAnswer(value);
    setState((s) => (parsed === null ? skipCurrent(s, elapsed) : answerCurrent(s, parsed, elapsed)));
    setValue("");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "var(--card-border)" }}>
        <div style={{ height: "100%", width: `${(state.index / preset.count) * 100}%`, background: "var(--teal)" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <p className="mono" style={{ color: "var(--teal)", fontSize: 14 }}>
          {mm}:{ss} · Q{state.index + 1}/{preset.count} · +{preset.scoring.correct} / {preset.scoring.wrong}
        </p>
        <p data-testid="prompt" className="mono" style={{ fontSize: 40, fontWeight: 600, margin: "22px 0 8px" }}>{item.prompt}</p>
        <input
          aria-label="answer"
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="mono"
          style={{ border: "none", borderBottom: "2px solid var(--teal)", background: "transparent", textAlign: "center", fontSize: 24, width: 220, padding: "6px 0", color: "var(--ink)" }}
        />
        <p className="microlabel" style={{ marginTop: 20 }}>Enter submits · empty Enter skips · no backtracking</p>
      </div>
    </div>
  );
}
```

`components/Results.tsx`:
```tsx
"use client";
import Link from "next/link";
import type { Item, Preset, SessionState, Summary } from "@qp/engine";

export default function Results({ summary, preset, items, state }: { summary: Summary; preset: Preset; items: Item[]; state: SessionState }) {
  const misses = state.grades
    .map((g, i) => ({ g, i }))
    .filter(({ g, i }) => !g && state.answers[i] !== null);
  return (
    <div className="container" style={{ padding: "56px 24px", maxWidth: 760 }}>
      <p className="microlabel">{preset.title} — result</p>
      <h1 data-testid="score" className="mono" style={{ fontSize: 52, margin: "8px 0" }}>{summary.score}</h1>
      <p className="mono" style={{ color: "var(--body)", fontSize: 14 }}>
        <span style={{ color: "var(--good)" }}>✓ {summary.correct}</span> · <span style={{ color: "var(--bad)" }}>✗ {summary.wrong}</span> · skipped {summary.skipped} · answered {summary.total}/{preset.count}
      </p>
      {misses.length > 0 && (
        <div style={{ marginTop: 30, borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
          <p className="microlabel" style={{ marginBottom: 8 }}>Misses</p>
          {misses.map(({ i }) => (
            <p key={i} className="mono" style={{ fontSize: 13, padding: "4px 0", color: "var(--body)" }}>
              {items[i].prompt} <span style={{ color: "var(--bad)" }}>you: {String(state.answers[i])}</span>{" "}
              <span style={{ color: "var(--good)" }}>ans: {items[i].answer}</span>
              {items[i].rule ? <span style={{ color: "var(--muted)" }}> — {items[i].rule}</span> : null}
            </p>
          ))}
        </div>
      )}
      <p style={{ marginTop: 30 }}>
        <Link href={`/test/${preset.id}`} style={{ fontWeight: 700 }}>Run again →</Link>
        <Link href="/stats" style={{ marginLeft: 20 }}>See stats</Link>
      </p>
    </div>
  );
}
```

`app/test/[preset]/page.tsx`:
```tsx
"use client";
import { use, useCallback, useMemo, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { getPreset, type Summary } from "@qp/engine";
import TestRunner from "@/components/TestRunner";
import { saveRun } from "@/lib/store/useStore";

export default function TestPage({ params }: { params: Promise<{ preset: string }> }) {
  const { preset: presetId } = use(params);
  const sp = useSearchParams();
  const base = getPreset(presetId);
  if (!base) notFound();
  // e2e/testing overrides: ?count=5&seed=42 (harmless in prod)
  const preset = useMemo(() => ({
    ...base!,
    count: sp.get("count") ? Math.max(1, Math.min(base!.count, Number(sp.get("count")))) : base!.count,
  }), [base, sp]);
  const [seed] = useState(() => (sp.get("seed") ? Number(sp.get("seed")) : Math.floor(Math.random() * 2 ** 31)));
  const onDone = useCallback((s: Summary) => { void saveRun(preset, s); }, [preset]);
  return <TestRunner preset={preset} seed={seed} onDone={onDone} />;
}
```

- [ ] **Step 4: Run tests + typecheck + manual verification**

Run: `npm test -- TestRunner` — Expected: PASS. Run: `npm run typecheck` — exit 0.
Manual: `npm run dev` → http://localhost:3000/test/optiver-80in8?count=5 → complete a run keyboard-only; command bar hidden during the test; results show; "Run again" works.

- [ ] **Step 5: Commit**

```bash
git add app components lib && git commit -m "feat: focus-mode timed test runner with results and local persistence"
```

---

### Task 10: Drill pages (untimed practice, instant feedback, rule reveal)

**Files:** Create: `components/DrillRunner.tsx`, `app/drills/arithmetic/page.tsx`, `app/drills/sequences/page.tsx`

No new pure logic (engine already tested) — this is composition; verified manually now and by Playwright in Task 14.

- [ ] **Step 1: Write implementation**

`components/DrillRunner.tsx`:
```tsx
"use client";
import { useMemo, useRef, useState } from "react";
import { grade, makeRng, parseAnswer, type Item, type Topic } from "@qp/engine";
import { arithmeticItem, sequenceItem } from "@qp/generators";
import { getStore } from "@/lib/store/useStore";

type Feedback = { ok: boolean; item: Item } | null;

export default function DrillRunner({ topic }: { topic: Topic }) {
  const rng = useMemo(() => makeRng(Math.floor(Math.random() * 2 ** 31)), []);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const next = () => (topic === "arithmetic" ? arithmeticItem(rng, difficulty) : sequenceItem(rng, difficulty));
  const [item, setItem] = useState<Item>(next);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [streak, setStreak] = useState(0);
  const qStart = useRef(Date.now());

  function submit() {
    const parsed = parseAnswer(value);
    if (parsed === null) return;
    const ok = grade(parsed, item.answer);
    void getStore().saveAttempts([{
      problemId: item.id, problemVersion: 1, seed: 0, mode: "practice",
      topic, answer: value, correct: ok, timeMs: Date.now() - qStart.current,
      sessionId: null, createdAt: new Date().toISOString(),
    }]);
    setFeedback({ ok, item });
    setStreak(ok ? streak + 1 : 0);
  }

  function advance() {
    setItem(next());
    setValue("");
    setFeedback(null);
    qStart.current = Date.now();
  }

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p className="microlabel">{topic} drill · endless</p>
        <p className="mono" style={{ fontSize: 12 }}>
          {[1, 2, 3].map((d) => (
            <button key={d} onClick={() => setDifficulty(d as 1 | 2 | 3)} style={{ background: "none", border: "none", marginLeft: 12, color: d === difficulty ? "var(--teal)" : "var(--faint)", fontWeight: d === difficulty ? 700 : 400, borderBottom: d === difficulty ? "2px solid var(--teal)" : "none" }}>
              L{d}
            </button>
          ))}
          <span style={{ marginLeft: 18, color: "var(--muted)" }}>streak {streak}</span>
        </p>
      </div>
      <p className="mono" style={{ fontSize: 32, fontWeight: 600, margin: "34px 0 16px" }}>{item.prompt}</p>
      {feedback === null ? (
        <input
          aria-label="answer" autoFocus inputMode="decimal" value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="mono"
          style={{ border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 18, width: 220 }}
        />
      ) : (
        <div style={{ borderTop: `2px solid ${feedback.ok ? "var(--good)" : "var(--bad)"}`, paddingTop: 12 }}
             onKeyDown={(e) => { if (e.key === "Enter") advance(); }} tabIndex={0} ref={(el) => el?.focus()}>
          <p className="mono" style={{ color: feedback.ok ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>
            {feedback.ok ? "✓ CORRECT" : `✗ ANSWER: ${feedback.item.answer}`}
          </p>
          {feedback.item.rule && <p style={{ color: "var(--body)", marginTop: 6, fontSize: 14 }}>{feedback.item.rule}</p>}
          <p className="microlabel" style={{ marginTop: 12 }}>Enter for next</p>
        </div>
      )}
    </div>
  );
}
```

`app/drills/arithmetic/page.tsx`:
```tsx
import DrillRunner from "@/components/DrillRunner";
export default function Page() { return <DrillRunner topic="arithmetic" />; }
```

`app/drills/sequences/page.tsx`:
```tsx
import DrillRunner from "@/components/DrillRunner";
export default function Page() { return <DrillRunner topic="sequences" />; }
```

- [ ] **Step 2: Verify**

`npm run typecheck` — exit 0. Manual: `npm run dev`; on `/drills/arithmetic` answer several (correct + wrong), switch difficulty; on `/drills/sequences` confirm the rule reveal after each answer and Enter advancing.

- [ ] **Step 3: Commit**

```bash
git add app components && git commit -m "feat: endless drill pages with instant feedback and sequence rule reveal"
```

---

### Task 11: Supabase project + schema migration + benchmark seed  ⚠️ CONTAINS USER ACTIONS

**Files:** Create: `supabase/migrations/0001_init.sql`, `.env.local` (user-filled), `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1 (USER ACTION — executor must stop and ask):** Create a free Supabase project at https://supabase.com/dashboard. From Project Settings → API copy the **Project URL** and **anon public key** into a new `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

(Account creation and credential entry are the user's alone. The anon key is designed to be public; RLS is the security boundary.)

- [ ] **Step 2: Write the migration** — `supabase/migrations/0001_init.sql` (complete schema per spec §7 — tables unused in Phase 1 ship now to avoid churn):

```sql
-- profiles: one per auth user, auto-created with a generated handle
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  target_firms text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'trader_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  problem_version int not null default 1,
  seed int not null default 0,
  mode text not null check (mode in ('practice', 'test', 'review')),
  topic text not null,
  answer text,
  correct boolean not null,
  time_ms int not null,
  session_id uuid,
  merged_from_local boolean not null default false,
  created_at timestamptz not null default now()
);
create index attempts_user_created on public.attempts (user_id, created_at desc);

create table public.test_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  preset text not null,
  score int not null,
  correct int not null,
  wrong int not null,
  skipped int not null,
  duration_s int not null,
  timings jsonb not null default '[]',
  merged_from_local boolean not null default false,
  created_at timestamptz not null default now()
);
create index test_sessions_user on public.test_sessions (user_id, created_at desc);
create index test_sessions_preset_score on public.test_sessions (preset, score desc) where not merged_from_local;

create table public.game_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game text not null,
  score numeric not null,
  rounds int not null,
  created_at timestamptz not null default now()
);

create table public.review_queue (
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  due_at timestamptz not null,
  interval_days int not null default 1,
  ease numeric not null default 2.5,
  primary key (user_id, problem_id)
);

create table public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_active date
);

create table public.problem_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  problem_id text not null,
  reason text not null,
  note text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.benchmarks (
  id bigint generated always as identity primary key,
  preset text not null,
  label text not null,
  value numeric not null,
  source text not null,   -- provenance required (spec §7)
  note text
);

-- RLS: users touch only their own rows; benchmarks are world-readable
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.test_sessions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.review_queue enable row level security;
alter table public.streaks enable row level security;
alter table public.problem_reports enable row level security;
alter table public.benchmarks enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own attempts read" on public.attempts for select using (auth.uid() = user_id);
create policy "own attempts insert" on public.attempts for insert with check (auth.uid() = user_id);

create policy "own sessions read" on public.test_sessions for select using (auth.uid() = user_id);
create policy "own sessions insert" on public.test_sessions for insert with check (auth.uid() = user_id);

create policy "own games read" on public.game_sessions for select using (auth.uid() = user_id);
create policy "own games insert" on public.game_sessions for insert with check (auth.uid() = user_id);

create policy "own queue all" on public.review_queue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks all" on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reports insert" on public.problem_reports for insert with check (auth.uid() = user_id or user_id is null);

create policy "benchmarks public read" on public.benchmarks for select using (true);

-- Seed benchmarks (provenance per spec §7)
insert into public.benchmarks (preset, label, value, source, note) values
  ('optiver-80in8', 'historical invite zone', 55,
   'Publicly reported candidate thresholds, forum-compiled 2024-2026 cycles; unofficial',
   'Raw +1/-2 score; treat as a zone, not a cutoff'),
  ('sequences-sprint', 'strong pace reference', 15,
   'Owner-set reference from documented IMC/Optiver-style tests; unofficial', null);
```

- [ ] **Step 3 (USER ACTION):** Apply the migration: Supabase Dashboard → SQL Editor → paste the full contents of `supabase/migrations/0001_init.sql` → Run. Expected: "Success. No rows returned". (Alternative if the Supabase CLI is installed and linked: `supabase db push`.)

- [ ] **Step 4: Client factories**

**Doc-check step first:** load the `find-docs` skill (or Context7 `/supabase/supabase`) and confirm the current `@supabase/ssr` API for Next 15 — this API has churned. The baseline below is correct as of the spec date; adjust only if current docs differ.

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

`lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
}
```

- [ ] **Step 5: Verify**

`npm run typecheck` — exit 0. Supabase Dashboard → Table Editor: all 8 tables exist; `benchmarks` has 2 rows.

- [ ] **Step 6: Commit**

```bash
git status   # confirm .env.local is NOT staged (gitignored)
git add supabase lib/supabase && git commit -m "feat: supabase schema with RLS, handle trigger, and seeded benchmarks"
```

---

### Task 12: Auth (magic link) + SupabaseStore + merge-on-sign-in

**Files:** Create: `app/login/page.tsx`, `app/auth/callback/route.ts`, `lib/store/supabase.ts`; Modify: `lib/store/useStore.ts`

- [ ] **Step 1: SupabaseStore** — `lib/store/supabase.ts`:

```ts
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, Store, TestSessionRow } from "./types";

type Client = ReturnType<typeof supabaseBrowser>;

const toAttempt = (r: AttemptRow, userId: string) => ({
  user_id: userId, problem_id: r.problemId, problem_version: r.problemVersion,
  seed: r.seed, mode: r.mode, topic: r.topic, answer: r.answer, correct: r.correct,
  time_ms: r.timeMs, session_id: r.sessionId, merged_from_local: r.mergedFromLocal ?? false,
  created_at: r.createdAt,
});
const toSession = (r: TestSessionRow, userId: string) => ({
  id: r.id, user_id: userId, preset: r.preset, score: r.score, correct: r.correct,
  wrong: r.wrong, skipped: r.skipped, duration_s: r.durationS, timings: r.timings,
  merged_from_local: r.mergedFromLocal ?? false, created_at: r.createdAt,
});

export class SupabaseStore implements Store {
  constructor(private client: Client, private userId: string) {}

  async saveAttempts(rows: AttemptRow[]) {
    const { error } = await this.client.from("attempts").insert(rows.map((r) => toAttempt(r, this.userId)));
    if (error) throw error;
  }
  async saveSession(row: TestSessionRow) {
    const { error } = await this.client.from("test_sessions").insert(toSession(row, this.userId));
    if (error) throw error;
  }
  async listAttempts(): Promise<AttemptRow[]> {
    const { data, error } = await this.client.from("attempts").select("*").order("created_at", { ascending: true }).limit(5000);
    if (error) throw error;
    return (data ?? []).map((d) => ({
      problemId: d.problem_id, problemVersion: d.problem_version, seed: d.seed, mode: d.mode,
      topic: d.topic, answer: d.answer, correct: d.correct, timeMs: d.time_ms,
      sessionId: d.session_id, createdAt: d.created_at, mergedFromLocal: d.merged_from_local,
    }));
  }
  async listSessions(): Promise<TestSessionRow[]> {
    const { data, error } = await this.client.from("test_sessions").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((d) => ({
      id: d.id, preset: d.preset, score: d.score, correct: d.correct, wrong: d.wrong,
      skipped: d.skipped, durationS: d.duration_s, timings: d.timings, createdAt: d.created_at,
      mergedFromLocal: d.merged_from_local,
    }));
  }
}
```

- [ ] **Step 2: Rewire `lib/store/useStore.ts`** (same exported API as Task 9; adds sign-in resolution, merge, and resilience — *studying never blocks*, spec §8):

```ts
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import { planMerge } from "./merge";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, Store, TestSessionRow } from "./types";
import type { Preset, Summary } from "@qp/engine";

const MERGED_FLAG = "qp.merged.v1";
let cached: { store: Store; signedIn: boolean } | null = null;

export async function resolveStore(): Promise<{ store: Store; signedIn: boolean }> {
  if (cached) return cached;
  const local = new LocalStore();
  try {
    const supa = supabaseBrowser();
    const { data } = await supa.auth.getUser();
    if (!data.user) return (cached = { store: local, signedIn: false });
    const remote = new SupabaseStore(supa, data.user.id);
    if (!localStorage.getItem(MERGED_FLAG)) {
      const plan = planMerge(await local.listAttempts(), await local.listSessions());
      if (plan.attempts.length) await remote.saveAttempts(plan.attempts);
      for (const s of plan.sessions) await remote.saveSession(s);
      localStorage.setItem(MERGED_FLAG, "1");
      await local.clear();
    }
    return (cached = { store: remote, signedIn: true });
  } catch {
    return { store: local, signedIn: false }; // backend unreachable → local, never block
  }
}

export function getStore(): Store {
  return {
    async saveAttempts(rows: AttemptRow[]) {
      const { store } = await resolveStore();
      try { await store.saveAttempts(rows); } catch { await new LocalStore().saveAttempts(rows); }
    },
    async saveSession(row: TestSessionRow) {
      const { store } = await resolveStore();
      try { await store.saveSession(row); } catch { await new LocalStore().saveSession(row); }
    },
    async listAttempts() { return (await resolveStore()).store.listAttempts(); },
    async listSessions() { return (await resolveStore()).store.listSessions(); },
  };
}

export async function saveRun(preset: Preset, summary: Summary): Promise<void> {
  const row: TestSessionRow = {
    id: crypto.randomUUID(), preset: preset.id, score: summary.score,
    correct: summary.correct, wrong: summary.wrong, skipped: summary.skipped,
    durationS: preset.durationS, timings: summary.timings, createdAt: new Date().toISOString(),
  };
  await getStore().saveSession(row);
}
```

- [ ] **Step 3: Login page + callback**

`app/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="container" style={{ padding: "72px 24px", maxWidth: 460 }}>
      <p className="microlabel">Sign in</p>
      <h1 style={{ fontSize: 30, margin: "8px 0 6px" }}>Save progress. Get ranked.</h1>
      <p style={{ color: "var(--body)", fontSize: 14, marginBottom: 22 }}>Everything works without an account — signing in syncs your history across devices. Local history merges in (it feeds stats only, never leaderboards).</p>
      {sent ? (
        <p style={{ color: "var(--good)", fontWeight: 600 }}>Magic link sent — check your email.</p>
      ) : (
        <>
          <label htmlFor="email" className="microlabel">Email</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              style={{ flex: 1, border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 15 }} />
            <button onClick={() => void send()} style={{ background: "var(--teal)", color: "#FFF6EC", border: "none", borderRadius: 999, padding: "10px 22px", fontWeight: 700 }}>Send link</button>
          </div>
          {err && <p style={{ color: "var(--bad)", fontSize: 13, marginTop: 10 }}>{err}</p>}
        </>
      )}
    </div>
  );
}
```

`app/auth/callback/route.ts`:
```ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/stats", url.origin));
}
```

- [ ] **Step 4: Verify**

`npm run typecheck` exit 0; `npm test` all green (LocalStore tests unaffected). Manual: /login → magic link to your email → click → land on /stats signed in; run `/test/optiver-80in8?count=5`; Supabase Table Editor shows the `test_sessions` row and your `trader_*` handle in `profiles`. Drill anonymously in a private window, then sign in there: merged rows appear with `merged_from_local = true`.

- [ ] **Step 5: Commit**

```bash
git add app lib && git commit -m "feat: magic-link auth, supabase store, rank-excluded local merge"
```

---

### Task 13: Stats dashboard (v4 editorial) with charts, hover, filters, benchmarks

**Files:** Create: `components/charts/LineChart.tsx`, `components/charts/BarChart.tsx`, `app/stats/page.tsx`

Layout, palette, stroke widths, hover behavior replicate `key-screens-v4.html` (approved mockup). Aggregation math is already tested (Task 7); charts are presentational.

- [ ] **Step 1: LineChart** — `components/charts/LineChart.tsx`:

```tsx
"use client";
import { useRef, useState } from "react";
import type { SeriesPoint } from "@qp/engine";

export default function LineChart({ points, unit, progressWord }: {
  points: SeriesPoint[];
  unit: string;
  progressWord: (delta: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  if (points.length < 2) return <p className="microlabel" style={{ padding: "14px 0" }}>Not enough sessions yet — come back after two days of drilling.</p>;

  const W = 200, H = 64, PAD = 6;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xs = points.map((_, i) => PAD + (i * (W - 2 * PAD - 16)) / (points.length - 1));
  const ys = points.map((p) => 52 - ((p.value - min) / span) * 36);
  const li = points.length - 1;

  function onMove(e: React.MouseEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    xs.forEach((x, i) => { const d = Math.abs(x - mx); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  }

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <line x1="0" y1="16" x2={W} y2="16" stroke="var(--rule)" strokeDasharray="2 3" />
        <line x1="0" y1="52" x2={W} y2="52" stroke="var(--rule)" strokeDasharray="2 3" />
        <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(" ")} fill="none"
          stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && (
          <>
            <line x1={xs[hover]} x2={xs[hover]} y1="6" y2="58" stroke="var(--ink)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={xs[hover]} cy={ys[hover]} r="3" fill="var(--teal)" stroke="var(--paper)" strokeWidth="1.5" />
          </>
        )}
        <circle cx={xs[li]} cy={ys[li]} r="2.5" fill="var(--teal)" />
        <text x={xs[li] + 5} y={ys[li] + 3} fontSize="8" fill="var(--ink)" fontWeight="600" fontFamily="var(--font-mono)">
          {points[li].value}
        </text>
      </svg>
      {hover !== null && (
        <div className="mono" style={{ position: "absolute", top: 2, left: `${(xs[hover] / W) * 100}%`, transform: xs[hover] > W * 0.6 ? "translateX(-105%)" : "translateX(8px)", background: "var(--ink)", color: "var(--paper)", borderRadius: 6, padding: "5px 8px", fontSize: 10, lineHeight: 1.5, whiteSpace: "nowrap", pointerEvents: "none" }}>
          {points[hover].date.slice(5)} · {points[hover].n}q<br />
          <b style={{ fontSize: 11 }}>{points[hover].value}{unit}</b><br />
          <span style={{ color: "#7FD4C0" }}>{progressWord(points[hover].value - points[0].value)}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: BarChart** — `components/charts/BarChart.tsx`:

```tsx
"use client";
import { useState } from "react";

export default function BarChart({ bars, maxValue, threshold, thresholdLabel }: {
  bars: { value: number; date: string }[];
  maxValue: number;
  threshold?: number;
  thresholdLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (bars.length === 0) return <p className="microlabel" style={{ padding: "14px 0" }}>No timed sims yet.</p>;
  const W = 200;
  const shown = bars.slice(-12);
  const bw = 9, gap = 5;
  const x = (i: number) => 6 + i * (bw + gap);
  const h = (v: number) => Math.max(2, (Math.max(0, v) / maxValue) * 44);
  const ty = threshold !== undefined ? 60 - (threshold / maxValue) * 44 : 0;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} 64`} style={{ width: "100%", display: "block" }} onMouseLeave={() => setHover(null)}>
        {threshold !== undefined && (
          <>
            <line x1="0" x2={x(shown.length - 1) + bw + 4} y1={ty} y2={ty} stroke="var(--ink)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.5" />
            <text x={x(shown.length - 1) + bw + 8} y={ty + 3} fontSize="7" fill="var(--muted)" fontFamily="var(--font-mono)">{threshold}</text>
          </>
        )}
        {shown.map((b, i) => (
          <rect key={i} x={x(i)} y={60 - h(b.value)} width={bw} height={h(b.value)} rx="2"
            fill={hover === i ? "#0A5A62" : "var(--teal)"} opacity={i === shown.length - 1 ? 1 : 0.4 + (0.5 * i) / shown.length}
            onMouseEnter={() => setHover(i)} style={{ cursor: "pointer" }} />
        ))}
        <text x={x(shown.length - 1)} y={60 - h(shown[shown.length - 1].value) - 4} fontSize="8" fill="var(--ink)" fontWeight="600" fontFamily="var(--font-mono)">
          {shown[shown.length - 1].value}
        </text>
      </svg>
      {hover !== null && (
        <div className="mono" style={{ position: "absolute", top: 0, left: `${(x(hover) / W) * 100}%`, transform: x(hover) > W * 0.6 ? "translateX(-105%)" : "translateX(10px)", background: "var(--ink)", color: "var(--paper)", borderRadius: 6, padding: "5px 8px", fontSize: 10, lineHeight: 1.5, whiteSpace: "nowrap", pointerEvents: "none" }}>
          {shown[hover].date.slice(5)} · attempt {bars.length - shown.length + hover + 1}<br />
          <b style={{ fontSize: 11 }}>{shown[hover].value}</b><br />
          {threshold !== undefined && (shown[hover].value >= threshold
            ? <span style={{ color: "#7FD4C0" }}>{thresholdLabel ?? "threshold"} ✓</span>
            : <span style={{ color: "#F0A8A2" }}>{threshold - shown[hover].value} below {thresholdLabel ?? "threshold"}</span>)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Stats page** — `app/stats/page.tsx`:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { accuracySeries, bestScoreSeries, currentStreak, paceSeries, topicAccuracy } from "@qp/engine";
import { getStore } from "@/lib/store/useStore";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, TestSessionRow } from "@/lib/store/types";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

const RANGES = { "7D": 7, "30D": 30, "90D": 90, ALL: 36500 } as const;
type RangeKey = keyof typeof RANGES;
const TOPICS = ["All topics", "arithmetic", "sequences"] as const;

interface Benchmark { preset: string; label: string; value: number }

export default function StatsPage() {
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [sessions, setSessions] = useState<TestSessionRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [range, setRange] = useState<RangeKey>("30D");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("All topics");

  useEffect(() => {
    void (async () => {
      const store = getStore();
      setAttempts(await store.listAttempts());
      setSessions(await store.listSessions());
      try {
        const { data } = await supabaseBrowser().from("benchmarks").select("preset,label,value");
        if (data) setBenchmarks(data);
      } catch { /* benchmarks are decorative; studying never blocks */ }
    })();
  }, []);

  const cutoff = useMemo(() => new Date(Date.now() - RANGES[range] * 864e5).toISOString(), [range]);
  const rows = useMemo(
    () => attempts.filter((a) => a.createdAt >= cutoff && (topic === "All topics" || a.topic === topic))
      .map((a) => ({ topic: a.topic, correct: a.correct, timeMs: a.timeMs, createdAt: a.createdAt })),
    [attempts, cutoff, topic],
  );
  const acc = useMemo(() => accuracySeries(rows), [rows]);
  const pace = useMemo(() => paceSeries(rows), [rows]);
  const byTopic = useMemo(() => topicAccuracy(rows), [rows]);
  const scores = useMemo(
    () => bestScoreSeries(sessions.filter((s) => !s.mergedFromLocal).map((s) => ({ preset: s.preset, score: s.score, createdAt: s.createdAt })), "optiver-80in8"),
    [sessions],
  );
  const streak = useMemo(
    () => currentStreak([...new Set(attempts.map((a) => a.createdAt.slice(0, 10)))], new Date().toISOString().slice(0, 10)),
    [attempts],
  );
  const bench = benchmarks.find((b) => b.preset === "optiver-80in8");
  const totalAcc = rows.length ? Math.round((1000 * rows.filter((r) => r.correct).length) / rows.length) / 10 : null;
  const avgPace = rows.length ? Math.round(rows.reduce((s, r) => s + r.timeMs, 0) / rows.length / 100) / 10 : null;

  const stat = (label: string, value: string) => (
    <span key={label} style={{ marginRight: 56 }}>
      <span className="microlabel">{label}</span>
      <div className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "3px 0 1px" }}>{value}</div>
    </span>
  );

  const dotLeader = { flex: 1, borderBottom: "1px dotted var(--card-border)", margin: "0 10px", transform: "translateY(-3px)" } as const;

  return (
    <div className="container" style={{ padding: "28px 24px" }}>
      <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: 22, fontSize: 12, flexWrap: "wrap" }}>
        <span>{(Object.keys(RANGES) as RangeKey[]).map((k) => (
          <button key={k} onClick={() => setRange(k)} style={{ background: "none", border: "none", marginRight: 10, color: k === range ? "var(--ink)" : "var(--faint)", fontWeight: k === range ? 700 : 400, borderBottom: k === range ? "2px solid var(--ink)" : "none", paddingBottom: 1 }}>{k}</button>
        ))}</span>
        <span>{TOPICS.map((t) => (
          <button key={t} onClick={() => setTopic(t)} style={{ background: "none", border: "none", marginRight: 12, color: t === topic ? "var(--teal)" : "var(--faint)", fontWeight: t === topic ? 700 : 400, borderBottom: t === topic ? "2px solid var(--teal)" : "none", paddingBottom: 1 }}>{t}</button>
        ))}</span>
      </div>

      <div style={{ display: "flex", padding: "18px 0", flexWrap: "wrap" }}>
        {stat("Accuracy", totalAcc === null ? "—" : `${totalAcc}%`)}
        {stat("Pace", avgPace === null ? "—" : `${avgPace}s`)}
        {stat("Sessions", String(sessions.length))}
        {stat("Streak", `${streak}d`)}
      </div>

      <div style={{ display: "flex", borderTop: "1px solid var(--rule)", flexWrap: "wrap" }}>
        {[
          { title: <><b style={{ color: "var(--ink)" }}>Accuracy</b> · 30D window</>, chart: <LineChart points={acc} unit="%" progressWord={(d) => `${d >= 0 ? "▲ +" : "▼ "}${d.toFixed(1)} since start`} /> },
          { title: <><b style={{ color: "var(--ink)" }}>Pace</b> · s/question · lower = better</>, chart: <LineChart points={pace} unit="s/q" progressWord={(d) => (d <= 0 ? `▲ ${Math.abs(d).toFixed(1)}s faster than start` : `▼ ${d.toFixed(1)}s slower than start`)} /> },
          { title: <><b style={{ color: "var(--ink)" }}>80-in-8 scores</b>{bench ? ` · dash = ${bench.label}` : ""}</>, chart: <BarChart bars={scores.map((s) => ({ value: s.score, date: s.date }))} maxValue={80} threshold={bench?.value} thresholdLabel={bench?.label} /> },
        ].map((c, i) => (
          <div key={i} style={{ flex: "1 1 240px", padding: i > 0 ? "14px 18px 8px 18px" : "14px 18px 8px 0", borderLeft: i > 0 ? "1px solid var(--rule)" : "none" }}>
            <p className="microlabel" style={{ marginBottom: 10 }}>{c.title}</p>
            {c.chart}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", borderTop: "1px solid var(--rule)", marginTop: 4, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px", padding: "14px 26px 0 0" }}>
          <p className="microlabel" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>Per-topic accuracy <Link href="/drills/arithmetic" style={{ letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>drill →</Link></p>
          {Object.entries(byTopic).map(([t, v]) => (
            <p key={t} style={{ display: "flex", alignItems: "baseline", fontSize: 13, padding: "4px 0", color: "var(--body)" }}>
              {t}<span style={dotLeader} />
              <b className="mono" style={{ color: v.pct < 75 ? "var(--bad)" : "var(--ink)" }}>{v.pct}%</b>
              <span className="mono" style={{ color: "var(--faint)", fontSize: 10, marginLeft: 8 }}>{v.n}q</span>
            </p>
          ))}
        </div>
        <div style={{ flex: "1 1 280px", padding: "14px 0 0 26px", borderLeft: "1px solid var(--rule)" }}>
          <p className="microlabel" style={{ marginBottom: 8 }}>Recent sims</p>
          {sessions.slice(-3).reverse().map((s) => (
            <p key={s.id} style={{ display: "flex", alignItems: "baseline", fontSize: 13, padding: "4px 0", color: "var(--body)" }}>
              <span className="mono" style={{ color: "var(--faint)", fontSize: 10, marginRight: 10 }}>{s.createdAt.slice(5, 10)}</span>
              {s.preset}{s.mergedFromLocal ? " (pre-signin)" : ""}
              <span style={dotLeader} />
              <b className="mono">{s.score}</b>
              <Link href={`/test/${s.preset}`} className="mono" style={{ fontSize: 11, marginLeft: 10, fontWeight: 600 }}>retry →</Link>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

`npm run typecheck` exit 0; `npm test` all green. Manual against the mockup: drill + run two short sims, open /stats — filter line drives every panel, stat line renders, 1.5px strokes, line hover shows crosshair + progress tooltip, bar hover shows threshold distance, dot-leader lists, zero nested boxes. Compare side-by-side with `key-screens-v4.html`.

- [ ] **Step 5: Commit**

```bash
git add app components && git commit -m "feat: v4 editorial stats dashboard with live-hover charts, filters, benchmarks"
```

---

### Task 14: Playwright e2e smoke

**Files:** Create: `playwright.config.ts`, `e2e/test-run.spec.ts`

- [ ] **Step 1: Config** — `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120000 },
});
```

- [ ] **Step 2: The spec** — `e2e/test-run.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("timed sim happy path: answer/skip through, land on results, stats renders", async ({ page }) => {
  await page.goto("/test/optiver-80in8?count=3&seed=42");
  const input = page.getByLabel("answer");
  await expect(input).toBeVisible();
  await expect(page.locator("nav")).toHaveCount(0); // focus mode hides chrome
  for (let i = 0; i < 3; i++) {
    await input.fill("0.5"); // wrong is fine; we're testing flow
    await input.press("Enter");
  }
  await expect(page.getByTestId("score")).toBeVisible();
  await page.goto("/stats");
  await expect(page.getByText("Recent sims")).toBeVisible();
  await expect(page.getByText("optiver-80in8").first()).toBeVisible();
});

test("sequences drill reveals the rule after answering", async ({ page }) => {
  await page.goto("/drills/sequences");
  const input = page.getByLabel("answer");
  await input.fill("999999");
  await input.press("Enter");
  await expect(page.getByText(/ANSWER:|CORRECT/)).toBeVisible();
  await expect(page.getByText("Enter for next")).toBeVisible();
});
```

- [ ] **Step 3: Run**

First time: `npx playwright install chromium`. Then: `npm run e2e`
Expected: 2 passed.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e && git commit -m "test: e2e smoke for timed sim flow and drill rule reveal"
```

---

### Task 15: Landing polish + keepalive + CI

**Files:** Modify: `app/page.tsx`; Create: `app/api/keepalive/route.ts`, `vercel.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: Landing page (Pink Paper editorial, honest copy)** — replace `app/page.tsx`:

```tsx
import Link from "next/link";

const drills = [
  { href: "/test/optiver-80in8", label: "80-in-8 numerical sim", sub: "80 questions · 8 minutes · +1/−2 scoring" },
  { href: "/test/sequences-sprint", label: "Sequences sprint", sub: "20 patterns · 8 minutes · rule shown on every miss" },
  { href: "/drills/arithmetic", label: "Arithmetic drill", sub: "Endless, difficulty-curved" },
  { href: "/drills/sequences", label: "Sequences drill", sub: "8 pattern families and counting" },
];

export default function Home() {
  return (
    <div className="container" style={{ padding: "72px 24px 40px" }}>
      <p className="microlabel">Free quant interview prep — no paywall, ever</p>
      <h1 style={{ fontSize: 46, letterSpacing: "-0.02em", margin: "10px 0 16px", maxWidth: "18ch", lineHeight: 1.1 }}>
        Train like the OA is tomorrow.
      </h1>
      <p style={{ color: "var(--body)", maxWidth: "56ch", fontSize: 16 }}>
        Timed sims in real test formats, infinite generated drills, and stats that show exactly
        where you stand against the invite zones. Works without an account; sign in to sync and rank.
      </p>
      <div style={{ borderTop: "1px solid var(--rule)", marginTop: 34 }}>
        {drills.map((d) => (
          <Link key={d.href} href={d.href} style={{ display: "flex", alignItems: "baseline", padding: "16px 0", borderBottom: "1px solid var(--rule)", color: "var(--ink)" }}>
            <b style={{ fontSize: 17 }}>{d.label}</b>
            <span style={{ flex: 1, borderBottom: "1px dotted var(--card-border)", margin: "0 14px", transform: "translateY(-4px)" }} />
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{d.sub}</span>
            <span className="mono" style={{ color: "var(--teal)", fontWeight: 700, marginLeft: 14 }}>→</span>
          </Link>
        ))}
      </div>
      <p className="mono" style={{ marginTop: 26, fontSize: 12, color: "var(--muted)" }}>
        Coming next: probability bank with walkthrough solutions · firm tracks · market-making game
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Keepalive route + cron** (spec §7 wants pings every 2–3 days; Vercel hobby cron granularity is daily-min, so daily — comfortably clear of Supabase's 7-day idle pause)

`app/api/keepalive/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supa.from("benchmarks").select("id").limit(1);
  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
```

`vercel.json`:
```json
{ "crons": [{ "path": "/api/keepalive", "schedule": "0 9 * * *" }] }
```

- [ ] **Step 3: CI** — `.github/workflows/ci.yml`:

```yaml
name: ci
on: [push, pull_request]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

(Playwright stays a local gate for now and joins CI in Phase 1.5; the Python verification suite also arrives in 1.5 with the first authored problems — generator correctness is already gated by the brute-force unit tests.)

- [ ] **Step 4: Verify**

`npm run typecheck` && `npm test` && `npm run build` — all green locally (the build catches Next-specific issues like client/server boundary mistakes).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: landing page, keepalive cron, CI workflow"
```

---

### Task 16: Public deploy  ⚠️ CONTAINS USER ACTIONS

- [ ] **Step 1 (USER ACTION):** Create the GitHub repo and push:
`gh repo create quant-prep --public --source . --push`
(or create it in the GitHub UI, then `git remote add origin <url> && git push -u origin main`).

- [ ] **Step 2 (USER ACTION):** At https://vercel.com/new import the `quant-prep` repo (Next.js auto-detected). Add env vars from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for Production + Preview. Deploy.

- [ ] **Step 3 (USER ACTION):** Supabase Dashboard → Authentication → URL Configuration: set Site URL to `https://<project>.vercel.app` and add `https://<project>.vercel.app/auth/callback` to Redirect URLs — magic links break without this.

- [ ] **Step 4: Verify production**

On the live URL: run `/test/optiver-80in8?count=5` anonymously → results render; sign in via magic link → session rows land in Supabase; /stats shows the benchmark dashed line; `https://<project>.vercel.app/api/keepalive` returns `{"ok":true,...}`.

- [ ] **Step 5: Commit any final tweaks**

```bash
git add -A && git commit -m "chore: production configuration tweaks" && git push
```
(only if files changed)

- [ ] **(Optional, USER ACTION, anytime later):** Google OAuth — create OAuth credentials in Google Cloud Console, add them under Supabase → Authentication → Providers → Google, then add a "Continue with Google" button on `/login` calling `supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } })`.

---

## Self-Review (performed at write time)

**Spec coverage (Phase 1 scope from spec §9):** repo/CI/Supabase → Tasks 1, 11, 15 ✓ · engine + arithmetic generator + Optiver 80-in-8 sim → Tasks 2–4, 6, 9 ✓ · sequences trainer → Tasks 5, 6 (`sequences-sprint`), 10 ✓ · auth + attempts → Tasks 11, 12 ✓ · benchmark seeding → Task 11 seed + Task 13 rendering ✓ · v4 dashboard → Tasks 7, 13 ✓ · public deploy → Task 16 ✓ · footer disclaimer (§5) → Task 1 ✓ · anonymous-complete + merge-never-ranks (§7) → Tasks 8, 12; Task 13 filters `mergedFromLocal` out of the score-bar series ✓ · keepalive (§7) → Task 15 ✓ · "studying never blocks" (§8) → Task 12 resolveStore fallback + Task 13 benchmark catch ✓. Deferred items listed in the header match spec phasing.

**Placeholder scan:** no TBDs; every code step contains complete code; the one "confirm against current docs" instruction (Task 11, @supabase/ssr) is a deliberate doc-check with working baseline code included, per the spec's find-docs loadout.

**Type consistency:** `Item.meta: Record<string, number | string>` everywhere; `Preset.difficulty(i): 1|2|3` matches generator signatures; `Summary` fields match `saveRun` and `Results` usage; store row types match LocalStore/SupabaseStore mappers and SQL columns (`time_ms↔timeMs`, `duration_s↔durationS`, `merged_from_local↔mergedFromLocal`); `getStore()` keeps an identical interface between Task 9 (local-only) and Task 12 (resolved), so TestRunner/DrillRunner don't change; e2e uses `?count=` override defined in Task 9's page.
