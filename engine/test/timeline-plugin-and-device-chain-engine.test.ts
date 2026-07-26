import { describe, expect, it } from "vitest";
import { TimelinePluginAndDeviceChainEngine } from "../../lib/timeline/TimelinePluginAndDeviceChainEngine";

const clock = () => new Date("2026-07-25T12:00:00.000Z");
const create = (engine: TimelinePluginAndDeviceChainEngine) =>
  engine.createChain({ projectId: "project-1", ownerId: "track-1", name: "Lead Vocal", inputChannels: 2, outputChannels: 2, createdBy: "steve" });
const add = (engine: TimelinePluginAndDeviceChainEngine, chainId: string, expectedHead: number, name: string, overrides: Record<string, unknown> = {}) =>
  engine.addDevice({ chainId, expectedHead, pluginId: `plugin.${name}`, pluginVersion: "1.0.0", name, kind: "audio-effect", format: "vst3", inputChannels: 2, outputChannels: 2, latencySamples: 64, addedBy: "steve", ...overrides });

describe("TimelinePluginAndDeviceChainEngine", () => {
  it("builds, validates, activates, and measures ordered device chains", () => {
    const engine = new TimelinePluginAndDeviceChainEngine(clock);
    let chain = create(engine);
    chain = add(engine, chain.id, chain.head, "Compressor", { parameters: [{ id: "threshold", name: "Threshold", value: -12, minimum: -60, maximum: 0, unit: "dB" }] });
    chain = add(engine, chain.id, chain.head, "Limiter", { latencySamples: 128 });
    expect(engine.totalLatency(chain.id)).toBe(192);
    chain = engine.validate({ chainId: chain.id, expectedHead: chain.head, validatedBy: "steve" });
    expect(chain.status).toBe("validated");
    chain = engine.activate({ chainId: chain.id, expectedHead: chain.head, activatedBy: "steve" });
    expect(chain.status).toBe("active");
  });

  it("supports bypass, parameter edits, wet/dry, and safe reordering", () => {
    const engine = new TimelinePluginAndDeviceChainEngine(clock);
    let chain = create(engine);
    chain = add(engine, chain.id, chain.head, "EQ", { parameters: [{ id: "gain", name: "Gain", value: 0, minimum: -24, maximum: 24, unit: "dB" }] });
    chain = add(engine, chain.id, chain.head, "Delay");
    const eq = chain.devices[0];
    chain = engine.updateDevice({ chainId: chain.id, deviceId: eq.id, expectedHead: chain.head, bypassed: true, wet: 0.5, parameters: [{ id: "gain", value: 3 }], updatedBy: "steve" });
    expect(engine.totalLatency(chain.id)).toBe(64);
    chain = engine.moveDevice({ chainId: chain.id, deviceId: chain.devices[1].id, toIndex: 0, expectedHead: chain.head, movedBy: "steve" });
    expect(engine.processingOrder(chain.id)[1]).toBe(eq.id);
    expect(() => engine.updateDevice({ chainId: chain.id, deviceId: eq.id, expectedHead: chain.head, wet: 2, updatedBy: "steve" })).toThrow(/between 0 and 1/);
  });

  it("holds incomplete, unavailable, misplaced, and incompatible devices", () => {
    const engine = new TimelinePluginAndDeviceChainEngine(clock);
    let empty = create(engine);
    empty = engine.validate({ chainId: empty.id, expectedHead: empty.head, validatedBy: "steve" });
    expect(empty.status).toBe("held");
    expect(empty.issues[0].code).toBe("device-required");
    let chain = create(engine);
    chain = add(engine, chain.id, chain.head, "Unavailable", { available: false, outputChannels: 1 });
    chain = add(engine, chain.id, chain.head, "Synth", { kind: "instrument", inputChannels: 1, outputChannels: 1 });
    chain = engine.validate({ chainId: chain.id, expectedHead: chain.head, validatedBy: "steve" });
    expect(chain.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["plugin-unavailable", "channel-mismatch", "instrument-position"]));
  });

  it("creates and restores complete chain snapshots", () => {
    const engine = new TimelinePluginAndDeviceChainEngine(clock);
    let chain = create(engine);
    chain = add(engine, chain.id, chain.head, "Original");
    const snapshot = engine.createSnapshot({ chainId: chain.id, name: "Clean", createdBy: "steve" });
    chain = add(engine, chain.id, chain.head, "Temporary");
    chain = engine.restoreSnapshot({ chainId: chain.id, snapshotId: snapshot.id, expectedHead: chain.head, restoredBy: "steve" });
    expect(chain.devices.map((device) => device.name)).toEqual(["Original"]);
    expect(engine.listEvents(chain.id).some((event) => event.action === "snapshot-restored")).toBe(true);
  });

  it("restores stable chain, device, snapshot, and event identities", () => {
    const source = new TimelinePluginAndDeviceChainEngine(clock);
    let chain = create(source);
    chain = add(source, chain.id, chain.head, "EQ");
    source.createSnapshot({ chainId: chain.id, name: "Saved", createdBy: "steve" });
    const archive = source.exportArchive();
    const restored = new TimelinePluginAndDeviceChainEngine(clock);
    restored.restoreArchive(archive);
    expect(restored.getChain(chain.id)).toEqual(archive.chains[0]);
    expect(create(restored).id).not.toBe(chain.id);
    expect(() => restored.restoreArchive({ ...archive, chains: [...archive.chains, archive.chains[0]] })).toThrow(/duplicate/i);
  });
});
