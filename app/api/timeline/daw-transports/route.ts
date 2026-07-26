import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { parseTimelineDawTransportCommand } from "@/lib/timeline/TimelineDawTransportApiPolicy";
import { createTimelineDawWorkspaceStore } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { TimelineDawTransportService } from "@/lib/timeline/TimelineDawTransportService";
import { TimelineDawWorkspaceConflictError } from "@/lib/timeline/TimelineDawWorkspaceService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
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
  return { id: data.user.id, token };
}

function failure(error: unknown) {
  const status = error instanceof ApiError
    ? error.status
    : error instanceof TimelineDawWorkspaceConflictError
      ? 409
      : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "DAW transport request failed." },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
    if (!sessionId) throw new ApiError("sessionId is required.", 400);
    const service = new TimelineDawTransportService(
      createTimelineDawWorkspaceStore(user.id, user.token),
    );
    return NextResponse.json(
      await service.snapshot(user.id, sessionId),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const command = parseTimelineDawTransportCommand(await request.json());
    const service = new TimelineDawTransportService(
      createTimelineDawWorkspaceStore(user.id, user.token),
    );
    return NextResponse.json(
      { receipt: await service.execute(command, user.id) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
