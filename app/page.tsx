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
