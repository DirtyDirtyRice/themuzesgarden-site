import "server-only";

import { analyzeArchitecturalHealth, type ArchitecturalFinding } from "./architecturalHealth";
import type { AiEvidencePlan } from "./aiEvidencePlanner";
import { readRecentCodeEvents, type CodeEvent } from "./codeEventLedger";
import { analyzeDependencyImpact, type ImpactedFile } from "./impactAnalysis";
import { readPreventedErrorEvents, type PreventedErrorEvent } from "./preventedErrorLedger";
import type { ProjectContextBundle } from "./projectContext";
import type { ProjectIndex } from "./projectIndex";
import type { CodeRelationship, RelationshipIndex } from "./relationshipIndex";
import { readVerificationHistory } from "./verificationHistoryStore";

export type AiCollectedEvidence = {
  generatedAt: string;
  relationships: CodeRelationship[];
  impacts: Array<{ symbol: string; path: string; directCount: number; totalCount: number; files: ImpactedFile[] }>;
  events: CodeEvent[];
  preventedErrors: PreventedErrorEvent[];
  architecturalFindings: ArchitecturalFinding[];
  verifications: Array<{ id: string; status: string; queuedAt: string; command: string | null }>;
  warnings: string[];
};

function containsFocus(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export async function collectAiEvidence(
  plan: AiEvidencePlan,
  context: ProjectContextBundle,
  projectIndex: ProjectIndex,
  relationshipIndex: RelationshipIndex,
  root = projectIndex.root,
): Promise<AiCollectedEvidence> {
  const selected = new Set(plan.evidence);
  const focusNames = plan.focusSymbols.map((symbol) => symbol.name.toLowerCase());
  const focusFiles = new Set(plan.focusFiles);
  const searchTerms = [...focusNames, ...plan.focusFiles.map((file) => file.toLowerCase())];
  const warnings: string[] = [];

  const relationships = selected.has("cross-references")
    ? relationshipIndex.relationships.filter((relationship) =>
        focusFiles.has(relationship.sourcePath) ||
        focusFiles.has(relationship.targetPath) ||
        focusNames.includes(relationship.symbolName.toLowerCase()),
      ).slice(0, 80)
    : [];

  const impacts = selected.has("dependency-impact")
    ? plan.focusSymbols.slice(0, 3).map((symbol) => {
        const report = analyzeDependencyImpact(relationshipIndex, {
          path: symbol.path,
          symbolName: symbol.name,
          line: symbol.line,
          maxDepth: 5,
          maxResults: 100,
        });
        return {
          symbol: symbol.name,
          path: symbol.path,
          directCount: report.directCount,
          totalCount: report.totalCount,
          files: report.impacts.slice(0, 25),
        };
      })
    : [];

  const recentEvents = selected.has("code-history") ? await readRecentCodeEvents(500, root) : [];
  const events = recentEvents.filter((event) =>
    focusFiles.has(event.path) ||
    (event.previousPath ? focusFiles.has(event.previousPath) : false) ||
    containsFocus(`${event.symbolName} ${event.details}`, searchTerms),
  ).slice(0, 60);

  const recentPrevented = selected.has("prevented-errors") ? await readPreventedErrorEvents(300, root) : [];
  const preventedErrors = recentPrevented.filter((event) =>
    focusFiles.has(event.file) ||
    event.impactedFiles.some((file) => focusFiles.has(file)) ||
    event.impactedSymbols.some((symbol) => focusNames.includes(symbol.toLowerCase())) ||
    event.evidence.some((item) => containsFocus(`${item.code} ${item.message}`, searchTerms)),
  ).slice(0, 30);

  const architecturalFindings = selected.has("architectural-health")
    ? analyzeArchitecturalHealth(projectIndex, relationshipIndex, recentEvents).findings.filter((finding) =>
        focusFiles.has(finding.path) || Boolean(finding.relatedPath && focusFiles.has(finding.relatedPath)),
      ).slice(0, 30)
    : [];

  const verificationJobs = selected.has("verification-history") ? await readVerificationHistory(100, root) : [];
  const verifications = verificationJobs.filter((job) =>
    containsFocus(JSON.stringify(job), searchTerms),
  ).slice(0, 20).map((job) => ({
    id: job.id,
    status: job.status,
    queuedAt: job.queuedAt,
    command: job.result?.command ?? null,
  }));

  if (selected.has("cross-references") && !relationships.length) warnings.push("No matching indexed relationships were found.");
  if (selected.has("code-history") && !events.length) warnings.push("No matching code-history events were found.");
  if (selected.has("prevented-errors") && !preventedErrors.length) warnings.push("No matching prevented-error events were found.");
  if (selected.has("verification-history") && !verifications.length) warnings.push("No matching verification records were found.");

  return {
    generatedAt: new Date().toISOString(),
    relationships,
    impacts,
    events,
    preventedErrors,
    architecturalFindings,
    verifications,
    warnings,
  };
}
