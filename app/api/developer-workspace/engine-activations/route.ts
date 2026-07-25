import { NextRequest, NextResponse } from "next/server";

import { buildTimelineActivationAudit } from "@/lib/developer-workspace/timelineActivationAudit";
import { getTimelineEngineActivationService } from "@/lib/timeline/TimelineEngineActivationServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const service = await getTimelineEngineActivationService();
    const snapshot = await service.snapshot();
    const report = buildTimelineActivationAudit(snapshot, {
      workflowId: request.nextUrl.searchParams.get("workflowId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    }, service.storageKind);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Activation audit could not be loaded.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
