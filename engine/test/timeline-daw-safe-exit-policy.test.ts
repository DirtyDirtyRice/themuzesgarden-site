import { describe, expect, it } from "vitest";
import { createTimelineDawSafeExitView } from "../../lib/timeline/TimelineDawSafeExitPolicy";

describe("DAW safe exit policy", () => {
  it("allows exit when browser-local capture work is idle", () => {
    expect(createTimelineDawSafeExitView({ workspaceRevision: 8, recording: false, uploading: false })).toEqual({
      canExit: true,
      blocker: null,
      saveMessage: "Durable workspace revision 8 is saved.",
    });
  });

  it("holds exit during recording and take persistence", () => {
    expect(createTimelineDawSafeExitView({ workspaceRevision: 8, recording: true, uploading: false }).blocker).toContain("Stop");
    expect(createTimelineDawSafeExitView({ workspaceRevision: 8, recording: false, uploading: true }).blocker).toContain("finish saving");
  });
});
