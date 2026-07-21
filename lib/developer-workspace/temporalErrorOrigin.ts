import "server-only";

import type { BuildDiagnostic } from "./buildDiagnostics";
import { analyzeDependencyImpact, type ImpactAnalysisReport } from "./impactAnalysis";
import { searchCodeEvents, type CodeEvent } from "./codeEventLedger";
import { searchGitEvents } from "./gitHistoryImporter";
import type { CodeRelationship, RelationshipIndex } from "./relationshipIndex";
import type { ProjectSymbol, SymbolIndex } from "./symbolIndex";

export type ErrorOriginCandidate = {
  event: CodeEvent;
  score: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
};

export type TemporalErrorOriginReport = {
  diagnostic: BuildDiagnostic;
  analyzedAt: string;
  nearbySymbols: ProjectSymbol[];
  relatedRelationships: CodeRelationship[];
  errorHistory: CodeEvent[];
  impactReports: ImpactAnalysisReport[];
  candidates: ErrorOriginCandidate[];
  breadcrumbs: Array<{
    occurredAt: string;
    kind: CodeEvent["kind"];
    title: string;
    path: string;
    line: number;
    commit: string | null;
    details: string;
  }>;
};

function nearbySymbols(diagnostic: BuildDiagnostic, index: SymbolIndex): ProjectSymbol[] {
  if (!diagnostic.file) return [];
  const line = diagnostic.line ?? 1;
  return index.symbols
    .filter((symbol) => symbol.path === diagnostic.file)
    .map((symbol) => ({ symbol, distance: line >= symbol.line && line <= symbol.endLine ? 0 : Math.min(Math.abs(line - symbol.line), Math.abs(line - symbol.endLine)) }))
    .sort((left, right) => left.distance - right.distance || left.symbol.line - right.symbol.line)
    .slice(0, 8)
    .map((item) => item.symbol);
}

function relevantRelationships(diagnostic: BuildDiagnostic, symbols: ProjectSymbol[], index: RelationshipIndex): CodeRelationship[] {
  const names = new Set(symbols.map((symbol) => symbol.name));
  return index.relationships
    .filter((relationship) => relationship.sourcePath === diagnostic.file || relationship.targetPath === diagnostic.file || names.has(relationship.symbolName))
    .sort((left, right) => Number(right.sourcePath === diagnostic.file) - Number(left.sourcePath === diagnostic.file))
    .slice(0, 60);
}

function candidate(event: CodeEvent, diagnostic: BuildDiagnostic, symbols: ProjectSymbol[]): ErrorOriginCandidate | null {
  if (event.kind === "build-error-resolved" || event.kind === "symbol-observed") return null;
  const names = new Set(symbols.map((symbol) => symbol.name.toLowerCase()));
  const reasons: string[] = [];
  let score = 0;
  if (event.path === diagnostic.file) { score += 50; reasons.push("same file as the compiler error"); }
  if (names.has(event.symbolName.toLowerCase())) { score += 45; reasons.push("same or enclosing symbol"); }
  if (event.kind === "git-symbol-changed" || event.kind === "git-symbol-moved") { score += 20; reasons.push("historical code change"); }
  if (event.kind === "import-added" || event.kind === "export-added" || event.kind === "reference-added") { score += 15; reasons.push("dependency relationship introduced"); }
  if (event.kind === "build-error-observed") { score += 70; reasons.push("recorded appearance of this error family"); }
  if (diagnostic.code && (event.details.includes(diagnostic.code) || event.symbolName === diagnostic.code)) { score += 35; reasons.push(`matches ${diagnostic.code}`); }
  if (!score) return null;
  return { event, score, confidence: score >= 90 ? "high" : score >= 55 ? "medium" : "low", reasons };
}

export async function investigateTemporalErrorOrigin(
  diagnostic: BuildDiagnostic,
  symbolIndex: SymbolIndex,
  relationshipIndex: RelationshipIndex,
  root = process.cwd()
): Promise<TemporalErrorOriginReport> {
  const symbols = nearbySymbols(diagnostic, symbolIndex);
  const relationships = relevantRelationships(diagnostic, symbols, relationshipIndex);
  const impactReports = symbols.slice(0, 3).map((symbol) => analyzeDependencyImpact(relationshipIndex, {
    path: symbol.path,
    symbolName: symbol.name,
    line: symbol.line,
    maxDepth: 6,
    maxResults: 250,
  }));
  const queries = [...new Set([diagnostic.file, diagnostic.code, ...symbols.map((symbol) => symbol.name)].filter((value): value is string => Boolean(value)))];
  const eventGroups = await Promise.all(queries.flatMap((query) => [searchCodeEvents(query, 600, root), searchGitEvents(query, 600, root)]));
  const eventMap = new Map<string, CodeEvent>();
  for (const event of eventGroups.flat()) eventMap.set(event.id, event);
  const errorHistory = [...eventMap.values()].filter((event) => event.kind === "build-error-observed" || event.kind === "build-error-resolved").sort((left, right) => new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime());
  const candidates = [...eventMap.values()].map((event) => candidate(event, diagnostic, symbols)).filter((item): item is ErrorOriginCandidate => item !== null).sort((left, right) => right.score - left.score || new Date(right.event.occurredAt).getTime() - new Date(left.event.occurredAt).getTime()).slice(0, 20);
  const breadcrumbs = candidates.slice(0, 10).sort((left, right) => new Date(left.event.occurredAt).getTime() - new Date(right.event.occurredAt).getTime()).map(({ event }) => ({ occurredAt: event.occurredAt, kind: event.kind, title: `${event.symbolName} · ${event.kind}`, path: event.path, line: event.line, commit: event.gitCommit ?? null, details: event.details }));
  return { diagnostic, analyzedAt: new Date().toISOString(), nearbySymbols: symbols, relatedRelationships: relationships, errorHistory, impactReports, candidates, breadcrumbs };
}
