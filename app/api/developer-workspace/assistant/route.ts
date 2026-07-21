import { NextRequest, NextResponse } from "next/server";

import { aiAssistantConfiguration, answerProjectQuestion } from "@/lib/developer-workspace/aiAssistant";
import { buildProjectContext } from "@/lib/developer-workspace/projectContext";
import { buildProjectIndex, type ProjectIndex } from "@/lib/developer-workspace/projectIndex";
import { buildSymbolIndex, type SymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectIndexes = new Map<string, Promise<ProjectIndex>>();
const symbolIndexes = new Map<string, Promise<SymbolIndex>>();

function isLocalRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function indexes(projectId: string, root: string): Promise<[ProjectIndex, SymbolIndex]> {
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
  if (!isLocalRequest(request)) return NextResponse.json({ error: "The coding assistant is available only from the local workspace." }, { status: 403 });
  return NextResponse.json(aiAssistantConfiguration());
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "The coding assistant is available only from the local workspace." }, { status: 403 });
  try {
    const requestContext = await resolveWorkspaceRequestContext(request);
    const payload = await request.json() as { question?: unknown };
    if (typeof payload.question !== "string" || !payload.question.trim()) throw new Error("A developer question is required.");
    if (payload.question.length > 2_000) throw new Error("Developer questions are limited to 2,000 characters.");
    const [projectIndex, symbolIndex] = await indexes(requestContext.projectId, requestContext.root);
    const context = await buildProjectContext(payload.question, projectIndex, symbolIndex);
    const result = await answerProjectQuestion(payload.question.trim(), context);
    return NextResponse.json({ ...result, project: requestContext.project, context: { symbols: context.symbols.length, files: context.files.length, excerpts: context.excerpts.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI assistant request failed.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
