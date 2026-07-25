import { describe, expect, it } from "vitest";
import { TimelinePluginProcessingHostEngine, type TimelinePluginManifest } from "../../lib/timeline/TimelinePluginProcessingHostEngine";

const manifest: TimelinePluginManifest = {
  pluginId: "garden.vendor.compressor", name: "Studio Compressor", vendor: "Garden Vendor",
  version: "1.0.0", format: "vst3", binaryFingerprint: "sha256-binary",
  supportedPlatforms: ["windows"], architectures: ["x64"], sampleRates: [48_000],
  minChannels: 1, maxChannels: 2, latencySamples: 64, memoryMb: 128, permissions: ["audio"],
};

function setup() {
  const engine = new TimelinePluginProcessingHostEngine();
  const plugin = engine.registerPlugin({ manifest, observedBinaryFingerprint: "sha256-binary", allowedPermissions: ["audio"], registeredBy: "installer-1" });
  engine.reviewPlugin({ hostedPluginId: plugin.id, decision: "trust", reviewedBy: "reviewer-1" });
  const chain = engine.createChain({ projectId: "song-1", targetId: "vocal-1", sampleRate: 48_000, channels: 2, platform: "windows", architecture: "x64", maxLatencySamples: 512, maxMemoryMb: 512, createdBy: "producer-1" });
  return { engine, plugin, chain };
}

describe("TimelinePluginProcessingHostEngine", () => {
  it("holds fingerprint and permission violations from trust", () => {
    const engine = new TimelinePluginProcessingHostEngine();
    const plugin = engine.registerPlugin({ manifest: { ...manifest, permissions: ["audio", "network"] }, observedBinaryFingerprint: "wrong", allowedPermissions: ["audio"], registeredBy: "installer-1" });
    expect(plugin.issues.join(" ")).toContain("fingerprint");
    expect(plugin.issues.join(" ")).toContain("network");
    expect(() => engine.reviewPlugin({ hostedPluginId: plugin.id, decision: "trust", reviewedBy: "reviewer-1" })).toThrow("security");
  });

  it("requires independent trust and rejects duplicate versions", () => {
    const engine = new TimelinePluginProcessingHostEngine();
    const plugin = engine.registerPlugin({ manifest, observedBinaryFingerprint: manifest.binaryFingerprint, allowedPermissions: ["audio"], registeredBy: "installer-1" });
    expect(() => engine.reviewPlugin({ hostedPluginId: plugin.id, decision: "trust", reviewedBy: "installer-1" })).toThrow("independent");
    expect(() => engine.registerPlugin({ manifest, observedBinaryFingerprint: manifest.binaryFingerprint, allowedPermissions: ["audio"], registeredBy: "installer-2" })).toThrow("already registered");
  });

  it("validates compatibility and resource budgets before activation", () => {
    const { engine, plugin, chain } = setup();
    const added = engine.addPlugin({ chainId: chain.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "state-1", addedBy: "producer-1" });
    expect(engine.validateChain({ chainId: added.id, validatedBy: "worker-1" }).status).toBe("ready");
    expect(engine.activateChain({ chainId: chain.id, activatedBy: "producer-1" }).status).toBe("active");
    const limited = engine.createChain({ projectId: "song-1", targetId: "guitar-1", sampleRate: 48_000, channels: 2, platform: "windows", architecture: "x64", maxLatencySamples: 32, maxMemoryMb: 64, createdBy: "producer-1" });
    engine.addPlugin({ chainId: limited.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "state-2", addedBy: "producer-1" });
    expect(engine.validateChain({ chainId: limited.id, validatedBy: "worker-1" }).issues.join(" ")).toContain("exceeds");
  });

  it("uses optimistic heads and non-destructive chain replacement", () => {
    const { engine, plugin, chain } = setup();
    engine.addPlugin({ chainId: chain.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "state", addedBy: "producer-1" });
    expect(() => engine.addPlugin({ chainId: chain.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "stale", addedBy: "producer-2" })).toThrow("Stale");
  });

  it("quarantines a crashing plugin and recovers with it bypassed", () => {
    const { engine, plugin, chain } = setup();
    const added = engine.addPlugin({ chainId: chain.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "state", addedBy: "producer-1" });
    engine.validateChain({ chainId: chain.id, validatedBy: "worker-1" });
    engine.activateChain({ chainId: chain.id, activatedBy: "producer-1" });
    const failed = engine.reportCrash({ chainId: chain.id, instanceId: added.instances[0].id, reason: "access violation", reportedBy: "host-1" });
    expect(failed.instances[0].bypassed).toBe(true);
    expect(engine.getPlugin(plugin.id)?.trust).toBe("quarantined");
    expect(engine.recoverChain({ chainId: chain.id, recoveredBy: "producer-1" }).status).toBe("draft");
  });

  it("restores stable plugin, chain, instance, and event identities", () => {
    const { engine, plugin, chain } = setup();
    engine.addPlugin({ chainId: chain.id, expectedHead: 0, hostedPluginId: plugin.id, stateFingerprint: "state", addedBy: "producer-1" });
    const restored = new TimelinePluginProcessingHostEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getChain(chain.id)?.instances[0].id).toBe("timeline-plugin-instance-1");
    const next = restored.createChain({ projectId: "song-2", targetId: "master", sampleRate: 48_000, channels: 2, platform: "windows", architecture: "x64", maxLatencySamples: 100, maxMemoryMb: 100, createdBy: "producer-1" });
    expect(next.id).toBe("timeline-processing-chain-2");
  });
});
