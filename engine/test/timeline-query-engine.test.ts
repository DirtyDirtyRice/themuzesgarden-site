import { describe, expect, it } from "vitest";

import {
  TIMELINE_SAMPLE_EVENTS,
  TIMELINE_WORKSPACE,
} from "../../lib/timeline/TimelineSeed";
import { TimelineQueryEngine } from "../../lib/timeline/TimelineQueryEngine";

function createWorkspace() {
  const first = {
    ...TIMELINE_SAMPLE_EVENTS[0],
    relationships: [
      {
        sourceId: "event-0001",
        targetId: "event-0002",
        type: "introduces",
      },
    ],
  };
  const second = { ...TIMELINE_SAMPLE_EVENTS[1], relationships: [] };
  const third = { ...TIMELINE_SAMPLE_EVENTS[2], relationships: [] };

  return {
    ...TIMELINE_WORKSPACE,
    events: [first, second, third],
  };
}

describe("TimelineQueryEngine", () => {
  it("uses indexes and full-text relevance to find matching events", () => {
    const engine = new TimelineQueryEngine();
    engine.load(createWorkspace());

    const result = engine.execute({
      trackId: "lyrics",
      search: "first lyric",
      sort: "relevance",
    });

    expect(result.totalMatches).toBe(1);
    expect(result.events[0].id).toBe("event-0002");
    expect(result.matches[0].matchedFields).toContain("content");
    expect(result.diagnostics.usedIndexes).toContain("trackId");
  });

  it("supports deterministic pagination and saved queries", () => {
    const engine = new TimelineQueryEngine();
    engine.load(createWorkspace());
    engine.saveQuery({
      id: "all-visible",
      name: "All visible events",
      description: "Timeline order",
      query: { sort: "time-ascending", limit: 2 },
    });

    const firstPage = engine.runSavedQuery("all-visible");
    const secondPage = engine.execute({
      sort: "time-ascending",
      offset: 2,
      limit: 2,
    });

    expect(firstPage.events.map((event) => event.id)).toEqual([
      "event-0001",
      "event-0002",
    ]);
    expect(firstPage.hasMore).toBe(true);
    expect(secondPage.events.map((event) => event.id)).toEqual(["event-0003"]);
  });

  it("traverses indexed relationships without returning the starting event", () => {
    const engine = new TimelineQueryEngine();
    engine.load(createWorkspace());

    expect(engine.getRelatedEvents("event-0001").map((event) => event.id)).toEqual([
      "event-0002",
    ]);
    expect(engine.getRelatedEvents("event-0002").map((event) => event.id)).toEqual([
      "event-0001",
    ]);
  });
});
