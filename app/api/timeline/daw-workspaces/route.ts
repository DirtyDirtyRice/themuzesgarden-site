import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { parseTimelineDawWorkspaceCommand } from "@/lib/timeline/TimelineDawWorkspaceApiPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";
import { TimelineDawWorkspaceConflictError } from "@/lib/timeline/TimelineDawWorkspaceService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new ApiError("Supabase session is invalid or expired.", 401);
  return { id: data.user.id, token, client };
}
async function requireProjectOwner(user: Awaited<ReturnType<typeof authorize>>, projectId: string) {
  const { data, error } = await user.client.from("projects").select("id, owner_id").eq("id", projectId).maybeSingle();
  if (error || !data || String(data.owner_id) !== user.id) throw new ApiError("Only the verified project owner can open this DAW workspace.", 403);
}
function failure(error: unknown) {
  const status = error instanceof ApiError ? error.status : error instanceof TimelineDawWorkspaceConflictError ? 409 : 400;
  return NextResponse.json({ error: error instanceof Error ? error.message : "DAW workspace request failed." }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}
export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request);
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim() || undefined;
    const sessions = await createTimelineDawWorkspaceServer(user.id, user.token).list(user.id, projectId);
    return NextResponse.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request);
    const command = parseTimelineDawWorkspaceCommand(await request.json());
    if (command.action === "open") await requireProjectOwner(user, command.projectId);
    const receipt = await createTimelineDawWorkspaceServer(user.id, user.token).execute(command, user.id);
    return NextResponse.json({ receipt }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
