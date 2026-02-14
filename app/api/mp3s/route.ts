import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * NOTE:
 * We moved Supabase listing to the browser (client) because Node fetch was failing on this machine.
 * So this API route is now just a friendly diagnostic, not a lister.
 */
export async function GET() {
  return NextResponse.json({
    ok: false,
    message:
      "This endpoint no longer lists MP3s. Listing is done in the browser (client) via listSupabaseMp3sClient().",
    nextStep:
      "Go to the Player page and we will debug which folder your MP3s are in.",
  });
}