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
