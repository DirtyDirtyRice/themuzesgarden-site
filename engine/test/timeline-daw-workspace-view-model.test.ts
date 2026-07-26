import { describe, expect, it } from "vitest";
import { TimelineDawSystemIntegrationEngine } from "../../lib/timeline/TimelineDawSystemIntegrationEngine";
import { TIMELINE_ENGINE_CATALOG } from "../../lib/timeline/TimelineEngineRegistry";
import { createTimelineDawWorkspaceAreas } from "../../lib/timeline/TimelineDawWorkspaceViewModel";

describe("TimelineDawWorkspaceViewModel", () => {
  it("places every DAW engine into one visible workspace area", () => {
    const report = new TimelineDawSystemIntegrationEngine().report();
    const areas = createTimelineDawWorkspaceAreas(report.stages);
    const engineIds = areas.flatMap((area) => area.engineIds);
    expect(areas.map((area) => area.id)).toEqual([
      "arrange",
      "midi",
      "mix",
      "automation",
      "export",
      "recovery",
    ]);
    expect(engineIds).toHaveLength(12);
    expect(new Set(engineIds).size).toBe(12);
    expect(areas.every((area) => area.ready)).toBe(true);
  });

  it("shows direct workspace areas held by an unhealthy engine", () => {
    const engine = new TimelineDawSystemIntegrationEngine();
    const healthy = TIMELINE_ENGINE_CATALOG
      .map((descriptor) => descriptor.id)
      .filter((engineId) => engineId !== "mixer-routing");
    const report = engine.report(healthy);
    const areas = createTimelineDawWorkspaceAreas(report.stages);
    expect(areas.find((area) => area.id === "mix")).toMatchObject({
      ready: false,
      completed: 0,
      required: 2,
    });
    expect(areas.find((area) => area.id === "export")?.ready).toBe(false);
    expect(areas.find((area) => area.id === "recovery")?.ready).toBe(true);
  });
});
