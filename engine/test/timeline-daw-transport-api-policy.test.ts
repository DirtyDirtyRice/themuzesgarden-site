import { describe, expect, it } from "vitest";
import { parseTimelineDawTransportCommand } from "../../lib/timeline/TimelineDawTransportApiPolicy";

describe("TimelineDawTransportApiPolicy", () => {
  it("normalizes initialization and located transport commands", () => {
    expect(parseTimelineDawTransportCommand({
      action: "initialize",
      sessionId: " session-1 ",
      expectedWorkspaceRevision: 2,
    })).toEqual({
      action: "initialize",
      sessionId: "session-1",
      expectedWorkspaceRevision: 2,
    });
    expect(parseTimelineDawTransportCommand({
      action: "locate",
      sessionId: "session-1",
      expectedTransportHead: 3,
      expectedWorkspaceRevision: 4,
      tick: 1_920,
    })).toMatchObject({ action: "locate", tick: 1_920 });
  });

  it("rejects invented actions and missing revision guards", () => {
    expect(() => parseTimelineDawTransportCommand({ action: "scrub" })).toThrow(/invalid/i);
    expect(() => parseTimelineDawTransportCommand({
      action: "play",
      sessionId: "session-1",
      expectedWorkspaceRevision: 1,
    })).toThrow(/expectedTransportHead/);
  });
});
