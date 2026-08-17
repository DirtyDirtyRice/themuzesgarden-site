import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import {
  resolveTimelineDawTakeStoragePath,
  TIMELINE_DAW_TAKE_BUCKET,
  TIMELINE_DAW_TAKE_DELIVERY_SECONDS,
} from "@/lib/timeline/TimelineDawRecordingTakeDeliveryPolicy";
import { parseTimelineDawTakeReview } from "@/lib/timeline/TimelineDawTakeReviewPolicy";
import { createTimelineDawRecordingPasses, parseTimelineDawRecordingPlan } from "@/lib/timeline/TimelineDawPunchLoopRecordingPolicy";
import {
  decideTimelineDawTakeAudioCleanup,
  timelineDawStoredAudioCleanupWarning,
} from "@/lib/timeline/TimelineDawTakeAudioCleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "timeline_daw_recording_takes";
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
  if (!header.toLowerCase().startsWith("bearer ") || !header.slice(7).trim()) {
    throw new ApiError("Authentication is required.", 401);
  }
  const token = header.slice(7).trim();
  const client = createClient(
    environment("NEXT_PUBLIC_SUPABASE_URL"),
    environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}

async function requireSession(ownerId: string, token: string, sessionId: string) {
  if (!sessionId) throw new ApiError("sessionId is required.", 400);
  const session = await createTimelineDawWorkspaceServer(ownerId, token).get(ownerId, sessionId);
  if (!session) throw new ApiError("DAW session was not found.", 404);
}

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "DAW recording take request failed." },
    { status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" } },
  );
}

function take(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    name: String(row.name),
    notes: String(row.notes ?? ""),
    rating: Number(row.rating ?? 0),
    source: {
      id: String(row.source_id),
      name: String(row.name),
      uri: String(row.uri),
      byteLength: Number(row.byte_length),
      checksum: String(row.checksum),
    },
    audio: {
      sampleRate: Number(row.sample_rate),
      channelCount: Number(row.channel_count),
      frameCount: Number(row.frame_count),
      durationSeconds: Number(row.duration_seconds),
    },
    preferred: Boolean(row.is_preferred),
    recording: {
      mode: String(row.recording_mode ?? "normal"),
      groupId: row.take_group_id == null ? null : String(row.take_group_id),
      passNumber: Number(row.pass_number ?? 1),
      timelineStartFrame: Number(row.timeline_start_frame ?? 0),
      sourceInFrame: Number(row.source_in_frame ?? 0),
      sourceOutFrame: row.source_out_frame == null ? Number(row.frame_count) : Number(row.source_out_frame),
      countInBars: Number(row.count_in_bars ?? 0),
      countInCaptured: Boolean(row.count_in_captured ?? true),
    },
    createdAt: String(row.created_at),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);
    const { data, error } = await user.client.from(TABLE)
      .select("*")
      .eq("owner_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(`Recording takes could not be loaded: ${error.message}`, 500);
    return NextResponse.json({ takes: (data ?? []).map((row) => take(row)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const body = await request.json() as {
      action?: string;
      sessionId?: string;
      name?: string;
      notes?: string;
      rating?: number;
      takeId?: string;
      source?: { id?: string; name?: string; uri?: string; byteLength?: number; checksum?: string };
      audio?: { sampleRate?: number; channelCount?: number; frameCount?: number; durationSeconds?: number };
      recordingPlan?: unknown;
    };
    const sessionId = body.sessionId?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);

    if (body.action === "register") {
      const source = body.source;
      const audio = body.audio;
      const ownerPrefix = `${PREFIX}${user.id}/${sessionId}/`;
      if (!source?.uri?.startsWith(ownerPrefix)) throw new ApiError("Recording source does not belong to this session.", 400);
      if (!source.id || !source.name || !source.checksum || !Number.isFinite(source.byteLength)) throw new ApiError("Recording source metadata is invalid.", 400);
      if (!audio || !Number.isFinite(audio.sampleRate) || !Number.isFinite(audio.channelCount) || !Number.isFinite(audio.frameCount) || !Number.isFinite(audio.durationSeconds)) {
        throw new ApiError("Recording audio metadata is invalid.", 400);
      }
      const plan = parseTimelineDawRecordingPlan({
        ...(body.recordingPlan && typeof body.recordingPlan === "object" ? body.recordingPlan : {}),
        sampleRate: audio.sampleRate,
      });
      const passes = createTimelineDawRecordingPasses(plan, Math.round(Number(audio.frameCount)));
      const groupId = plan.mode === "normal" ? null : (plan.groupId ?? `recording-group-${crypto.randomUUID()}`);
      const rows = passes.map((pass) => ({
        id: `timeline-daw-take-${crypto.randomUUID()}`,
        owner_id: user.id,
        session_id: sessionId,
        source_id: source.id,
        name: passes.length > 1 ? `${source.name} - Pass ${pass.passNumber}` : source.name,
        uri: source.uri,
        byte_length: source.byteLength,
        checksum: source.checksum,
        sample_rate: audio.sampleRate,
        channel_count: audio.channelCount,
        frame_count: audio.frameCount,
        duration_seconds: audio.durationSeconds,
        recording_mode: plan.mode,
        take_group_id: groupId,
        pass_number: pass.passNumber,
        timeline_start_frame: pass.timelineStartFrame,
        source_in_frame: pass.sourceInFrame,
        source_out_frame: pass.sourceOutFrame,
        count_in_bars: plan.countInBars,
        count_in_captured: plan.countInCaptured,
      }));
      const { data, error } = await user.client.from(TABLE).insert(rows).select("*");
      if (error || !data?.length) throw new ApiError(`Recording take could not be registered: ${error?.message ?? "missing rows"}`, 500);
      const registered = data.map((row) => take(row));
      return NextResponse.json({ take: registered[0], takes: registered }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "review") {
      if (!body.takeId) throw new ApiError("takeId is required.", 400);
      let review;
      try {
        review = parseTimelineDawTakeReview(body);
      } catch (cause) {
        throw new ApiError(cause instanceof Error ? cause.message : "Take review is invalid.", 400);
      }
      const { data, error } = await user.client.from(TABLE)
        .update({ ...review, updated_at: new Date().toISOString() })
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .eq("id", body.takeId)
        .select("*")
        .single();
      if (error || !data) throw new ApiError("Recording take was not found.", 404);
      return NextResponse.json({ take: take(data) }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "prefer") {
      if (!body.takeId) throw new ApiError("takeId is required.", 400);
      const { error: clearError } = await user.client.from(TABLE)
        .update({ is_preferred: false })
        .eq("owner_id", user.id)
        .eq("session_id", sessionId);
      if (clearError) throw new ApiError(`Preferred take could not be updated: ${clearError.message}`, 500);
      const { data, error } = await user.client.from(TABLE)
        .update({ is_preferred: true, updated_at: new Date().toISOString() })
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .eq("id", body.takeId)
        .select("*")
        .single();
      if (error || !data) throw new ApiError("Recording take was not found.", 404);
      return NextResponse.json({ take: take(data) }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "audition") {
      if (!body.takeId) throw new ApiError("takeId is required.", 400);
      const { data, error } = await user.client.from(TABLE)
        .select("uri")
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .eq("id", body.takeId)
        .single();
      if (error || !data) throw new ApiError("Recording take was not found.", 404);
      let path: string;
      try {
        path = resolveTimelineDawTakeStoragePath(String(data.uri), user.id, sessionId);
      } catch (cause) {
        throw new ApiError(cause instanceof Error ? cause.message : "Recording source path is invalid.", 400);
      }
      const { data: signed, error: signedError } = await user.client.storage
        .from(TIMELINE_DAW_TAKE_BUCKET)
        .createSignedUrl(path, TIMELINE_DAW_TAKE_DELIVERY_SECONDS);
      if (signedError || !signed?.signedUrl) {
        throw new ApiError(`Recording audition could not be prepared: ${signedError?.message ?? "signed URL missing"}`, 500);
      }
      return NextResponse.json(
        { auditionUrl: signed.signedUrl, expiresInSeconds: TIMELINE_DAW_TAKE_DELIVERY_SECONDS },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (body.action === "delete") {
      if (!body.takeId) throw new ApiError("takeId is required.", 400);
      const { data, error } = await user.client.from(TABLE)
        .select("*")
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .eq("id", body.takeId)
        .single();
      if (error || !data) throw new ApiError("Recording take was not found.", 404);
      const uri = String(data.uri);
      const ownerPrefix = `${PREFIX}${user.id}/${sessionId}/`;
      if (!uri.startsWith(ownerPrefix)) throw new ApiError("Recording source path is invalid.", 400);
      const { error: deleteError } = await user.client.from(TABLE).delete().eq("id", body.takeId).eq("owner_id", user.id);
      if (deleteError) throw new ApiError(`Recording take could not be deleted: ${deleteError.message}`, 500);
      const { count, error: countError } = await user.client.from(TABLE).select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("session_id", sessionId).eq("uri", uri);
      const cleanup = decideTimelineDawTakeAudioCleanup({
        remainingReferenceCount: count,
        referenceCheckFailed: Boolean(countError),
      });
      let cleanupWarning = cleanup.warning;
      if (cleanup.removeStoredAudio) {
        const { error: storageError } = await user.client.storage.from(BUCKET).remove([uri.slice(PREFIX.length)]);
        if (storageError) cleanupWarning = timelineDawStoredAudioCleanupWarning();
      }
      return NextResponse.json({ deletedTakeId: body.takeId, cleanupWarning }, { headers: { "Cache-Control": "no-store" } });
    }

    throw new ApiError("Recording take action is invalid.", 400);
  } catch (error) { return failure(error); }
}
