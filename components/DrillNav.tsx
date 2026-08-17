import Link from "next/link";

const DRILLS = [
  { href: "/drills/arithmetic", label: "arithmetic" },
  { href: "/drills/sequences", label: "sequences" },
  { href: "/drills/probability", label: "probability" },
];

export default function DrillNav({ current }: { current: string }) {
  return (
    <p className="mono" style={{ fontSize: 12, marginBottom: 18 }}>
      {DRILLS.map((d, i) => (
        <span key={d.href}>
          {i > 0 && <span style={{ color: "var(--faint)" }}> · </span>}
          {d.label === current
            ? <span style={{ color: "var(--ink)", fontWeight: 700, borderBottom: "2px solid var(--teal)" }}>{d.label}</span>
            : <Link href={d.href}>{d.label}</Link>}
        </span>
      ))}
    </p>
  );
}
