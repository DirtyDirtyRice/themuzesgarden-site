import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urlPreview = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 35) + "..."
    : null;

  const anonPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12) + "..."
    : null;

  return NextResponse.json({
    hasUrl,
    hasAnon,
    urlPreview,
    anonPreview,
  });
}