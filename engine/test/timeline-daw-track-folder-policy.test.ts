import { describe, expect, it } from "vitest";
import { createTimelineDawTrackFolder, parseTimelineDawTrackFolders, removeTimelineDawTrackFolder, renameTimelineDawTrackFolder, toggleTimelineDawTrackFolder } from "../../lib/timeline/TimelineDawTrackFolderPolicy";

describe("DAW track folder policy", () => {
  it("restores only current, non-overlapping folders with at least two tracks", () => {
    const stored = JSON.stringify({ band: { id: "band", name: " Band ", laneIds: ["a", "b", "foreign"], collapsed: true }, overlap: { id: "overlap", name: "Overlap", laneIds: ["b", "c"], collapsed: false }, single: { id: "single", name: "Single", laneIds: ["c"], collapsed: false } });
    expect(parseTimelineDawTrackFolders(stored, ["a", "b", "c"])).toEqual({ band: { id: "band", name: "Band", laneIds: ["a", "b"], collapsed: true } });
  });

  it("creates, renames, collapses, and removes only the folder container", () => {
    const created = createTimelineDawTrackFolder({}, { id: "f1", name: " Vocals ", laneIds: ["a", "b"], collapsed: false });
    expect(created.f1.name).toBe("Vocals");
    expect(renameTimelineDawTrackFolder(created, "f1", "Lead Vocals").f1.name).toBe("Lead Vocals");
    expect(toggleTimelineDawTrackFolder(created, "f1").f1.collapsed).toBe(true);
    expect(removeTimelineDawTrackFolder(created, "f1")).toEqual({});
    expect(created.f1.laneIds).toEqual(["a", "b"]);
  });

  it("does not put one track in two folders", () => {
    const folders = createTimelineDawTrackFolder({}, { id: "f1", name: "One", laneIds: ["a", "b"], collapsed: false });
    expect(createTimelineDawTrackFolder(folders, { id: "f2", name: "Two", laneIds: ["b", "c"], collapsed: false })).toBe(folders);
  });
});
