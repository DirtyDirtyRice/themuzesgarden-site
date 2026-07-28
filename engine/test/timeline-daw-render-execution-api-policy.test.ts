import { describe, expect, it } from "vitest";
import { parseTimelineDawRenderExecutionCommand } from "../../lib/timeline/TimelineDawRenderExecutionApiPolicy";

describe("TimelineDawRenderExecutionApiPolicy", () => {
  it("normalizes a revision-guarded execution command", () => {
    expect(parseTimelineDawRenderExecutionCommand({
      action: "execute-wav",
      sessionId: " session-1 ",
      jobId: " job-1 ",
      expectedWorkspaceRevision: 4,
    })).toEqual({
      action: "execute-wav",
      sessionId: "session-1",
      jobId: "job-1",
      expectedWorkspaceRevision: 4,
    });
  });
  it("rejects unsupported fields and missing revision protection", () => {
    expect(() => parseTimelineDawRenderExecutionCommand({
      action: "execute-wav", sessionId: "s", jobId: "j",
      expectedWorkspaceRevision: 1, actorId: "other",
    })).toThrow(/unsupported field/i);
    expect(() => parseTimelineDawRenderExecutionCommand({
      action: "execute-wav", sessionId: "s", jobId: "j",
    })).toThrow(/expectedWorkspaceRevision/i);
  });
});
