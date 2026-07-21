import "server-only";

import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  parseCodeRootSignatures,
  type CodeRootIssue,
  type ParsedCodeRoot,
} from "./codeRootSignature";
import { buildProjectIndex, type ProjectEntry, type ProjectIndex } from "./projectIndex";
import { buildSymbolIndex, type ProjectSymbol, type SymbolIndex } from "./symbolIndex";

export type CodeRootSymbolReference = Pick<
  ProjectSymbol,
  "id" | "name" | "kind" | "line" | "endLine" | "exported" | "containerName"
>;

export type IndexedCodeRoot = ParsedCodeRoot & {
  symbols: CodeRootSymbolReference[];
  exportedSymbolCount: number;
};

export type CodeRootFile = {
  path: string;
  lineCount: number;
  rootCount: number;
  rootedLineCount: number;
  coveragePercent: number;
  roots: IndexedCodeRoot[];
};

export type CodeRootIndexIssue = CodeRootIssue | {
  code: "duplicate-project-id" | "unrooted-large-file";
  severity: "error" | "warning";
  path: string;
  line: number;
  rootId: string | null;
  message: string;
};

export type CodeRootIndex = {
  root: string;
  generatedAt: string;
  markerFormat: "// @code-root stable.id | Human title";
  scannedFileCount: number;
  rootedFileCount: number;
  rootCount: number;
  symbolCount: number;
  coveragePercent: number;
  files: CodeRootFile[];
  roots: IndexedCodeRoot[];
  issues: CodeRootIndexIssue[];
};

export type CodeRootIndexOptions = {
  root?: string;
  largeFileLineThreshold?: number;
  projectIndex?: ProjectIndex;
  symbolIndex?: SymbolIndex;
};

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);

function sourceFiles(entries: ProjectEntry[]): ProjectEntry[] {
  return entries.flatMap((entry) => {
    if (entry.kind === "directory") return sourceFiles(entry.children ?? []);
    if (!entry.extension || !sourceExtensions.has(entry.extension.toLowerCase())) return [];
    if (entry.path.endsWith(".d.ts")) return [];
    return [entry];
  });
}

function rootSymbols(root: ParsedCodeRoot, symbols: ProjectSymbol[]): CodeRootSymbolReference[] {
  return symbols
    .filter((symbol) => symbol.line >= root.startLine && symbol.line <= root.endLine)
    .sort((left, right) => left.line - right.line || left.column - right.column)
    .map(({ id, name, kind, line, endLine, exported, containerName }) => ({
      id,
      name,
      kind,
      line,
      endLine,
      exported,
      containerName,
    }));
}

function coverage(rootedLines: number, totalLines: number): number {
  if (totalLines <= 0) return 100;
  return Math.round((Math.min(rootedLines, totalLines) / totalLines) * 10_000) / 100;
}

function normalizedThreshold(value: number | undefined): number {
  const threshold = value ?? 400;
  if (!Number.isInteger(threshold) || threshold < 50 || threshold > 100_000) {
    throw new Error("Large-file root threshold must be an integer between 50 and 100,000 lines.");
  }
  return threshold;
}

export async function buildCodeRootIndex(options: CodeRootIndexOptions = {}): Promise<CodeRootIndex> {
  const root = await realpath(path.resolve(options.root ?? process.cwd()));
  const threshold = normalizedThreshold(options.largeFileLineThreshold);
  const [projectIndex, symbolIndex] = await Promise.all([
    options.projectIndex ?? buildProjectIndex({ root }),
    options.symbolIndex ?? buildSymbolIndex({ root }),
  ]);
  if (path.resolve(projectIndex.root) !== root || path.resolve(symbolIndex.root) !== root) {
    throw new Error("Code Root Index inputs must belong to the same canonical project root.");
  }

  const symbolsByPath = new Map<string, ProjectSymbol[]>();
  for (const symbol of symbolIndex.symbols) {
    const values = symbolsByPath.get(symbol.path) ?? [];
    values.push(symbol);
    symbolsByPath.set(symbol.path, values);
  }

  const files: CodeRootFile[] = [];
  const issues: CodeRootIndexIssue[] = [];
  for (const entry of sourceFiles(projectIndex.entries)) {
    const absolute = path.resolve(root, entry.path);
    const relative = path.relative(root, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("A root-index file escaped the selected project.");
    const parsed = parseCodeRootSignatures(await readFile(absolute, "utf8"), entry.path);
    const fileSymbols = symbolsByPath.get(entry.path) ?? [];
    const roots = parsed.roots.map((codeRoot) => {
      const symbols = rootSymbols(codeRoot, fileSymbols);
      return {
        ...codeRoot,
        symbols,
        exportedSymbolCount: symbols.filter((symbol) => symbol.exported).length,
      };
    });
    const rootedLineCount = roots.reduce((total, codeRoot) => total + codeRoot.lineCount + 1, 0);
    files.push({
      path: entry.path,
      lineCount: parsed.lineCount,
      rootCount: roots.length,
      rootedLineCount,
      coveragePercent: coverage(rootedLineCount, parsed.lineCount),
      roots,
    });
    issues.push(...parsed.issues);
    if (parsed.lineCount >= threshold && roots.length === 0) {
      issues.push({
        code: "unrooted-large-file",
        severity: "warning",
        path: entry.path,
        line: 1,
        rootId: null,
        message: `${entry.path} has ${parsed.lineCount.toLocaleString()} lines and no code root chapters.`,
      });
    }
  }

  const roots = files.flatMap((file) => file.roots);
  const rootsById = new Map<string, IndexedCodeRoot[]>();
  for (const codeRoot of roots) {
    const values = rootsById.get(codeRoot.id) ?? [];
    values.push(codeRoot);
    rootsById.set(codeRoot.id, values);
  }
  for (const [id, matches] of rootsById) {
    if (matches.length < 2) continue;
    for (const match of matches) {
      issues.push({
        code: "duplicate-project-id",
        severity: "error",
        path: match.path,
        line: match.markerLine,
        rootId: id,
        message: `Code root id "${id}" is also used at ${matches.filter((item) => item !== match).map((item) => `${item.path}:${item.markerLine}`).join(", ")}.`,
      });
    }
  }

  files.sort((left, right) => left.path.localeCompare(right.path));
  roots.sort((left, right) => left.path.localeCompare(right.path) || left.markerLine - right.markerLine);
  issues.sort((left, right) => left.path.localeCompare(right.path) || left.line - right.line || left.code.localeCompare(right.code));
  const totalLines = files.reduce((total, file) => total + file.lineCount, 0);
  const rootedLines = files.reduce((total, file) => total + file.rootedLineCount, 0);

  return {
    root,
    generatedAt: new Date().toISOString(),
    markerFormat: "// @code-root stable.id | Human title",
    scannedFileCount: files.length,
    rootedFileCount: files.filter((file) => file.rootCount > 0).length,
    rootCount: roots.length,
    symbolCount: roots.reduce((total, codeRoot) => total + codeRoot.symbols.length, 0),
    coveragePercent: coverage(rootedLines, totalLines),
    files,
    roots,
    issues,
  };
}

export function findCodeRoot(index: CodeRootIndex, id: string): IndexedCodeRoot | null {
  const matches = index.roots.filter((codeRoot) => codeRoot.id === id);
  return matches.length === 1 ? matches[0] : null;
}

export function codeRootAtLocation(index: CodeRootIndex, filePath: string, line: number): IndexedCodeRoot | null {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  return index.roots.find((codeRoot) => codeRoot.path === normalized && line >= codeRoot.markerLine && line <= codeRoot.endLine) ?? null;
}
