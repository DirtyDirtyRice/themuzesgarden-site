import "server-only";

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ArchitecturalFinding,
  ArchitecturalHealthReport,
  ArchitecturalRisk,
} from "./architecturalHealth";

export type ArchitecturalHealthSnapshotFinding = Pick<
  ArchitecturalFinding,
  "id" | "kind" | "risk" | "path" | "relatedPath" | "score" | "title"
>;

export type ArchitecturalHealthSnapshot = {
  recordedAt: string;
  healthScore: number;
  indexedFiles: number;
  indexedRelationships: number;
  criticalCount: number;
  highCount: number;
  findings: ArchitecturalHealthSnapshotFinding[];
};

export type ArchitecturalRiskChange = {
  id: string;
  path: string;
  relatedPath: string | null;
  title: string;
  previousRisk: ArchitecturalRisk | null;
  currentRisk: ArchitecturalRisk | null;
  previousScore: number | null;
  currentScore: number | null;
};

export type ArchitecturalHealthTrend = "first-snapshot" | "improved" | "stable" | "regressed";

export type ArchitecturalHealthComparison = {
  trend: ArchitecturalHealthTrend;
  scoreDelta: number;
  previousScore: number | null;
  currentScore: number;
  introduced: ArchitecturalRiskChange[];
  resolved: ArchitecturalRiskChange[];
  worsened: ArchitecturalRiskChange[];
  improved: ArchitecturalRiskChange[];
};

export type ArchitecturalHealthHistoryResult = {
  current: ArchitecturalHealthSnapshot;
  previous: ArchitecturalHealthSnapshot | null;
  comparison: ArchitecturalHealthComparison;
  history: ArchitecturalHealthSnapshot[];
};

const directory = "code-map-reports/architectural-health";
const fileName = "history.jsonl";
const maximumStoredFindings = 1_000;
const maximumHistoryRead = 200;
const riskWeight: Record<ArchitecturalRisk, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};
const lockKey = "__developerWorkspaceArchitecturalHealthHistoryLock";
const lockState = globalThis as typeof globalThis & { [lockKey]?: Promise<void> };
lockState[lockKey] ??= Promise.resolve();

function snapshot(report: ArchitecturalHealthReport): ArchitecturalHealthSnapshot {
  return {
    recordedAt: new Date().toISOString(),
    healthScore: report.healthScore,
    indexedFiles: report.indexedFiles,
    indexedRelationships: report.indexedRelationships,
    criticalCount: report.criticalCount,
    highCount: report.highCount,
    findings: report.findings.slice(0, maximumStoredFindings).map((finding) => ({
      id: finding.id,
      kind: finding.kind,
      risk: finding.risk,
      path: finding.path,
      relatedPath: finding.relatedPath,
      score: finding.score,
      title: finding.title,
    })),
  };
}

function change(
  current: ArchitecturalHealthSnapshotFinding | null,
  previous: ArchitecturalHealthSnapshotFinding | null,
): ArchitecturalRiskChange {
  const source = current ?? previous;
  if (!source) throw new Error("Architectural risk comparison requires a finding.");
  return {
    id: source.id,
    path: source.path,
    relatedPath: source.relatedPath,
    title: source.title,
    previousRisk: previous?.risk ?? null,
    currentRisk: current?.risk ?? null,
    previousScore: previous?.score ?? null,
    currentScore: current?.score ?? null,
  };
}

export function compareArchitecturalHealth(
  current: ArchitecturalHealthSnapshot,
  previous: ArchitecturalHealthSnapshot | null,
): ArchitecturalHealthComparison {
  if (!previous) {
    return {
      trend: "first-snapshot",
      scoreDelta: 0,
      previousScore: null,
      currentScore: current.healthScore,
      introduced: [],
      resolved: [],
      worsened: [],
      improved: [],
    };
  }

  const currentById = new Map(current.findings.map((finding) => [finding.id, finding]));
  const previousById = new Map(previous.findings.map((finding) => [finding.id, finding]));
  const introduced: ArchitecturalRiskChange[] = [];
  const resolved: ArchitecturalRiskChange[] = [];
  const worsened: ArchitecturalRiskChange[] = [];
  const improved: ArchitecturalRiskChange[] = [];

  for (const finding of current.findings) {
    const old = previousById.get(finding.id) ?? null;
    if (!old) {
      introduced.push(change(finding, null));
      continue;
    }
    const riskDelta = riskWeight[finding.risk] - riskWeight[old.risk];
    const scoreDelta = finding.score - old.score;
    if (riskDelta > 0 || (riskDelta === 0 && scoreDelta >= 10)) {
      worsened.push(change(finding, old));
    } else if (riskDelta < 0 || (riskDelta === 0 && scoreDelta <= -10)) {
      improved.push(change(finding, old));
    }
  }

  for (const finding of previous.findings) {
    if (!currentById.has(finding.id)) resolved.push(change(null, finding));
  }

  const scoreDelta = current.healthScore - previous.healthScore;
  const regressionWeight = introduced.length + worsened.length * 2;
  const improvementWeight = resolved.length + improved.length * 2;
  const trend: ArchitecturalHealthTrend =
    scoreDelta < 0 || regressionWeight > improvementWeight
      ? "regressed"
      : scoreDelta > 0 || improvementWeight > regressionWeight
        ? "improved"
        : "stable";

  return {
    trend,
    scoreDelta,
    previousScore: previous.healthScore,
    currentScore: current.healthScore,
    introduced,
    resolved,
    worsened,
    improved,
  };
}

export async function readArchitecturalHealthHistory(
  root = process.cwd(),
  limit = 30,
): Promise<ArchitecturalHealthSnapshot[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > maximumHistoryRead) {
    throw new Error(`Architectural health history limit must be between 1 and ${maximumHistoryRead}.`);
  }
  try {
    const source = await readFile(path.join(root, directory, fileName), "utf8");
    return source
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .reverse()
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as ArchitecturalHealthSnapshot];
        } catch {
          return [];
        }
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function recordArchitecturalHealth(
  report: ArchitecturalHealthReport,
  root = process.cwd(),
): Promise<ArchitecturalHealthHistoryResult> {
  const task = async () => {
    const historyBefore = await readArchitecturalHealthHistory(root, 30);
    const current = snapshot(report);
    const previous = historyBefore[0] ?? null;
    const outputDirectory = path.join(root, directory);
    await mkdir(outputDirectory, { recursive: true });
    await appendFile(path.join(outputDirectory, fileName), `${JSON.stringify(current)}\n`, "utf8");
    return {
      current,
      previous,
      comparison: compareArchitecturalHealth(current, previous),
      history: [current, ...historyBefore].slice(0, 30),
    };
  };

  const pending = lockState[lockKey]!.then(task, task);
  lockState[lockKey] = pending.then(() => undefined, () => undefined);
  return pending;
}
