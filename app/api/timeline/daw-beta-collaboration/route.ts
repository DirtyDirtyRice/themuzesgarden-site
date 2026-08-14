import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { parseTimelineDawBetaFeedback } from "@/lib/timeline/TimelineDawBetaFeedbackPolicy";

export const runtime = "nodejs", dynamic = "force-dynamic";
const environment = (name: string) => { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is not configured.`); return value; };
async function client(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw new Error("Authentication is required.");
  const token = header.slice(7).trim();
  const result = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await result.auth.getUser(token); if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  return result;
}
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : "Beta collaboration request failed." }, { status: 403 });
export async function GET(request: NextRequest) {
  try { const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "", database = await client(request), { data, error } = await database.rpc("get_timeline_daw_beta_collaboration", { p_session_id: sessionId }); if (error) throw new Error(error.message); return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return fail(error); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>, sessionId = String(body.sessionId ?? "").trim(), database = await client(request);
    if (body.action === "respond") {
      const response = String(body.response ?? "").trim();
      if (response.length < 2 || response.length > 4000) throw new Error("Response must contain 2-4000 characters.");
      const { data, error } = await database.rpc("respond_timeline_daw_beta_collaborator_feedback", { p_session_id: sessionId, p_feedback_id: String(body.feedbackId ?? ""), p_response: response });
      if (error) throw new Error(error.message); return NextResponse.json({ event: data }, { status: 201 });
    }
    const input = parseTimelineDawBetaFeedback(body);
    const { data, error } = await database.rpc("submit_timeline_daw_beta_collaborator_feedback", { p_session_id: sessionId, p_checkpoint_checksum: input.checkpointChecksum, p_stage: input.stage, p_severity: input.severity, p_reproducibility: input.reproducibility, p_summary: input.summary, p_expected_behavior: input.expectedBehavior, p_reproduction_notes: input.reproductionNotes });
    if (error) throw new Error(error.message); return NextResponse.json({ feedback: data }, { status: 201 });
  } catch (error) { return fail(error); }
}
