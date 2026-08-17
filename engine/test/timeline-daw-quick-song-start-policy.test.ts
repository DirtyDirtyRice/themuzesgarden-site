import { describe, expect, it } from "vitest";
import { createTimelineDawQuickSongStartName, filterTimelineDawQuickSongChoices, validateTimelineDawQuickSongStart } from "../../lib/timeline/TimelineDawQuickSongStartPolicy";

describe("DAW quick song start policy", () => {
  it("creates a plain default session name from the linked song", () => {
    expect(createTimelineDawQuickSongStartName("  My   Song ")).toBe("My Song Session");
    expect(createTimelineDawQuickSongStartName(null)).toBe("New Song Session");
  });

  it("requires the project, linked song, name, and current workspace revision", () => {
    expect(validateTimelineDawQuickSongStart({ projectId: "", songId: "song", sessionName: "Take", workspaceRevision: 1 }).message).toBe("Choose a project.");
    expect(validateTimelineDawQuickSongStart({ projectId: "project", songId: "", sessionName: "Take", workspaceRevision: 1 }).message).toContain("linked");
    expect(validateTimelineDawQuickSongStart({ projectId: "project", songId: "song", sessionName: "Take", workspaceRevision: -1 }).message).toContain("Refresh");
  });

  it("returns the exact durable session-open input when ready", () => {
    expect(validateTimelineDawQuickSongStart({ projectId: " p ", songId: " s ", sessionName: " First   Take ", workspaceRevision: 4 })).toEqual({ ready: true, input: { projectId: "p", songId: "s", name: "First Take", expectedWorkspaceRevision: 4 } });
  });

  it("searches linked choices by title or artist using every word", () => {
    const tracks = [
      { id: "1", title: "Midnight Train", artist: "Steve" },
      { id: "2", title: "Morning Light", artist: "The Garden" },
      { id: "3", title: "Train Home", artist: "The Garden" },
    ];
    expect(filterTimelineDawQuickSongChoices(tracks, "train garden").map((track) => track.id)).toEqual(["3"]);
    expect(filterTimelineDawQuickSongChoices(tracks, "  STEVE ").map((track) => track.id)).toEqual(["1"]);
    expect(filterTimelineDawQuickSongChoices(tracks, "")).toBe(tracks);
  });
});
