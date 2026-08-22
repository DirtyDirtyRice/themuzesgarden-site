import { describe, expect, it } from "vitest";
import { resolveTimelineDawTrackShortcut } from "../../lib/timeline/TimelineDawTrackShortcutPolicy";

describe("DAW track keyboard shortcuts", () => {
  it("maps lock and hear keys for exactly one selected track", () => {
    expect(resolveTimelineDawTrackShortcut({ key: "L", selectedCount: 1, editableTarget: false })).toBe("toggle-lock");
    expect(resolveTimelineDawTrackShortcut({ key: "h", selectedCount: 1, editableTarget: false })).toBe("toggle-preview");
  });

  it("ignores shortcuts while typing, using modifiers, or selecting several tracks", () => {
    expect(resolveTimelineDawTrackShortcut({ key: "l", selectedCount: 1, editableTarget: true })).toBeNull();
    expect(resolveTimelineDawTrackShortcut({ key: "h", selectedCount: 2, editableTarget: false })).toBeNull();
    expect(resolveTimelineDawTrackShortcut({ key: "l", selectedCount: 1, editableTarget: false, ctrlKey: true })).toBeNull();
  });
});
