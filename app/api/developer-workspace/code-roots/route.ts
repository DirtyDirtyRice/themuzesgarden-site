import { NextRequest, NextResponse } from "next/server";

import { buildCodeRootIndex } from "@/lib/developer-workspace/codeRootIndex";
import { readProjectSourceFile } from "@/lib/developer-workspace/projectFile";
import { recommendCodeRoots } from "@/lib/developer-workspace/codeRootRecommendation";
import { prepareCodeRootSafePatch } from "@/lib/developer-workspace/codeRootSafePatch";
import { buildSymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import {
  readCodeRootEvents,
  readCodeRootRegistry,
  updateCodeRootLedger,
} from "@/lib/developer-workspace/codeRootLedger";
import {
  isLocalDevelopmentWorkspaceRequest,
  resolveWorkspaceRequestContext,
} from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function eventLimit(request: NextRequest): number {
  const value = Number(request.nextUrl.searchParams.get("eventLimit") ?? "100");
  if (!Number.isInteger(value) || value < 1 || value > 2_000) {
    throw new Error("Code root event limit must be an integer between 1 and 2,000.");
  }
  return value;
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Code roots could not be processed." },
    { status: 400 }
  );
}

export async function GET(request: NextRequest) {
  if (!isLocalDevelopmentWorkspaceRequest(request)) {
    return NextResponse.json(
      { error: "Code roots are available only from the local development workspace." },
      { status: 403 }
    );
  }
  try {
    const workspaceContext = await resolveWorkspaceRequestContext(request);
    const [index, registry, events] = await Promise.all([
      buildCodeRootIndex({ root: workspaceContext.root }),
      readCodeRootRegistry(workspaceContext.root),
      readCodeRootEvents(eventLimit(request), workspaceContext.root),
    ]);
    return NextResponse.json(
      {
        project: workspaceContext.project,
        index,
        registry: {
          generatedAt: registry.generatedAt,
          trackedRootCount: Object.keys(registry.records).length,
          records: Object.values(registry.records),
        },
        events,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isLocalDevelopmentWorkspaceRequest(request)) {
    return NextResponse.json(
      { error: "Code root observation is available only from the local development workspace." },
      { status: 403 }
    );
  }
  try {
    const payload: unknown = await request.json();
    if (typeof payload !== "object" || payload === null) throw new Error("Code root request is required.");
    const candidate = payload as { action?: unknown; path?: unknown };
    const workspaceContext = await resolveWorkspaceRequestContext(request);
    if (candidate.action === "recommend") {
      if (typeof candidate.path !== "string" || !candidate.path.trim()) throw new Error("A project-relative source path is required.");
      const [sourceFile, symbols] = await Promise.all([
        readProjectSourceFile(candidate.path.trim(), { root: workspaceContext.root }),
        buildSymbolIndex({ root: workspaceContext.root }),
      ]);
      const result = recommendCodeRoots(sourceFile.source, sourceFile.path, symbols.symbols);
      const patches = result.recommendations.map((recommendation) => {
        const prepared = prepareCodeRootSafePatch(sourceFile.source, recommendation);
        return {
          recommendation,
          validation: prepared.insertion.validation,
          originalTokenHash: prepared.insertion.originalTokenHash,
          candidateTokenHash: prepared.insertion.candidateTokenHash,
          proposal: prepared.proposal,
        };
      });
      return NextResponse.json({
        project: workspaceContext.project,
        source: { path: sourceFile.path, size: sourceFile.size, totalLines: sourceFile.totalLines, modifiedAt: sourceFile.modifiedAt },
        result,
        patches,
      });
    }
    if (candidate.action !== "observe") throw new Error("Code root action must be observe or recommend.");
    const index = await buildCodeRootIndex({ root: workspaceContext.root });
    const update = await updateCodeRootLedger(index, workspaceContext.root);
    return NextResponse.json({ project: workspaceContext.project, index, update });
  } catch (error) {
    return errorResponse(error);
  }
}
