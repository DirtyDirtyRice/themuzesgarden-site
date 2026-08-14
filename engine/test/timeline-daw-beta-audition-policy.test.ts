import { describe, expect, it } from "vitest";
import { assertTimelineDawBetaAuditionSource, createTimelineDawBetaAuditionChecksum, parseTimelineDawBetaAuditionEvent } from "../../lib/timeline/TimelineDawBetaAuditionPolicy";

describe("DAW beta audition policy", () => {
  it("accepts bounded playback evidence and rejects unsupported actions", () => {
    expect(parseTimelineDawBetaAuditionEvent({ action: "playback-completed", positionSeconds: 91.2 })).toMatchObject({ action: "playback-completed", positionSeconds: 91.2 });
    expect(() => parseTimelineDawBetaAuditionEvent({ action: "download", positionSeconds: 0 })).toThrow("invalid");
  });
  it("confines an audition master to the owner and session storage path", () => {
    expect(assertTimelineDawBetaAuditionSource({ ownerId: "owner", sessionId: "session", sourceUri: "supabase://timeline-daw-render-sources/owner/session/master.wav", sourceChecksum: `sha256:${"a".repeat(64)}` })).toEqual({ storagePath: "owner/session/master.wav", expiresInSeconds: 300 });
    expect(() => assertTimelineDawBetaAuditionSource({ ownerId: "owner", sessionId: "session", sourceUri: "supabase://timeline-daw-render-sources/other/session/master.wav", sourceChecksum: `sha256:${"a".repeat(64)}` })).toThrow("outside");
  });
  it("creates deterministic audition evidence checksums", () => expect(createTimelineDawBetaAuditionChecksum({ sourceId: "s", event: "playback-started" })).toMatch(/^sha256:[a-f0-9]{64}$/));
});
