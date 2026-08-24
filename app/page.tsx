import Link from "next/link";
import { FIRMS, PROBLEMS } from "@/content/problems";

// Counts are derived, not written down: the "coming next" line here advertised the
// probability bank for weeks after it shipped, and a hand-typed 191 goes stale the same way.
const TOPICS = new Set(PROBLEMS.map((t) => t.topic)).size;

const sims = [
  { href: "/test/optiver-80in8", label: "80-in-8 numerical sprint", sub: "Free entry · 8 minutes · +1/−2 scoring" },
  { href: "/test/optiver-mc-80in8", label: "Optiver 80-in-8", sub: "Their real format · blanked operand · 4 options" },
  { href: "/test/sequences-sprint", label: "Sequences sprint", sub: "20 patterns · 8 minutes · rule shown on every miss" },
  { href: "/game/market-maker", label: "Market-making game", sub: "Quote a two-way market · 12 rounds · 25s each" },
  { href: "/game/estimator", label: "Estimation & calibration", sub: "Decompose the unknown · 90% intervals · 8 questions" },
];

const drills = [
  { href: "/drills/probability", label: "Problem bank", sub: `${PROBLEMS.length} problems · ${TOPICS} topics · ${FIRMS.length} firm tracks` },
  { href: "/drills/arithmetic", label: "Arithmetic drill", sub: "Endless, difficulty-curved" },
  { href: "/drills/sequences", label: "Sequences drill", sub: "16 pattern families, weighted by level" },
  { href: "/drills/missing-operand", label: "Missing operand", sub: "Four-way choice · the unknown moves around the equation" },
];

function List({ items }: { items: { href: string; label: string; sub: string }[] }) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)" }}>
      {items.map((d) => (
        <Link key={d.href} href={d.href} style={{ display: "flex", alignItems: "baseline", padding: "16px 0", borderBottom: "1px solid var(--rule)", color: "var(--ink)" }}>
          <b style={{ fontSize: 17 }}>{d.label}</b>
          <span style={{ flex: 1, borderBottom: "1px dotted var(--card-border)", margin: "0 14px", transform: "translateY(-4px)" }} />
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{d.sub}</span>
          <span className="mono" style={{ color: "var(--teal)", fontWeight: 700, marginLeft: 14 }}>→</span>
        </Link>
      ))}
    </div>
  );
}

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

      <p className="microlabel" style={{ marginTop: 34, marginBottom: 8 }}>Timed sims</p>
      <List items={sims} />
      <p className="microlabel" style={{ marginTop: 30, marginBottom: 8 }}>Endless drills</p>
      <List items={drills} />

      <p className="mono" style={{ marginTop: 26, fontSize: 12, color: "var(--muted)" }}>
        Missed problems come back on a spaced schedule in <Link href="/review">Review</Link>
      </p>
    </div>
  );
}
