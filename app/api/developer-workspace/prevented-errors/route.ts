import { NextRequest, NextResponse } from "next/server";

import {
  readPreventedErrorEvents,
  summarizePreventedErrors,
  type PreventedErrorEvent,
} from "@/lib/developer-workspace/preventedErrorLedger";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";
import { readAiDriftReport } from "@/lib/developer-workspace/aiDriftReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function localDevelopment(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function requestedLimit(request: NextRequest): number {
  const value = Number(request.nextUrl.searchParams.get("limit") ?? "200");
  if (!Number.isInteger(value) || value < 1 || value > 2_000) {
    throw new Error("Prevented-error limit must be an integer between 1 and 2,000.");
  }
  return value;
}

function searchable(event: PreventedErrorEvent): string {
  return [
    event.attemptId,
    event.capsuleId ?? "",
    event.file,
    event.outcome,
    event.note,
    ...event.impactedFiles,
    ...event.impactedSymbols,
    ...event.evidence.flatMap((item) => [item.classification, item.code, item.message, item.file]),
  ].join("\n").toLowerCase();
}

export async function GET(request: NextRequest) {
  if (!localDevelopment(request)) {
    return NextResponse.json(
      { error: "Prevented-error evidence is available only from the local development server." },
      { status: 403 }
    );
  }

  try {
    const workspaceContext = await resolveWorkspaceRequestContext(request);
    const limit = requestedLimit(request);
    const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const attemptId = request.nextUrl.searchParams.get("attemptId")?.trim() ?? "";
    const stored = await readPreventedErrorEvents(
      Math.min(2_000, Math.max(limit, query || attemptId ? 2_000 : limit)),
      workspaceContext.root
    );
    const driftReport = await readAiDriftReport(workspaceContext.root);
    const selected = stored
      .filter((event) => !attemptId || event.attemptId === attemptId)
      .filter((event) => !query || searchable(event).includes(query))
      .slice(0, limit);
    const events = selected.map((event) => ({
      ...event,
      candidateSnapshot: null,
    }));
    return NextResponse.json(
      {
        project: workspaceContext.project,
        events,
        count: events.length,
        summary: summarizePreventedErrors(stored),
        driftReport,
        snapshotsIncluded: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prevented-error evidence could not be read." },
      { status: 400 }
    );
  }
}
