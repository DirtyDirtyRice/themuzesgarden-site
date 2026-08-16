import { describe, expect, it } from "vitest";
import { assessTimelineDawRecordingInterruption, isTimelineDawCaptureStalled } from "../../lib/timeline/TimelineDawRecordingInterruption";

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

  it("stops safely when a muted input does not recover during its grace period", () => {
    const decision = assessTimelineDawRecordingInterruption({
      reason: "input-muted", recordingActive: true, stopAlreadyStarted: false,
      interruptionAlreadyHandled: false, capturedFrames: 2_400,
    });
    expect(decision).toMatchObject({ shouldStop: true, canRecoverAudio: true });
    expect(decision.notice).toMatch(/muted for five seconds/i);
  });

  it("detects a five-second capture pipeline stall only after audio began", () => {
    expect(isTimelineDawCaptureStalled({
      recordingActive: true, stopAlreadyStarted: false, capturedFrames: 4_800,
      lastCaptureAtMs: 1_000, nowMs: 6_000,
    })).toBe(true);
    expect(isTimelineDawCaptureStalled({
      recordingActive: true, stopAlreadyStarted: false, capturedFrames: 0,
      lastCaptureAtMs: 1_000, nowMs: 20_000,
    })).toBe(false);
    expect(isTimelineDawCaptureStalled({
      recordingActive: true, stopAlreadyStarted: true, capturedFrames: 4_800,
      lastCaptureAtMs: 1_000, nowMs: 20_000,
    })).toBe(false);
  });

  it("protects captured audio when the browser audio engine cannot resume", () => {
    const decision = assessTimelineDawRecordingInterruption({
      reason: "audio-engine-stopped", recordingActive: true, stopAlreadyStarted: false,
      interruptionAlreadyHandled: false, capturedFrames: 9_600,
    });
    expect(decision).toMatchObject({ shouldStop: true, canRecoverAudio: true });
    expect(decision.notice).toMatch(/could not resume within three seconds/i);
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
