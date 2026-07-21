import { NextRequest, NextResponse } from "next/server";

import { readProjectFile } from "@/lib/developer-workspace/projectFile";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readPositiveInteger(
  request: NextRequest,
  name: string,
  fallback: number
): number {
  const value = request.nextUrl.searchParams.get(name);
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const projectPath = request.nextUrl.searchParams.get("path")?.trim();
    if (!projectPath) {
      return NextResponse.json(
        { error: "A project-relative path is required." },
        { status: 400 }
      );
    }

    const context = await resolveWorkspaceRequestContext(request);
    const file = await readProjectFile(projectPath, {
      root: context.root,
      startLine: readPositiveInteger(request, "line", 1),
      lineCount: readPositiveInteger(request, "count", 300),
    });

    return NextResponse.json(file, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project file request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
