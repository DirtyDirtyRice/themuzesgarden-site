import { NextRequest, NextResponse } from "next/server";
import { buildProjectContext } from "@/lib/developer-workspace/projectContext";
import { buildProjectIndex, type ProjectIndex } from "@/lib/developer-workspace/projectIndex";
import { buildSymbolIndex, type SymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const projectIndexes = new Map<string, Promise<ProjectIndex>>();
const symbolIndexes = new Map<string, Promise<SymbolIndex>>();

function indexes(projectId: string, root: string, refresh: boolean): Promise<[ProjectIndex, SymbolIndex]> {
  if (refresh) {
    projectIndexes.delete(projectId);
    symbolIndexes.delete(projectId);
  }
  let projectIndex = projectIndexes.get(projectId);
  let symbolIndex = symbolIndexes.get(projectId);
  if (!projectIndex) {
    projectIndex = buildProjectIndex({ root }).catch((error) => { projectIndexes.delete(projectId); throw error; });
    projectIndexes.set(projectId, projectIndex);
  }
  if (!symbolIndex) {
    symbolIndex = buildSymbolIndex({ root }).catch((error) => { symbolIndexes.delete(projectId); throw error; });
    symbolIndexes.set(projectId, symbolIndex);
  }
  return Promise.all([projectIndex, symbolIndex]);
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const [projectIndex, symbolIndex] = await indexes(context.projectId, context.root, request.nextUrl.searchParams.get("refresh") === "true");
    return NextResponse.json({ ...await buildProjectContext(request.nextUrl.searchParams.get("query") ?? "", projectIndex, symbolIndex), project: context.project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Project context request failed." }, { status: 400 });
  }
}
