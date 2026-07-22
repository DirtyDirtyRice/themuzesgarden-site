import type {
  ArchitecturalFinding,
  ArchitecturalHealthReport,
  ArchitecturalRisk,
} from "./architecturalHealth";

export type ArchitecturalGateReasonCode =
  | "HEALTH_SCORE_DROP"
  | "NEW_CRITICAL_RISK"
  | "NEW_HIGH_RISK"
  | "RISK_SEVERITY_INCREASE"
  | "NEW_DEPENDENCY_CYCLE"
  | "BLAST_RADIUS_INCREASE";

export type ArchitecturalGateReason = {
  code: ArchitecturalGateReasonCode;
  risk: ArchitecturalRisk;
  path: string | null;
  relatedPath: string | null;
  message: string;
  previousValue: number | string | null;
  currentValue: number | string;
};

export type ArchitecturalRegressionPolicy = {
  maximumHealthScoreDrop: number;
  blockNewCriticalFindings: boolean;
  blockNewHighFindings: boolean;
  maximumBlastRadiusIncrease: number;
};

export type ArchitecturalRegressionGateResult = {
  passed: boolean;
  evaluatedAt: string;
  previousHealthScore: number;
  currentHealthScore: number;
  healthScoreDelta: number;
  introducedFindings: number;
  resolvedFindings: number;
  worsenedFindings: number;
  reasons: ArchitecturalGateReason[];
};

const DEFAULT_POLICY: ArchitecturalRegressionPolicy = {
  maximumHealthScoreDrop: 5,
  blockNewCriticalFindings: true,
  blockNewHighFindings: true,
  maximumBlastRadiusIncrease: 5,
};

const riskWeight: Record<ArchitecturalRisk, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

function reasonForNewFinding(
  finding: ArchitecturalFinding,
): ArchitecturalGateReason | null {
  if (finding.kind === "tight-coupling") {
    return {
      code: "NEW_DEPENDENCY_CYCLE",
      risk: finding.risk,
      path: finding.path,
      relatedPath: finding.relatedPath,
      message: `Patch introduced bidirectional coupling between ${finding.path} and ${finding.relatedPath ?? "another file"}.`,
      previousValue: null,
      currentValue: finding.score,
    };
  }
  if (finding.kind === "high-blast-radius") {
    return {
      code: "BLAST_RADIUS_INCREASE",
      risk: finding.risk,
      path: finding.path,
      relatedPath: null,
      message: `Patch introduced a high downstream blast radius in ${finding.path}.`,
      previousValue: null,
      currentValue: finding.score,
    };
  }
  if (finding.risk === "critical") {
    return {
      code: "NEW_CRITICAL_RISK",
      risk: "critical",
      path: finding.path,
      relatedPath: finding.relatedPath,
      message: `Patch introduced a critical architectural finding: ${finding.title}.`,
      previousValue: null,
      currentValue: finding.score,
    };
  }
  if (finding.risk === "high") {
    return {
      code: "NEW_HIGH_RISK",
      risk: "high",
      path: finding.path,
      relatedPath: finding.relatedPath,
      message: `Patch introduced a high architectural finding: ${finding.title}.`,
      previousValue: null,
      currentValue: finding.score,
    };
  }
  return null;
}

export function evaluateArchitecturalRegression(
  previous: ArchitecturalHealthReport,
  current: ArchitecturalHealthReport,
  policy: Partial<ArchitecturalRegressionPolicy> = {},
): ArchitecturalRegressionGateResult {
  const rules = { ...DEFAULT_POLICY, ...policy };
  const previousById = new Map(previous.findings.map((finding) => [finding.id, finding]));
  const currentById = new Map(current.findings.map((finding) => [finding.id, finding]));
  const introduced = current.findings.filter((finding) => !previousById.has(finding.id));
  const resolved = previous.findings.filter((finding) => !currentById.has(finding.id));
  const worsened = current.findings.filter((finding) => {
    const old = previousById.get(finding.id);
    return Boolean(old) && (
      riskWeight[finding.risk] > riskWeight[old!.risk] ||
      (finding.risk === old!.risk && finding.score - old!.score >= 10)
    );
  });
  const reasons: ArchitecturalGateReason[] = [];
  const healthScoreDelta = current.healthScore - previous.healthScore;

  if (healthScoreDelta < -rules.maximumHealthScoreDrop) {
    reasons.push({
      code: "HEALTH_SCORE_DROP",
      risk: healthScoreDelta <= -15 ? "critical" : "high",
      path: null,
      relatedPath: null,
      message: `Architectural health dropped ${Math.abs(healthScoreDelta)} points, exceeding the ${rules.maximumHealthScoreDrop}-point limit.`,
      previousValue: previous.healthScore,
      currentValue: current.healthScore,
    });
  }

  for (const finding of introduced) {
    const reason = reasonForNewFinding(finding);
    if (!reason) continue;
    if (reason.code === "NEW_CRITICAL_RISK" && !rules.blockNewCriticalFindings) continue;
    if (reason.code === "NEW_HIGH_RISK" && !rules.blockNewHighFindings) continue;
    reasons.push(reason);
  }

  for (const finding of worsened) {
    const old = previousById.get(finding.id)!;
    if (
      finding.kind === "high-blast-radius" &&
      finding.score - old.score <= rules.maximumBlastRadiusIncrease
    ) {
      continue;
    }
    reasons.push({
      code: finding.kind === "high-blast-radius"
        ? "BLAST_RADIUS_INCREASE"
        : "RISK_SEVERITY_INCREASE",
      risk: finding.risk,
      path: finding.path,
      relatedPath: finding.relatedPath,
      message: `${finding.title} worsened from ${old.risk} (${old.score}) to ${finding.risk} (${finding.score}).`,
      previousValue: `${old.risk}:${old.score}`,
      currentValue: `${finding.risk}:${finding.score}`,
    });
  }

  const uniqueReasons = [...new Map(
    reasons.map((reason) => [
      [reason.code, reason.path, reason.relatedPath, reason.message].join(":"),
      reason,
    ]),
  ).values()];

  return {
    passed: uniqueReasons.length === 0,
    evaluatedAt: new Date().toISOString(),
    previousHealthScore: previous.healthScore,
    currentHealthScore: current.healthScore,
    healthScoreDelta,
    introducedFindings: introduced.length,
    resolvedFindings: resolved.length,
    worsenedFindings: worsened.length,
    reasons: uniqueReasons,
  };
}
