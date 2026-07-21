import { describe, expect, it } from "vitest";

import { analyzeDependencyImpact } from "../../lib/developer-workspace/impactAnalysis";
import type { CodeRelationship, RelationshipIndex } from "../../lib/developer-workspace/relationshipIndex";

function relationship(
  key: string,
  targetPath: string,
  sourcePath: string,
  symbolName: string,
  targetLine: number
): CodeRelationship {
  return {
    key,
    kind: "reference",
    symbolName,
    sourcePath,
    sourceLine: 5,
    sourceColumn: 3,
    targetPath,
    targetLine,
  };
}

function index(relationships: CodeRelationship[]): RelationshipIndex {
  return {
    root: "C:/project",
    generatedAt: "2026-07-19T00:00:00.000Z",
    fileCount: 5,
    relationships,
  };
}

describe("developer workspace dependency impact", () => {
  const relationships = [
    relationship("foo-b", "src/a.ts", "src/b.ts", "Foo", 10),
    relationship("other-x", "src/a.ts", "src/x.ts", "Other", 20),
    relationship("bar-c", "src/b.ts", "src/c.ts", "Bar", 8),
    relationship("baz-d", "src/c.ts", "src/d.ts", "Baz", 4),
    relationship("cycle-a", "src/d.ts", "src/a.ts", "Cycle", 2),
  ];

  it("follows a selected symbol through downstream files without entering cycles", () => {
    const report = analyzeDependencyImpact(index(relationships), {
      path: "src/a.ts",
      symbolName: "Foo",
      line: 10,
    });

    expect(report.impacts.map(({ path, depth }) => [path, depth])).toEqual([
      ["src/b.ts", 1],
      ["src/c.ts", 2],
      ["src/d.ts", 3],
    ]);
    expect(report.directCount).toBe(1);
    expect(report.impacts[2].pathSteps.map((step) => step.symbolName)).toEqual([
      "Foo",
      "Bar",
      "Baz",
    ]);
    expect(report.truncated).toBe(false);
  });

  it("reports when the requested depth leaves downstream impact unexplored", () => {
    const report = analyzeDependencyImpact(index(relationships), {
      path: "src/a.ts",
      symbolName: "Foo",
      line: 10,
      maxDepth: 2,
    });

    expect(report.impacts.map((impact) => impact.path)).toEqual(["src/b.ts", "src/c.ts"]);
    expect(report.truncated).toBe(true);
  });
});
