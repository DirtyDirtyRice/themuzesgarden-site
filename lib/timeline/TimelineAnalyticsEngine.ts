import type {
  TimelineEvent,
  TimelineEventType,
  TimelineId,
  TimelineSource,
  TimelineStatus,
  TimelineTrack,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineAnalyticsSeverity = "info" | "warning" | "critical";

export type TimelineAnalyticsDistribution<T extends string = string> = {
  key: T;
  count: number;
  percentage: number;
};

export type TimelineTrackAnalytics = {
  trackId: TimelineId;
  title: string;
  eventCount: number;
  activeEventCount: number;
  archivedEventCount: number;
  aiEventCount: number;
  firstSecond: number | null;
  lastSecond: number | null;
  spanSeconds: number;
  totalDurationSeconds: number;
  eventsPerMinute: number;
  utilizationPercentage: number;
  locked: boolean;
  muted: boolean;
  visible: boolean;
};

export type TimelineAnalyticsHotspot = {
  id: TimelineId;
  severity: TimelineAnalyticsSeverity;
  category:
    "scale" | "density" | "balance" | "lifecycle" | "maintenance" | "track";
  title: string;
  detail: string;
  entityIds: TimelineId[];
  recommendation: string;
};

export type TimelineAnalyticsReport = {
  id: TimelineId;
  projectId: TimelineId;
  generatedAt: string;
  score: number;
  totals: {
    tracks: number;
    events: number;
    activeEvents: number;
    archivedEvents: number;
    disabledEvents: number;
    aiEvents: number;
    userEvents: number;
    emptyTracks: number;
    unassignedEvents: number;
    historyActions: number;
  };
  temporal: {
    firstSecond: number | null;
    lastSecond: number | null;
    spanSeconds: number;
    totalDurationSeconds: number;
  };
  eventTypes: TimelineAnalyticsDistribution<TimelineEventType>[];
  statuses: TimelineAnalyticsDistribution<TimelineStatus>[];
  sources: TimelineAnalyticsDistribution<TimelineSource>[];
  tracks: TimelineTrackAnalytics[];
  hotspots: TimelineAnalyticsHotspot[];
  recommendations: string[];
};

export type TimelineAnalyticsThresholds = {
  denseTrackEventCount?: number;
  largeProjectEventCount?: number;
  highArchivedPercentage?: number;
  highDisabledPercentage?: number;
  dominantTrackPercentage?: number;
  staleDays?: number;
};

function percentage(count: number, total: number): number {
  return total ? Math.round((count / total) * 10_000) / 100 : 0;
}

function distribution<T extends string>(
  values: T[],
): TimelineAnalyticsDistribution<T>[] {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts, ([key, count]) => ({
    key,
    count,
    percentage: percentage(count, values.length),
  })).sort(
    (left, right) =>
      right.count - left.count || left.key.localeCompare(right.key),
  );
}

function eventSecond(event: TimelineEvent): number {
  return Number.isFinite(event.location.seconds)
    ? Math.max(0, event.location.seconds)
    : 0;
}

function eventDuration(event: TimelineEvent): number {
  return Number.isFinite(event.duration) ? Math.max(0, event.duration ?? 0) : 0;
}

function trackAnalytics(
  track: TimelineTrack,
  events: TimelineEvent[],
  totalEvents: number,
): TimelineTrackAnalytics {
  const seconds = events.map(eventSecond);
  const firstSecond = seconds.length ? Math.min(...seconds) : null;
  const lastSecond = seconds.length
    ? Math.max(
        ...events.map((event) => eventSecond(event) + eventDuration(event)),
      )
    : null;
  const spanSeconds =
    firstSecond !== null && lastSecond !== null
      ? Math.max(0, lastSecond - firstSecond)
      : 0;
  return {
    trackId: track.id,
    title: track.title,
    eventCount: events.length,
    activeEventCount: events.filter((event) => event.enabled && !event.archived)
      .length,
    archivedEventCount: events.filter((event) => event.archived).length,
    aiEventCount: events.filter((event) => event.aiGenerated).length,
    firstSecond,
    lastSecond,
    spanSeconds,
    totalDurationSeconds:
      Math.round(
        events.reduce((sum, event) => sum + eventDuration(event), 0) * 1000,
      ) / 1000,
    eventsPerMinute:
      spanSeconds > 0
        ? Math.round((events.length / (spanSeconds / 60)) * 100) / 100
        : events.length,
    utilizationPercentage: percentage(events.length, totalEvents),
    locked: track.locked,
    muted: track.muted,
    visible: track.visible,
  };
}

export class TimelineAnalyticsEngine {
  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  analyze(
    workspace: TimelineWorkspace,
    thresholds: TimelineAnalyticsThresholds = {},
  ): TimelineAnalyticsReport {
    const limits = {
      denseTrackEventCount: thresholds.denseTrackEventCount ?? 1_000,
      largeProjectEventCount: thresholds.largeProjectEventCount ?? 10_000,
      highArchivedPercentage: thresholds.highArchivedPercentage ?? 25,
      highDisabledPercentage: thresholds.highDisabledPercentage ?? 15,
      dominantTrackPercentage: thresholds.dominantTrackPercentage ?? 70,
      staleDays: thresholds.staleDays ?? 90,
    };
    const events = workspace.events;
    const tracks = workspace.tracks
      .map((track) =>
        trackAnalytics(
          track,
          events.filter((event) => event.trackId === track.id),
          events.length,
        ),
      )
      .sort(
        (left, right) =>
          right.eventCount - left.eventCount ||
          left.title.localeCompare(right.title),
      );
    const hotspots: TimelineAnalyticsHotspot[] = [];
    const addHotspot = (
      id: string,
      severity: TimelineAnalyticsSeverity,
      category: TimelineAnalyticsHotspot["category"],
      title: string,
      detail: string,
      entityIds: TimelineId[],
      recommendation: string,
    ) =>
      hotspots.push({
        id,
        severity,
        category,
        title,
        detail,
        entityIds,
        recommendation,
      });

    const emptyTracks = tracks.filter((track) => track.eventCount === 0);
    const trackIds = new Set(workspace.tracks.map((track) => track.id));
    const unassignedEvents = events.filter(
      (event) => !trackIds.has(event.trackId),
    );
    if (unassignedEvents.length) {
      addHotspot(
        "analytics:unassigned-events",
        "critical",
        "track",
        "Events reference missing tracks",
        `${unassignedEvents.length} event(s) point to track IDs that are not present in this workspace.`,
        unassignedEvents.map((event) => event.id),
        "Restore the missing tracks or move these events onto valid tracks before editing.",
      );
    }
    if (emptyTracks.length) {
      addHotspot(
        "analytics:empty-tracks",
        "info",
        "track",
        "Empty Timeline tracks",
        `${emptyTracks.length} track(s) currently contain no events.`,
        emptyTracks.map((track) => track.trackId),
        "Hide, archive, or populate unused tracks to reduce visual clutter.",
      );
    }
    tracks
      .filter((track) => track.eventCount >= limits.denseTrackEventCount)
      .forEach((track) =>
        addHotspot(
          `analytics:dense:${track.trackId}`,
          "warning",
          "density",
          "Dense Timeline track",
          `${track.title} contains ${track.eventCount} events.`,
          [track.trackId],
          "Use virtualized rendering and consider grouping related events.",
        ),
      );
    if (events.length >= limits.largeProjectEventCount) {
      addHotspot(
        "analytics:large-project",
        "warning",
        "scale",
        "Large Timeline project",
        `${events.length} events require large-project safeguards.`,
        events.slice(0, 100).map((event) => event.id),
        "Enable windowed loading, incremental indexes, and background analysis.",
      );
    }
    const archivedEvents = events.filter((event) => event.archived);
    if (
      percentage(archivedEvents.length, events.length) >=
      limits.highArchivedPercentage
    ) {
      addHotspot(
        "analytics:archived-ratio",
        "warning",
        "lifecycle",
        "High archived-event share",
        `${percentage(archivedEvents.length, events.length)}% of events are archived.`,
        archivedEvents.map((event) => event.id),
        "Move older archived material into recoverable cold storage.",
      );
    }
    const disabledEvents = events.filter((event) => !event.enabled);
    if (
      percentage(disabledEvents.length, events.length) >=
      limits.highDisabledPercentage
    ) {
      addHotspot(
        "analytics:disabled-ratio",
        "warning",
        "maintenance",
        "High disabled-event share",
        `${percentage(disabledEvents.length, events.length)}% of events are disabled.`,
        disabledEvents.map((event) => event.id),
        "Review disabled events and restore, archive, or trash them explicitly.",
      );
    }
    const dominant = tracks[0];
    if (
      tracks.length > 1 &&
      dominant &&
      dominant.utilizationPercentage >= limits.dominantTrackPercentage
    ) {
      addHotspot(
        `analytics:dominant:${dominant.trackId}`,
        "warning",
        "balance",
        "Track concentration",
        `${dominant.title} contains ${dominant.utilizationPercentage}% of all events.`,
        [dominant.trackId],
        "Consider separating independent concerns into additional tracks.",
      );
    }
    const staleBefore =
      this.now().getTime() - limits.staleDays * 24 * 60 * 60 * 1000;
    const staleEvents = events.filter((event) => {
      const updated = Date.parse(event.audit.updatedAt);
      return (
        Number.isFinite(updated) && updated < staleBefore && !event.archived
      );
    });
    if (staleEvents.length) {
      addHotspot(
        "analytics:stale-events",
        "info",
        "maintenance",
        "Older active material",
        `${staleEvents.length} active event(s) have not changed in ${limits.staleDays} days.`,
        staleEvents.map((event) => event.id),
        "Review whether these events remain active, should be archived, or need revision.",
      );
    }

    const firstSecond = events.length
      ? Math.min(...events.map(eventSecond))
      : null;
    const lastSecond = events.length
      ? Math.max(
          ...events.map((event) => eventSecond(event) + eventDuration(event)),
        )
      : null;
    const penalty = hotspots.reduce(
      (sum, hotspot) =>
        sum +
        (hotspot.severity === "critical"
          ? 25
          : hotspot.severity === "warning"
            ? 8
            : 2),
      0,
    );
    const recommendations = Array.from(
      new Set(hotspots.map((hotspot) => hotspot.recommendation)),
    );
    if (!recommendations.length) {
      recommendations.push(
        "Continue recording Timeline history and review analytics after major edits.",
      );
    }
    return {
      id: `timeline-analytics-${++this.sequence}`,
      projectId: workspace.projectId,
      generatedAt: this.now().toISOString(),
      score: Math.max(0, 100 - penalty),
      totals: {
        tracks: workspace.tracks.length,
        events: events.length,
        activeEvents: events.filter((event) => event.enabled && !event.archived)
          .length,
        archivedEvents: archivedEvents.length,
        disabledEvents: disabledEvents.length,
        aiEvents: events.filter((event) => event.aiGenerated).length,
        userEvents: events.filter((event) => event.source === "user").length,
        emptyTracks: emptyTracks.length,
        unassignedEvents: unassignedEvents.length,
        historyActions: workspace.history.length,
      },
      temporal: {
        firstSecond,
        lastSecond,
        spanSeconds:
          firstSecond !== null && lastSecond !== null
            ? Math.max(0, lastSecond - firstSecond)
            : 0,
        totalDurationSeconds:
          Math.round(
            events.reduce((sum, event) => sum + eventDuration(event), 0) * 1000,
          ) / 1000,
      },
      eventTypes: distribution(events.map((event) => event.type)),
      statuses: distribution(events.map((event) => event.status)),
      sources: distribution(events.map((event) => event.source)),
      tracks,
      hotspots,
      recommendations,
    };
  }
}

export const timelineAnalyticsEngine = new TimelineAnalyticsEngine();
