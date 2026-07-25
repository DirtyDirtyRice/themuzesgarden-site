import { NextResponse } from "next/server";

import { buildTimelineEngineHealth } from "@/lib/developer-workspace/timelineEngineHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(buildTimelineEngineHealth(process.cwd()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Engine health analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
