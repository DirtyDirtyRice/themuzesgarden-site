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
    expect(parseTimelineDawTransportCommand({
      action: "set-loop",
      sessionId: "session-1",
      expectedTransportHead: 4,
      expectedWorkspaceRevision: 5,
      enabled: true,
      startTick: 1_920,
      endTick: 5_760,
    })).toMatchObject({ action: "set-loop", enabled: true, startTick: 1_920, endTick: 5_760 });
    expect(parseTimelineDawTransportCommand({
      action: "set-count-in",
      sessionId: "session-1",
      expectedTransportHead: 5,
      expectedWorkspaceRevision: 6,
      bars: 2,
    })).toMatchObject({ action: "set-count-in", bars: 2 });
    expect(parseTimelineDawTransportCommand({
      action: "set-metronome",
      sessionId: "session-1",
      expectedTransportHead: 6,
      expectedWorkspaceRevision: 7,
      enabled: true,
    })).toMatchObject({ action: "set-metronome", enabled: true });
    expect(parseTimelineDawTransportCommand({
      action: "set-cue",
      sessionId: "session-1",
      expectedTransportHead: 7,
      expectedWorkspaceRevision: 8,
      cueTick: 2_880,
    })).toMatchObject({ action: "set-cue", tick: 2_880 });
    expect(parseTimelineDawTransportCommand({
      action: "set-cue",
      sessionId: "session-1",
      expectedTransportHead: 8,
      expectedWorkspaceRevision: 9,
      cueTick: null,
    })).toMatchObject({ action: "set-cue", tick: null });
  });

  it("rejects invented actions and missing revision guards", () => {
    expect(() => parseTimelineDawTransportCommand({ action: "scrub" })).toThrow(/invalid/i);
    expect(() => parseTimelineDawTransportCommand({
      action: "play",
      sessionId: "session-1",
      expectedWorkspaceRevision: 1,
    })).toThrow(/expectedTransportHead/);
    expect(() => parseTimelineDawTransportCommand({
      action: "set-loop",
      sessionId: "session-1",
      expectedTransportHead: 1,
      expectedWorkspaceRevision: 1,
      enabled: true,
      startTick: 960,
      endTick: 960,
    })).toThrow(/after loop start/i);
    expect(() => parseTimelineDawTransportCommand({
      action: "set-count-in",
      sessionId: "session-1",
      expectedTransportHead: 1,
      expectedWorkspaceRevision: 1,
      bars: 17,
    })).toThrow(/0 to 16/i);
    expect(() => parseTimelineDawTransportCommand({
      action: "set-metronome",
      sessionId: "session-1",
      expectedTransportHead: 1,
      expectedWorkspaceRevision: 1,
      enabled: "yes",
    })).toThrow(/enabled/i);
    expect(() => parseTimelineDawTransportCommand({
      action: "set-cue",
      sessionId: "session-1",
      expectedTransportHead: 1,
      expectedWorkspaceRevision: 1,
      cueTick: -1,
    })).toThrow(/cue tick/i);
  });
});
