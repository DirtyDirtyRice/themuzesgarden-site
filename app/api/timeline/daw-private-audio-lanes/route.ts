import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { parseTimelineDawPrivateAudioLane } from "@/lib/timeline/TimelineDawPrivateAudioLanePolicy";
import { parseTimelineDawPrivateLaneMix } from "@/lib/timeline/TimelineDawPrivateLaneMixerPolicy";
import { parseTimelineDawPrivateLaneArrangement } from "@/lib/timeline/TimelineDawPrivateLaneArrangementPolicy";
import { parseTimelineDawPrivateLaneFade } from "@/lib/timeline/TimelineDawPrivateLaneFadePolicy";
import { parseTimelineDawPrivateLaneTransform } from "@/lib/timeline/TimelineDawPrivateLaneTransformPolicy";
import { parseTimelineDawPrivateLaneSplit } from "@/lib/timeline/TimelineDawPrivateLaneSplitPolicy";
import { createTimelineDawPrivateLaneEditReceipt, type TimelineDawPrivateLaneEditOperation } from "@/lib/timeline/TimelineDawPrivateLaneEditHistoryPolicy";
import { parseTimelineDawMusicianTrackName } from "@/lib/timeline/TimelineDawMusicianTrackName";
import { resolveTimelineDawMusicianTrackCopyPosition } from "@/lib/timeline/TimelineDawMusicianTrackCopy";

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
    sourceInSeconds: Number(row.source_in_seconds ?? 0),
    sourceOutSeconds: Number(row.source_out_seconds ?? row.duration_seconds),
    busId: row.bus_id ? String(row.bus_id) : null,
    transform: { stretchRatio: Number(row.stretch_ratio ?? 1), pitchSemitones: Number(row.pitch_semitones ?? 0), algorithm: (row.transform_algorithm ?? "preserve-pitch") as "preserve-pitch" | "resample", quality: (row.transform_quality ?? "balanced") as "draft" | "balanced" | "high", bypassed: Boolean(row.transform_bypassed) },
    fade: { inSeconds: Number(row.fade_in_seconds ?? 0), outSeconds: Number(row.fade_out_seconds ?? 0) },
    mix: { muted: Boolean(row.muted), soloed: Boolean(row.soloed), gain: Number(row.gain), pan: Number(row.pan) },
    provenance: row.comp_id ? { compId: String(row.comp_id), renderChecksum: String(row.comp_render_checksum) } : null,
    playbackUrl, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}
async function recordEdit(client: SupabaseClient, ownerId: string, sessionId: string, operation: TimelineDawPrivateLaneEditOperation, beforeRows: Record<string, unknown>[], afterRows: Record<string, unknown>[]) {
  const receipt = createTimelineDawPrivateLaneEditReceipt({ operation, beforeRows, afterRows });
  const { error } = await client.from("timeline_daw_private_lane_edit_history").insert({
    id: `timeline-daw-lane-history-${crypto.randomUUID()}`, owner_id: ownerId, session_id: sessionId,
    operation: receipt.operation, label: receipt.label, before_rows: receipt.beforeRows, after_rows: receipt.afterRows,
  });
  if (error) throw new ApiError(`Private lane edit history could not be recorded: ${error.message}`, 500);
}

async function assertLease(client:SupabaseClient,ownerId:string,sessionId:string,resourceId:string,actorId:string){if(!resourceId)return;const{data}=await client.from("timeline_daw_private_edit_leases").select("holder_id,holder_name,expires_at").eq("owner_id",ownerId).eq("session_id",sessionId).eq("resource_kind","lane").eq("resource_id",resourceId).gt("expires_at",new Date().toISOString()).maybeSingle();if(data&&data.holder_id!==actorId)throw new ApiError(`${data.holder_name} holds this lane until ${data.expires_at}.`,409)}
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
    if(request.method==="POST")await assertLease(user.client,user.id,sessionId,typeof body.laneId==="string"?body.laneId:"",user.id);
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
        source_in_seconds: 0, source_out_seconds: input.durationSeconds,
        comp_id: input.compId, comp_render_checksum: input.compRenderChecksum,
      }).select("*").single();
      if (error || !data) throw new ApiError(`Private audio lane could not be saved: ${error?.message ?? "missing row"}`, 500);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, input.sourceUri)) }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "rename") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      let name: string;
      try { name = parseTimelineDawMusicianTrackName(body.name); }
      catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Track name is invalid.", 400); }
      const { data, error } = await user.client.from(TABLE).update({ name, updated_at: new Date().toISOString() })
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (error || !data) throw new ApiError("Private audio track was not found.", 404);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, String(data.source_uri))) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "arrange") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data: stored, error: storedError } = await user.client.from(TABLE).select("*")
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).single();
      if (storedError || !stored) throw new ApiError("Private audio lane was not found.", 404);
      let arrangement;
      try { arrangement = parseTimelineDawPrivateLaneArrangement(body, Number(stored.sample_rate), Number(stored.frame_count)); }
      catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Private lane arrangement is invalid.", 400); }
      try {
        parseTimelineDawPrivateLaneFade({ fadeInSeconds: stored.fade_in_seconds, fadeOutSeconds: stored.fade_out_seconds },
          Number(stored.sample_rate), arrangement.sourceOutFrame - arrangement.sourceInFrame);
      } catch { throw new ApiError("Shorten the lane fades before trimming to this duration.", 400); }
      const { data, error } = await user.client.from(TABLE).update({
        timeline_start_seconds: arrangement.timelineStartSeconds,
        source_in_seconds: arrangement.sourceInSeconds,
        source_out_seconds: arrangement.sourceOutSeconds,
        updated_at: new Date().toISOString(),
      }).eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (error || !data) throw new ApiError("Private audio lane was not found.", 404);
      await recordEdit(user.client, user.id, sessionId, "arrange", [stored], [data]);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, String(data.source_uri))) }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "duplicate") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data: stored, error: storedError } = await user.client.from(TABLE).select("*")
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).single();
      if (storedError || !stored) throw new ApiError("Private audio lane was not found.", 404);
      let arrangement;
      try {
        const nextStart = resolveTimelineDawMusicianTrackCopyPosition({
          originalStartSeconds: Number(stored.timeline_start_seconds),
          sourceInSeconds: Number(stored.source_in_seconds),
          sourceOutSeconds: Number(stored.source_out_seconds),
          playPositionSeconds: body.timelineStartSeconds === undefined ? undefined : Number(body.timelineStartSeconds),
        });
        arrangement = parseTimelineDawPrivateLaneArrangement({
          timelineStartSeconds: nextStart,
          sourceInSeconds: stored.source_in_seconds,
          sourceOutSeconds: stored.source_out_seconds,
        }, Number(stored.sample_rate), Number(stored.frame_count));
      } catch (cause) {
        throw new ApiError(cause instanceof Error ? cause.message : "Copy position is invalid.", 400);
      }
      const copyId = `timeline-daw-private-lane-${crypto.randomUUID()}`;
      const { data, error } = await user.client.from(TABLE).insert({
        id: copyId, owner_id: user.id, session_id: sessionId,
        name: `${String(stored.name).slice(0, 113)} Copy`,
        source_id: stored.source_id, source_uri: stored.source_uri, source_checksum: stored.source_checksum,
        sample_rate: stored.sample_rate, channel_count: stored.channel_count, frame_count: stored.frame_count,
        duration_seconds: stored.duration_seconds, timeline_start_seconds: arrangement.timelineStartSeconds,
        source_in_seconds: arrangement.sourceInSeconds, source_out_seconds: arrangement.sourceOutSeconds,
        comp_id: stored.comp_id, comp_render_checksum: stored.comp_render_checksum,
        muted: stored.muted, soloed: stored.soloed, gain: stored.gain, pan: stored.pan,
        fade_in_seconds: stored.fade_in_seconds, fade_out_seconds: stored.fade_out_seconds,
        bus_id: stored.bus_id,
      }).select("*").single();
      if (error || !data) throw new ApiError(`Private audio lane could not be duplicated: ${error?.message ?? "missing row"}`, 500);
      await recordEdit(user.client, user.id, sessionId, "duplicate", [], [data]);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, String(data.source_uri))) }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "split") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data: stored, error: storedError } = await user.client.from(TABLE).select("*")
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).single();
      if (storedError || !stored) throw new ApiError("Private audio lane was not found.", 404);
      let split;
      try {
        split = parseTimelineDawPrivateLaneSplit(body, Number(stored.sample_rate), Number(stored.timeline_start_seconds),
          Number(stored.source_in_seconds), Number(stored.source_out_seconds), Number(stored.fade_in_seconds), Number(stored.fade_out_seconds),
          Number(stored.stretch_ratio ?? 1), Boolean(stored.transform_bypassed));
      } catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Private lane split is invalid.", 400); }
      const rightLaneId = `timeline-daw-private-lane-${crypto.randomUUID()}`;
      const { data, error } = await user.client.rpc("split_timeline_daw_private_audio_lane", {
        p_lane_id: laneId, p_session_id: sessionId, p_right_lane_id: rightLaneId,
        p_timeline_split_seconds: split.timelineSplitSeconds, p_source_split_seconds: split.sourceSplitSeconds,
      });
      if (error || !Array.isArray(data) || data.length !== 2) {
        throw new ApiError(`Private audio lane could not be split atomically: ${error?.message ?? "split rows missing"}`, 500);
      }
      if (stored.bus_id) {
        const { data: routed, error: routeError } = await user.client.from(TABLE).update({ bus_id: stored.bus_id }).eq("id", rightLaneId).eq("owner_id", user.id).select("*").single();
        if (routeError || !routed) throw new ApiError("Split region routing could not be preserved.", 500);
        const index = data.findIndex((row) => row.id === rightLaneId); if (index >= 0) data[index] = routed;
      }
      await recordEdit(user.client, user.id, sessionId, "split", [stored], data);
      const lanes = await Promise.all(data.map(async (row) => lane(row, await sign(user.client, user.id, sessionId, String(row.source_uri)))));
      return NextResponse.json({ lanes }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "transform") { const laneId=typeof body.laneId==="string"?body.laneId.trim():"";const {data:stored}=await user.client.from(TABLE).select("*").eq("id",laneId).eq("owner_id",user.id).eq("session_id",sessionId).single();if(!stored)throw new ApiError("Private audio lane was not found.",404);const transform=parseTimelineDawPrivateLaneTransform(body);const {data,error}=await user.client.from(TABLE).update({stretch_ratio:transform.stretchRatio,pitch_semitones:transform.pitchSemitones,transform_algorithm:transform.algorithm,transform_quality:transform.quality,transform_bypassed:transform.bypassed,updated_at:new Date().toISOString()}).eq("id",laneId).eq("owner_id",user.id).select("*").single();if(error||!data)throw new ApiError("Lane transform could not be saved.",500);await recordEdit(user.client,user.id,sessionId,"transform",[stored],[data]);return NextResponse.json({lane:lane(data,await sign(user.client,user.id,sessionId,String(data.source_uri)))})}
    if (body.action === "mix") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      let mix;
      try { mix = parseTimelineDawPrivateLaneMix(body); }
      catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Private lane mixer settings are invalid.", 400); }
      const { data, error } = await user.client.from(TABLE).update({ ...mix, updated_at: new Date().toISOString() })
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (error || !data) throw new ApiError("Private audio lane was not found.", 404);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, String(data.source_uri))) }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "fade") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data: stored, error: storedError } = await user.client.from(TABLE).select("*")
        .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).single();
      if (storedError || !stored) throw new ApiError("Private audio lane was not found.", 404);
      const stretch = Boolean(stored.transform_bypassed) ? 1 : Number(stored.stretch_ratio ?? 1);
      const durationFrames = Math.round((Number(stored.source_out_seconds) - Number(stored.source_in_seconds)) * stretch * Number(stored.sample_rate));
      let fade;
      try { fade = parseTimelineDawPrivateLaneFade(body, Number(stored.sample_rate), durationFrames); }
      catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Private lane fade settings are invalid.", 400); }
      const { data, error } = await user.client.from(TABLE).update({
        fade_in_seconds: fade.inSeconds, fade_out_seconds: fade.outSeconds, updated_at: new Date().toISOString(),
      }).eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (error || !data) throw new ApiError("Private audio lane was not found.", 404);
      await recordEdit(user.client, user.id, sessionId, "fade", [stored], [data]);
      return NextResponse.json({ lane: lane(data, await sign(user.client, user.id, sessionId, String(data.source_uri))) }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "remove") {
      const laneId = typeof body.laneId === "string" ? body.laneId.trim() : "";
      if (!laneId) throw new ApiError("laneId is required.", 400);
      const { data, error } = await user.client.from(TABLE).delete().eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (error || !data) throw new ApiError("Private audio lane was not found.", 404);
      await recordEdit(user.client, user.id, sessionId, "remove", [data], []);
      return NextResponse.json({ removedLaneId: laneId }, { headers: { "Cache-Control": "no-store" } });
    }
    throw new ApiError("Private audio lane action is invalid.", 400);
  } catch (error) { return failure(error); }
}
