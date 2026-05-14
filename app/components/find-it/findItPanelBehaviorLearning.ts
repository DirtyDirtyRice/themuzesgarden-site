import type { FindItPanelIntelligenceEvent } from "./findItPanelIntelligenceEvents";

export type FindItPanelBehaviorSnapshot = {
  eventCount: number;
  lastEvent: FindItPanelIntelligenceEvent | null;
  recentEvents: FindItPanelIntelligenceEvent[];
  behaviorLabel: string;
  behaviorMessage: string;
};

export function createBehaviorSnapshot(
  events: FindItPanelIntelligenceEvent[],
): FindItPanelBehaviorSnapshot {
  const lastEvent = events[0] ?? null;

  if (!lastEvent) {
    return {
      eventCount: 0,
      lastEvent: null,
      recentEvents: [],
      behaviorLabel: "No behavior yet",
      behaviorMessage: "Behavior learning starts after search activity.",
    };
  }

  const kinds = new Set(events.map((e) => e.kind));

  const behaviorLabel =
    kinds.size >= 4
      ? "Learning mixed behavior"
      : kinds.size >= 2
      ? "Learning active behavior"
      : "Learning first pattern";

  return {
    eventCount: events.length,
    lastEvent,
    recentEvents: events.slice(0, 5),
    behaviorLabel,
    behaviorMessage: `${events.length} panel event${
      events.length === 1 ? "" : "s"
    } tracked in this session.`,
  };
}