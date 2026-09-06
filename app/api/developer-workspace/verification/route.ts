import { NextRequest, NextResponse } from "next/server";

import { verificationCoordinatorStatus } from "@/lib/developer-workspace/verificationCoordinator";
import { isLocalDevelopmentWorkspaceRequest, resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isLocalDevelopmentWorkspaceRequest(request)) return NextResponse.json({ error: "Verification status is available only from the local development server." }, { status: 403 });
  const context = await resolveWorkspaceRequestContext(request);
  return NextResponse.json({ ...await verificationCoordinatorStatus({ projectId: context.projectId, root: context.root }), project: context.project });
}
