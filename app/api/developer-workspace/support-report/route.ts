import { NextRequest, NextResponse } from "next/server";

import { createWorkspaceSupportReport } from "@/lib/developer-workspace/workspaceSupportReport";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const report = await createWorkspaceSupportReport(context.project);
    const date = report.generatedAt.slice(0, 10);
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="developer-workspace-support-${date}.json"` } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Support report failed." }, { status: 400 });
  }
}
