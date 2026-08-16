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
