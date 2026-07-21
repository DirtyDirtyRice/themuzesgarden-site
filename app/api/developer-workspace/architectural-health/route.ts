import { NextRequest, NextResponse } from "next/server";

import { analyzeArchitecturalHealth } from "@/lib/developer-workspace/architecturalHealth";
import {
  compareArchitecturalHealth,
  readArchitecturalHealthHistory,
  recordArchitecturalHealth,
} from "@/lib/developer-workspace/architecturalHealthHistory";
import { readRecentCodeEvents } from "@/lib/developer-workspace/codeEventLedger";
import {
  buildProjectIndex,
  type ProjectIndex,
} from "@/lib/developer-workspace/projectIndex";
import {
  buildRelationshipIndex,
  type RelationshipIndex,
} from "@/lib/developer-workspace/relationshipIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectIndexes = new Map<string, Promise<ProjectIndex>>();
const relationshipIndexes = new Map<string, Promise<RelationshipIndex>>();

function boundedInteger(
  request: NextRequest,
  name: string,
  fallback: number,
  maximum: number,
): number {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return value;
}

function indexes(
  projectId: string,
  root: string,
  refresh: boolean,
): Promise<[ProjectIndex, RelationshipIndex]> {
  if (refresh) {
    projectIndexes.delete(projectId);
    relationshipIndexes.delete(projectId);
  }

  let projectIndex = projectIndexes.get(projectId);
  if (!projectIndex) {
    projectIndex = buildProjectIndex({ root }).catch((error) => {
      projectIndexes.delete(projectId);
      throw error;
    });
    projectIndexes.set(projectId, projectIndex);
  }

  let relationshipIndex = relationshipIndexes.get(projectId);
  if (!relationshipIndex) {
    relationshipIndex = buildRelationshipIndex(root).catch((error) => {
      relationshipIndexes.delete(projectId);
      throw error;
    });
    relationshipIndexes.set(projectId, relationshipIndex);
  }

  return Promise.all([projectIndex, relationshipIndex]);
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const refresh = request.nextUrl.searchParams.get("refresh") === "1";
    const eventLimit = boundedInteger(request, "eventLimit", 1_000, 2_000);
    const [indexed, events] = await Promise.all([
      indexes(context.projectId, context.root, refresh),
      readRecentCodeEvents(eventLimit, context.root),
    ]);
    const [projectIndex, relationshipIndex] = indexed;

    const report = analyzeArchitecturalHealth(
      projectIndex,
      relationshipIndex,
      events,
    );
    const recorded = refresh
      ? await recordArchitecturalHealth(report, context.root)
      : null;
    const history = recorded?.history ?? await readArchitecturalHealthHistory(context.root, 30);
    const comparison = recorded?.comparison ?? (
      history[0]
        ? compareArchitecturalHealth(history[0], history[1] ?? null)
        : null
    );

    return NextResponse.json(
      {
        ...report,
        project: context.project,
        healthHistory: history,
        healthComparison: comparison,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Architectural health analysis failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
