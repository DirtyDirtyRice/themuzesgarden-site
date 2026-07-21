import { NextRequest, NextResponse } from "next/server";

import { analyzeDependencyImpact } from "@/lib/developer-workspace/impactAnalysis";
import {
  buildRelationshipIndex,
  type RelationshipIndex,
} from "@/lib/developer-workspace/relationshipIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cachedIndexes = new Map<string, Promise<RelationshipIndex>>();

function relationshipIndex(projectId: string, root: string, refresh: boolean): Promise<RelationshipIndex> {
  if (refresh) cachedIndexes.delete(projectId);
  let cached = cachedIndexes.get(projectId);
  if (!cached) {
    cached = buildRelationshipIndex(root).catch((error) => {
      cachedIndexes.delete(projectId);
      throw error;
    });
    cachedIndexes.set(projectId, cached);
  }
  return cached;
}

function positiveInteger(request: NextRequest, name: string, fallback: number): number {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const projectPath = request.nextUrl.searchParams.get("path")?.trim();
    const symbolName = request.nextUrl.searchParams.get("name")?.trim();
    if (!projectPath || !symbolName) {
      return NextResponse.json({ error: "Both path and name are required." }, { status: 400 });
    }

    const index = await relationshipIndex(context.projectId, context.root, request.nextUrl.searchParams.get("refresh") === "1");
    const report = analyzeDependencyImpact(index, {
      path: projectPath,
      symbolName,
      line: positiveInteger(request, "line", 1),
      maxDepth: positiveInteger(request, "depth", 6),
      maxResults: positiveInteger(request, "limit", 500),
    });

    return NextResponse.json({ ...report, project: context.project }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dependency impact analysis failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
