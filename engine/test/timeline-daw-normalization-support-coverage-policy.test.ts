import { describe, expect, it } from "vitest";
import {
  assertTimelineDawNormalizationCoveragePlan,
  createTimelineDawNormalizationCoverageEvidence,
  createTimelineDawNormalizationCoveragePlan,
  parseTimelineDawNormalizationCoverageEvidence,
  timelineDawNormalizationEvidenceCoverage,
  type CoverageSubject,
} from "../../lib/timeline/TimelineDawNormalizationSupportCoveragePolicy";

const subjects: CoverageSubject[] = [
  { type: "export", id: "export-1", checksum: "sha256:one", createdAt: "2026-08-13T00:00:00Z" },
  { type: "revocation", id: "revoke-1", checksum: "sha256:two", createdAt: "2026-08-13T01:00:00Z" },
];

describe("normalization support chain coverage", () => {
  it("measures coverage by event type and reports the percent", () => {
    const coverage = timelineDawNormalizationEvidenceCoverage(subjects, [{ eventType: "export", subjectId: "export-1" }]);
    expect(coverage.covered).toEqual({ export: 1, revocation: 0 });
    expect(coverage.unchained.map((subject) => subject.id)).toEqual(["revoke-1"]);
    expect(coverage.percent).toBe(50);
    expect(coverage.complete).toBe(false);
  });

  it("sorts plans deterministically", () => {
    const plan = createTimelineDawNormalizationCoveragePlan({ headHash: "sha256:head", subjects: [...subjects].reverse() });
    expect(plan.subjects.map((subject) => subject.id)).toEqual(["export-1", "revoke-1"]);
    expect(plan.planChecksum).toMatch(/^sha256:/);
  });

  it("rejects stale, tampered, and non-authoritative plans", () => {
    const current = createTimelineDawNormalizationCoveragePlan({ headHash: "sha256:head", subjects });
    const stale = createTimelineDawNormalizationCoveragePlan({ headHash: "sha256:old", subjects });
    const incomplete = createTimelineDawNormalizationCoveragePlan({ headHash: "sha256:head", subjects: subjects.slice(0, 1) });
    expect(() => assertTimelineDawNormalizationCoveragePlan(current, current)).not.toThrow();
    expect(() => assertTimelineDawNormalizationCoveragePlan(stale, current)).toThrow(/stale/);
    expect(() => assertTimelineDawNormalizationCoveragePlan(incomplete, current)).toThrow(/authoritative ledger/);
    expect(() => assertTimelineDawNormalizationCoveragePlan({ ...current, subjects: [] }, current)).toThrow(/checksum/);
  });

  it("validates portable evidence and rejects changed evidence", () => {
    const evidence = createTimelineDawNormalizationCoverageEvidence({ complete: true });
    expect(parseTimelineDawNormalizationCoverageEvidence(evidence).checksum).toBe(evidence.checksum);
    expect(() => parseTimelineDawNormalizationCoverageEvidence({ ...evidence, complete: false })).toThrow(/checksum/);
  });
});