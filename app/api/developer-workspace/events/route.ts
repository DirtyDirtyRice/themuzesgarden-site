import { NextRequest, NextResponse } from "next/server";

import { readRecentCodeEvents, searchCodeEvents, updateCodeEventLedger } from "@/lib/developer-workspace/codeEventLedger";
import { readRecentGitEvents, searchGitEvents } from "@/lib/developer-workspace/gitHistoryImporter";
import { buildSymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import { buildRelationshipIndex } from "@/lib/developer-workspace/relationshipIndex";
import { updateRelationshipEventLedger } from "@/lib/developer-workspace/relationshipEventLedger";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let activeUpdate = false;

function local(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export async function GET(request: NextRequest) {
  if (!local(request)) return NextResponse.json({ error: "Code events are available only in the local workspace." }, { status: 403 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const requested = Number(request.nextUrl.searchParams.get("limit") ?? "200");
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    const [liveEvents, gitEvents] = await Promise.all([query ? searchCodeEvents(query, requested, context.root) : readRecentCodeEvents(requested, context.root), query ? searchGitEvents(query, requested, context.root) : readRecentGitEvents(requested, context.root)]);
    const events = [...liveEvents, ...gitEvents].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()).slice(0, requested);
    return NextResponse.json({ events, count: events.length, liveCount: liveEvents.length, gitCount: gitEvents.length, project: context.project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Code events could not be read." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!local(request) || process.env.NODE_ENV === "production") return NextResponse.json({ error: "Ledger updates are available only from the local development server." }, { status: 403 });
  if (activeUpdate) return NextResponse.json({ error: "The Code Event Ledger is already updating." }, { status: 409 });
  activeUpdate = true;
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const [symbolIndex, relationshipIndex] = await Promise.all([buildSymbolIndex({ root: context.root }), buildRelationshipIndex(context.root)]);
    const symbols = await updateCodeEventLedger(symbolIndex, context.root);
    const relationships = await updateRelationshipEventLedger(relationshipIndex, context.root);
    return NextResponse.json({ ...symbols, relationshipEvents: relationships.events, trackedRelationships: relationships.trackedRelationships, project: context.project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Code Event Ledger update failed." }, { status: 400 });
  } finally {
    activeUpdate = false;
  }
}
