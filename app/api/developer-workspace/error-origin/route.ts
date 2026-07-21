import { NextRequest, NextResponse } from "next/server";

import type { BuildDiagnostic } from "@/lib/developer-workspace/buildDiagnostics";
import { buildRelationshipIndex } from "@/lib/developer-workspace/relationshipIndex";
import { buildSymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import { investigateTemporalErrorOrigin } from "@/lib/developer-workspace/temporalErrorOrigin";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function local(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function diagnostic(value: unknown): BuildDiagnostic {
  if (typeof value !== "object" || value === null) throw new Error("A build diagnostic is required.");
  const item = value as Partial<BuildDiagnostic>;
  if (typeof item.id !== "string" || typeof item.message !== "string") throw new Error("The build diagnostic is incomplete.");
  return {
    id: item.id,
    file: typeof item.file === "string" ? item.file : null,
    line: typeof item.line === "number" ? item.line : null,
    column: typeof item.column === "number" ? item.column : null,
    code: typeof item.code === "string" ? item.code : null,
    severity: item.severity === "warning" ? "warning" : "error",
    message: item.message.slice(0, 4_000),
    primary: item.primary !== false,
    cascadeOf: typeof item.cascadeOf === "string" ? item.cascadeOf : null,
  };
}

export async function POST(request: NextRequest) {
  if (!local(request)) return NextResponse.json({ error: "Temporal error tracing is available only in the local workspace." }, { status: 403 });
  try {
    const payload = await request.json() as { diagnostic?: unknown };
    const selected = diagnostic(payload.diagnostic);
    const workspaceContext = await resolveWorkspaceRequestContext(request);
    const [symbols, relationships] = await Promise.all([
      buildSymbolIndex({ root: workspaceContext.root }),
      buildRelationshipIndex(workspaceContext.root),
    ]);
    const report = await investigateTemporalErrorOrigin(selected, symbols, relationships, workspaceContext.root);
    return NextResponse.json({ project: workspaceContext.project, ...report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Temporal error investigation failed." }, { status: 400 });
  }
}
