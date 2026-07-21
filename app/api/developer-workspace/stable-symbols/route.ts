import { NextRequest, NextResponse } from "next/server";

import { readStableSymbolRegistry } from "@/lib/developer-workspace/stableSymbolIdentityStore";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function local(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function limitFrom(request: NextRequest): number {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("limit must be between 1 and 500.");
  }
  return limit;
}

export async function GET(request: NextRequest) {
  if (!local(request)) {
    return NextResponse.json(
      { error: "Stable symbol identities are available only in the local workspace." },
      { status: 403 }
    );
  }

  try {
    const context = await resolveWorkspaceRequestContext(request);
    const registry = await readStableSymbolRegistry(context.root);
    const stableId = request.nextUrl.searchParams.get("id")?.trim();
    const projectPath = request.nextUrl.searchParams.get("path")?.trim().toLowerCase();
    const name = request.nextUrl.searchParams.get("name")?.trim().toLowerCase();
    const kind = request.nextUrl.searchParams.get("kind")?.trim().toLowerCase();
    const allRecords = Object.values(registry.records);
    const results = allRecords
      .filter((record) => !stableId || record.stableId === stableId)
      .filter((record) => !projectPath || record.path.toLowerCase() === projectPath)
      .filter((record) => !name || record.name.toLowerCase() === name)
      .filter((record) => !kind || record.kind === kind)
      .sort(
        (left, right) =>
          Number(right.present) - Number(left.present) ||
          new Date(right.lastObservedAt).getTime() - new Date(left.lastObservedAt).getTime() ||
          left.stableId.localeCompare(right.stableId)
      )
      .slice(0, limitFrom(request));

    return NextResponse.json(
      {
        project: context.project,
        generatedAt: registry.generatedAt,
        total: allRecords.length,
        present: allRecords.filter((record) => record.present).length,
        removed: allRecords.filter((record) => !record.present).length,
        results,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stable symbol identities could not be read.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
