import { NextRequest, NextResponse } from "next/server";

import { startLiveCodeWatcher, stopLiveCodeWatcher, watcherStatus } from "@/lib/developer-workspace/liveCodeWatcher";
import {
  startWorkspaceRuntimeSupervisor,
  stopWorkspaceRuntimeSupervisor,
  workspaceRuntimeSupervisorStatus,
} from "@/lib/developer-workspace/workspaceRuntimeSupervisor";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function local(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function combinedStatus() {
  return { ...watcherStatus(), supervisor: workspaceRuntimeSupervisorStatus() };
}

export async function GET(request: NextRequest) {
  if (!local(request)) return NextResponse.json({ error: "Live watching is available only from the local development server." }, { status: 403 });
  const context = await resolveWorkspaceRequestContext(request);
  startWorkspaceRuntimeSupervisor(context.root);
  return NextResponse.json({ ...combinedStatus(), project: context.project });
}

export async function POST(request: NextRequest) {
  if (!local(request)) return NextResponse.json({ error: "Live watching is available only from the local development server." }, { status: 403 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const payload = await request.json() as { action?: unknown };
    if (payload.action === "start") {
      startWorkspaceRuntimeSupervisor(context.root);
      startLiveCodeWatcher(context.root);
      return NextResponse.json({ ...combinedStatus(), project: context.project });
    }
    if (payload.action === "stop") {
      stopWorkspaceRuntimeSupervisor();
      stopLiveCodeWatcher();
      return NextResponse.json({ ...combinedStatus(), project: context.project });
    }
    throw new Error("Watcher action must be start or stop.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Watcher control failed." }, { status: 400 });
  }
}
