import type { CodeRelationship, RelationshipIndex } from "./relationshipIndex";

export type ImpactRisk = "high" | "medium" | "low";

export type ImpactAnalysisQuery = {
  path: string;
  symbolName?: string;
  line?: number;
  maxDepth?: number;
  maxResults?: number;
};

export type ImpactPathStep = {
  fromPath: string;
  toPath: string;
  kind: CodeRelationship["kind"];
  symbolName: string;
  sourceLine: number;
  sourceColumn: number;
  targetLine: number;
};

export type ImpactedFile = {
  path: string;
  depth: number;
  risk: ImpactRisk;
  pathSteps: ImpactPathStep[];
};

export type ImpactAnalysisReport = {
  subject: { path: string; symbolName: string | null; line: number | null };
  analyzedAt: string;
  indexedFiles: number;
  indexedRelationships: number;
  directCount: number;
  totalCount: number;
  maxDepth: number;
  truncated: boolean;
  impacts: ImpactedFile[];
};

function normalized(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function riskForDepth(depth: number): ImpactRisk {
  if (depth === 1) return "high";
  if (depth === 2) return "medium";
  return "low";
}

function stepFor(relationship: CodeRelationship): ImpactPathStep {
  return {
    fromPath: relationship.targetPath,
    toPath: relationship.sourcePath,
    kind: relationship.kind,
    symbolName: relationship.symbolName,
    sourceLine: relationship.sourceLine,
    sourceColumn: relationship.sourceColumn,
    targetLine: relationship.targetLine,
  };
}

function uniqueEdges(relationships: CodeRelationship[]): CodeRelationship[] {
  const seen = new Set<string>();
  return relationships.filter((relationship) => {
    const key = [
      relationship.targetPath,
      relationship.sourcePath,
      relationship.kind,
      relationship.symbolName,
      relationship.sourceLine,
      relationship.sourceColumn,
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return relationship.targetPath !== relationship.sourcePath;
  });
}

export function analyzeDependencyImpact(
  index: RelationshipIndex,
  query: ImpactAnalysisQuery
): ImpactAnalysisReport {
  const subjectPath = normalized(query.path);
  const maxDepth = Math.min(12, Math.max(1, query.maxDepth ?? 6));
  const maxResults = Math.min(2_000, Math.max(1, query.maxResults ?? 500));
  const crossFile = uniqueEdges(index.relationships);
  const outgoing = new Map<string, CodeRelationship[]>();

  for (const relationship of crossFile) {
    const existing = outgoing.get(relationship.targetPath);
    if (existing) existing.push(relationship);
    else outgoing.set(relationship.targetPath, [relationship]);
  }

  let firstEdges = outgoing.get(subjectPath) ?? [];
  if (query.symbolName) {
    const exact = firstEdges.filter(
      (relationship) =>
        relationship.symbolName === query.symbolName &&
        (!query.line || relationship.targetLine === query.line)
    );
    firstEdges = exact.length
      ? exact
      : firstEdges.filter((relationship) => relationship.symbolName === query.symbolName);
  }

  const impacts = new Map<string, ImpactedFile>();
  let frontier = firstEdges.map((relationship) => ({
    filePath: relationship.sourcePath,
    steps: [stepFor(relationship)],
  }));
  let depth = 1;
  let truncated = false;

  while (frontier.length && depth <= maxDepth) {
    const nextFrontier: typeof frontier = [];
    for (const candidate of frontier) {
      if (candidate.filePath === subjectPath || impacts.has(candidate.filePath)) continue;
      if (impacts.size >= maxResults) {
        truncated = true;
        break;
      }

      impacts.set(candidate.filePath, {
        path: candidate.filePath,
        depth,
        risk: riskForDepth(depth),
        pathSteps: candidate.steps,
      });

      for (const relationship of outgoing.get(candidate.filePath) ?? []) {
        if (!impacts.has(relationship.sourcePath) && relationship.sourcePath !== subjectPath) {
          nextFrontier.push({
            filePath: relationship.sourcePath,
            steps: [...candidate.steps, stepFor(relationship)],
          });
        }
      }
    }
    if (truncated) break;
    frontier = nextFrontier;
    depth += 1;
  }

  if (frontier.length && depth > maxDepth) truncated = true;
  const ordered = [...impacts.values()].sort(
    (left, right) => left.depth - right.depth || left.path.localeCompare(right.path)
  );

  return {
    subject: {
      path: subjectPath,
      symbolName: query.symbolName ?? null,
      line: query.line ?? null,
    },
    analyzedAt: new Date().toISOString(),
    indexedFiles: index.fileCount,
    indexedRelationships: index.relationships.length,
    directCount: ordered.filter((impact) => impact.depth === 1).length,
    totalCount: ordered.length,
    maxDepth,
    truncated,
    impacts: ordered,
  };
}
