import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { parseTimelineDawPrivateAudioLane } from "@/lib/timeline/TimelineDawPrivateAudioLanePolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "timeline_daw_private_audio_lanes";
const BUCKET = "timeline-daw-render-sources";
const PREFIX = `supabase://${BUCKET}/`;

class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
function environment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(`${name} is not configured.`, 503);
  return value;
}
async function authorize(request: NextRequest) {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ") || !header.slice(7).trim()) throw new ApiError("Authentication is required.", 401);
  const token = header.slice(7).trim();
  const client = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}
async function requireSession(ownerId: string, token: string, sessionId: string) {
  if (!sessionId) throw new ApiError("sessionId is required.", 400);
  if (!await createTimelineDawWorkspaceServer(ownerId, token).get(ownerId, sessionId)) throw new ApiError("DAW session was not found.", 404);
}
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Private audio lane request failed." }, {
    status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" },
  });
}
function lane(row: Record<string, unknown>, playbackUrl: string) {
  return {
    id: String(row.id), sessionId: String(row.session_id), name: String(row.name),
    source: { id: String(row.source_id), uri: String(row.source_uri), checksum: String(row.source_checksum) },
    audio: { sampleRate: Number(row.sample_rate), channelCount: Number(row.channel_count), frameCount: Number(row.frame_count), durationSeconds: Number(row.duration_seconds) },
    timelineStartSeconds: Number(row.timeline_start_seconds),
    provenance: row.comp_id ? { compId: String(row.comp_id), renderChecksum: String(row.comp_render_checksum) } : null,
    playbackUrl, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}
async function sign(client: SupabaseClient, ownerId: string, sessionId: string, uri: string) {
  const ownerPrefix = `${PREFIX}${ownerId}/${sessionId}/`;
  if (!uri.startsWith(ownerPrefix)) throw new ApiError("Private lane source path is invalid.", 403);
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(uri.slice(PREFIX.length), 3_600);
  if (error || !data?.signedUrl) throw new ApiError(`Private lane playback could not be prepared: ${error?.message ?? "signed URL missing"}`, 500);
  return data.signedUrl;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);
    const { data, error } = await user.client.from(TABLE).select("*").eq("owner_id", user.id).eq("session_id", sessionId).order("timeline_start_seconds");
    if (error) throw new ApiError(`Private audio lanes could not be loaded: ${error.message}`, 500);
    const lanes = await Promise.all((data ?? []).map(async (row) => lane(row, await sign(user.client, user.id, sessionId, String(row.source_uri)))));
    return NextResponse.json({ lanes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const body = await request.json() as Record<string, unknown>;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    await requireSession(user.id, user.token, sessionId);
    if (body.action === "add") {
      let input;
      try { input = parseTimelineDawPrivateAudioLane(body, user.id, sessionId); }
      catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Private lane is invalid.", 400); }
      const id = `timeline-daw-private-lane-${crypto.randomUUID()}`;
      const { data, error } = await user.client.from(TABLE).insert({
        id, owner_id: user.id, session_id: sessionId, name: input.name,
        source_id: input.sourceId, source_uri: input.sourceUri, source_checksum: input.sourceChecksum,
        sample_rate: input.sampleRate, channel_count: input.channelCount, frame_count: input.frameCount,
        duration_seconds: input.durationSeconds, timeline_start_seconds: input.timelineStartSeconds,
        comp_id: input.compId, comp_render_checksum: input.compRenderChecksum,
      }).select("*").single();
      if (error || !data) throw new ApiError(`Private audio lane could not be saved: ${error?.message ?? "missing row"}`, 500);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, input.sourceUri)) }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "remove") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data, error } = await user.client.from(TABLE).delete().eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("id").single();
      if (error || !data) throw new ApiError("Private audio lane was not found.", 404);
      return NextResponse.json({ removedLaneId: laneId }, { headers: { "Cache-Control": "no-store" } });
    }
    throw new ApiError("Private audio lane action is invalid.", 400);
  } catch (error) { return failure(error); }
}
