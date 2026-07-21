import "server-only";

import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

export type ProjectSourceLine = {
  number: number;
  text: string;
};

export type ProjectFileView = {
  path: string;
  name: string;
  extension: string | null;
  language: string;
  size: number;
  modifiedAt: string;
  totalLines: number;
  startLine: number;
  endLine: number;
  lines: ProjectSourceLine[];
};

export type ProjectFileReadOptions = {
  root?: string;
  startLine?: number;
  lineCount?: number;
  maxBytes?: number;
};

export type ProjectSourceFile = {
  path: string;
  name: string;
  extension: string | null;
  language: string;
  size: number;
  modifiedAt: string;
  totalLines: number;
  source: string;
};

const DEFAULT_LINE_COUNT = 300;
const MAX_LINE_COUNT = 1_000;
const DEFAULT_MAX_BYTES = 2 * 1_024 * 1_024;

const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "code-map-reports",
  "codex-session-notes",
  "duplicate-reports",
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".css": "css",
  ".html": "html",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".json": "json",
  ".md": "markdown",
  ".mjs": "javascript",
  ".mts": "typescript",
  ".scss": "scss",
  ".sql": "sql",
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".txt": "plaintext",
  ".yaml": "yaml",
  ".yml": "yaml",
};

function normalizeRelativePath(value: string): string {
  return value.split(path.sep).join("/");
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer; received ${value}.`);
  }
}

function assertAllowedRelativePath(relativePath: string): void {
  if (!relativePath.trim()) {
    throw new Error("A project-relative file path is required.");
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error("Absolute file paths are not accepted.");
  }

  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.includes("..")) {
    throw new Error("Parent-directory traversal is not accepted.");
  }

  const blockedSegment = segments.find((segment) => BLOCKED_PATH_SEGMENTS.has(segment));
  if (blockedSegment) {
    throw new Error(`The ${blockedSegment} directory is excluded from the Developer Workspace.`);
  }
}

function assertInsideRoot(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("The requested file must resolve inside the project root.");
  }
}

function isBinary(buffer: Buffer): boolean {
  const sampleLength = Math.min(buffer.length, 8_192);
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) return true;
  }
  return false;
}

function languageForExtension(extension: string | null): string {
  return extension ? (LANGUAGE_BY_EXTENSION[extension] ?? "plaintext") : "plaintext";
}

export async function readProjectFile(
  relativePath: string,
  options: ProjectFileReadOptions = {}
): Promise<ProjectFileView> {
  assertAllowedRelativePath(relativePath);

  const startLine = options.startLine ?? 1;
  const requestedLineCount = options.lineCount ?? DEFAULT_LINE_COUNT;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  assertPositiveInteger(startLine, "startLine");
  assertPositiveInteger(requestedLineCount, "lineCount");
  assertPositiveInteger(maxBytes, "maxBytes");

  const lineCount = Math.min(requestedLineCount, MAX_LINE_COUNT);
  const root = await realpath(path.resolve(options.root ?? process.cwd()));
  const requestedFile = path.resolve(root, relativePath);
  assertInsideRoot(root, requestedFile);

  const resolvedFile = await realpath(requestedFile);
  assertInsideRoot(root, resolvedFile);

  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile()) {
    throw new Error("The requested project entry is not a file.");
  }
  if (fileStats.size > maxBytes) {
    throw new Error(
      `The requested file is ${fileStats.size.toLocaleString()} bytes; the viewer limit is ${maxBytes.toLocaleString()} bytes.`
    );
  }

  const buffer = await readFile(resolvedFile);
  if (isBinary(buffer)) {
    throw new Error("Binary files cannot be opened in the source viewer.");
  }

  const text = buffer.toString("utf8");
  const allLines = text.split(/\r?\n/);
  const totalLines = allLines.length;
  const boundedStartLine = Math.min(startLine, Math.max(totalLines, 1));
  const endLine = Math.min(totalLines, boundedStartLine + lineCount - 1);
  const lines = allLines
    .slice(boundedStartLine - 1, endLine)
    .map((line, index) => ({
      number: boundedStartLine + index,
      text: line,
    }));
  const extension = path.extname(resolvedFile).toLowerCase() || null;

  return {
    path: normalizeRelativePath(path.relative(root, resolvedFile)),
    name: path.basename(resolvedFile),
    extension,
    language: languageForExtension(extension),
    size: fileStats.size,
    modifiedAt: fileStats.mtime.toISOString(),
    totalLines,
    startLine: boundedStartLine,
    endLine,
    lines,
  };
}
export async function readProjectSourceFile(
  relativePath: string,
  options: Pick<ProjectFileReadOptions, "root" | "maxBytes"> = {}
): Promise<ProjectSourceFile> {
  assertAllowedRelativePath(relativePath);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  assertPositiveInteger(maxBytes, "maxBytes");
  const root = await realpath(path.resolve(options.root ?? process.cwd()));
  const requestedFile = path.resolve(root, relativePath);
  assertInsideRoot(root, requestedFile);
  const resolvedFile = await realpath(requestedFile);
  assertInsideRoot(root, resolvedFile);
  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile()) throw new Error("The requested project entry is not a file.");
  if (fileStats.size > maxBytes) {
    throw new Error(`The requested file is ${fileStats.size.toLocaleString()} bytes; the source-analysis limit is ${maxBytes.toLocaleString()} bytes.`);
  }
  const buffer = await readFile(resolvedFile);
  if (isBinary(buffer)) throw new Error("Binary files cannot be analyzed as source.");
  const source = buffer.toString("utf8");
  const extension = path.extname(resolvedFile).toLowerCase() || null;
  return {
    path: normalizeRelativePath(path.relative(root, resolvedFile)),
    name: path.basename(resolvedFile),
    extension,
    language: languageForExtension(extension),
    size: fileStats.size,
    modifiedAt: fileStats.mtime.toISOString(),
    totalLines: source.split(/\r?\n/).length,
    source,
  };
}