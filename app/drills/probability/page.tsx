"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DrillNav from "@/components/DrillNav";
import ProblemRunner from "@/components/ProblemRunner";
import { FIRMS, PROBLEMS, TOPIC_LABELS } from "@/content/problems";

// `useSearchParams` opts the whole route out of static rendering unless it sits under a Suspense
// boundary (Next 15). The fallback is never seen — the params are known before first paint — so
// it is null rather than a skeleton that would flash.
export default function Page() {
  return <Suspense fallback={null}><Bank /></Suspense>;
}

function Bank() {
  const topics = useMemo(() => [...new Set(PROBLEMS.map((t) => t.topic))], []);
  // Deep link from the stats page's per-topic list: ?topic=probability/bayes. Only a topic the
  // bank actually ships is honoured — an old bookmark naming a retired one (finance/pricing, split
  // away in B16) opens the whole bank rather than a filter that matches nothing.
  const wanted = useSearchParams().get("topic") ?? undefined;
  const [topic, setTopic] = useState<string | undefined>(wanted && topics.includes(wanted) ? wanted : undefined);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | undefined>(undefined);
  const [firm, setFirm] = useState<string | undefined>(undefined);
  const chip = (active: boolean) => ({
    background: "none", border: "none", marginRight: 14, paddingBottom: 1,
    color: active ? "var(--teal)" : "var(--faint)", fontWeight: active ? 700 : 400,
    borderBottom: active ? "2px solid var(--teal)" : "none",
  } as const);
  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
      <DrillNav current="problem bank" />
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <span>
          <button type="button" style={chip(topic === undefined)} onClick={() => setTopic(undefined)}>all</button>
          {topics.map((t) => (
            <button key={t} type="button" style={chip(topic === t)} onClick={() => setTopic(t)}>{TOPIC_LABELS[t] ?? t}</button>
          ))}
        </span>
        <span>
          <button type="button" style={chip(difficulty === undefined)} onClick={() => setDifficulty(undefined)}>any</button>
          {([1, 2, 3] as const).map((dd) => (
            <button key={dd} type="button" aria-pressed={difficulty === dd} style={chip(difficulty === dd)} onClick={() => setDifficulty(dd)}>L{dd}</button>
          ))}
        </span>
      </div>
      {/* Firm tracks: the same `firms` tags the walkthrough prints as "seen at", used as a filter. */}
      <div className="mono" style={{ fontSize: 12, marginBottom: 26 }}>
        <span style={{ color: "var(--faint)", marginRight: 14 }}>seen at</span>
        <button type="button" style={chip(firm === undefined)} onClick={() => setFirm(undefined)}>any firm</button>
        {FIRMS.map((f) => (
          <button key={f} type="button" style={chip(firm === f)} onClick={() => setFirm(f)}>{f}</button>
        ))}
      </div>
      <ProblemRunner topic={topic} difficulty={difficulty} firm={firm} />
    </div>
  );
}
