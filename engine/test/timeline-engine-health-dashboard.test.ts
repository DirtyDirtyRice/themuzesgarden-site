import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildTimelineEngineHealth } from "../../lib/developer-workspace/timelineEngineHealth";
import type { TimelineEngineDescriptor } from "../../lib/timeline/TimelineEngineRegistry";

function descriptor(id: string, dependencies: string[] = []): TimelineEngineDescriptor {
  return {
    id,
    name: id,
    module: `./${id}`,
    version: "1.0.0",
    domain: "core",
    capabilities: [id],
    dependencies,
    required: true,
  };
}

describe("timeline engine health dashboard", () => {
  it("verifies the complete repository catalog from real source files", () => {
    const dashboard = buildTimelineEngineHealth(
      process.cwd(),
      undefined,
      () => new Date("2026-07-25T12:00:00.000Z"),
    );
    expect(dashboard.report.ready).toBe(true);
    expect(dashboard.report.healthy).toBe(dashboard.report.registered);
    expect(dashboard.engines.at(-1)?.descriptor.id).toBe("activation-gate");
    expect(dashboard.domains.every((domain) => domain.ready)).toBe(true);
    expect(dashboard.dependencyLinks).toBeGreaterThan(dashboard.report.registered);
  });

  it("holds a missing source module out of readiness with actionable evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "timeline-engine-health-"));
    mkdirSync(join(root, "lib", "timeline"), { recursive: true });
    writeFileSync(join(root, "lib", "timeline", "present.ts"), "export {};\n");
    const dashboard = buildTimelineEngineHealth(root, [
      descriptor("present"),
      descriptor("missing", ["present"]),
    ]);
    expect(dashboard.report.ready).toBe(false);
    expect(dashboard.report.healthy).toBe(1);
    expect(dashboard.report.errors.join(" ")).toContain("missing");
    expect(
      dashboard.engines.find((engine) => engine.descriptor.id === "missing")?.message,
    ).toContain("Source module is missing");
  });
});
