import { describe, expect, it } from "vitest";
import { parseTimelineDawRenderCommand } from "../../lib/timeline/TimelineDawRenderApiPolicy";

const valid = {
  action: "prepare", sessionId: " session-1 ", expectedWorkspaceRevision: 4,
  name: " Main Mix ", target: "mix", sourceIds: [" master ", "master"],
  startSample: 0, endSample: 96_000, sampleRate: 48_000, bitDepth: 24,
  channels: 2, format: "wav",
};

describe("TimelineDawRenderApiPolicy", () => {
  it("normalizes a complete guarded render command", () => {
    expect(parseTimelineDawRenderCommand(valid)).toEqual({
      ...valid, sessionId: "session-1", name: "Main Mix", sourceIds: ["master"],
      normalizePeakDb: null, dither: false,
    });
  });
  it("strictly rejects unsupported fields and invalid output specifications", () => {
    expect(() => parseTimelineDawRenderCommand({ ...valid, actorId: "intruder" }))
      .toThrow(/unsupported field/i);
    expect(() => parseTimelineDawRenderCommand({ ...valid, endSample: 0 }))
      .toThrow(/after startSample/i);
    expect(() => parseTimelineDawRenderCommand({ ...valid, format: "mp3", bitDepth: 24 }))
      .toThrow(/MP3 requires 16-bit/i);
  });
  it("requires sources and optimistic workspace revision protection", () => {
    expect(() => parseTimelineDawRenderCommand({ ...valid, sourceIds: [] }))
      .toThrow(/1 to 256/i);
    expect(() => parseTimelineDawRenderCommand({ ...valid, expectedWorkspaceRevision: -1 }))
      .toThrow(/non-negative safe integer/i);
  });
});
