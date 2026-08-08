import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { TimelineAudioDecodeEngine } from "@/lib/timeline/TimelineAudioDecodeEngine";
import { TimelineDawRenderSupabaseSourceStore } from "@/lib/timeline/TimelineDawRenderSourceStore";
import { deriveTimelineDawPrivateLaneWaveform } from "@/lib/timeline/TimelineDawPrivateLaneWaveformPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANE_TABLE = "timeline_daw_private_audio_lanes";
const WAVEFORM_TABLE = "timeline_daw_private_waveforms";

class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
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
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Private waveform request failed." }, {
    status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    const laneId = request.nextUrl.searchParams.get("laneId")?.trim() ?? "";
    if (!sessionId || !laneId) throw new ApiError("sessionId and laneId are required.", 400);
    if (!await createTimelineDawWorkspaceServer(user.id, user.token).get(user.id, sessionId)) throw new ApiError("DAW session was not found.", 404);
    const { data: lane, error: laneError } = await user.client.from(LANE_TABLE).select("*")
      .eq("id", laneId).eq("owner_id", user.id).eq("session_id", sessionId).single();
    if (laneError || !lane) throw new ApiError("Private audio lane was not found.", 404);
    const key = {
      owner_id: user.id, source_checksum: String(lane.source_checksum), sample_rate: Number(lane.sample_rate),
      channel_count: Number(lane.channel_count), frame_count: Number(lane.frame_count),
    };
    const cached = await user.client.from(WAVEFORM_TABLE).select("bin_count,frame_count,peaks")
      .match(key).maybeSingle();
    if (cached.error) throw new ApiError(`Waveform cache could not be read: ${cached.error.message}`, 500);
    if (cached.data) return NextResponse.json({ waveform: {
      binCount: Number(cached.data.bin_count), frameCount: Number(cached.data.frame_count), peaks: cached.data.peaks,
    }, cached: true }, { headers: { "Cache-Control": "private, max-age=300" } });

    const bytes = await new TimelineDawRenderSupabaseSourceStore(user.client, user.id).load(user.id, String(lane.source_uri));
    const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (checksum !== lane.source_checksum) throw new ApiError("Private WAV checksum no longer matches its lane record.", 409);
    const decoded = new TimelineAudioDecodeEngine().decode({
      sourceArtifactId: String(lane.source_id), sourceFingerprint: checksum, bytes, fileName: "source.wav", decodedBy: user.id,
    });
    if (!decoded.accepted || !decoded.audio) throw new ApiError(decoded.issues[0]?.message ?? "Private WAV could not be decoded.", 400);
    if (decoded.audio.sampleRate !== key.sample_rate || decoded.audio.channelCount !== key.channel_count || decoded.audio.frameCount !== key.frame_count) {
      throw new ApiError("Private WAV geometry no longer matches its lane record.", 409);
    }
    const waveform = deriveTimelineDawPrivateLaneWaveform(decoded.audio);
    const saved = await user.client.from(WAVEFORM_TABLE).upsert({ ...key, bin_count: waveform.binCount, peaks: waveform.peaks });
    if (saved.error) throw new ApiError(`Waveform cache could not be saved: ${saved.error.message}`, 500);
    return NextResponse.json({ waveform, cached: false }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) { return failure(error); }
}
