import { describe, expect, it } from "vitest";
import { TimelineMixerAndRoutingEngine } from "../../lib/timeline/TimelineMixerAndRoutingEngine";

const clock = () => new Date("2026-07-25T12:00:00.000Z");
const create = (engine: TimelineMixerAndRoutingEngine) => engine.createMixer({
  projectId: "project-1", songId: "song-1", multiTrackSessionId: "session-1",
  audioGraphId: "graph-1", name: "Main Console", sampleRate: 48_000, createdBy: "steve",
});
function channels(engine: TimelineMixerAndRoutingEngine) {
  let mixer = create(engine);
  mixer = engine.addChannel({ mixerId: mixer.id, expectedHead: mixer.head, externalId: "track-1", name: "Guitar", kind: "track", latencySamples: 64, addedBy: "steve" });
  mixer = engine.addChannel({ mixerId: mixer.id, expectedHead: mixer.head, externalId: "bus-1", name: "Music", kind: "group", latencySamples: 128, addedBy: "steve" });
  mixer = engine.addChannel({ mixerId: mixer.id, expectedHead: mixer.head, externalId: "master-1", name: "Master", kind: "master", latencySamples: 32, addedBy: "steve" });
  return mixer;
}

describe("TimelineMixerAndRoutingEngine", () => {
  it("routes tracks through groups to master and calculates path latency", () => {
    const engine = new TimelineMixerAndRoutingEngine(clock);
    let mixer = channels(engine);
    mixer = engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[0].id, destinationChannelId: mixer.channels[1].id, addedBy: "steve" });
    mixer = engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[1].id, destinationChannelId: mixer.channels[2].id, addedBy: "steve" });
    mixer = engine.validate({ mixerId: mixer.id, expectedHead: mixer.head, validatedBy: "steve" });
    expect(mixer.status).toBe("validated");
    expect(mixer.totalLatencySamples).toBe(224);
    mixer = engine.activate({ mixerId: mixer.id, expectedHead: mixer.head, activatedBy: "steve" });
    expect(mixer.status).toBe("active");
  });

  it("supports sends and rejects duplicate routes, feedback, and channel mismatches", () => {
    const engine = new TimelineMixerAndRoutingEngine(clock);
    let mixer = channels(engine);
    mixer = engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[0].id, destinationChannelId: mixer.channels[1].id, kind: "send", preFader: true, gainDb: -12, addedBy: "steve" });
    expect(() => engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[0].id, destinationChannelId: mixer.channels[1].id, kind: "send", addedBy: "steve" })).toThrow(/Duplicate/);
    mixer = engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[1].id, destinationChannelId: mixer.channels[2].id, addedBy: "steve" });
    expect(() => engine.addRoute({ mixerId: mixer.id, expectedHead: mixer.head, sourceChannelId: mixer.channels[2].id, destinationChannelId: mixer.channels[0].id, addedBy: "steve" })).toThrow(/feedback cycle/);
  });

  it("applies deterministic mute and solo precedence", () => {
    const engine = new TimelineMixerAndRoutingEngine(clock);
    let mixer = channels(engine);
    mixer = engine.updateChannel({ mixerId: mixer.id, expectedHead: mixer.head, channelId: mixer.channels[1].id, soloed: true, updatedBy: "steve" });
    expect(engine.effectiveChannelState(mixer.id, mixer.channels[0].id).audible).toBe(false);
    expect(engine.effectiveChannelState(mixer.id, mixer.channels[1].id).audible).toBe(true);
    expect(engine.effectiveChannelState(mixer.id, mixer.channels[2].id).audible).toBe(true);
    mixer = engine.updateChannel({ mixerId: mixer.id, expectedHead: mixer.head, channelId: mixer.channels[1].id, muted: true, updatedBy: "steve" });
    expect(engine.effectiveChannelState(mixer.id, mixer.channels[1].id).audible).toBe(false);
  });

  it("records multichannel meter evidence and clipping", () => {
    const engine = new TimelineMixerAndRoutingEngine(clock);
    const mixer = channels(engine);
    const meter = engine.recordMeter({ mixerId: mixer.id, channelId: mixer.channels[0].id, peakDbfs: [-0.2, 0.1], rmsDbfs: [-14, -13], measuredAtSample: 48_000, recordedBy: "steve" });
    expect(meter.clipped).toBe(true);
    expect(engine.listMeters(mixer.id, mixer.channels[0].id)).toEqual([meter]);
    expect(() => engine.recordMeter({ mixerId: mixer.id, channelId: mixer.channels[0].id, peakDbfs: [-1], rmsDbfs: [-12], measuredAtSample: 0, recordedBy: "steve" })).toThrow(/channel count/);
  });

  it("holds incomplete routing and restores all stable identities", () => {
    const source = new TimelineMixerAndRoutingEngine(clock);
    let mixer = create(source);
    mixer = source.validate({ mixerId: mixer.id, expectedHead: mixer.head, validatedBy: "steve" });
    expect(mixer.status).toBe("held");
    expect(mixer.issues[0].code).toBe("master-required");
    const archive = source.exportArchive();
    const restored = new TimelineMixerAndRoutingEngine(clock);
    restored.restoreArchive(archive);
    const next = create(restored);
    expect(next.id).not.toBe(mixer.id);
    expect(restored.listEvents(mixer.id)).toEqual(archive.events);
    expect(() => restored.restoreArchive({ ...archive, mixers: [...archive.mixers, archive.mixers[0]] })).toThrow(/duplicate/i);
  });
});
