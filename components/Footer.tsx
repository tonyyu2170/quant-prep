"use client";
import { usePathname } from "next/navigation";
import { isFocusMode } from "@/lib/routes";

export default function Footer() {
  if (isFocusMode(usePathname())) return null; // focus mode: chrome disappears (spec §5)
  return (
    <footer className="container" style={{ borderTop: "1px solid var(--rule)", marginTop: 64, padding: "20px 24px", fontSize: 12, color: "var(--muted)" }}>
      QuantPrep is independent — not affiliated with or endorsed by any firm. Free forever.
    </footer>
  );
}
