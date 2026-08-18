import { describe, expect, it } from "vitest";
import { buildTimelineDawMusicianTrackAutomationCopies, buildTimelineDawMusicianTrackProcessingCopies, buildTimelineDawMusicianTrackRepairCopies } from "../../lib/timeline/TimelineDawMusicianTrackProcessingCopy";

describe("musician track processing copies", () => {
  it("copies every send and insert to every repeated track", () => {
    let id = 0;
    const result = buildTimelineDawMusicianTrackProcessingCopies({
      ownerId: "owner", sessionId: "song", targetLaneIds: ["copy-a", "copy-b"], id: () => String(++id),
      sends: [{ destination_bus_id: "reverb", level: 0.4, pre_fader: false, muted: false }],
      inserts: [{ slot: 0, effect: "compressor", bypassed: false, parameters: { threshold: -12 }, latency_samples: 32, sidechain: null }],
    });
    expect(result.sends).toHaveLength(2);
    expect(result.inserts).toHaveLength(2);
    expect(result.sends.map((row) => row.source_id)).toEqual(["copy-a", "copy-b"]);
    expect(result.inserts[1]).toMatchObject({ source_id: "copy-b", effect: "compressor", parameters: { threshold: -12 }, latency_samples: 32 });
    expect(new Set([...result.sends, ...result.inserts].map((row) => row.id)).size).toBe(4);
  });

  it("copies volume and pan automation with new envelope and point ids", () => {
    let id = 0;
    const result = buildTimelineDawMusicianTrackAutomationCopies({
      ownerId: "owner", sessionId: "song", targetLaneIds: ["copy-a", "copy-b"], id: () => String(++id),
      envelopes: [
        { id: "gain-envelope", parameter: "gain", bypassed: false },
        { id: "pan-envelope", parameter: "pan", bypassed: true },
      ],
      points: [
        { envelope_id: "gain-envelope", sample_position: 0, value: 0.5, interpolation: "linear" },
        { envelope_id: "gain-envelope", sample_position: 48000, value: 1, interpolation: "hold" },
        { envelope_id: "pan-envelope", sample_position: 0, value: -0.25, interpolation: "linear" },
      ],
    });
    expect(result.envelopes).toHaveLength(4);
    expect(result.points).toHaveLength(6);
    expect(result.envelopes.map((row) => [row.source_id, row.parameter, row.bypassed])).toEqual([
      ["copy-a", "gain", false], ["copy-a", "pan", true], ["copy-b", "gain", false], ["copy-b", "pan", true],
    ]);
    expect(result.points.filter((row) => row.sample_position === 48000)).toHaveLength(2);
    expect(new Set([...result.envelopes, ...result.points].map((row) => row.id)).size).toBe(10);
    expect(result.points.every((point) => result.envelopes.some((envelope) => envelope.id === point.envelope_id))).toBe(true);
  });

  it("copies warp timing and audio repairs into independent track records", () => {
    const result = buildTimelineDawMusicianTrackRepairCopies({
      ownerId: "owner", sessionId: "song", targetLaneIds: ["copy-a", "copy-b"],
      warpMap: { markers: [{ sourceFrame: 100, destinationFrame: 120, protected: false }] },
      clipRepair: {
        bypassed: false,
        gain_points: [{ frame: 0, gainDb: -3 }],
        spectral_repairs: [{ id: "hum", startFrame: 0, endFrame: 100, lowHz: 50, highHz: 70, attenuationDb: -12, bypassed: false, provenance: "manual" }],
      },
      clipRepairChecksum: (state) => `checksum-${state.laneId}-${state.revision}`,
    });
    expect(result.warpMaps).toEqual([
      { owner_id: "owner", session_id: "song", lane_id: "copy-a", markers: [{ sourceFrame: 100, destinationFrame: 120, protected: false }], revision: 1 },
      { owner_id: "owner", session_id: "song", lane_id: "copy-b", markers: [{ sourceFrame: 100, destinationFrame: 120, protected: false }], revision: 1 },
    ]);
    expect(result.clipRepairs).toHaveLength(2);
    expect(result.clipRepairs[1]).toMatchObject({ lane_id: "copy-b", revision: 0, state_checksum: "checksum-copy-b-0", gain_points: [{ frame: 0, gainDb: -3 }] });
    expect(result.clipRepairs[0].id).not.toBe(result.clipRepairs[1].id);
  });

  it("allows tracks without processing and rejects missing targets", () => {
    expect(buildTimelineDawMusicianTrackProcessingCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: ["copy"], sends: [], inserts: [], id: () => "id" }))
      .toEqual({ sends: [], inserts: [] });
    expect(() => buildTimelineDawMusicianTrackProcessingCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: [], sends: [], inserts: [], id: () => "id" }))
      .toThrow(/targets are invalid/);
    expect(() => buildTimelineDawMusicianTrackAutomationCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: [], envelopes: [], points: [], id: () => "id" }))
      .toThrow(/targets are invalid/);
    expect(() => buildTimelineDawMusicianTrackRepairCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: [], clipRepairChecksum: () => "checksum" }))
      .toThrow(/targets are invalid/);
  });
});
