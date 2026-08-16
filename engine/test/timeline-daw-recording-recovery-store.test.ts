import { describe, expect, it } from "vitest";
import { TIMELINE_DAW_MAX_RECOVERY_BYTES, validateTimelineDawStoredRecovery } from "../../lib/timeline/TimelineDawRecordingRecoveryStore";

describe("persistent recording recovery policy", () => {
  const valid = { sessionId: "session-1", blob: new Blob([new Uint8Array(44)]), fileName: "take.wav", plan: {}, savedAt: "2026-08-15T00:00:00Z" };
  it("accepts only the exact session", () => {
    expect(validateTimelineDawStoredRecovery(valid, "session-1")).toBeNull();
    expect(validateTimelineDawStoredRecovery(valid, "session-2")).toMatch(/different/i);
  });
  it("rejects corrupt audio, invalid names, and oversize bounds", () => {
    expect(TIMELINE_DAW_MAX_RECOVERY_BYTES).toBe(500 * 1024 * 1024);
    expect(validateTimelineDawStoredRecovery({ ...valid, blob: new Blob([]) }, "session-1")).toMatch(/corrupt/i);
    expect(validateTimelineDawStoredRecovery({ ...valid, fileName: "take.mp3" }, "session-1")).toMatch(/filename/i);
  });
});
