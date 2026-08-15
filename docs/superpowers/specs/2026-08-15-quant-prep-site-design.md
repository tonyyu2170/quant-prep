# QuantPrep — Design Spec

**Date:** 2026-08-15
**Status:** Approved by user through brainstorming (Sections 1–6 individually approved; visual mockups iterated to v4 in `.superpowers/brainstorm/`)
**Working title:** "QuantPrep" — final name parked; decided during build alongside domain/handle availability check.

## 1. Vision & Context

A **free, public** quant-trading interview prep site replacing the paid incumbents (TraderMath, QuantProf, Mynbit, GetCracked): practice problem banks, company-specific OA/interview/superday prep, timed test simulators, market-making games, behavioral prep — all with detailed explanations.

Context that shapes priorities: the owner is recruiting for **Summer 2027 quant trading internships and OAs are imminent** (apps opened June–Sept 2026). The drilling core ships first so it's usable within days; quality bar stays high throughout ("don't skimp on quality at all"). Division of labor: **Claude builds, owner studies.**

Company-specific content policy (owner's explicit call): be as company-specific as the paid sites. In practice all content is *original problems modeled on publicly documented formats* — see §6 transformation rule (never verbatim; new prose, new parameters, own solutions).

## 2. Decisions Log

| Decision | Choice |
|---|---|
| Audience | Public free site |
| Urgency | OAs imminent → drilling core first, quality everywhere |
| Target firms | All three clusters (~14 firms) |
| Content engine | Multi-source, rewritten + parameterized + machine-verified |
| Builder | Claude builds; owner studies |
| Accounts | Day one (Supabase), plus full anonymous mode |
| Stack | Next.js (App Router) + Vercel hobby + Supabase free — $0 |
| Design | "Pink Paper": exam-paper structure, FT-salmon/teal system |

## 3. Feature Map & Phasing (approved Section 1)

**Phase 1 — Drilling Core** (ships in days; usable for real OA prep immediately):
- Speed Arithmetic — procedural, infinite; presets matching real tests (Optiver 80-in-8 with +1/−2 scoring, Flow-style, custom); per-operation stats.
- Sequences Trainer — generated pattern families (arithmetic, geometric, interleaved, recursive, digit-manipulation, meta); timed test mode.
- Probability & EV Bank — authored + verified + parameterized; topics: counting, conditional/Bayes, EV & variance, distributions, gambler's ruin, geometric probability; 3 difficulty tiers; full walkthrough solutions.
- Timed OA Simulator — real conditions: countdown, no pause, question-per-screen, penalty scoring where firms use it, post-test miss review.
- Accounts & Stats Dashboard — Supabase auth, attempt history, per-topic accuracy, trends, streaks. The dashboard's percentile stat and per-session percentile chips render against the seeded `benchmarks` table from day one, so the v4 mockup is fully realizable in Phase 1.
- Leaderboards & Percentiles — per timed preset; seeded with curated benchmarks until user base fills in. (Build order: benchmark seeding ships with the Phase 1 dashboard; user-vs-user leaderboards land in Phase 1.5, immediately after the drilling core — see §9.)

**Phase 2 — Company Tracks & Games:**
- Firm Tracks ×~14: process map (apply → OA → phones → superday), what-they-ask intel, format-exact OA simulator, tailored sets, superday guide. Firms: Optiver, IMC, Flow, Akuna, CTC, Jane Street, SIG, Five Rings, DRW, Citadel Sec, HRT, Jump, Tower, DE Shaw. Build order = whose OAs hit first.
- Market Making Game — quote bid/ask on hidden-value events; inventory management vs bot flow incl. informed traders; PnL-scored rounds; leaderboard; plus "make me a market" drill with width/skew feedback.
- Numerical Reasoning — generated chart/table data-interpretation (SHL-style).
- Pattern/IQ Matrices — Raven's-style SVG, rotations, odd-one-out, difficulty curve.
- Mental Math Extras — Fermi estimation, fraction↔decimal, powers/roots, technique write-ups.

**Phase 3 — Full Platform:**
- Behavioral & Superday Hub — question bank with strong-answer frameworks, firm culture notes, "why trading/why firm" builders, logistics tips.
- Brainteaser & Logic Bank — classics + originals, tagged by firm frequency.
- Betting & Calibration Games — Kelly bankroll sim, confidence-interval calibration trainer, dice-betting EV games.
- Review Queue — spaced repetition on misses; misses resurface with re-rolled numbers.
- Study Plans — "OA in 3 days" / "superday in a week" checklists wired to drills.
- Tips & Tricks Hub — recruiting timeline, application strategy, negotiation, curated free-resource links.

**Non-goals (v1–v2):** no coding-interview judge (firm tracks link out to per-firm LeetCode lists), no forums/community, no mobile apps (responsive web), no video.

## 4. Design System — "Pink Paper" (approved Sections 2–3, iterated to v4)

Identity: exam-paper cleanliness + financial-press warmth. Reference mockups: `.superpowers/brainstorm/35997-1786824505/content/key-screens*.html` (v4 = final dashboard; v2 = final drill screen).

**Palette:**
- Paper `#FFF1E5` (page background) · Surface `#FFFAF4` (cards, sparingly) · Card border `#F0DFD0` · Hairline rule `#EBD9C6`
- Ink `#33302E` (text, command bar bg) · Body `#4A453F` · Muted `#8C8378` · Faint `#A79886`
- **Teal `#0D7680` — the single accent AND the only data hue** (links, active states, CTAs, chart series). Light-on-ink variant `#4FB3BF`.
- Status only, always icon-paired (✓✗▲▼): green `#147D64`, red `#B4231F`. **Validated:** teal↔green fail CVD/normal separation (ΔE ≈ 5.5) → they must never appear as co-equal chart series.
- Dark mode: first-class warm-charcoal counterpart of this palette; designed during build (its own validation pass, not an automatic flip).

**Typography:** Schibsted Grotesk (UI/headings; Inter banned per taste rules) + **JetBrains Mono for every digit, timer, stat, and code**. KaTeX for math.

**Layout rules:**
- Dense/data screens are **editorial, not boxed**: hairline rules + whitespace + column dividers structure the page; nested cards are the exception (drill problem card, firm intel pair), never the default. Dot-leader lists for ranked/indexed content.
- Ink command bar as global nav (brand left, sections right, active = teal underline).
- Caps-mono microlabels (9–10px, letterspaced) for section titles on data screens.
- Keyboard-first: type → Enter → next; entire drill/test flow mouse-free.
- Micro-motion: spring-feel 150–300ms on reveals and correct/wrong feedback; `prefers-reduced-motion` respected; transforms/opacity only.
- SVG icons only (no emoji icons); cursor-pointer + visible focus states on all interactive elements; 4.5:1 text contrast minimum; 44px touch targets; single-column collapse < 768px, no horizontal scroll.

**Chart rules (dataviz-derived, validator-checked):**
- One unit per chart — never dual-axis (accuracy and pace are separate small multiples).
- Single-series: endpoint label, no legend. Teal only. 1.5px line strokes; 0.75px crosshair/threshold strokes; recessive dotted grid.
- Thresholds (e.g., "55 invite zone") as labeled dashed lines.
- Hover ships by default: crosshair snaps to nearest session on lines, tooltip shows value + cumulative progress since window start ("▲ +8.6 since Jul 18"); per-mark tooltip on bars (score, date, distance from invite zone). Table view available for accessibility.

## 5. Key Screens (approved, mockup-fidelity)

**Drill screen (practice):** topic chip (topic · subtopic · difficulty) → question (max ~62ch) → answer input accepting fractions/decimals/expressions → on submit, walkthrough solution unfolds: *verdict line (your answer + exact value) → Setup (name events, translate givens) → numbered steps with math blocks (Bayes first, then a concrete population table, then compute) → sanity check → key-insight callout (teal) → common-trap callout (red) → "seen at" firms + expected pace → actions (re-roll numbers · harder variant · add to review queue · report issue).* Solutions are step-templated so all intermediate numbers interpolate from the drawn parameters.

**Timed test mode:** chrome disappears; thin progress bar; mono timer + question counter + scoring rule visible; one question per screen; Enter submits; no backtracking; esc abandons; post-test review of every miss.

**Stats dashboard (v4, editorial):** quiet text-level filter line (time range 7D/30D/90D/ALL · topic links · mode selector) driving all panels → single stat line (Accuracy, Pace, Sessions, Percentile — tiny caps label, 26px mono value, small delta) → one ruled row of three compact charts (Accuracy trend, Pace trend, sim-score bars with threshold) with live hover per chart rules → two dot-leader columns (Weakest topics with "drill these →", Recent sessions with percentile chip + "retry →"). Zero nested boxes.

**Firm track page:** firm header + season status → process pipeline pills with the user's current stage highlighted → two-up: "what they test here" intel vs "your readiness" (best sim score, weak spot, trend) → full-width CTA to the format-exact simulator. Template ×14 firms; "last verified" date stamped. Every firm page and the site footer carry an "independent — not affiliated with or endorsed by any firm" disclaimer.

## 6. Content Engine (approved Section 4)

**Problem = parameterized template**, stored as typed TS in `content/problems/<topic>/`:

```ts
{
  id, slug, topic: "probability/bayes", difficulty: 1|2|3,
  firms: [{ firm: "sig", weight: 0.8 }],
  source: { kind: "original" | "free-resource" | "textbook" | "paid-sample", inspiration: "classic: base-rate fallacy" }, // kind mirrors §6 source categories a–d for coverage auditing
  params: { sensitivity: { choices: [0.95, 0.99] }, prevalence: { range: [1e-4, 1e-3], clean: true } },
  statement: "A test is {{sensitivity%}} sensitive…",
  answer: "expr: (sens*prev) / (sens*prev + (1-spec)*(1-prev))",
  accepted: { forms: ["fraction", "decimal", "expression"], tolerance: { rel: 0.005 } }, // rel | abs — explicit per problem, never implied
  solution: [ /* step templates, KaTeX, params interpolated */ ],
  keyInsight, commonTrap,
  verify: { method: "montecarlo", trials: 1e6 } // or "symbolic" | "brute-force"
}
```

**Sources (owner-approved), one transformation rule:** (a) originals; (b) free-resource classics; (c) textbook classics; (d) paid-site free samples — for b–d always **new prose + new parameters + our own solution**; inspiration lineage recorded internally for coverage auditing.

**Verification (CI gate, `verification/` Python):** per problem, ~100 param draws; closed-form answer checked against seeded Monte Carlo (or SymPy exact); every number appearing in solution text re-computed; KaTeX compiles; no un-interpolated params. Generators verified against brute-force solvers. Tolerance semantics are explicit per problem (`{ rel }` or `{ abs }`); verification fails any problem whose tolerance is loose relative to its answer's magnitude (e.g. an absolute 0.005 on a rare-event posterior of ~0.01). Monte Carlo trial counts scale with event rarity so sampling noise sits well inside the tolerance; problems whose target events are too rare to sample cheaply must use `symbolic` verification instead. **Red CI = no deploy.**

**Launch targets:** arithmetic infinite; ~30 sequence families; ~10 chart archetypes; ~12 matrix rule types; 150 probability/EV authored at launch → 500+ by peak season; 75 brainteasers; 50 market-logic; 40 behavioral; 14 firm tracks.

**Ops:** per-problem "report an issue" → Supabase review queue. Problems versioned; attempts record the version answered.

## 7. Data Model & Backend (approved Section 5)

**Principle: problems never live in the DB.** Content is static/CDN; Supabase stores only user activity. Free-tier limits are then comfortable by construction.

Tables (all RLS): `profiles` (auto-generated changeable handle, target firms) · `attempts` (problem id + version + param seed, answer, correct, time_ms, mode, session) · `test_sessions` (preset, score, correct/wrong/skipped, duration) · `game_sessions` · `review_queue` (SRS state) · `streaks` · `problem_reports` · `benchmarks` (curated thresholds).

- **Leaderboards/percentiles:** best-score views per preset, window-function ranks, public view exposes handle + score only. Each `benchmarks` row records its provenance (owner's own scores, publicly reported thresholds), so authoritative-looking lines like "55 invite zone" cite a source.
- **Auth:** magic-link + Google. **Anonymous mode is complete** (localStorage) with sign-in nudge; local history merges on first sign-in. Merged local history feeds stats, streaks, and the review queue only — never leaderboards or percentile ranks (localStorage records are forgeable); only server-recorded sessions rank.
- **Resilience:** studying never blocks — backend outage queues writes locally, flushes later; CI cron pings every 2–3 days to stay clear of Supabase's 7-day idle-pause (weekly is exactly the boundary — one delayed run pauses the project).
- **Integrity:** timed submissions carry per-question timings; server-side checks reject impossible scores (sub-human timing, > max, non-monotonic). Accepted limitation: answers ship in the static content bundle, so **no client-graded mode is cheat-proof** — timed sims included, not just games — against answer extraction at human-plausible pace. Accepted for v1; mitigated by flag-score reports + benchmarks. Revisit only if leaderboards gain stakes: ranked presets would then need server-side grading, a deliberate exception to "problems never live in the DB."

## 8. Architecture & Repo (approved Section 6)

Next.js App Router on Vercel hobby. Static world (landing, firm guides, topic/solution pages, tips) is SSG for SEO — firm guides target long-tail queries. Client world (drill runner, tests, games, dashboard) talks to Supabase under RLS. Hand-rolled SVG charts (no chart lib). Vercel Web Analytics (cookieless). KaTeX.

```
quant-prep/
  app/                  # drills/[topic], test/[preset], firms/[firm], games/[game], stats
  components/
  content/problems/<topic>/   content/firms/*.mdx   content/guides/*.mdx
  packages/engine/      # param drawing, grading, session logic — pure TS, TDD
  packages/generators/  # arithmetic, sequences, chart-reading, matrices
  verification/         # Python MC/SymPy suite (CI gate)
  supabase/migrations/
  e2e/                  # Playwright smoke: answer→solution; timed test→score submit
```

**Error-handling principle:** *studying never blocks* — grading falls back expression→numeric; mid-test refresh resumes within grace window else attempt voids (never corrupts); outages queue locally.

**Testing:** engine/generators test-first; verification gates content; typecheck + unit + verification green before deploy; Playwright smoke on critical flows.

## 9. Build Order & Skill Loadout

1. **Phase 1 (days):** repo/CI/Supabase → engine + arithmetic generator + Optiver 80-in-8 sim → sequences trainer → auth + attempts + benchmark seeding + v4 dashboard. Public deploy immediately.
2. **Phase 1.5:** 150 probability/EV problems with walkthroughs; leaderboards/percentiles; review queue.
3. **Phase 2:** firm tracks by OA order (Optiver/IMC/Flow → JS/SIG/Five Rings → Citadel/HRT/…); numerical-reasoning + matrix generators; market-making game.
4. **Phase 3:** behavioral hub; brainteasers; betting/calibration games; study plans; tips hub.

Per-phase skills: `dataviz` (charts), `trading-skills:market-microstructure-traditional` (MM game realism), `ecc:seo` (guides), `emil-design-eng` + `design-taste-frontend` (polish passes), `humanizer` (guide copy), `find-docs`/Context7 (Next.js/Supabase APIs), superpowers TDD + verification-before-completion throughout.

## 10. Success Criteria

- Owner can run a format-faithful Optiver-style 80-in-8 within days of build start, with scores/percentiles tracked.
- Every shipped problem passes machine verification; zero unverified answers in production.
- All four key screens match approved mockups (v2 drill, v4 dashboard) in structure and rules.
- Site is fully usable anonymously; account adds sync/rank only.
- $0 recurring cost on Vercel hobby + Supabase free.

## 11. Open Items (parked deliberately)

- **Site name + domain/handles** — decided at build start with availability check ("QuantPrep" is the working title).
- **Dark mode palette** — designed + validated during build as its own pass.
- **Launch/distribution channels** — owner's call post-launch; out of build scope.
