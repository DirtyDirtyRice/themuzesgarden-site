import { createHash } from "node:crypto";

// @code-root developer.roots.contracts | Code Root Signature Contracts
export const CODE_ROOT_MARKER = "@code-root";
export const CODE_ROOT_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

export type CodeRootIssueSeverity = "error" | "warning";
export type CodeRootIssueCode =
  | "invalid-marker"
  | "invalid-id"
  | "missing-title"
  | "duplicate-id"
  | "empty-section";

export type CodeRootIssue = {
  code: CodeRootIssueCode;
  severity: CodeRootIssueSeverity;
  path: string;
  line: number;
  rootId: string | null;
  message: string;
};

export type ParsedCodeRoot = {
  id: string;
  title: string;
  path: string;
  markerLine: number;
  startLine: number;
  endLine: number;
  lineCount: number;
  contentHash: string;
  marker: string;
};

export type CodeRootParseResult = {
  path: string;
  lineCount: number;
  roots: ParsedCodeRoot[];
  issues: CodeRootIssue[];
};

type MarkerCandidate = {
  line: number;
  raw: string;
  id: string | null;
  title: string | null;
};

// @code-root developer.roots.parsing | Marker Parsing and Fingerprints
function normalizedPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizedContent(lines: string[]): string {
  return lines
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function contentHash(lines: string[]): string {
  return createHash("sha256").update(normalizedContent(lines)).digest("hex");
}

function markerCandidate(raw: string, line: number): MarkerCandidate | null {
  if (!/^\s*\/\/\s*@code-root\b/.test(raw)) return null;
  const match = raw.match(/^\s*\/\/\s*@code-root(?:\s+([^|\s]+))?(?:\s*\|\s*(.*?))?\s*$/);
  if (!match) return { line, raw, id: null, title: null };
  return {
    line,
    raw,
    id: match[1]?.trim() || null,
    title: match[2]?.trim() || null,
  };
}

function issue(
  path: string,
  line: number,
  code: CodeRootIssueCode,
  message: string,
  rootId: string | null = null,
  severity: CodeRootIssueSeverity = "error"
): CodeRootIssue {
  return { code, severity, path, line, rootId, message };
}

export function formatCodeRootMarker(id: string, title: string): string {
  const cleanId = id.trim();
  const cleanTitle = title.trim();
  if (!CODE_ROOT_ID_PATTERN.test(cleanId)) {
    throw new Error(`Code root id "${cleanId}" must start with a lowercase letter and contain only lowercase letters, numbers, dots, underscores, or hyphens.`);
  }
  if (!cleanTitle) throw new Error("Code root title is required.");
  if (cleanTitle.includes("\n") || cleanTitle.includes("\r")) throw new Error("Code root title must fit on one line.");
  return `// ${CODE_ROOT_MARKER} ${cleanId} | ${cleanTitle}`;
}

// @code-root developer.roots.validation | Root Boundary Validation
export function parseCodeRootSignatures(source: string, filePath: string): CodeRootParseResult {
  const path = normalizedPath(filePath);
  const lines = source.split(/\r?\n/);
  const candidates = lines.flatMap((raw, index) => {
    const candidate = markerCandidate(raw, index + 1);
    return candidate ? [candidate] : [];
  });
  const issues: CodeRootIssue[] = [];
  const valid: Array<MarkerCandidate & { id: string; title: string }> = [];

  for (const candidate of candidates) {
    if (!candidate.id) {
      issues.push(issue(path, candidate.line, "invalid-marker", `Use the exact form "// ${CODE_ROOT_MARKER} stable.id | Human title".`));
      continue;
    }
    if (!CODE_ROOT_ID_PATTERN.test(candidate.id)) {
      issues.push(issue(path, candidate.line, "invalid-id", `Code root id "${candidate.id}" is not a stable lowercase identifier.`, candidate.id));
      continue;
    }
    if (!candidate.title) {
      issues.push(issue(path, candidate.line, "missing-title", `Code root "${candidate.id}" needs a human-readable title after "|".`, candidate.id));
      continue;
    }
    valid.push({ ...candidate, id: candidate.id, title: candidate.title });
  }

  const occurrences = new Map<string, MarkerCandidate[]>();
  for (const candidate of valid) {
    const matches = occurrences.get(candidate.id) ?? [];
    matches.push(candidate);
    occurrences.set(candidate.id, matches);
  }
  const duplicates = new Set<string>();
  for (const [id, matches] of occurrences) {
    if (matches.length < 2) continue;
    duplicates.add(id);
    for (const match of matches) {
      issues.push(issue(path, match.line, "duplicate-id", `Code root id "${id}" appears ${matches.length} times in this file.`, id));
    }
  }

  const unique = valid.filter((candidate) => !duplicates.has(candidate.id));
  const roots: ParsedCodeRoot[] = unique.map((candidate, index) => {
    const followingMarker = candidates.find((item) => item.line > candidate.line);
    const endLine = followingMarker ? followingMarker.line - 1 : lines.length;
    const startLine = candidate.line + 1;
    const sectionLines = lines.slice(startLine - 1, endLine);
    const meaningful = sectionLines.some((line) => line.trim() && !/^\s*\/\//.test(line));
    if (!meaningful) {
      issues.push(issue(path, candidate.line, "empty-section", `Code root "${candidate.id}" does not contain executable code or declarations.`, candidate.id, "warning"));
    }
    return {
      id: candidate.id,
      title: candidate.title,
      path,
      markerLine: candidate.line,
      startLine,
      endLine,
      lineCount: Math.max(0, endLine - startLine + 1),
      contentHash: contentHash(sectionLines),
      marker: candidate.raw.trim(),
    };
  });

  return {
    path,
    lineCount: lines.length,
    roots,
    issues: issues.sort((left, right) => left.line - right.line || left.code.localeCompare(right.code)),
  };
}

// @code-root developer.roots.navigation | Root Location Navigation
export function rootContainingLine(roots: ParsedCodeRoot[], line: number): ParsedCodeRoot | null {
  if (!Number.isInteger(line) || line < 1) return null;
  return roots.find((root) => line >= root.markerLine && line <= root.endLine) ?? null;
}
