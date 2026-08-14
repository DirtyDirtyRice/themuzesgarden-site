import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  evaluateTimelineDawTechnicalTest,
  type TimelineDawTechnicalTestResult,
} from "@/lib/timeline/TimelineDawTechnicalTestPolicy";
import type { TimelineDawOwnerTestEvidence } from "@/lib/timeline/TimelineDawOwnerMusicianTestPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthorizedUser = {
  id: string;
  token: string;
  client: SupabaseClient;
};

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function authorize(request: NextRequest): Promise<AuthorizedUser> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authentication is required.");
  }

  const token = authorization.slice(7).trim();
  const client = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  return { id: data.user.id, token, client };
}

async function countEvidence(
  client: SupabaseClient,
  table: string,
  ownerId: string,
  sessionId: string,
  filters: Record<string, string> = {},
) {
  let query = client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("session_id", sessionId);
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count, error } = await query;
  if (error) throw new Error(`${table} could not be inspected: ${error.message}`);
  return count ?? 0;
}

async function loadEvidence(
  client: SupabaseClient,
  ownerId: string,
  sessionId: string,
): Promise<TimelineDawOwnerTestEvidence> {
  const values = await Promise.all([
    countEvidence(client, "timeline_daw_recording_takes", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_audio_lanes", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_lane_edit_history", ownerId, sessionId),
    countEvidence(client, "timeline_daw_arrangement_item_edits", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_buses", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_inserts", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_automation_edits", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_session_snapshots", ownerId, sessionId),
    countEvidence(client, "timeline_daw_private_bounce_jobs", ownerId, sessionId, {
      state: "completed",
    }),
  ]);
  return {
    audioSourceCount: values[0] + values[1],
    editCount: values[2] + values[3],
    mixControlCount: values[4] + values[5] + values[6],
    snapshotCount: values[7],
    completedExportCount: values[8],
  };
}

async function authorizeSession(request: NextRequest, sessionId: string) {
  if (!sessionId) throw new Error("sessionId is required.");
  const user = await authorize(request);
  const session = await createTimelineDawWorkspaceServer(user.id, user.token).get(
    user.id,
    sessionId,
  );
  if (!session) throw new Error("DAW session was not found.");
  return user;
}

function createReceiptChecksum(input: {
  ownerId: string;
  sessionId: string;
  observedAt: string;
  evidence: TimelineDawOwnerTestEvidence;
  results: TimelineDawTechnicalTestResult[];
}) {
  const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return `sha256:${digest}`;
}

async function latestReceipt(
  client: SupabaseClient,
  ownerId: string,
  sessionId: string,
) {
  const { data, error } = await client
    .from("timeline_daw_technical_test_receipts")
    .select(
      "id,evidence,results,verified_count,held_count,human_required_count,ready_for_human,receipt_checksum,created_at",
    )
    .eq("owner_id", ownerId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Technical test receipt could not be loaded: ${error.message}`);
  return data;
}

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Technical test request failed." },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    const user = await authorizeSession(request, sessionId);
    const evidence = await loadEvidence(user.client, user.id, sessionId);
    return NextResponse.json(
      {
        evaluation: evaluateTimelineDawTechnicalTest(evidence),
        evidence,
        latestReceipt: await latestReceipt(user.client, user.id, sessionId),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = String(body.sessionId ?? "").trim();
    if (body.action !== "run") throw new Error("Technical test action is invalid.");
    const user = await authorizeSession(request, sessionId);
    const evidence = await loadEvidence(user.client, user.id, sessionId);
    const evaluation = evaluateTimelineDawTechnicalTest(evidence);
    const observedAt = new Date().toISOString();
    const receiptChecksum = createReceiptChecksum({
      ownerId: user.id,
      sessionId,
      observedAt,
      evidence,
      results: evaluation.results,
    });
    const { data, error } = await user.client
      .from("timeline_daw_technical_test_receipts")
      .insert({
        owner_id: user.id,
        session_id: sessionId,
        evidence,
        results: evaluation.results,
        verified_count: evaluation.verifiedCount,
        held_count: evaluation.heldCount,
        human_required_count: evaluation.humanRequiredCount,
        ready_for_human: evaluation.readyForHuman,
        receipt_checksum: receiptChecksum,
        created_at: observedAt,
      })
      .select(
        "id,evidence,results,verified_count,held_count,human_required_count,ready_for_human,receipt_checksum,created_at",
      )
      .single();
    if (error) throw new Error(`Technical test receipt could not be saved: ${error.message}`);
    return NextResponse.json({ evaluation, evidence, latestReceipt: data });
  } catch (error) {
    return failure(error);
  }
}
