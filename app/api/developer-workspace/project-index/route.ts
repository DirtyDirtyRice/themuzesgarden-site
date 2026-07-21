import { NextRequest, NextResponse } from "next/server";

import {
  buildProjectIndex,
  searchProjectIndex,
} from "@/lib/developer-workspace/projectIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SEARCH_RESULTS = 250;

function readLimit(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("limit");
  if (!value) return 100;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Search limit must be a positive integer.");
  }

  return Math.min(parsed, MAX_SEARCH_RESULTS);
}

export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const local = process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
  if (!local) {
    return NextResponse.json(
      { error: "Project indexing is available only from the local development server." },
      { status: 403 }
    );
  }
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const index = await buildProjectIndex({ root: context.root });
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

    const response = query
      ? {
          generatedAt: index.generatedAt,
          root: index.root,
          stats: index.stats,
          truncated: index.truncated,
          query,
          results: searchProjectIndex(index, query, readLimit(request)),
        }
      : index;

    return NextResponse.json({ ...response, project: context.project }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project indexing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
