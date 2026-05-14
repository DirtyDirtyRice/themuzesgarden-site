export type FindItPanelIntelligenceEventKind =
  | "search_started"
  | "debounce_waiting"
  | "results_ready"
  | "focused_target"
  | "no_results"
  | "target_changed"
  | "route_context_changed"
  | "layout_promoted"
  | "meaning_locked";

export type FindItPanelIntelligenceEvent = {
  id: string;
  kind: FindItPanelIntelligenceEventKind;
  label: string;
  detail: string;
  createdAt: number;
};

function createEventId(kind: FindItPanelIntelligenceEventKind, time: number) {
  return `${kind}-${time}`;
}

export function createFindItEvent({
  kind,
  label,
  detail,
  now = Date.now(),
}: {
  kind: FindItPanelIntelligenceEventKind;
  label: string;
  detail: string;
  now?: number;
}): FindItPanelIntelligenceEvent {
  return {
    id: createEventId(kind, now),
    kind,
    label,
    detail,
    createdAt: now,
  };
}

export function appendFindItEvent(
  events: FindItPanelIntelligenceEvent[],
  nextEvent: FindItPanelIntelligenceEvent | null,
) {
  if (!nextEvent) return events;

  const prev = events[0];

  if (prev && prev.kind === nextEvent.kind && prev.detail === nextEvent.detail) {
    return events;
  }

  return [nextEvent, ...events].slice(0, 12);
}