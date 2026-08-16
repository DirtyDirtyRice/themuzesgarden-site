import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordingInterruption } from "../../lib/timeline/TimelineDawRecordingInterruption";

describe("TimelineDawRecordingInterruption", () => {
  it("finalizes captured audio when the selected input ends", () => {
    expect(assessTimelineDawRecordingInterruption({
      reason: "input-ended", recordingActive: true, stopAlreadyStarted: false,
      interruptionAlreadyHandled: false, capturedFrames: 4_800,
    })).toMatchObject({ shouldStop: true, canRecoverAudio: true });
  });

  it("explains when an interruption happens before capture begins", () => {
    const decision = assessTimelineDawRecordingInterruption({
      reason: "stream-inactive", recordingActive: true, stopAlreadyStarted: false,
      interruptionAlreadyHandled: false, capturedFrames: 0,
    });
    expect(decision).toMatchObject({ shouldStop: true, canRecoverAudio: false });
    expect(decision.notice).toMatch(/before any audio/i);
  });

  it("ignores duplicate, inactive, and manual-stop events", () => {
    for (const overrides of [
      { recordingActive: false },
      { stopAlreadyStarted: true },
      { interruptionAlreadyHandled: true },
    ]) {
      expect(assessTimelineDawRecordingInterruption({
        reason: "input-ended", recordingActive: true, stopAlreadyStarted: false,
        interruptionAlreadyHandled: false, capturedFrames: 10, ...overrides,
      }).shouldStop).toBe(false);
    }
  });
});
