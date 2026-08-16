import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // must execute per-request: a cached keepalive pings nothing

export async function GET() {
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supa.from("benchmarks").select("id").limit(1);
  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
