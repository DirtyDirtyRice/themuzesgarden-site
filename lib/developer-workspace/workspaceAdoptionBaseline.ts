import "server-only";

import { analyzeArchitecturalHealth } from "./architecturalHealth";
import { recordArchitecturalHealth } from "./architecturalHealthHistory";
import { updateBuildEventLedger } from "./buildEventLedger";
import { runTypeCheck } from "./buildDiagnostics";
import { readRecentCodeEvents, updateCodeEventLedger } from "./codeEventLedger";
import { buildProjectIndex } from "./projectIndex";
import { updateRelationshipEventLedger } from "./relationshipEventLedger";
import { buildRelationshipIndex } from "./relationshipIndex";
import { buildSymbolIndex } from "./symbolIndex";

export type WorkspaceAdoptionBaseline = {
  recordedAt: string;
  root: string;
  files: number;
  symbols: number;
  relationships: number;
  newSymbolEvents: number;
  newRelationshipEvents: number;
  typecheckStatus: "passed" | "failed" | "timed-out";
  diagnostics: number;
  healthScore: number;
  criticalRisks: number;
  highRisks: number;
};

export async function establishWorkspaceAdoptionBaseline(root: string): Promise<WorkspaceAdoptionBaseline> {
  const [projectIndex, symbolIndex, relationshipIndex] = await Promise.all([
    buildProjectIndex({ root }),
    buildSymbolIndex({ root }),
    buildRelationshipIndex(root),
  ]);

  const symbolUpdate = await updateCodeEventLedger(symbolIndex, root);
  const relationshipUpdate = await updateRelationshipEventLedger(relationshipIndex, root);
  const typecheck = await runTypeCheck(root);
  await updateBuildEventLedger(typecheck, root);

  const events = await readRecentCodeEvents(2_000, root);
  const health = analyzeArchitecturalHealth(projectIndex, relationshipIndex, events);
  await recordArchitecturalHealth(health, root);

  return {
    recordedAt: new Date().toISOString(),
    root: projectIndex.root,
    files: projectIndex.stats.fileCount,
    symbols: symbolIndex.symbols.length,
    relationships: relationshipIndex.relationships.length,
    newSymbolEvents: symbolUpdate.events.length,
    newRelationshipEvents: relationshipUpdate.events.length,
    typecheckStatus: typecheck.status,
    diagnostics: typecheck.primaryDiagnosticCount,
    healthScore: health.healthScore,
    criticalRisks: health.criticalCount,
    highRisks: health.highCount,
  };
}
