import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { TimelineDawRecoverySupabaseCheckpointStore } from "@/lib/timeline/TimelineDawRecoveryCheckpointStore";
import { TimelineDawRecoveryCheckpointService } from "@/lib/timeline/TimelineDawRecoveryCheckpointService";
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

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(`${label} is required.`, 400);
  return value.trim();
}

function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new ApiError("expectedWorkspaceRevision must be a non-negative safe integer.", 400);
  }
  return value as number;
}

function failure(error: unknown) {
  const status = error instanceof ApiError ? error.status
    : error instanceof TimelineDawWorkspaceConflictError ? 409 : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "DAW recovery request failed." },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function service(user: Awaited<ReturnType<typeof authorize>>) {
  return new TimelineDawRecoveryCheckpointService(
    createTimelineDawWorkspaceStore(user.id, user.token),
    new TimelineDawRecoverySupabaseCheckpointStore(user.client, user.id),
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = required(request.nextUrl.searchParams.get("sessionId"), "sessionId");
    return NextResponse.json(
      await service(user).snapshot(user.id, sessionId),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const raw = await request.json() as Record<string, unknown>;
    const action = raw.action;
    const common = {
      actorId: user.id,
      sessionId: required(raw.sessionId, "sessionId"),
      expectedWorkspaceRevision: revision(raw.expectedWorkspaceRevision),
    };
    if (action === "capture") {
      const allowed = new Set(["action", "sessionId", "label", "expectedWorkspaceRevision"]);
      const extra = Object.keys(raw).find((key) => !allowed.has(key));
      if (extra) throw new ApiError(`Recovery capture contains unsupported field: ${extra}.`, 400);
      return NextResponse.json({
        receipt: await service(user).capture({
          ...common,
          label: required(raw.label, "label"),
        }),
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    if (action === "restore") {
      const allowed = new Set(["action", "sessionId", "checkpointId", "expectedWorkspaceRevision"]);
      const extra = Object.keys(raw).find((key) => !allowed.has(key));
      if (extra) throw new ApiError(`Recovery restore contains unsupported field: ${extra}.`, 400);
      return NextResponse.json({
        receipt: await service(user).restore({
          ...common,
          checkpointId: required(raw.checkpointId, "checkpointId"),
        }),
      }, { headers: { "Cache-Control": "no-store" } });
    }
    throw new ApiError("DAW recovery action is invalid.", 400);
  } catch (error) { return failure(error); }
}
