import { describe, expect, it } from "vitest";
import { createTimelineDawRecordingRecoveryView, TIMELINE_DAW_MAX_RECOVERABLE_RECORDINGS } from "../../lib/timeline/TimelineDawRecordingRecovery";

describe("interrupted recording recovery", () => {
  it("holds a new recording while one recovery WAV exists", () => {
    expect(TIMELINE_DAW_MAX_RECOVERABLE_RECORDINGS).toBe(1);
    expect(createTimelineDawRecordingRecoveryView({ hasRecovery: true, uploading: false, uploadedSourceAvailable: false })).toMatchObject({ startHeld: true, retryLabel: "Retry Private Save" });
  });
  it("retries only registration after source upload succeeded", () => {
    expect(createTimelineDawRecordingRecoveryView({ hasRecovery: true, uploading: false, uploadedSourceAvailable: true }).retryLabel).toBe("Retry Take Registration");
  });
});
