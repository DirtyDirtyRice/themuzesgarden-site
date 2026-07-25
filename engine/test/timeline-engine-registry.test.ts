import { describe, expect, it } from "vitest";
import { TIMELINE_ENGINE_CATALOG, TimelineEngineRegistry, type TimelineEngineDescriptor } from "../../lib/timeline/TimelineEngineRegistry";

function item(id: string, dependencies: string[] = [], required = true): TimelineEngineDescriptor {
  return { id, name: id, module: `./${id}`, version: "1.0.0", domain: "core", capabilities: [id], dependencies, required };
}

describe("TimelineEngineRegistry", () => {
  it("catalogs the completed engine system with a valid activation graph", () => {
    const registry = new TimelineEngineRegistry();
    expect(TIMELINE_ENGINE_CATALOG.length).toBeGreaterThanOrEqual(56);
    expect(registry.startupOrder().at(-1)).toBe("activation-ledger");
    expect(registry.impact("validation")).toContain("production-coordinator");
  });

  it("rejects duplicate identities, self-dependencies, and invalid versions", () => {
    expect(() => new TimelineEngineRegistry([item("same"), item("same")])).toThrow("Duplicate");
    expect(() => new TimelineEngineRegistry([item("self", ["self"])])).toThrow("itself");
    expect(() => new TimelineEngineRegistry([{ ...item("bad"), version: "latest" }])).toThrow("semantic");
  });

  it("reports missing dependencies and dependency cycles", () => {
    const missing = new TimelineEngineRegistry([item("a", ["missing"])]);
    missing.probeAll(() => ({ healthy: true, message: "ok" }));
    expect(missing.readiness().errors.join(" ")).toContain("missing");
    const cycle = new TimelineEngineRegistry([item("a", ["b"]), item("b", ["a"])]);
    expect(() => cycle.startupOrder()).toThrow("cycle");
  });

  it("requires a matching healthy probe for every required engine", () => {
    const registry = new TimelineEngineRegistry([item("core"), item("optional", [], false)]);
    expect(registry.readiness().ready).toBe(false);
    registry.recordProbe({ engineId: "core", healthy: true, checkedAt: "2026-07-25T12:00:00.000Z", version: "1.0.0", message: "green" });
    expect(registry.readiness().ready).toBe(true);
    expect(() => registry.recordProbe({ engineId: "core", healthy: true, checkedAt: "2026-07-25T12:00:00.000Z", version: "2.0.0", message: "wrong" })).toThrow("version");
  });

  it("builds a complete readiness report after system-wide probes", () => {
    const registry = new TimelineEngineRegistry();
    registry.probeAll(() => ({ healthy: true, message: "focused tests green" }));
    const report = registry.readiness();
    expect(report.ready).toBe(true);
    expect(report.healthy).toBe(report.registered);
    expect(report.startupOrder.indexOf("audio-artifacts")).toBeLessThan(report.startupOrder.indexOf("mastering"));
  });

  it("restores registry evidence without losing dependency behavior", () => {
    const source = new TimelineEngineRegistry([item("a"), item("b", ["a"])]);
    source.probeAll(() => ({ healthy: true, message: "ok" }));
    const restored = new TimelineEngineRegistry([]);
    restored.restoreArchive(source.exportArchive());
    expect(restored.readiness().ready).toBe(true);
    expect(restored.startupOrder()).toEqual(["a", "b"]);
  });
});
