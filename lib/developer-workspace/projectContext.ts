import "server-only";

import type { ProjectEntry, ProjectIndex } from "./projectIndex";
import { searchProjectIndex } from "./projectIndex";
import { readProjectFile, type ProjectSourceLine } from "./projectFile";
import type { ProjectSymbol, SymbolIndex } from "./symbolIndex";
import { searchSymbolIndex } from "./symbolIndex";

export type ContextExcerpt = { id: string; path: string; startLine: number; endLine: number; language: string; reason: string; score: number; lines: ProjectSourceLine[] };
export type ContextFileMatch = { path: string; name: string; extension: string | null; score: number; matchedBy: string[] };
export type ContextSymbolMatch = ProjectSymbol & { score: number; matchedBy: string[] };
export type ProjectContextBundle = { query: string; generatedAt: string; terms: string[]; symbols: ContextSymbolMatch[]; files: ContextFileMatch[]; excerpts: ContextExcerpt[]; characterCount: number; warnings: string[] };
export type ProjectContextOptions = { maxSymbols?: number; maxFiles?: number; maxExcerpts?: number; maxCharacters?: number };

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "does", "for", "from", "how", "i", "in", "is", "it", "me", "of", "on", "or", "show", "that", "the", "this", "to", "used", "uses", "what", "where", "which", "who", "with"]);
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".jsx", ".json", ".md", ".mjs", ".mts", ".scss", ".sql", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);

function assertLimit(value: number, label: string, maximum: number): void {
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error(`${label} must be an integer between 1 and ${maximum}.`);
}

export function extractContextTerms(query: string): string[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];
  const identifierParts = cleanQuery.split(/[^A-Za-z0-9_./-]+/).filter(Boolean);
  const wordParts = cleanQuery.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9_./-]+/).filter(Boolean);
  const candidates = [cleanQuery, ...identifierParts, ...wordParts];
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const normalized = candidate.toLowerCase();
    if (normalized.length < 2 || STOP_WORDS.has(normalized) || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).slice(0, 16);
}

function collectSymbolMatches(index: SymbolIndex, terms: string[], limit: number): ContextSymbolMatch[] {
  const matches = new Map<string, ContextSymbolMatch>();
  terms.forEach((term, termIndex) => {
    for (const result of searchSymbolIndex(index, term, { limit: Math.max(limit * 3, 20) })) {
      const score = result.score + Math.max(0, 120 - termIndex * 8);
      const current = matches.get(result.symbol.id);
      if (current) {
        current.score = Math.max(current.score, score);
        if (!current.matchedBy.includes(term)) current.matchedBy.push(term);
      } else matches.set(result.symbol.id, { ...result.symbol, score, matchedBy: [term] });
    }
  });
  return [...matches.values()].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.line - b.line).slice(0, limit);
}

function collectFileMatches(index: ProjectIndex, terms: string[], limit: number): ContextFileMatch[] {
  const matches = new Map<string, ContextFileMatch>();
  terms.forEach((term, termIndex) => {
    for (const result of searchProjectIndex(index, term, Math.max(limit * 3, 20))) {
      const entry: ProjectEntry = result.entry;
      if (entry.kind !== "file" || (entry.extension && !SOURCE_EXTENSIONS.has(entry.extension))) continue;
      const score = result.score + Math.max(0, 100 - termIndex * 7);
      const current = matches.get(entry.path);
      if (current) {
        current.score = Math.max(current.score, score);
        if (!current.matchedBy.includes(term)) current.matchedBy.push(term);
      } else matches.set(entry.path, { path: entry.path, name: entry.name, extension: entry.extension, score, matchedBy: [term] });
    }
  });
  return [...matches.values()].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}

export async function buildProjectContext(query: string, projectIndex: ProjectIndex, symbolIndex: SymbolIndex, options: ProjectContextOptions = {}): Promise<ProjectContextBundle> {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new Error("A context question is required.");
  if (cleanQuery.length > 500) throw new Error("Context questions are limited to 500 characters.");
  const maxSymbols = options.maxSymbols ?? 12, maxFiles = options.maxFiles ?? 10, maxExcerpts = options.maxExcerpts ?? 10, maxCharacters = options.maxCharacters ?? 40_000;
  assertLimit(maxSymbols, "maxSymbols", 50); assertLimit(maxFiles, "maxFiles", 50); assertLimit(maxExcerpts, "maxExcerpts", 30); assertLimit(maxCharacters, "maxCharacters", 200_000);
  const terms = extractContextTerms(cleanQuery);
  const symbols = collectSymbolMatches(symbolIndex, terms, maxSymbols);
  const files = collectFileMatches(projectIndex, terms, maxFiles);
  const warnings: string[] = [], excerpts: ContextExcerpt[] = [], excerptKeys = new Set<string>();
  let characterCount = 0;
  const candidates = [
    ...symbols.map((s) => ({ path: s.path, line: s.line, score: s.score, reason: `${s.kind} ${s.containerName ? `${s.containerName}.` : ""}${s.name}` })),
    ...files.map((f) => ({ path: f.path, line: 1, score: f.score - 150, reason: `matching file ${f.name}` })),
  ].sort((a, b) => b.score - a.score);

  for (const candidate of candidates) {
    if (excerpts.length >= maxExcerpts || characterCount >= maxCharacters) break;
    const startLine = Math.max(1, candidate.line - 5), key = `${candidate.path}:${startLine}`;
    if (excerptKeys.has(key)) continue;
    excerptKeys.add(key);
    try {
      const view = await readProjectFile(candidate.path, { root: projectIndex.root, startLine, lineCount: 30 });
      const remaining = maxCharacters - characterCount, lines: ProjectSourceLine[] = [];
      let size = 0;
      for (const line of view.lines) {
        const lineSize = line.text.length + 12;
        if (lines.length && size + lineSize > remaining) break;
        lines.push(line); size += lineSize;
      }
      if (!lines.length) break;
      characterCount += size;
      excerpts.push({ id: key, path: view.path, startLine: lines[0].number, endLine: lines.at(-1)!.number, language: view.language, reason: candidate.reason, score: candidate.score, lines });
    } catch (error) {
      warnings.push(`${candidate.path}: ${error instanceof Error ? error.message : "could not read file"}`);
    }
  }
  return { query: cleanQuery, generatedAt: new Date().toISOString(), terms, symbols, files, excerpts, characterCount, warnings };
}
