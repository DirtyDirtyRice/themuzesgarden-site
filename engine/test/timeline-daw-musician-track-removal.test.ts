import { describe, expect, it } from "vitest";
import { createTimelineDawMusicianTrackRemovalMessage } from "../../lib/timeline/TimelineDawMusicianTrackRemoval";

describe("TimelineDawMusicianTrackRemoval", () => {
  it("explains source protection and recovery before removing a track", () => {
    const message = createTimelineDawMusicianTrackRemovalMessage("Lead Vocal");
    expect(message.confirmation).toContain("Remove Lead Vocal from this song?");
    expect(message.confirmation).toContain("private recording will be preserved");
    expect(message.confirmation).toContain("Undo Last Track Edit");
  });

  it("confirms the truthful recoverable result", () => {
    const message = createTimelineDawMusicianTrackRemovalMessage("Guitar");
    expect(message.success).toContain("Guitar was removed from this song");
    expect(message.success).toContain("private recording is preserved");
  });
});
