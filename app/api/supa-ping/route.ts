import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Basic sanity checks (no secrets leaked)
  const urlLooksLikeSupabase =
    url.startsWith("https://") && url.includes(".supabase.co");

  const anonLooksLikeJwt = anon.startsWith("eyJ");

  // Try a simple network request to Supabase REST endpoint
  // This does not modify anything; it just checks reachability.
  const target = url ? `${url}/rest/v1/` : "";

  try {
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is empty");
    if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty");

    const res = await fetch(target, {
      method: "GET",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
    });

    const text = await res.text();

    return NextResponse.json({
      ok: true,
      urlPreview: url.slice(0, 45) + "...",
      urlLooksLikeSupabase,
      anonLooksLikeJwt,
      fetchTarget: target,
      status: res.status,
      statusText: res.statusText,
      bodyPreview: text.slice(0, 200),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        urlPreview: url ? url.slice(0, 45) + "..." : null,
        urlLooksLikeSupabase,
        anonLooksLikeJwt,
        fetchTarget: target || null,
        error: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}