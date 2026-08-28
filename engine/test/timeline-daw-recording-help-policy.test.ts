import { describe, expect, it } from "vitest";
import { normalizeTimelineDawBabyStepHelpStep } from "../../lib/timeline/TimelineDawBabyStepHelpPolicy";
import { timelineDawRecordingHelpStorageKey, TIMELINE_DAW_RECORDING_HELP_STEPS } from "../../lib/timeline/TimelineDawRecordingHelpPolicy";

describe("DAW recording baby-step help", () => {
  it("covers input, preflight, plan, capture, and saved-take review", () => {
    expect(TIMELINE_DAW_RECORDING_HELP_STEPS.map((step) => step.title)).toEqual([
      "Choose the input", "Test the input level", "Choose the recording plan", "Record and save", "Review the saved take",
    ]);
  });
  it("allows only a valid step for this five-step workflow", () => {
    expect(normalizeTimelineDawBabyStepHelpStep("4", TIMELINE_DAW_RECORDING_HELP_STEPS.length)).toBe(4);
    expect(normalizeTimelineDawBabyStepHelpStep(5, TIMELINE_DAW_RECORDING_HELP_STEPS.length)).toBe(0);
  });
  it("keeps recording progress separate by workflow and session", () => {
    expect(timelineDawRecordingHelpStorageKey("session-1")).toBe("the-muzes-garden:daw-recording-help:session-1");
    expect(timelineDawRecordingHelpStorageKey("session-1")).not.toContain("export-help");
  });
});
