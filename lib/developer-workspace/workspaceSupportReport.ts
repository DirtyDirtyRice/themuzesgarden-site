import "server-only";

import { readAiDriftReport } from "./aiDriftReport";
import { readArchitecturalHealthHistory } from "./architecturalHealthHistory";
import { readRecentCodeEvents } from "./codeEventLedger";
import { watcherStatus } from "./liveCodeWatcher";
import { readPreventedErrorEvents, summarizePreventedErrors } from "./preventedErrorLedger";
import { buildProjectIndex } from "./projectIndex";
import { readStableSymbolRegistry } from "./stableSymbolIdentityStore";
import { readVerificationHistory } from "./verificationHistoryStore";
import type { WorkspaceProjectRecord } from "./workspaceProjectRegistry";

export type WorkspaceSupportReport = {
  schemaVersion: 1;
  generatedAt: string;
  product: { name: string; version: string; node: string; platform: string };
  project: { id: string; name: string; framework: string; packageName: string | null; status: string };
  index: { files: number; directories: number; bytes: number; truncated: boolean };
  watcher: { running: boolean; lastChangeAt: string | null; lastIndexedAt: string | null; pendingFileCount: number; lastEventCount: number; hasError: boolean };
  ledgers: { codeEvents: number; stableSymbols: number; presentSymbols: number; preventedErrors: ReturnType<typeof summarizePreventedErrors>; aiDrift: { totalHeldAttempts: number; stillUnrealized: number; corrected: number; activated: number; abandoned: number } };
  verification: { recordedJobs: number; latestStatus: string | null; latestKind: string | null; latestCompletedAt: string | null };
  architecture: { recordedSnapshots: number; healthScore: number | null; criticalCount: number; highCount: number };
};

export async function createWorkspaceSupportReport(project: WorkspaceProjectRecord): Promise<WorkspaceSupportReport> {
  const [index, events, registry, prevented, drift, verifications, health] = await Promise.all([
    buildProjectIndex({ root: project.rootPath }),
    readRecentCodeEvents(2_000, project.rootPath),
    readStableSymbolRegistry(project.rootPath),
    readPreventedErrorEvents(2_000, project.rootPath),
    readAiDriftReport(project.rootPath),
    readVerificationHistory(200, project.rootPath),
    readArchitecturalHealthHistory(project.rootPath, 200),
  ]);
  const watcher = watcherStatus();
  const latestVerification = verifications[0] ?? null;
  const latestHealth = health[0] ?? null;
  const stableSymbols = Object.values(registry.records);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    product: { name: "Developer Workspace", version: "0.1.0", node: process.version, platform: process.platform },
    project: { id: project.id, name: project.name, framework: project.framework, packageName: project.packageName, status: project.status },
    index: { files: index.stats.fileCount, directories: index.stats.directoryCount, bytes: index.stats.totalBytes, truncated: index.truncated },
    watcher: { running: watcher.running, lastChangeAt: watcher.lastChangeAt, lastIndexedAt: watcher.lastIndexedAt, pendingFileCount: watcher.pendingFiles.length, lastEventCount: watcher.lastEventCount, hasError: Boolean(watcher.error) },
    ledgers: { codeEvents: events.length, stableSymbols: stableSymbols.length, presentSymbols: stableSymbols.filter((symbol) => symbol.present).length, preventedErrors: summarizePreventedErrors(prevented), aiDrift: { totalHeldAttempts: drift.totalHeldAttempts, stillUnrealized: drift.stillUnrealized, corrected: drift.corrected, activated: drift.activated, abandoned: drift.abandoned } },
    verification: { recordedJobs: verifications.length, latestStatus: latestVerification?.status ?? null, latestKind: latestVerification?.kind ?? null, latestCompletedAt: latestVerification?.completedAt ?? null },
    architecture: { recordedSnapshots: health.length, healthScore: latestHealth?.healthScore ?? null, criticalCount: latestHealth?.criticalCount ?? 0, highCount: latestHealth?.highCount ?? 0 },
  };
}
