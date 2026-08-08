import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { parseTimelineDawTakeCompRecipe } from "@/lib/timeline/TimelineDawTakeCompPolicy";

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
        updated_at: now,
      }, { onConflict: "id" }).select("*").single();
      if (error || !data) throw new ApiError(`Take comp could not be saved: ${error?.message ?? "missing row"}`, 500);
      return NextResponse.json({ comp: comp(data) }, { status: body.compId ? 200 : 201, headers: { "Cache-Control": "no-store" } });
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
