import { describe, expect, it } from "vitest";

import type { BuildDiagnostic } from "../../lib/developer-workspace/buildDiagnostics";
import { triageBuildDiagnostics } from "../../lib/developer-workspace/diagnosticTriage";

function diagnostic(id: string, code: string, primary: boolean, cascadeOf: string | null): BuildDiagnostic {
  return { id, file: "lib/timeline/TimelineSeed.ts", line: id === "syntax" ? 4523 : 4550, column: 1, code, severity: "error", message: code === "TS1005" ? "'}' expected." : "Cannot find name 'TimelineRuntime'.", primary, cascadeOf };
}

describe("diagnostic root-cause triage", () => {
  it("orders parsing roots before missing symbols and attaches cascades", () => {
    const report = triageBuildDiagnostics([
      diagnostic("missing", "TS2304", true, null),
      diagnostic("cascade", "TS1005", false, "syntax"),
      diagnostic("syntax", "TS1005", true, null),
    ]);

    expect(report.clusters.map((cluster) => cluster.category)).toEqual(["syntax", "missing-symbol"]);
    expect(report.clusters[0].related.map((item) => item.id)).toEqual(["cascade"]);
    expect(report.primaryDiagnostics).toBe(2);
    expect(report.cascadeDiagnostics).toBe(1);
  });
});
