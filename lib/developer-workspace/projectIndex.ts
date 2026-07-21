import "server-only";

import { realpath, readdir, stat } from "node:fs/promises";
import path from "node:path";

export type ProjectEntryKind = "directory" | "file";

export type ProjectEntry = {
  kind: ProjectEntryKind;
  name: string;
  path: string;
  extension: string | null;
  size: number;
  modifiedAt: string;
  children?: ProjectEntry[];
};

export type ProjectIndexStats = {
  directoryCount: number;
  fileCount: number;
  totalBytes: number;
  extensions: Record<string, number>;
};

export type ProjectIndex = {
  root: string;
  generatedAt: string;
  entries: ProjectEntry[];
  stats: ProjectIndexStats;
  truncated: boolean;
};

export type ProjectIndexOptions = {
  root?: string;
  excludeNames?: Iterable<string>;
  maxFiles?: number;
};

export type ProjectSearchResult = {
  entry: ProjectEntry;
  score: number;
};

const DEFAULT_EXCLUDED_NAMES = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "code-map-reports",
  "codex-session-notes",
  "duplicate-reports",
]);

const DEFAULT_MAX_FILES = 50_000;

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}

function compareEntries(left: ProjectEntry, right: ProjectEntry): number {
  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }

  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function createStats(): ProjectIndexStats {
  return {
    directoryCount: 0,
    fileCount: 0,
    totalBytes: 0,
    extensions: {},
  };
}

function recordFile(stats: ProjectIndexStats, extension: string | null, size: number): void {
  stats.fileCount += 1;
  stats.totalBytes += size;

  const key = extension ?? "[no extension]";
  stats.extensions[key] = (stats.extensions[key] ?? 0) + 1;
}

function assertValidLimit(maxFiles: number): void {
  if (!Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new Error(`Project index maxFiles must be a positive integer; received ${maxFiles}.`);
  }
}

function assertInsideRoot(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Project entry resolved outside the project root: ${candidate}`);
  }
}

export async function buildProjectIndex(
  options: ProjectIndexOptions = {}
): Promise<ProjectIndex> {
  const requestedRoot = path.resolve(options.root ?? process.cwd());
  const root = await realpath(requestedRoot);
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const excludedNames = new Set([
    ...DEFAULT_EXCLUDED_NAMES,
    ...(options.excludeNames ?? []),
  ]);

  assertValidLimit(maxFiles);

  const stats = createStats();
  let truncated = false;

  async function scanDirectory(absoluteDirectory: string): Promise<ProjectEntry[]> {
    if (stats.fileCount >= maxFiles) {
      truncated = true;
      return [];
    }

    const directoryEntries = await readdir(absoluteDirectory, { withFileTypes: true });
    const entries: ProjectEntry[] = [];

    for (const directoryEntry of directoryEntries) {
      if (excludedNames.has(directoryEntry.name)) {
        continue;
      }

      if (stats.fileCount >= maxFiles) {
        truncated = true;
        break;
      }

      const absoluteEntry = path.join(absoluteDirectory, directoryEntry.name);
      assertInsideRoot(root, absoluteEntry);

      if (directoryEntry.isSymbolicLink()) {
        continue;
      }

      const entryStats = await stat(absoluteEntry);
      const relativePath = normalizePath(path.relative(root, absoluteEntry));

      if (directoryEntry.isDirectory()) {
        stats.directoryCount += 1;
        entries.push({
          kind: "directory",
          name: directoryEntry.name,
          path: relativePath,
          extension: null,
          size: 0,
          modifiedAt: entryStats.mtime.toISOString(),
          children: await scanDirectory(absoluteEntry),
        });
        continue;
      }

      if (!directoryEntry.isFile()) {
        continue;
      }

      const extension = path.extname(directoryEntry.name).toLowerCase() || null;
      recordFile(stats, extension, entryStats.size);
      entries.push({
        kind: "file",
        name: directoryEntry.name,
        path: relativePath,
        extension,
        size: entryStats.size,
        modifiedAt: entryStats.mtime.toISOString(),
      });
    }

    return entries.sort(compareEntries);
  }

  return {
    root,
    generatedAt: new Date().toISOString(),
    entries: await scanDirectory(root),
    stats,
    truncated,
  };
}

function collectEntries(entries: ProjectEntry[], output: ProjectEntry[]): void {
  for (const entry of entries) {
    output.push(entry);
    if (entry.children) {
      collectEntries(entry.children, output);
    }
  }
}

function scoreEntry(entry: ProjectEntry, query: string): number {
  const name = entry.name.toLowerCase();
  const entryPath = entry.path.toLowerCase();

  if (name === query) return 1_000;
  if (name.startsWith(query)) return 750;
  if (name.includes(query)) return 500;
  if (entryPath.endsWith(`/${query}`)) return 400;
  if (entryPath.includes(query)) return 250;
  return 0;
}

export function searchProjectIndex(
  index: ProjectIndex,
  query: string,
  limit = 100
): ProjectSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Project search limit must be a positive integer; received ${limit}.`);
  }

  const entries: ProjectEntry[] = [];
  collectEntries(index.entries, entries);

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entry.path.localeCompare(right.entry.path, undefined, {
          numeric: true,
          sensitivity: "base",
        })
    )
    .slice(0, limit);
}
