import { NextRequest, NextResponse } from "next/server";
import { authorizeTimelineDawSessionAccess } from "@/lib/timeline/TimelineDawSessionAccessServer";
import { evaluateTimelineDawMusicianTrialReadiness } from "@/lib/timeline/TimelineDawMusicianTrialReadinessPolicy";

export const runtime = "nodejs", dynamic = "force-dynamic";
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : "DAW access request failed." }, { status: 403 });

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    const access = await authorizeTimelineDawSessionAccess(request, sessionId, "session:read", "open-beta-session");
    const { data, error } = await access.client.from("timeline_daw_session_access_receipts")
      .select("id,role,capability,action,allowed,reason,receipt_checksum,observed_at")
      .eq("actor_id", access.actorId).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    const capabilities = access.decision.role === "owner"
      ? ["session:read", "workflow:read", "feedback:create", "feedback:respond", "transport:read"]
      : ["session:read", "workflow:read", "feedback:create", "feedback:respond", "transport:read"];
    return NextResponse.json({ access: access.decision, capabilities, trialReadiness: evaluateTimelineDawMusicianTrialReadiness(capabilities), receipts: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
