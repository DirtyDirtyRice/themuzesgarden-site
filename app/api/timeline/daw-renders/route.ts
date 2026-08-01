import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { parseTimelineDawRenderCommand } from "@/lib/timeline/TimelineDawRenderApiPolicy";
import { parseTimelineDawRenderExecutionCommand } from "@/lib/timeline/TimelineDawRenderExecutionApiPolicy";
import { TimelineDawRenderDeliveryService } from "@/lib/timeline/TimelineDawRenderDeliveryService";
import { TimelineDawRenderExecutionService } from "@/lib/timeline/TimelineDawRenderExecutionService";
import { TimelineDawRenderSourceMixer } from "@/lib/timeline/TimelineDawRenderSourceMixer";
import { TimelineDawRenderSupabaseSourceStore } from "@/lib/timeline/TimelineDawRenderSourceStore";
import { TimelineDawRenderSupabaseArtifactStore } from "@/lib/timeline/TimelineDawRenderSupabaseArtifactStore";
import { TimelineDawStemPackageService } from "@/lib/timeline/TimelineDawStemPackageService";
import { TimelineDawStemSupabasePackageStore } from "@/lib/timeline/TimelineDawStemPackageStore";
import { TimelineDawRenderService } from "@/lib/timeline/TimelineDawRenderService";
import { createTimelineDawWorkspaceStore } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { TimelineDawWorkspaceConflictError } from "@/lib/timeline/TimelineDawWorkspaceService";

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
  const status = error instanceof ApiError ? error.status
    : error instanceof TimelineDawWorkspaceConflictError ? 409 : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "DAW render request failed." },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
    if (!sessionId) throw new ApiError("sessionId is required.", 400);
    const service = new TimelineDawRenderService(createTimelineDawWorkspaceStore(user.id, user.token));
    const snapshot = await service.snapshot(user.id, sessionId);
    const jobId = request.nextUrl.searchParams.get("jobId")?.trim();
    if (jobId) {
      const job = snapshot.jobs.find((candidate) => candidate.id === jobId);
      if (!job || job.state !== "completed" || !job.outputUri || !job.checksum) {
        throw new ApiError("Completed DAW render artifact was not found.", 404);
      }
      const deliveryUrl = await new TimelineDawRenderDeliveryService(
        new TimelineDawRenderSupabaseArtifactStore(user.client, user.id),
        new TimelineDawStemSupabasePackageStore(user.client, user.id),
      ).createDeliveryUrl({ ownerId: user.id, sessionId, job });
      return NextResponse.json({ deliveryUrl }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const raw = await request.json();
    if (["execute-wav", "execute-stems"].includes(String((raw as { action?: unknown })?.action))) {
      const command = parseTimelineDawRenderExecutionCommand(raw);
      const workspaceStore = createTimelineDawWorkspaceStore(user.id, user.token);
      const snapshot = await new TimelineDawRenderService(workspaceStore)
        .snapshot(user.id, command.sessionId);
      const job = snapshot.jobs.find((candidate) => candidate.id === command.jobId);
      if (!job) throw new ApiError("DAW render job was not found.", 404);
      const sourceStore = new TimelineDawRenderSupabaseSourceStore(user.client, user.id);
      const receipt = command.action === "execute-stems"
        ? await new TimelineDawStemPackageService(
            workspaceStore,
            sourceStore,
            new TimelineDawStemSupabasePackageStore(user.client, user.id),
          ).execute({
            actorId: user.id,
            sessionId: command.sessionId,
            jobId: command.jobId,
            expectedWorkspaceRevision: command.expectedWorkspaceRevision,
            workerId: "timeline-pcm-stem-worker-v1",
          })
        : await new TimelineDawRenderExecutionService(
            workspaceStore,
            new TimelineDawRenderSupabaseArtifactStore(user.client, user.id),
          ).execute({
            actorId: user.id,
            sessionId: command.sessionId,
            jobId: command.jobId,
            expectedWorkspaceRevision: command.expectedWorkspaceRevision,
            channels: await new TimelineDawRenderSourceMixer(sourceStore).resolve(job, user.id),
            workerId: "timeline-pcm-wav-worker-v1",
          });
      return NextResponse.json({ receipt }, {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const command = parseTimelineDawRenderCommand(raw);
    const service = new TimelineDawRenderService(createTimelineDawWorkspaceStore(user.id, user.token));
    return NextResponse.json(
      { receipt: await service.execute(command, user.id) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) { return failure(error); }
}
