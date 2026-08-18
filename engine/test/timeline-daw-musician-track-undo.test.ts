import { describe, expect, it } from "vitest";
import { selectTimelineDawMusicianTrackUndo } from "../../lib/timeline/TimelineDawMusicianTrackUndo";

describe("TimelineDawMusicianTrackUndo", () => {
  it("offers the newest applied edit for immediate undo", () => {
    const choice = selectTimelineDawMusicianTrackUndo([
      { id: "new", label: "Move or trim track", state: "applied" },
      { id: "old", label: "Split track", state: "applied" },
    ]);
    expect(choice.undo?.id).toBe("new");
    expect(choice.redo).toBeNull();
  });

  it("offers the correct undone edit for redo", () => {
    const choice = selectTimelineDawMusicianTrackUndo([
      { id: "new", label: "Move track", state: "undone" },
      { id: "older", label: "Trim track", state: "undone" },
    ]);
    expect(choice.undo).toBeNull();
    expect(choice.redo?.id).toBe("older");
  });
});
