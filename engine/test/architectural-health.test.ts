import { describe, expect, it } from "vitest";

import { analyzeArchitecturalHealth } from "../../lib/developer-workspace/architecturalHealth";
import type { CodeEvent } from "../../lib/developer-workspace/codeEventLedger";
import type { ProjectIndex } from "../../lib/developer-workspace/projectIndex";
import type { RelationshipIndex } from "../../lib/developer-workspace/relationshipIndex";

function projectIndex(): ProjectIndex {
  return {
    root: "C:/project",
    generatedAt: "2026-07-21T00:00:00.000Z",
    truncated: false,
    stats: {
      directoryCount: 1,
      fileCount: 4,
      totalBytes: 145_000,
      extensions: { ".ts": 4 },
    },
    entries: [
      {
        kind: "directory",
        name: "lib",
        path: "lib",
        extension: null,
        size: 0,
        modifiedAt: "2026-07-21T00:00:00.000Z",
        children: [
          { kind: "file", name: "core.ts", path: "lib/core.ts", extension: ".ts", size: 120_000, modifiedAt: "2026-07-21T00:00:00.000Z" },
          { kind: "file", name: "consumer-a.ts", path: "lib/consumer-a.ts", extension: ".ts", size: 10_000, modifiedAt: "2026-07-21T00:00:00.000Z" },
          { kind: "file", name: "consumer-b.ts", path: "lib/consumer-b.ts", extension: ".ts", size: 10_000, modifiedAt: "2026-07-21T00:00:00.000Z" },
          { kind: "file", name: "healthy.ts", path: "lib/healthy.ts", extension: ".ts", size: 5_000, modifiedAt: "2026-07-21T00:00:00.000Z" },
        ],
      },
    ],
  };
}

function relationshipIndex(): RelationshipIndex {
  const relationships = [
    ["lib/consumer-a.ts", "lib/core.ts", "Core"],
    ["lib/consumer-b.ts", "lib/core.ts", "Core"],
    ["lib/core.ts", "lib/consumer-a.ts", "ConsumerA"],
  ].map(([sourcePath, targetPath, symbolName], index) => ({
    key: `relationship-${index}`,
    kind: "reference" as const,
    symbolName,
    sourcePath,
    sourceLine: index + 1,
    sourceColumn: 1,
    targetPath,
    targetLine: 1,
  }));

  return {
    root: "C:/project",
    generatedAt: "2026-07-21T00:00:00.000Z",
    fileCount: 4,
    relationships,
  };
}

function event(path: string, index: number): CodeEvent {
  return {
    id: `event-${index}`,
    kind: "symbol-changed",
    occurredAt: new Date(2026, 6, 21, 0, index).toISOString(),
    symbolKey: `symbol-${index}`,
    symbolName: "Core",
    symbolKind: "class",
    path,
    line: 1,
    previousPath: null,
    previousLine: null,
    details: "Test change",
  };
}

describe("Architectural Health Engine", () => {
  it("ranks oversized, frequently changed dependency bottlenecks", () => {
    const events = Array.from({ length: 5 }, (_, index) =>
      event("lib/core.ts", index),
    );
    const report = analyzeArchitecturalHealth(
      projectIndex(),
      relationshipIndex(),
      events,
      {
        largeFileBytes: 100_000,
        bottleneckDependents: 2,
        frequentChangeEvents: 5,
        highBlastRadius: 2,
      },
    );

    const core = report.files.find((file) => file.path === "lib/core.ts");
    expect(core).toMatchObject({
      incomingDependencies: 2,
      changeEvents: 5,
    });
    expect(core?.riskScore).toBeGreaterThanOrEqual(85);
    expect(report.findings.map((finding) => finding.kind)).toEqual(
      expect.arrayContaining([
        "oversized-file",
        "dependency-bottleneck",
        "high-change-file",
        "high-blast-radius",
      ]),
    );
  });

  it("detects bidirectional coupling without inflating healthy files", () => {
    const report = analyzeArchitecturalHealth(
      projectIndex(),
      relationshipIndex(),
      [],
      { bottleneckDependents: 10, highBlastRadius: 25 },
    );

    expect(report.coupling).toHaveLength(1);
    expect(report.coupling[0]).toMatchObject({
      leftPath: "lib/consumer-a.ts",
      rightPath: "lib/core.ts",
      leftToRight: 1,
      rightToLeft: 1,
    });
    expect(
      report.findings.some((finding) => finding.kind === "tight-coupling"),
    ).toBe(true);
    expect(
      report.files.find((file) => file.path === "lib/healthy.ts")?.risk,
    ).toBe("low");
  });
});
