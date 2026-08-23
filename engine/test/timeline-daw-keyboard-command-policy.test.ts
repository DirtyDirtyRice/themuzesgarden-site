import { describe, expect, it } from "vitest";
import {
  describeTimelineDawClipKeyboardCommand,
  resolveTimelineDawClipKeyboardCommand,
} from "../../lib/timeline/TimelineDawKeyboardCommandPolicy";

const base = {
  key: "",
  editableTarget: false,
  selectedCount: 1,
  clipboardCount: 1,
  canUndo: true,
  canRedo: true,
};

describe("DAW clip keyboard command policy", () => {
  it("maps professional edit, clipboard, undo, and redo commands", () => {
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "ArrowLeft" })).toBe("move-left");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "ArrowRight", altKey: true })).toBe("trim-start-right");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "ArrowLeft", shiftKey: true })).toBe("trim-end-left");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "z", ctrlKey: true })).toBe("undo");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "z", metaKey: true, shiftKey: true })).toBe("redo");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "y", ctrlKey: true })).toBe("redo");
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "Delete" })).toBe("archive");
  });

  it("does not steal typing, repeated keys, or unavailable commands", () => {
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "s", editableTarget: true })).toBeNull();
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "ArrowLeft", repeat: true })).toBeNull();
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "c", ctrlKey: true, selectedCount: 0 })).toBeNull();
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "v", ctrlKey: true, clipboardCount: 0 })).toBeNull();
    expect(resolveTimelineDawClipKeyboardCommand({ ...base, key: "z", ctrlKey: true, canUndo: false })).toBeNull();
  });

  it("provides concise screen-reader announcements", () => {
    expect(describeTimelineDawClipKeyboardCommand("duplicate", 2)).toBe("2 selected clips duplicated.");
    expect(describeTimelineDawClipKeyboardCommand("redo", 0)).toBe("Clip edit redone.");
  });
});
