"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setErr(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="container" style={{ padding: "72px 24px", maxWidth: 460 }}>
      <p className="microlabel">Sign in</p>
      <h1 style={{ fontSize: 30, margin: "8px 0 6px" }}>Save progress. Get ranked.</h1>
      {sp.get("error") === "link" && <p style={{ color: "var(--bad)", fontSize: 13, marginBottom: 10 }}>That sign-in link didn't work or expired — request a new one.</p>}
      <p style={{ color: "var(--body)", fontSize: 14, marginBottom: 22 }}>Everything works without an account — signing in syncs your history across devices. Local history merges in (it feeds stats only, never leaderboards).</p>
      {sent ? (
        <p style={{ color: "var(--good)", fontWeight: 600 }}>Magic link sent — check your email.</p>
      ) : (
        <>
          <label htmlFor="email" className="microlabel">Email</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              style={{ flex: 1, border: "1.5px solid var(--card-border)", background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 15 }} />
            <button onClick={() => void send()} style={{ background: "var(--teal)", color: "#FFF6EC", border: "none", borderRadius: 999, padding: "10px 22px", fontWeight: 700 }}>Send link</button>
          </div>
          {err && <p style={{ color: "var(--bad)", fontSize: 13, marginTop: 10 }}>{err}</p>}
        </>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
