import { describe, expect, it } from "vitest";
import { buildTimelineDawMusicianTrackProcessingCopies } from "../../lib/timeline/TimelineDawMusicianTrackProcessingCopy";

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

  it("allows tracks without processing and rejects missing targets", () => {
    expect(buildTimelineDawMusicianTrackProcessingCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: ["copy"], sends: [], inserts: [], id: () => "id" }))
      .toEqual({ sends: [], inserts: [] });
    expect(() => buildTimelineDawMusicianTrackProcessingCopies({ ownerId: "owner", sessionId: "song", targetLaneIds: [], sends: [], inserts: [], id: () => "id" }))
      .toThrow(/targets are invalid/);
  });
});
