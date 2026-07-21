import { describe, expect, it } from "vitest";

import {
  compareArchitecturalHealth,
  type ArchitecturalHealthSnapshot,
} from "../../lib/developer-workspace/architecturalHealthHistory";

function snapshot(
  healthScore: number,
  findings: ArchitecturalHealthSnapshot["findings"],
): ArchitecturalHealthSnapshot {
  return {
    recordedAt: "2026-07-21T00:00:00.000Z",
    healthScore,
    indexedFiles: 10,
    indexedRelationships: 20,
    criticalCount: findings.filter((finding) => finding.risk === "critical").length,
    highCount: findings.filter((finding) => finding.risk === "high").length,
    findings,
  };
}

function finding(
  id: string,
  risk: "critical" | "high" | "moderate" | "low",
  score: number,
): ArchitecturalHealthSnapshot["findings"][number] {
  return {
    id,
    kind: "dependency-bottleneck",
    risk,
    path: `lib/${id}.ts`,
    relatedPath: null,
    score,
    title: id,
  };
}

describe("Architectural Health history comparison", () => {
  it("classifies introduced and worsened risks as a regression", () => {
    const previous = snapshot(82, [finding("core", "moderate", 45)]);
    const current = snapshot(67, [
      finding("core", "critical", 91),
      finding("new-bottleneck", "high", 70),
    ]);

    const comparison = compareArchitecturalHealth(current, previous);

    expect(comparison.trend).toBe("regressed");
    expect(comparison.scoreDelta).toBe(-15);
    expect(comparison.worsened.map((item) => item.id)).toEqual(["core"]);
    expect(comparison.introduced.map((item) => item.id)).toEqual([
      "new-bottleneck",
    ]);
  });

  it("classifies resolved and lower-risk findings as an improvement", () => {
    const previous = snapshot(55, [
      finding("core", "critical", 94),
      finding("old-cycle", "high", 72),
    ]);
    const current = snapshot(78, [finding("core", "moderate", 42)]);

    const comparison = compareArchitecturalHealth(current, previous);

    expect(comparison.trend).toBe("improved");
    expect(comparison.scoreDelta).toBe(23);
    expect(comparison.improved.map((item) => item.id)).toEqual(["core"]);
    expect(comparison.resolved.map((item) => item.id)).toEqual(["old-cycle"]);
  });
});
