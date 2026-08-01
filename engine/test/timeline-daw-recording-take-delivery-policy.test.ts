import { describe, expect, it } from "vitest";
import {
  resolveTimelineDawTakeStoragePath,
  TIMELINE_DAW_TAKE_DELIVERY_SECONDS,
} from "../../lib/timeline/TimelineDawRecordingTakeDeliveryPolicy";

describe("TimelineDawRecordingTakeDeliveryPolicy", () => {
  it("resolves a WAV belonging to the authenticated owner and session", () => {
    expect(resolveTimelineDawTakeStoragePath(
      "supabase://timeline-daw-render-sources/user-1/session-1/take.wav",
      "user-1",
      "session-1",
    )).toBe("user-1/session-1/take.wav");
    expect(TIMELINE_DAW_TAKE_DELIVERY_SECONDS).toBe(300);
  });

  it("rejects cross-owner, cross-session, and unsafe paths", () => {
    expect(() => resolveTimelineDawTakeStoragePath(
      "supabase://timeline-daw-render-sources/user-2/session-1/take.wav",
      "user-1",
      "session-1",
    )).toThrow(/does not belong/);
    expect(() => resolveTimelineDawTakeStoragePath(
      "supabase://timeline-daw-render-sources/user-1/session-2/take.wav",
      "user-1",
      "session-1",
    )).toThrow(/does not belong/);
    expect(() => resolveTimelineDawTakeStoragePath(
      "supabase://timeline-daw-render-sources/user-1/session-1/take.mp3",
      "user-1",
      "session-1",
    )).toThrow(/path is invalid/);
  });
});
