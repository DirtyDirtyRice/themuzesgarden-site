import { NextRequest, NextResponse } from "next/server";

import {
  buildSymbolIndex,
  searchSymbolIndex,
  type ProjectSymbolKind,
  type SymbolIndex,
  type SymbolSearchResult,
} from "@/lib/developer-workspace/symbolIndex";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 250;
const SYMBOL_KINDS = new Set<ProjectSymbolKind>([
  "class",
  "interface",
  "type",
  "enum",
  "function",
  "constant",
  "method",
]);

const cachedIndexes = new Map<string, Promise<SymbolIndex>>();

function getIndex(projectId: string, root: string, refresh: boolean): Promise<SymbolIndex> {
  if (refresh) cachedIndexes.delete(projectId);
  let cached = cachedIndexes.get(projectId);
  if (!cached) {
    cached = buildSymbolIndex({ root }).catch((error) => {
      cachedIndexes.delete(projectId);
      throw error;
    });
    cachedIndexes.set(projectId, cached);
  }
  return cached;
}

function readLimit(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("limit");
  if (!value) return 100;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("limit must be a positive integer.");
  }
  return Math.min(parsed, MAX_RESULTS);
}

function readKind(request: NextRequest): ProjectSymbolKind | undefined {
  const value = request.nextUrl.searchParams.get("kind");
  if (!value) return undefined;
  if (!SYMBOL_KINDS.has(value as ProjectSymbolKind)) {
    throw new Error(`Unsupported symbol kind: ${value}.`);
  }
  return value as ProjectSymbolKind;
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const refresh = request.nextUrl.searchParams.get("refresh") === "1";
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    const projectPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
    const kind = readKind(request);
    const limit = readLimit(request);
    const index = await getIndex(context.projectId, context.root, refresh);

    let results: SymbolSearchResult[];
    if (query) {
      results = searchSymbolIndex(index, query, {
        kind,
        path: projectPath || undefined,
        limit,
      });
    } else if (projectPath) {
      results = index.symbols
        .filter((symbol) => symbol.path === projectPath)
        .filter((symbol) => !kind || symbol.kind === kind)
        .slice(0, limit)
        .map((symbol) => ({ symbol, score: 1_000 }));
    } else {
      results = [];
    }

    return NextResponse.json(
      {
        project: context.project,
        generatedAt: index.generatedAt,
        fileCount: index.fileCount,
        symbolCount: index.symbolCount,
        symbolsByKind: index.symbolsByKind,
        query,
        path: projectPath || null,
        kind: kind ?? null,
        results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Symbol indexing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
