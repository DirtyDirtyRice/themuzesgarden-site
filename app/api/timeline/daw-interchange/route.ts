import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { TimelineDawInterchangeSupabasePackageStore } from "@/lib/timeline/TimelineDawInterchangePackageStore";
import { TimelineDawInterchangePackageService } from "@/lib/timeline/TimelineDawInterchangePackageService";
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
    { error: error instanceof Error ? error.message : "DAW interchange request failed." },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(`${label} is required.`, 400);
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = required(request.nextUrl.searchParams.get("sessionId"), "sessionId");
    const store = new TimelineDawInterchangeSupabasePackageStore(user.client, user.id);
    const service = new TimelineDawInterchangePackageService(
      createTimelineDawWorkspaceStore(user.id, user.token),
      store,
    );
    const packageId = request.nextUrl.searchParams.get("packageId")?.trim();
    if (packageId) {
      return NextResponse.json({
        deliveryUrl: await service.createDeliveryUrl({
          actorId: user.id, sessionId, packageId,
        }),
      }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      await service.snapshot(user.id, sessionId),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const raw = await request.json() as Record<string, unknown>;
    const allowed = new Set([
      "action", "sessionId", "jobIds", "name", "destination",
      "expectedWorkspaceRevision",
    ]);
    const extra = Object.keys(raw).find((key) => !allowed.has(key));
    if (extra) throw new ApiError(`DAW interchange request contains unsupported field: ${extra}.`, 400);
    if (raw.action !== "create") throw new ApiError("DAW interchange action is invalid.", 400);
    if (!Array.isArray(raw.jobIds) || raw.jobIds.some((id) => typeof id !== "string")) {
      throw new ApiError("jobIds must be an array of render IDs.", 400);
    }
    if (
      !Number.isSafeInteger(raw.expectedWorkspaceRevision)
      || Number(raw.expectedWorkspaceRevision) < 0
    ) {
      throw new ApiError("expectedWorkspaceRevision must be a non-negative safe integer.", 400);
    }
    const service = new TimelineDawInterchangePackageService(
      createTimelineDawWorkspaceStore(user.id, user.token),
      new TimelineDawInterchangeSupabasePackageStore(user.client, user.id),
    );
    const receipt = await service.execute({
      actorId: user.id,
      sessionId: required(raw.sessionId, "sessionId"),
      jobIds: raw.jobIds as string[],
      name: required(raw.name, "name"),
      destination: required(raw.destination, "destination"),
      expectedWorkspaceRevision: raw.expectedWorkspaceRevision as number,
      workerId: "timeline-interchange-worker-v1",
    });
    return NextResponse.json({ receipt }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return failure(error); }
}
