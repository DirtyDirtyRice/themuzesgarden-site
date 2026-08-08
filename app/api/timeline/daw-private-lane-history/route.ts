import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TABLE = "timeline_daw_private_lane_edit_history";
const BUCKET = "timeline-daw-render-sources";
const PREFIX = `supabase://${BUCKET}/`;

class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
function environment(name: string) { const value = process.env[name]?.trim(); if (!value) throw new ApiError(`${name} is not configured.`, 503); return value; }
async function authorize(request: NextRequest) {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ") || !header.slice(7).trim()) throw new ApiError("Authentication is required.", 401);
  const token = header.slice(7).trim();
  const client = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}
async function requireSession(ownerId: string, token: string, sessionId: string) {
  if (!sessionId) throw new ApiError("sessionId is required.", 400);
  if (!await createTimelineDawWorkspaceServer(ownerId, token).get(ownerId, sessionId)) throw new ApiError("DAW session was not found.", 404);
}
function history(row: Record<string, unknown>) { return { id: String(row.id), operation: String(row.operation), label: String(row.label), state: String(row.state), createdAt: String(row.created_at), changedAt: String(row.changed_at) }; }
async function sign(client: SupabaseClient, ownerId: string, sessionId: string, uri: string) {
  const prefix = `${PREFIX}${ownerId}/${sessionId}/`;
  if (!uri.startsWith(prefix)) throw new ApiError("Private lane source path is invalid.", 403);
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(uri.slice(PREFIX.length), 3_600);
  if (error || !data?.signedUrl) throw new ApiError("Private lane playback could not be prepared.", 500);
  return data.signedUrl;
}
function lane(row: Record<string, unknown>, playbackUrl: string) { return {
  id: String(row.id), sessionId: String(row.session_id), name: String(row.name),
  source: { id: String(row.source_id), uri: String(row.source_uri), checksum: String(row.source_checksum) },
  audio: { sampleRate: Number(row.sample_rate), channelCount: Number(row.channel_count), frameCount: Number(row.frame_count), durationSeconds: Number(row.duration_seconds) },
  timelineStartSeconds: Number(row.timeline_start_seconds), sourceInSeconds: Number(row.source_in_seconds), sourceOutSeconds: Number(row.source_out_seconds), busId: row.bus_id ? String(row.bus_id) : null,
  fade: { inSeconds: Number(row.fade_in_seconds), outSeconds: Number(row.fade_out_seconds) },
  mix: { muted: Boolean(row.muted), soloed: Boolean(row.soloed), gain: Number(row.gain), pan: Number(row.pan) },
  provenance: row.comp_id ? { compId: String(row.comp_id), renderChecksum: String(row.comp_render_checksum) } : null,
  playbackUrl, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
}; }
function failure(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Private lane history request failed." }, { status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" } }); }

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request); const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);
    const { data, error } = await user.client.from(TABLE).select("id,operation,label,state,created_at,changed_at").eq("owner_id", user.id).eq("session_id", sessionId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
    if (error) throw new ApiError(`Private lane history could not be loaded: ${error.message}`, 500);
    return NextResponse.json({ history: (data ?? []).map(history) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request); const body = await request.json() as Record<string, unknown>;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const historyId = typeof body.historyId === "string" ? body.historyId.trim() : "";
    const action = body.action === "undo" || body.action === "redo" ? body.action : null;
    await requireSession(user.id, user.token, sessionId);
    if (!historyId || !action) throw new ApiError("A valid history action and historyId are required.", 400);
    const { data, error } = await user.client.rpc("apply_timeline_daw_private_lane_history", { p_history_id: historyId, p_direction: action });
    if (error || !Array.isArray(data)) throw new ApiError(`Private lane ${action} failed: ${error?.message ?? "rows missing"}`, error?.message.includes("conflict") ? 409 : 400);
    const lanes = await Promise.all(data.map(async (row) => lane(row, await sign(user.client, user.id, sessionId, String(row.source_uri)))));
    const refreshed = await user.client.from(TABLE).select("id,operation,label,state,created_at,changed_at").eq("owner_id", user.id).eq("session_id", sessionId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
    if (refreshed.error) throw new ApiError("Private lane history could not be refreshed.", 500);
    return NextResponse.json({ lanes, history: (refreshed.data ?? []).map(history) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
