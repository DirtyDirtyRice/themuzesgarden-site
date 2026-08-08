import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { parseTimelineDawTakeCompRecipe } from "@/lib/timeline/TimelineDawTakeCompPolicy";
import { TimelineAudioDecodeEngine } from "@/lib/timeline/TimelineAudioDecodeEngine";
import { encodeTimelineDawPcmWav } from "@/lib/timeline/TimelineDawPcmCapture";
import { TimelineDawRenderSupabaseArtifactStore } from "@/lib/timeline/TimelineDawRenderSupabaseArtifactStore";
import { TimelineDawRenderSupabaseSourceStore } from "@/lib/timeline/TimelineDawRenderSourceStore";
import { TimelineDawTakeCompRenderer } from "@/lib/timeline/TimelineDawTakeCompRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMP_TABLE = "timeline_daw_take_comps";
const TAKE_TABLE = "timeline_daw_recording_takes";

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
    { error: error instanceof Error ? error.message : "DAW take comp request failed." },
    { status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" } },
  );
}

function comp(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    name: String(row.name),
    regions: row.regions,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    render: row.output_uri ? {
      uri: String(row.output_uri),
      checksum: String(row.output_checksum),
      byteLength: Number(row.output_byte_length),
      sampleRate: Number(row.output_sample_rate),
      channelCount: Number(row.output_channel_count),
      frameCount: Number(row.output_frame_count),
      durationSeconds: Number(row.output_duration_seconds),
      renderedAt: String(row.rendered_at),
    } : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);
    const { data, error } = await user.client.from(COMP_TABLE)
      .select("*")
      .eq("owner_id", user.id)
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false });
    if (error) throw new ApiError(`Take comps could not be loaded: ${error.message}`, 500);
    return NextResponse.json({ comps: (data ?? []).map((row) => comp(row)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const body = await request.json() as {
      action?: string;
      sessionId?: string;
      compId?: string;
      name?: string;
      regions?: Array<{ takeId?: string; startSeconds?: number; endSeconds?: number }>;
    };
    const sessionId = body.sessionId?.trim() ?? "";
    await requireSession(user.id, user.token, sessionId);

    if (body.action === "save") {
      const takeIds = [...new Set((body.regions ?? []).map((region) => region.takeId?.trim()).filter(Boolean))] as string[];
      const { data: takes, error: takeError } = await user.client.from(TAKE_TABLE)
        .select("id,duration_seconds")
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .in("id", takeIds);
      if (takeError) throw new ApiError(`Comp takes could not be verified: ${takeError.message}`, 500);
      const durations = new Map((takes ?? []).map((take) => [String(take.id), Number(take.duration_seconds)]));
      let recipe;
      try {
        recipe = parseTimelineDawTakeCompRecipe(body, durations);
      } catch (cause) {
        throw new ApiError(cause instanceof Error ? cause.message : "Comp recipe is invalid.", 400);
      }
      const id = body.compId?.trim() || `timeline-daw-comp-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const { data, error } = await user.client.from(COMP_TABLE).upsert({
        id,
        owner_id: user.id,
        session_id: sessionId,
        name: recipe.name,
        regions: recipe.regions,
        output_uri: null,
        output_checksum: null,
        output_byte_length: null,
        output_sample_rate: null,
        output_channel_count: null,
        output_frame_count: null,
        output_duration_seconds: null,
        rendered_at: null,
        updated_at: now,
      }, { onConflict: "id" }).select("*").single();
      if (error || !data) throw new ApiError(`Take comp could not be saved: ${error?.message ?? "missing row"}`, 500);
      return NextResponse.json({ comp: comp(data) }, { status: body.compId ? 200 : 201, headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "render") {
      if (!body.compId) throw new ApiError("compId is required.", 400);
      const { data: storedComp, error: compError } = await user.client.from(COMP_TABLE)
        .select("*")
        .eq("id", body.compId)
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .single();
      if (compError || !storedComp) throw new ApiError("Take comp was not found.", 404);
      const rawRegions: unknown[] = Array.isArray(storedComp.regions) ? storedComp.regions : [];
      const takeIds = [...new Set(rawRegions.map((region) => String((region as { takeId?: unknown }).takeId ?? "")))];
      const { data: takes, error: takeError } = await user.client.from(TAKE_TABLE)
        .select("id,uri,duration_seconds")
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .in("id", takeIds);
      if (takeError) throw new ApiError(`Comp takes could not be loaded: ${takeError.message}`, 500);
      let recipe;
      try {
        recipe = parseTimelineDawTakeCompRecipe(
          { name: storedComp.name, regions: rawRegions },
          new Map((takes ?? []).map((take) => [String(take.id), Number(take.duration_seconds)])),
        );
      } catch (cause) {
        throw new ApiError(cause instanceof Error ? cause.message : "Stored comp recipe is invalid.", 400);
      }
      const sourceStore = new TimelineDawRenderSupabaseSourceStore(user.client, user.id);
      const decoder = new TimelineAudioDecodeEngine();
      const sources = new Map();
      for (const take of takes ?? []) {
        const id = String(take.id);
        const bytes = await sourceStore.load(user.id, String(take.uri));
        const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
        const decoded = decoder.decode({ sourceArtifactId: id, sourceFingerprint: checksum, bytes, fileName: "take.wav", decodedBy: user.id });
        if (!decoded.accepted || !decoded.audio) throw new ApiError(decoded.issues[0]?.message ?? `Take ${id} could not be decoded.`, 400);
        sources.set(id, { ...decoded.audio, takeId: id });
      }
      const pcm = new TimelineDawTakeCompRenderer().render(recipe.regions, sources);
      const wav = encodeTimelineDawPcmWav(pcm.channels, pcm.sampleRate);
      const checksum = `sha256:${createHash("sha256").update(wav.bytes).digest("hex")}`;
      const artifactStore = new TimelineDawRenderSupabaseArtifactStore(user.client, user.id);
      const artifact = await artifactStore.save({
        ownerId: user.id, sessionId, jobId: body.compId, bytes: wav.bytes, checksum, contentType: "audio/wav",
      });
      const deliveryUrl = await artifactStore.createDeliveryUrl(artifact);
      const renderedAt = new Date().toISOString();
      const { data: updated, error: updateError } = await user.client.from(COMP_TABLE).update({
        output_uri: artifact.uri,
        output_checksum: artifact.checksum,
        output_byte_length: artifact.byteLength,
        output_sample_rate: pcm.sampleRate,
        output_channel_count: pcm.channelCount,
        output_frame_count: pcm.frameCount,
        output_duration_seconds: pcm.durationSeconds,
        rendered_at: renderedAt,
        updated_at: renderedAt,
      }).eq("id", body.compId).eq("owner_id", user.id).eq("session_id", sessionId).select("*").single();
      if (updateError || !updated) throw new ApiError(`Rendered comp metadata could not be saved: ${updateError?.message ?? "missing row"}`, 500);
      return NextResponse.json({
        comp: comp(updated), deliveryUrl, progress: [
          { stage: "decoded", percent: 35 },
          { stage: "assembled", percent: 70 },
          { stage: "persisted", percent: 100 },
        ],
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "delivery") {
      if (!body.compId) throw new ApiError("compId is required.", 400);
      const { data, error } = await user.client.from(COMP_TABLE)
        .select("output_uri,output_checksum,output_byte_length")
        .eq("id", body.compId).eq("owner_id", user.id).eq("session_id", sessionId).single();
      if (error || !data?.output_uri || !data.output_checksum || !data.output_byte_length) {
        throw new ApiError("Rendered comp artifact was not found.", 404);
      }
      const deliveryUrl = await new TimelineDawRenderSupabaseArtifactStore(user.client, user.id).createDeliveryUrl({
        ownerId: user.id,
        sessionId,
        jobId: body.compId,
        uri: String(data.output_uri),
        byteLength: Number(data.output_byte_length),
        checksum: String(data.output_checksum),
        contentType: "audio/wav",
      });
      return NextResponse.json({ deliveryUrl }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "delete") {
      if (!body.compId) throw new ApiError("compId is required.", 400);
      const { data, error } = await user.client.from(COMP_TABLE)
        .delete()
        .eq("id", body.compId)
        .eq("owner_id", user.id)
        .eq("session_id", sessionId)
        .select("id")
        .single();
      if (error || !data) throw new ApiError("Take comp was not found.", 404);
      return NextResponse.json({ deletedCompId: body.compId }, { headers: { "Cache-Control": "no-store" } });
    }

    throw new ApiError("Take comp action is invalid.", 400);
  } catch (error) { return failure(error); }
}
