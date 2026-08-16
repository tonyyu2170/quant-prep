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
  if (points.length === 1) return <p className="microlabel" style={{ padding: "14px 0" }}>First day logged — trends appear from day two.</p>;
  if (points.length < 2) return <p className="microlabel" style={{ padding: "14px 0" }}>Not enough sessions yet — come back after two days of drilling.</p>;

  const W = 200, H = 64, PAD = 6;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const ts = points.map((p) => Date.parse(p.date));
  const t0 = ts[0], tSpan = ts[ts.length - 1] - t0 || 1;
  const xs = ts.map((t) => PAD + ((t - t0) / tSpan) * (W - 2 * PAD - 16));
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
