import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { TimelineAudioDecodeEngine } from "@/lib/timeline/TimelineAudioDecodeEngine";
import { TimelineDawRenderSupabaseSourceStore } from "@/lib/timeline/TimelineDawRenderSourceStore";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}
function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "DAW render source request failed." },
    { status: error instanceof ApiError ? error.status : 400, headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    if (request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
      const path = typeof body.path === "string" ? body.path.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const expectedChecksum = typeof body.checksum === "string" ? body.checksum.trim() : "";
      const expectedLength = Number(body.byteLength);
      if (body.action !== "register-upload") throw new ApiError("Render source action is invalid.", 400);
      if (!sessionId) throw new ApiError("sessionId is required.", 400);
      if (!path.startsWith(`${user.id}/${sessionId}/`) || path.includes("..")) {
        throw new ApiError("Private render source path is invalid.", 403);
      }
      if (!name.toLowerCase().endsWith(".wav") || !path.toLowerCase().endsWith(".wav")) {
        throw new ApiError("Render sources must be WAV files.", 400);
      }
      if (!/^sha256:[a-f0-9]{64}$/.test(expectedChecksum)) throw new ApiError("Render source checksum is invalid.", 400);
      if (!Number.isInteger(expectedLength) || expectedLength <= 0 || expectedLength > 268_435_456) {
        throw new ApiError("WAV source size must be from 1 byte to 256 MB.", 413);
      }
      const session = await createTimelineDawWorkspaceServer(user.id, user.token).get(user.id, sessionId);
      if (!session) throw new ApiError("DAW session was not found.", 404);
      const { data, error } = await user.client.storage.from("timeline-daw-render-sources").download(path);
      if (error || !data) throw new ApiError(`Private WAV could not be verified: ${error?.message ?? "file missing"}`, 400);
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (bytes.byteLength !== expectedLength) throw new ApiError("Private WAV size changed during upload.", 409);
      const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
      if (checksum !== expectedChecksum) throw new ApiError("Private WAV checksum verification failed.", 409);
      const decoded = new TimelineAudioDecodeEngine().decode({
        sourceArtifactId: name, sourceFingerprint: checksum, bytes, fileName: name, decodedBy: user.id,
      });
      if (!decoded.accepted) throw new ApiError(decoded.issues[0]?.message ?? "WAV source is invalid.", 400);
      return NextResponse.json({
        source: {
          id: `timeline-daw-source-${checksum.slice(7, 23)}`,
          ownerId: user.id,
          sessionId,
          name,
          uri: `supabase://timeline-daw-render-sources/${path}`,
          byteLength: bytes.byteLength,
          checksum,
        },
        audio: decoded.evidence,
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const form = await request.formData();
    const sessionId = typeof form.get("sessionId") === "string"
      ? String(form.get("sessionId")).trim()
      : "";
    const file = form.get("file");
    if (!sessionId) throw new ApiError("sessionId is required.", 400);
    if (!(file instanceof File)) throw new ApiError("A WAV source file is required.", 400);
    if (file.size <= 0 || file.size > 268_435_456) {
      throw new ApiError("WAV source size must be from 1 byte to 256 MB.", 413);
    }
    if (!file.name.toLowerCase().endsWith(".wav")) {
      throw new ApiError("Render sources must be WAV files.", 400);
    }
    const session = await createTimelineDawWorkspaceServer(user.id, user.token)
      .get(user.id, sessionId);
    if (!session) throw new ApiError("DAW session was not found.", 404);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    const decoded = new TimelineAudioDecodeEngine().decode({
      sourceArtifactId: file.name,
      sourceFingerprint: checksum,
      bytes,
      fileName: file.name,
      decodedBy: user.id,
    });
    if (!decoded.accepted) {
      throw new ApiError(decoded.issues[0]?.message ?? "WAV source is invalid.", 400);
    }
    const source = await new TimelineDawRenderSupabaseSourceStore(user.client, user.id).save({
      ownerId: user.id,
      sessionId,
      name: file.name,
      bytes,
    });
    return NextResponse.json({ source, audio: decoded.evidence }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return failure(error); }
}
