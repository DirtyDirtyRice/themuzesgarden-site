import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_ENGINE_IDS, TimelineDawSystemIntegrationEngine } from "../../lib/timeline/TimelineDawSystemIntegrationEngine";
import { TIMELINE_ENGINE_CATALOG } from "../../lib/timeline/TimelineEngineRegistry";

describe("TimelineDawSystemIntegrationEngine", () => {
  it("reports all twelve DAW engines ready in dependency order", () => {
    const report = new TimelineDawSystemIntegrationEngine().report();
    expect(report).toMatchObject({ ready: true, completed: 12, required: 12 });
    expect(report.stages.map((stage) => stage.engineId)).toEqual([...TIMELINE_DAW_ENGINE_IDS]);
    expect(report.startupOrder).toHaveLength(12);
  });

  it("identifies an unhealthy engine and every directly blocked stage", () => {
    const healthy = TIMELINE_ENGINE_CATALOG.map((engine) => engine.id).filter((id) => id !== "mixer-routing");
    const report = new TimelineDawSystemIntegrationEngine().report(healthy);
    expect(report.ready).toBe(false);
    expect(report.stages.find((stage) => stage.engineId === "mixer-routing")?.ready).toBe(false);
    expect(report.stages.find((stage) => stage.engineId === "plugin-device-chain")?.blockingReasons).toContain("Required dependency mixer-routing is unhealthy.");
  });

  it("detects missing DAW registrations", () => {
    const catalog = TIMELINE_ENGINE_CATALOG.filter((engine) => engine.id !== "offline-render-export");
    const report = new TimelineDawSystemIntegrationEngine(catalog).report();
    expect(report.errors).toContain("DAW engine offline-render-export is not registered.");
  });
});
