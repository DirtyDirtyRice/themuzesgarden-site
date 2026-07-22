import { describe, expect, it } from "vitest";

import type {
  ArchitecturalFinding,
  ArchitecturalHealthReport,
} from "../../lib/developer-workspace/architecturalHealth";
import { evaluateArchitecturalRegression } from "../../lib/developer-workspace/architecturalRegressionGate";

function finding(
  id: string,
  risk: ArchitecturalFinding["risk"],
  score: number,
  kind: ArchitecturalFinding["kind"] = "dependency-bottleneck",
): ArchitecturalFinding {
  return {
    id,
    kind,
    risk,
    path: `lib/${id}.ts`,
    relatedPath: kind === "tight-coupling" ? "lib/other.ts" : null,
    score,
    title: id,
    explanation: id,
    evidence: [id],
  };
}

function report(
  healthScore: number,
  findings: ArchitecturalFinding[],
): ArchitecturalHealthReport {
  return {
    generatedAt: "2026-07-21T00:00:00.000Z",
    healthScore,
    indexedFiles: 10,
    indexedRelationships: 20,
    analyzedEvents: 0,
    criticalCount: findings.filter((item) => item.risk === "critical").length,
    highCount: findings.filter((item) => item.risk === "high").length,
    files: [],
    coupling: [],
    findings,
  };
}

describe("Architectural Regression Gate", () => {
  it("blocks compiling changes that introduce material architecture risks", () => {
    const before = report(88, [finding("core", "moderate", 40)]);
    const after = report(69, [
      finding("core", "critical", 91),
      finding("cycle", "high", 72, "tight-coupling"),
    ]);

    const result = evaluateArchitecturalRegression(before, after);

    expect(result.passed).toBe(false);
    expect(result.healthScoreDelta).toBe(-19);
    expect(result.reasons.map((reason) => reason.code)).toEqual(
      expect.arrayContaining([
        "HEALTH_SCORE_DROP",
        "RISK_SEVERITY_INCREASE",
        "NEW_DEPENDENCY_CYCLE",
      ]),
    );
  });

  it("allows neutral or improving architectural changes", () => {
    const before = report(72, [
      finding("core", "high", 70),
      finding("old-risk", "moderate", 40),
    ]);
    const after = report(84, [finding("core", "moderate", 48)]);

    const result = evaluateArchitecturalRegression(before, after);

    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.resolvedFindings).toBe(1);
    expect(result.healthScoreDelta).toBe(12);
  });
});
