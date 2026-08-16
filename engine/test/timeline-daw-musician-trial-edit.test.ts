import { describe, expect, it } from "vitest";
import { parseTimelineDawMusicianTrialTrim } from "../../lib/timeline/TimelineDawMusicianTrialEdit";

describe("musician trial editing", () => {
  it("converts a bounded trim to exact PCM frames", () => expect(parseTimelineDawMusicianTrialTrim({ startSeconds: 1, endSeconds: 2.5, durationSeconds: 4, sampleRate: 48_000 })).toEqual({ startFrame: 48_000, endFrame: 120_000, startSeconds: 1, endSeconds: 2.5 }));
  it("rejects an empty edit", () => expect(() => parseTimelineDawMusicianTrialTrim({ startSeconds: 2, endSeconds: 2, durationSeconds: 4, sampleRate: 48_000 })).toThrow(/0.05 seconds/i));
});
