import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { parseTimelineDawPrivateLaneGroupEdit } from "@/lib/timeline/TimelineDawPrivateLaneGroupEditPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TABLE = "timeline_daw_private_audio_lanes";
const BUCKET = "timeline-daw-render-sources";
const PREFIX = `supabase://${BUCKET}/`;
class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
function environment(name: string) { const value = process.env[name]?.trim(); if (!value) throw new ApiError(`${name} is not configured.`, 503); return value; }
async function authorize(request: NextRequest) {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ") || !header.slice(7).trim()) throw new ApiError("Authentication is required.", 401);
  const token = header.slice(7).trim();
  const client = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token); if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}
async function sign(client: SupabaseClient, ownerId: string, sessionId: string, uri: string) {
  const prefix = `${PREFIX}${ownerId}/${sessionId}/`; if (!uri.startsWith(prefix)) throw new ApiError("Private lane source path is invalid.", 403);
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(uri.slice(PREFIX.length), 3_600);
  if (error || !data?.signedUrl) throw new ApiError("Private lane playback could not be prepared.", 500); return data.signedUrl;
}
function lane(row: Record<string, unknown>, playbackUrl: string) { return {
  id: String(row.id), sessionId: String(row.session_id), name: String(row.name), source: { id: String(row.source_id), uri: String(row.source_uri), checksum: String(row.source_checksum) },
  audio: { sampleRate: Number(row.sample_rate), channelCount: Number(row.channel_count), frameCount: Number(row.frame_count), durationSeconds: Number(row.duration_seconds) },
  timelineStartSeconds: Number(row.timeline_start_seconds), sourceInSeconds: Number(row.source_in_seconds), sourceOutSeconds: Number(row.source_out_seconds),
  fade: { inSeconds: Number(row.fade_in_seconds), outSeconds: Number(row.fade_out_seconds) }, mix: { muted: Boolean(row.muted), soloed: Boolean(row.soloed), gain: Number(row.gain), pan: Number(row.pan) },
  provenance: row.comp_id ? { compId: String(row.comp_id), renderChecksum: String(row.comp_render_checksum) } : null, playbackUrl, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
}; }
function failure(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Private lane group edit failed." }, { status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" } }); }

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request); const body = await request.json() as Record<string, unknown>;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const laneIds = Array.isArray(body.laneIds) ? [...new Set(body.laneIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))] : [];
    if (!sessionId || !await createTimelineDawWorkspaceServer(user.id, user.token).get(user.id, sessionId)) throw new ApiError("DAW session was not found.", 404);
    const selected = await user.client.from(TABLE).select("*").eq("owner_id", user.id).eq("session_id", sessionId).in("id", laneIds).order("id");
    if (selected.error || !selected.data || selected.data.length !== laneIds.length) throw new ApiError("One or more selected private regions were not found.", 404);
    let edit;
    try { edit = parseTimelineDawPrivateLaneGroupEdit(body, selected.data.map((row) => ({ id: String(row.id), timelineStartSeconds: Number(row.timeline_start_seconds), sourceInSeconds: Number(row.source_in_seconds), sourceOutSeconds: Number(row.source_out_seconds), sampleRate: Number(row.sample_rate) }))); }
    catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Group edit is invalid.", 400); }
    const changedAt = new Date().toISOString();
    const after = selected.data.map((row) => {
      if (edit.action === "move") return { ...row, timeline_start_seconds: Number(row.timeline_start_seconds) + edit.deltaSeconds, updated_at: changedAt };
      if (edit.action === "mix") return { ...row, muted: edit.muted, gain: edit.gain, pan: edit.pan, updated_at: changedAt };
      const sampleRate = Number(row.sample_rate);
      return { ...row, fade_in_seconds: Math.round(edit.fadeInSeconds * sampleRate) / sampleRate, fade_out_seconds: Math.round(edit.fadeOutSeconds * sampleRate) / sampleRate, updated_at: changedAt };
    }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const { data, error } = await user.client.rpc("apply_timeline_daw_private_lane_group_edit", {
      p_history_id: `timeline-daw-lane-history-${crypto.randomUUID()}`, p_session_id: sessionId, p_before_rows: selected.data, p_after_rows: after,
    });
    if (error || !Array.isArray(data)) throw new ApiError(`Private lane group edit failed: ${error?.message ?? "rows missing"}`, error?.message.includes("conflict") ? 409 : 400);
    const lanes = await Promise.all(data.map(async (row) => lane(row, await sign(user.client, user.id, sessionId, String(row.source_uri)))));
    return NextResponse.json({ lanes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
