import { describe, expect, it } from "vitest";
import { createTimelineDawMusicianInvitationHandoff } from "../../lib/timeline/TimelineDawMusicianInvitationHandoff";

describe("musician invitation handoff", () => {
  it("creates one plain message with the enrollment path, code, and real trial steps", () => {
    const result = createTimelineDawMusicianInvitationHandoff({ label: "Riley", code: "invite-code-that-is-long-enough", origin: "https://www.themuzesgarden.com/" });
    expect(result.enrollmentUrl).toBe("https://www.themuzesgarden.com/workspace/daw/beta");
    expect(result.message).toMatch(/Riley|one-time invitation code|Record a short take|Export an edited WAV/);
  });
  it("rejects an invalid invitation secret", () => expect(() => createTimelineDawMusicianInvitationHandoff({ label: "Riley", code: "short", origin: "https://example.com" })).toThrow(/valid one-time/i));
});
