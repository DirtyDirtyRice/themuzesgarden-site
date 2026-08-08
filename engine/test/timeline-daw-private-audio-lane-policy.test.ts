import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateAudioLane } from "../../lib/timeline/TimelineDawPrivateAudioLanePolicy";

const checksum = `sha256:${"a".repeat(64)}`;
const valid = {
  name: "  Lead   Comp  ",
  sourceId: "source-1",
  sourceUri: "supabase://timeline-daw-render-sources/owner-1/session-1/source.wav",
  sourceChecksum: checksum,
  sampleRate: 48_000,
  channelCount: 2,
  frameCount: 96_000,
  durationSeconds: 2,
  timelineStartSeconds: 4.25,
  compId: "comp-1",
  compRenderChecksum: checksum,
};

describe("TimelineDawPrivateAudioLanePolicy", () => {
  it("normalizes an owner-scoped lane with complete comp provenance", () => {
    expect(parseTimelineDawPrivateAudioLane(valid, "owner-1", "session-1")).toEqual({
      ...valid,
      name: "Lead Comp",
    });
  });

  it("rejects foreign sources, invalid geometry, positions, and partial provenance", () => {
    expect(() => parseTimelineDawPrivateAudioLane({ ...valid, sourceUri: valid.sourceUri.replace("owner-1", "other") }, "owner-1", "session-1")).toThrow(/belong/);
    expect(() => parseTimelineDawPrivateAudioLane({ ...valid, frameCount: 48_000 }, "owner-1", "session-1")).toThrow(/geometry/);
    expect(() => parseTimelineDawPrivateAudioLane({ ...valid, timelineStartSeconds: -1 }, "owner-1", "session-1")).toThrow(/position/);
    expect(() => parseTimelineDawPrivateAudioLane({ ...valid, compRenderChecksum: null }, "owner-1", "session-1")).toThrow(/provenance/);
  });
});
