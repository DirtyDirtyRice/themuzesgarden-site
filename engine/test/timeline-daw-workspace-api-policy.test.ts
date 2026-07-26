import { describe, expect, it } from "vitest";
import { parseTimelineDawWorkspaceCommand } from "../../lib/timeline/TimelineDawWorkspaceApiPolicy";

describe("TimelineDawWorkspaceApiPolicy", () => {
  it("accepts and normalizes a complete open command", () => {
    expect(parseTimelineDawWorkspaceCommand({
      action: "open", projectId: " project-1 ", songId: " song-1 ",
      name: " Session ", expectedWorkspaceRevision: 0,
    })).toEqual({
      action: "open", projectId: "project-1", songId: "song-1",
      name: "Session", expectedWorkspaceRevision: 0,
    });
  });
  it("accepts lifecycle commands with both revision guards", () => {
    expect(parseTimelineDawWorkspaceCommand({
      action: "activate", sessionId: "session-1",
      expectedSessionRevision: 2, expectedWorkspaceRevision: 4,
    })).toMatchObject({ action: "activate", expectedSessionRevision: 2, expectedWorkspaceRevision: 4 });
  });
  it("rejects invented actions and incomplete commands", () => {
    expect(() => parseTimelineDawWorkspaceCommand({ action: "delete" })).toThrow("action is invalid");
    expect(() => parseTimelineDawWorkspaceCommand({
      action: "open", projectId: "project-1", expectedWorkspaceRevision: 0,
    })).toThrow("Open requires");
  });
});
