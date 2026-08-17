import { describe, expect, it } from "vitest";
import {
  decideTimelineDawTakeAudioCleanup,
  timelineDawStoredAudioCleanupWarning,
} from "../../lib/timeline/TimelineDawTakeAudioCleanup";

describe("TimelineDawTakeAudioCleanup", () => {
  it("keeps shared audio while another take still references it", () => {
    expect(decideTimelineDawTakeAudioCleanup({ remainingReferenceCount: 2, referenceCheckFailed: false }))
      .toEqual({ removeStoredAudio: false, warning: null });
  });

  it("removes audio only after the final take reference is deleted", () => {
    expect(decideTimelineDawTakeAudioCleanup({ remainingReferenceCount: 0, referenceCheckFailed: false }))
      .toEqual({ removeStoredAudio: true, warning: null });
  });

  it("reports metadata deletion truthfully when reference checking fails", () => {
    expect(decideTimelineDawTakeAudioCleanup({ remainingReferenceCount: null, referenceCheckFailed: true }))
      .toMatchObject({ removeStoredAudio: false, warning: expect.stringMatching(/take was deleted/i) });
  });

  it("preserves stored audio when the reference count is unavailable", () => {
    expect(decideTimelineDawTakeAudioCleanup({ remainingReferenceCount: null, referenceCheckFailed: false }))
      .toMatchObject({ removeStoredAudio: false, warning: expect.stringMatching(/cleanup/i) });
  });

  it("separates failed storage cleanup from successful take deletion", () => {
    expect(timelineDawStoredAudioCleanupWarning()).toMatch(/take was deleted/i);
  });
});
