"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { accuracySeries, bestScoreSeries, currentStreak, getPreset, paceSeries, topicAccuracy } from "@qp/engine";
import { getStore } from "@/lib/store/useStore";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AttemptRow, TestSessionRow } from "@/lib/store/types";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

const RANGES = { "7D": 7, "30D": 30, "90D": 90, ALL: 36500 } as const;
type RangeKey = keyof typeof RANGES;
const TOPICS = ["All topics", "arithmetic", "sequences", "probability"] as const;
const SIM_PRESETS = ["optiver-80in8", "optiver-mc-80in8", "sequences-sprint"] as const;
type SimPreset = (typeof SIM_PRESETS)[number];
const SIM_LABELS: Record<SimPreset, string> = { "optiver-80in8": "Free-entry sprint scores", "optiver-mc-80in8": "Optiver 80-in-8 scores", "sequences-sprint": "Seq-sprint scores" };

interface Benchmark { preset: string; label: string; value: number }

// Local calendar date (not UTC): an attempt at 9pm EDT belongs to that local day.
const localDate = (d: string | Date) => {
  const t = typeof d === "string" ? new Date(d) : d;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export default function StatsPage() {
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [sessions, setSessions] = useState<TestSessionRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [range, setRange] = useState<RangeKey>("30D");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("All topics");
  const [simPreset, setSimPreset] = useState<SimPreset>("optiver-80in8");
  const simDef = getPreset(simPreset)!;

  useEffect(() => {
    void (async () => {
      const store = getStore();
      try { setAttempts(await store.listAttempts()); } catch { /* render empty rather than crash */ }
      try { setSessions(await store.listSessions()); } catch { /* render empty rather than crash */ }
      try {
        const { data } = await supabaseBrowser().from("benchmarks").select("preset,label,value");
        if (data) setBenchmarks(data);
      } catch { /* benchmarks are decorative; studying never blocks */ }
    })();
  }, []);

  const cutoffDay = useMemo(() => {
    const n = new Date();
    return localDate(new Date(n.getFullYear(), n.getMonth(), n.getDate() - (RANGES[range] - 1)));
  }, [range]);
  const rows = useMemo(
    () => attempts
      .filter((a) => localDate(a.createdAt) >= cutoffDay && (topic === "All topics" || a.topic === topic || a.topic.startsWith(topic + "/")))
      .map((a) => ({ topic: a.topic, correct: a.correct, timeMs: a.timeMs, createdAt: localDate(a.createdAt) })),
    [attempts, cutoffDay, topic],
  );
  const acc = useMemo(() => accuracySeries(rows), [rows]);
  const pace = useMemo(() => paceSeries(rows), [rows]);
  const byTopic = useMemo(() => topicAccuracy(rows), [rows]);
  const scores = useMemo(
    () => bestScoreSeries(
      sessions
        .filter((s) => !s.mergedFromLocal && (s.total === undefined || s.total === simDef.count))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((s) => ({ preset: s.preset, score: s.score, createdAt: localDate(s.createdAt) })),
      simPreset,
    ),
    [sessions, simPreset, simDef.count],
  );
  const streak = useMemo(
    () => currentStreak([...new Set(attempts.map((a) => localDate(a.createdAt)))], localDate(new Date())),
    [attempts],
  );
  const bench = benchmarks.find((b) => b.preset === simPreset);
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
          { title: <><b style={{ color: "var(--ink)" }}>Accuracy</b> · {range} window</>, chart: <LineChart points={acc} unit="%" progressWord={(d) => `${d >= 0 ? "▲ +" : "▼ "}${d.toFixed(1)} since start`} /> },
          { title: <><b style={{ color: "var(--ink)" }}>Pace</b> · s/question · lower = better</>, chart: <LineChart points={pace} unit="s/q" progressWord={(d) => (d <= 0 ? `▲ ${Math.abs(d).toFixed(1)}s faster than start` : `▼ ${d.toFixed(1)}s slower than start`)} /> },
          {
            title: <>
              {SIM_PRESETS.map((p) => (
                <button key={p} onClick={() => setSimPreset(p)}
                  style={{ background: "none", border: "none", padding: 0, marginRight: 10, font: "inherit", letterSpacing: "inherit", textTransform: "inherit", cursor: "pointer", color: p === simPreset ? "var(--ink)" : "var(--faint)", fontWeight: p === simPreset ? 700 : 400 }}>
                  {SIM_LABELS[p]}
                </button>
              ))}
              {bench ? ` · dash = ${bench.label}` : ""}
            </>,
            chart: <BarChart key={simPreset} bars={scores.map((s) => ({ value: s.score, date: s.date }))} maxValue={simDef.count * simDef.scoring.correct} threshold={bench?.value} thresholdLabel={bench?.label} />,
          },
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
              <span className="mono" style={{ color: "var(--faint)", fontSize: 10, marginRight: 10 }}>{localDate(s.createdAt).slice(5)}</span>
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
