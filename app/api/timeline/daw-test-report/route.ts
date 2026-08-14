import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { buildTimelineDawOwnerTestReport, type TimelineDawReportObservation } from "@/lib/timeline/TimelineDawOwnerTestReportPolicy";
import type { TimelineDawTechnicalTestResult } from "@/lib/timeline/TimelineDawTechnicalTestPolicy";
import type { TimelineDawOwnerTestOutcome, TimelineDawOwnerTestStep } from "@/lib/timeline/TimelineDawOwnerMusicianTestPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function environment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function authorize(request: NextRequest, sessionId: string) {
  if (!sessionId) throw new Error("sessionId is required.");
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw new Error("Authentication is required.");
  const token = header.slice(7).trim();
  const client = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  const session = await createTimelineDawWorkspaceServer(data.user.id, token).get(data.user.id, sessionId);
  if (!session) throw new Error("DAW session was not found.");
  return { ownerId: data.user.id, client, session };
}

async function loadTechnicalReceipt(client: SupabaseClient, ownerId: string, sessionId: string) {
  const { data, error } = await client.from("timeline_daw_technical_test_receipts")
    .select("id,results,verified_count,held_count,human_required_count,ready_for_human,receipt_checksum,created_at")
    .eq("owner_id", ownerId).eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Technical receipt could not be loaded: ${error.message}`);
  return data;
}

async function loadManualTest(client: SupabaseClient, ownerId: string, sessionId: string) {
  const { data: session, error } = await client.from("timeline_daw_owner_test_sessions")
    .select("id,status,created_at,updated_at").eq("owner_id", ownerId).eq("session_id", sessionId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Guided test session could not be loaded: ${error.message}`);
  if (!session) return { session: null, observations: [] as TimelineDawReportObservation[] };
  const { data, error: observationError } = await client.from("timeline_daw_owner_test_observations")
    .select("id,step,outcome,notes,click_count,excessive_steps,screenshot_data_url,failure_context,created_at")
    .eq("owner_id", ownerId).eq("test_session_id", session.id).order("created_at", { ascending: true });
  if (observationError) throw new Error(`Musician observations could not be loaded: ${observationError.message}`);
  const observations = (data ?? []).map((item) => ({
    id: String(item.id), step: String(item.step) as TimelineDawOwnerTestStep,
    outcome: String(item.outcome) as TimelineDawOwnerTestOutcome, notes: String(item.notes ?? ""),
    clickCount: typeof item.click_count === "number" ? item.click_count : null,
    excessiveSteps: Boolean(item.excessive_steps), screenshotDataUrl: typeof item.screenshot_data_url === "string" ? item.screenshot_data_url : null,
    failureContext: item.failure_context && typeof item.failure_context === "object" ? item.failure_context as Record<string, unknown> : {},
    createdAt: String(item.created_at),
  }));
  return { session, observations };
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    const authorized = await authorize(request, sessionId);
    const [receipt, manual] = await Promise.all([
      loadTechnicalReceipt(authorized.client, authorized.ownerId, sessionId),
      loadManualTest(authorized.client, authorized.ownerId, sessionId),
    ]);
    const technicalResults = Array.isArray(receipt?.results) ? receipt.results as TimelineDawTechnicalTestResult[] : [];
    const report = buildTimelineDawOwnerTestReport({ generatedAt: new Date().toISOString(), technicalResults, observations: manual.observations });
    return NextResponse.json({
      report,
      session: { id: authorized.session.id, name: authorized.session.name, state: authorized.session.state },
      technicalReceipt: receipt,
      manualSession: manual.session,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Test report could not be loaded." }, { status: 400 });
  }
}
