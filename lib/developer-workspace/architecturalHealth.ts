import type { CodeEvent } from "./codeEventLedger";
import type { ProjectEntry, ProjectIndex } from "./projectIndex";
import type { RelationshipIndex } from "./relationshipIndex";

export type ArchitecturalRisk = "critical" | "high" | "moderate" | "low";
export type ArchitecturalFindingKind =
  | "oversized-file"
  | "dependency-bottleneck"
  | "high-change-file"
  | "tight-coupling"
  | "high-blast-radius";

export type ArchitecturalHealthOptions = {
  largeFileBytes?: number;
  bottleneckDependents?: number;
  frequentChangeEvents?: number;
  highBlastRadius?: number;
};

export type ArchitecturalFileHealth = {
  path: string;
  size: number;
  incomingDependencies: number;
  outgoingDependencies: number;
  relationshipCount: number;
  changeEvents: number;
  riskScore: number;
  risk: ArchitecturalRisk;
};

export type ArchitecturalCoupling = {
  leftPath: string;
  rightPath: string;
  leftToRight: number;
  rightToLeft: number;
  totalRelationships: number;
  risk: ArchitecturalRisk;
};

export type ArchitecturalFinding = {
  id: string;
  kind: ArchitecturalFindingKind;
  risk: ArchitecturalRisk;
  path: string;
  relatedPath: string | null;
  score: number;
  title: string;
  explanation: string;
  evidence: string[];
};

export type ArchitecturalHealthReport = {
  generatedAt: string;
  healthScore: number;
  indexedFiles: number;
  indexedRelationships: number;
  analyzedEvents: number;
  criticalCount: number;
  highCount: number;
  files: ArchitecturalFileHealth[];
  coupling: ArchitecturalCoupling[];
  findings: ArchitecturalFinding[];
};

const DEFAULTS: Required<ArchitecturalHealthOptions> = {
  largeFileBytes: 100_000,
  bottleneckDependents: 10,
  frequentChangeEvents: 20,
  highBlastRadius: 25,
};

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function filesFrom(entries: ProjectEntry[]): ProjectEntry[] {
  return entries.flatMap((entry) =>
    entry.kind === "file" ? [entry] : filesFrom(entry.children ?? []),
  );
}

function riskForScore(score: number): ArchitecturalRisk {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

function uniqueFileEdges(index: RelationshipIndex): Array<{
  sourcePath: string;
  targetPath: string;
}> {
  const seen = new Set<string>();
  const edges: Array<{ sourcePath: string; targetPath: string }> = [];

  for (const relationship of index.relationships) {
    const sourcePath = normalizePath(relationship.sourcePath);
    const targetPath = normalizePath(relationship.targetPath);
    if (sourcePath === targetPath) continue;
    const key = `${sourcePath}\0${targetPath}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ sourcePath, targetPath });
  }

  return edges;
}

function findingId(
  kind: ArchitecturalFindingKind,
  path: string,
  relatedPath: string | null = null,
): string {
  return `${kind}:${path}:${relatedPath ?? ""}`.toLowerCase();
}

export function analyzeArchitecturalHealth(
  projectIndex: ProjectIndex,
  relationshipIndex: RelationshipIndex,
  events: CodeEvent[] = [],
  options: ArchitecturalHealthOptions = {},
): ArchitecturalHealthReport {
  const limits = { ...DEFAULTS, ...options };
  const entries = filesFrom(projectIndex.entries);
  const edges = uniqueFileEdges(relationshipIndex);
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  const relationshipCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();

  for (const edge of edges) {
    const dependents = incoming.get(edge.targetPath) ?? new Set<string>();
    dependents.add(edge.sourcePath);
    incoming.set(edge.targetPath, dependents);
    const dependencies = outgoing.get(edge.sourcePath) ?? new Set<string>();
    dependencies.add(edge.targetPath);
    outgoing.set(edge.sourcePath, dependencies);
  }

  for (const relationship of relationshipIndex.relationships) {
    const source = normalizePath(relationship.sourcePath);
    const target = normalizePath(relationship.targetPath);
    relationshipCounts.set(source, (relationshipCounts.get(source) ?? 0) + 1);
    if (target !== source) {
      relationshipCounts.set(target, (relationshipCounts.get(target) ?? 0) + 1);
    }
  }

  for (const event of events) {
    const path = normalizePath(event.path);
    eventCounts.set(path, (eventCounts.get(path) ?? 0) + 1);
    if (event.previousPath) {
      const previous = normalizePath(event.previousPath);
      eventCounts.set(previous, (eventCounts.get(previous) ?? 0) + 1);
    }
  }

  const files = entries
    .map((entry): ArchitecturalFileHealth => {
      const path = normalizePath(entry.path);
      const incomingDependencies = incoming.get(path)?.size ?? 0;
      const outgoingDependencies = outgoing.get(path)?.size ?? 0;
      const changeEvents = eventCounts.get(path) ?? 0;
      const sizeRisk = Math.min(35, (entry.size / limits.largeFileBytes) * 35);
      const bottleneckRisk = Math.min(
        30,
        (incomingDependencies / limits.bottleneckDependents) * 30,
      );
      const changeRisk = Math.min(
        20,
        (changeEvents / limits.frequentChangeEvents) * 20,
      );
      const dependencyRisk = Math.min(15, outgoingDependencies * 1.5);
      const riskScore = Math.round(
        Math.min(100, sizeRisk + bottleneckRisk + changeRisk + dependencyRisk),
      );

      return {
        path,
        size: entry.size,
        incomingDependencies,
        outgoingDependencies,
        relationshipCount: relationshipCounts.get(path) ?? 0,
        changeEvents,
        riskScore,
        risk: riskForScore(riskScore),
      };
    })
    .sort((left, right) => right.riskScore - left.riskScore || left.path.localeCompare(right.path));

  const fileByPath = new Map(files.map((file) => [file.path, file]));
  const coupling: ArchitecturalCoupling[] = [];
  const paired = new Set<string>();

  for (const edge of edges) {
    const reverseCount = relationshipIndex.relationships.filter(
      (item) =>
        normalizePath(item.sourcePath) === edge.targetPath &&
        normalizePath(item.targetPath) === edge.sourcePath,
    ).length;
    if (!reverseCount) continue;
    const pair = [edge.sourcePath, edge.targetPath].sort();
    const key = pair.join("\0");
    if (paired.has(key)) continue;
    paired.add(key);
    const forwardCount = relationshipIndex.relationships.filter(
      (item) =>
        normalizePath(item.sourcePath) === edge.sourcePath &&
        normalizePath(item.targetPath) === edge.targetPath,
    ).length;
    const totalRelationships = forwardCount + reverseCount;
    coupling.push({
      leftPath: edge.sourcePath,
      rightPath: edge.targetPath,
      leftToRight: forwardCount,
      rightToLeft: reverseCount,
      totalRelationships,
      risk: riskForScore(Math.min(100, 35 + totalRelationships * 8)),
    });
  }

  coupling.sort(
    (left, right) =>
      right.totalRelationships - left.totalRelationships ||
      left.leftPath.localeCompare(right.leftPath),
  );

  const findings: ArchitecturalFinding[] = [];
  for (const file of files) {
    if (file.size >= limits.largeFileBytes) {
      findings.push({
        id: findingId("oversized-file", file.path),
        kind: "oversized-file",
        risk: file.risk,
        path: file.path,
        relatedPath: null,
        score: file.riskScore,
        title: "File has exceeded the maintainable size threshold",
        explanation: "Large files increase review cost, merge conflicts, drift, and the chance that unrelated systems break together.",
        evidence: [`${file.size.toLocaleString()} bytes`, `${file.relationshipCount} indexed relationships`],
      });
    }
    if (file.incomingDependencies >= limits.bottleneckDependents) {
      findings.push({
        id: findingId("dependency-bottleneck", file.path),
        kind: "dependency-bottleneck",
        risk: file.risk,
        path: file.path,
        relatedPath: null,
        score: file.riskScore,
        title: "File is a dependency bottleneck",
        explanation: "Many files depend directly on this file, so a breaking change can spread widely.",
        evidence: [`${file.incomingDependencies} direct dependent files`],
      });
    }
    if (file.changeEvents >= limits.frequentChangeEvents) {
      findings.push({
        id: findingId("high-change-file", file.path),
        kind: "high-change-file",
        risk: file.risk,
        path: file.path,
        relatedPath: null,
        score: file.riskScore,
        title: "File changes unusually often",
        explanation: "Frequent historical changes indicate an unstable boundary or an area accumulating responsibilities.",
        evidence: [`${file.changeEvents} recorded code events`],
      });
    }
    if (file.incomingDependencies >= limits.highBlastRadius) {
      findings.push({
        id: findingId("high-blast-radius", file.path),
        kind: "high-blast-radius",
        risk: "critical",
        path: file.path,
        relatedPath: null,
        score: Math.max(85, file.riskScore),
        title: "Changes have a high downstream blast radius",
        explanation: "This file sits upstream of enough direct consumers to require impact analysis before modification.",
        evidence: [`${file.incomingDependencies} direct consumers`],
      });
    }
  }

  for (const pair of coupling) {
    findings.push({
      id: findingId("tight-coupling", pair.leftPath, pair.rightPath),
      kind: "tight-coupling",
      risk: pair.risk,
      path: pair.leftPath,
      relatedPath: pair.rightPath,
      score: Math.min(100, 35 + pair.totalRelationships * 8),
      title: "Two files depend on each other",
      explanation: "Bidirectional dependencies make either file harder to change, test, or reuse independently.",
      evidence: [
        `${pair.leftToRight} relationships forward`,
        `${pair.rightToLeft} relationships backward`,
      ],
    });
  }

  findings.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const penalty = findings.reduce(
    (sum, finding) => sum + (finding.risk === "critical" ? 12 : finding.risk === "high" ? 7 : finding.risk === "moderate" ? 3 : 1),
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    healthScore: Math.max(0, 100 - Math.min(100, penalty)),
    indexedFiles: files.length,
    indexedRelationships: relationshipIndex.relationships.length,
    analyzedEvents: events.length,
    criticalCount: findings.filter((finding) => finding.risk === "critical").length,
    highCount: findings.filter((finding) => finding.risk === "high").length,
    files,
    coupling,
    findings,
  };
}
