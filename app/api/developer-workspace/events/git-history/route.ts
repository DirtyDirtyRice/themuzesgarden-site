import { NextRequest, NextResponse } from "next/server";

import { gitImportProgress, importGitHistory } from "@/lib/developer-workspace/gitHistoryImporter";
import { isLocalDevelopmentWorkspaceRequest, resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isLocalDevelopmentWorkspaceRequest(request)) return NextResponse.json({ error: "Git history import is available only from the local development server." }, { status: 403 });
  const context = await resolveWorkspaceRequestContext(request);
  return NextResponse.json({ ...gitImportProgress(context.root), project: context.project });
}

export async function POST(request: NextRequest) {
  if (!isLocalDevelopmentWorkspaceRequest(request)) return NextResponse.json({ error: "Git history import is available only from the local development server." }, { status: 403 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const payload = await request.json() as { restart?: unknown };
    return NextResponse.json({ ...await importGitHistory(context.root, payload.restart === true), project: context.project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Git history import failed." }, { status: 400 });
  }
}
