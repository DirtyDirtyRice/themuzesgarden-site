import { NextRequest, NextResponse } from "next/server";

import {
  buildCrossReferenceWorkspace,
  type CrossReferenceWorkspace,
} from "@/lib/developer-workspace/crossReferences";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cachedWorkspaces = new Map<string, Promise<CrossReferenceWorkspace>>();

function getWorkspace(projectId: string, root: string, refresh: boolean): Promise<CrossReferenceWorkspace> {
  if (refresh) cachedWorkspaces.delete(projectId);
  let cached = cachedWorkspaces.get(projectId);
  if (!cached) {
    cached = buildCrossReferenceWorkspace(root).catch((error) => {
      cachedWorkspaces.delete(projectId);
      throw error;
    });
    cachedWorkspaces.set(projectId, cached);
  }
  return cached;
}

function readLine(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("line");
  const line = Number(value);
  if (!Number.isInteger(line) || line < 1) {
    throw new Error("line must be a positive integer.");
  }
  return line;
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const projectPath = request.nextUrl.searchParams.get("path")?.trim();
    const name = request.nextUrl.searchParams.get("name")?.trim();
    if (!projectPath || !name) {
      return NextResponse.json(
        { error: "Both path and name are required." },
        { status: 400 }
      );
    }

    const workspace = await getWorkspace(
      context.projectId,
      context.root,
      request.nextUrl.searchParams.get("refresh") === "1"
    );
    const report = workspace.inspect({
      path: projectPath,
      name,
      line: readLine(request),
    });

    return NextResponse.json(
      {
        project: context.project,
        indexedFiles: workspace.fileCount,
        ...report,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cross-reference lookup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
