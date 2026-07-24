import { describe, expect, it } from "vitest";

import { TimelineAnalyticsEngine } from "../../lib/timeline/TimelineAnalyticsEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

describe("TimelineAnalyticsEngine", () => {
  it("builds deterministic distributions, track utilization, and time totals", () => {
    const engine = new TimelineAnalyticsEngine(
      () => new Date("2026-07-23T12:00:00.000Z"),
    );
    const report = engine.analyze(TIMELINE_WORKSPACE, {
      staleDays: 10_000,
      denseTrackEventCount: 10_000,
      largeProjectEventCount: 100_000,
    });

    expect(report.projectId).toBe(TIMELINE_WORKSPACE.projectId);
    expect(report.totals.events).toBe(TIMELINE_WORKSPACE.events.length);
    expect(report.totals.tracks).toBe(TIMELINE_WORKSPACE.tracks.length);
    expect(report.eventTypes.reduce((sum, item) => sum + item.count, 0)).toBe(
      TIMELINE_WORKSPACE.events.length,
    );
    expect(
      report.tracks.reduce((sum, track) => sum + track.eventCount, 0),
    ).toBe(TIMELINE_WORKSPACE.events.length - report.totals.unassignedEvents);
    expect(report.totals.unassignedEvents).toBeGreaterThan(0);
    expect(report.hotspots.map((hotspot) => hotspot.id)).toContain(
      "analytics:unassigned-events",
    );
    expect(report.temporal.spanSeconds).toBeGreaterThanOrEqual(0);
  });

  it("identifies scale, density, lifecycle, maintenance, and balance risks", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const oldDate = "2020-01-01T00:00:00.000Z";
    const baseEvent = TIMELINE_WORKSPACE.events[0];
    const events = Array.from({ length: 8 }, (_, index) => ({
      ...structuredClone(baseEvent),
      id: `analytics-event-${index}`,
      trackId: TIMELINE_WORKSPACE.tracks[0].id,
      enabled: index < 4,
      archived: index >= 6,
      audit: {
        ...baseEvent.audit,
        updatedAt: oldDate,
      },
      location: {
        ...baseEvent.location,
        seconds: index * 10,
      },
    }));
    const engine = new TimelineAnalyticsEngine(() => now);
    const report = engine.analyze(
      {
        ...structuredClone(TIMELINE_WORKSPACE),
        events,
        history: [],
      },
      {
        denseTrackEventCount: 5,
        largeProjectEventCount: 8,
        highArchivedPercentage: 20,
        highDisabledPercentage: 40,
        dominantTrackPercentage: 70,
        staleDays: 30,
      },
    );
    const categories = report.hotspots.map((hotspot) => hotspot.category);

    expect(categories).toEqual(
      expect.arrayContaining([
        "scale",
        "density",
        "balance",
        "lifecycle",
        "maintenance",
        "track",
      ]),
    );
    expect(report.score).toBeLessThan(100);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("handles an empty workspace without invalid numeric output", () => {
    const report = new TimelineAnalyticsEngine().analyze({
      ...structuredClone(TIMELINE_WORKSPACE),
      events: [],
      history: [],
    });

    expect(report.totals.events).toBe(0);
    expect(report.temporal).toMatchObject({
      firstSecond: null,
      lastSecond: null,
      spanSeconds: 0,
      totalDurationSeconds: 0,
    });
    expect(report.eventTypes).toEqual([]);
    expect(Number.isFinite(report.score)).toBe(true);
  });
});
