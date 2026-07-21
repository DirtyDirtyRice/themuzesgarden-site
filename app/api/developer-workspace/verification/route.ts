import { NextRequest, NextResponse } from "next/server";

import { verificationCoordinatorStatus } from "@/lib/developer-workspace/verificationCoordinator";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const local = process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
  if (!local) return NextResponse.json({ error: "Verification status is available only from the local development server." }, { status: 403 });
  const context = await resolveWorkspaceRequestContext(request);
  return NextResponse.json({ ...await verificationCoordinatorStatus({ projectId: context.projectId, root: context.root }), project: context.project });
}
