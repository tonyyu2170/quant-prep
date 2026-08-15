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
