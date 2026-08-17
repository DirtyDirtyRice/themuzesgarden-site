import { describe, expect, it } from "vitest";
import { createTimelineDawTakeArrangementPlacement } from "../../lib/timeline/TimelineDawTakeArrangementPlacement";

describe("TimelineDawTakeArrangementPlacement", () => {
  it("restores a saved take as a complete arrangement source", () => {
    const placement = createTimelineDawTakeArrangementPlacement({
      name: "Lead vocal take 3",
      source: {
        id: "source-3",
        name: "lead-vocal-3.wav",
        uri: "supabase://timeline-daw-render-sources/owner/session/lead-vocal-3.wav",
        byteLength: 4096,
        checksum: "sha256:take-3",
      },
      audio: { sampleRate: 48_000, channelCount: 1, frameCount: 96_000, durationSeconds: 2 },
    });

    expect(placement.detail.source.id).toBe("source-3");
    expect(placement.detail.audio.durationSeconds).toBe(2);
    expect(placement.confirmation).toContain("Lead vocal take 3");
    expect(placement.confirmation).toContain("current play position");
  });
});
