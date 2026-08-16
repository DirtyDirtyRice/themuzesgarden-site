import { describe, expect, it } from "vitest";
import { completeTimelineDawMusicianTrialStep, parseTimelineDawMusicianTrialProgress, summarizeTimelineDawMusicianTrialProgress } from "../../lib/timeline/TimelineDawMusicianTrialProgress";

describe("musician trial progress", () => {
  it("keeps only known steps with valid observation times", () => {
    expect(parseTimelineDawMusicianTrialProgress({ access: "2026-08-15T12:00:00.000Z", owner: "2026-08-15T12:00:00.000Z", play: "bad" })).toEqual({ access: "2026-08-15T12:00:00.000Z" });
  });

  it("records first completion and summarizes all seven steps", () => {
    const first = completeTimelineDawMusicianTrialStep({}, "record", "2026-08-15T12:00:00.000Z");
    const repeated = completeTimelineDawMusicianTrialStep(first, "record", "2026-08-16T12:00:00.000Z");
    expect(repeated.record).toBe("2026-08-15T12:00:00.000Z");
    expect(summarizeTimelineDawMusicianTrialProgress(repeated)).toMatchObject({ completed: 1, required: 7, complete: false });
  });
});
