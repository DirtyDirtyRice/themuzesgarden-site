import { NextRequest, NextResponse } from "next/server";

import { applySafePatch, previewSafePatch, type SafePatchProposal } from "@/lib/developer-workspace/safePatchExecutor";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let activePatch = false;

function isLocalDevelopmentRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function readProposal(value: unknown): SafePatchProposal {
  if (typeof value !== "object" || value === null) throw new Error("A safe patch proposal is required.");
  const candidate = value as Partial<SafePatchProposal>;
  if (typeof candidate.file !== "string" || typeof candidate.startLine !== "number" || typeof candidate.endLine !== "number" || !Array.isArray(candidate.expectedLines) || !candidate.expectedLines.every((line) => typeof line === "string") || !Array.isArray(candidate.replacementLines) || !candidate.replacementLines.every((line) => typeof line === "string") || typeof candidate.explanation !== "string") throw new Error("The safe patch proposal is incomplete.");
  return candidate as SafePatchProposal;
}

export async function POST(request: NextRequest) {
  if (!isLocalDevelopmentRequest(request)) return NextResponse.json({ error: "Safe patches are available only from the local development server." }, { status: 403 });
  if (activePatch) return NextResponse.json({ error: "Another safe patch is currently being verified." }, { status: 409 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const payload = await request.json() as { action?: unknown; proposal?: unknown; expectedHash?: unknown; confirmed?: unknown };
    const proposal = readProposal(payload.proposal);
    if (payload.action === "preview") return NextResponse.json({ ...await previewSafePatch(proposal, context.root), project: context.project });
    if (payload.action !== "apply") throw new Error("Safe patch action must be preview or apply.");
    if (payload.confirmed !== true) throw new Error("Explicit patch confirmation is required.");
    if (typeof payload.expectedHash !== "string" || !payload.expectedHash) throw new Error("The preview file hash is required.");
    activePatch = true;
    return NextResponse.json({ ...await applySafePatch(proposal, payload.expectedHash, { projectId: context.projectId, root: context.root }), project: context.project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Safe patch request failed." }, { status: 400 });
  } finally {
    activePatch = false;
  }
}
