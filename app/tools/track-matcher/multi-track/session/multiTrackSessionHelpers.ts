import type {
  MultiTrackControllerSnapshot,
} from "../controller/multiTrackControllerTypes";
import type {
  MultiTrackSessionFoundation,
  MultiTrackSessionHealth,
  MultiTrackSessionNote,
  MultiTrackSessionRouteStatus,
  MultiTrackSessionTrackSelection,
} from "./multiTrackSessionTypes";

export function createMultiTrackSessionHealth(
  snapshot: MultiTrackControllerSnapshot,
): MultiTrackSessionHealth {
  const foundationCount = snapshot.panelSummaries.filter(
    (panel) => panel.status === "foundation",
  ).length;
  const plannedCount = snapshot.panelSummaries.filter(
    (panel) => panel.status === "planned",
  ).length;

  return {
    label: "Session foundation ready",
    detail: `${foundationCount} foundation panels and ${plannedCount} planned panels are mapped without audio-runtime ownership.`,
    status: foundationCount > 0 ? "foundation" : "planned",
  };
}

export function createMultiTrackSessionRoutes(
  snapshot: MultiTrackControllerSnapshot,
): MultiTrackSessionRouteStatus[] {
  return snapshot.panelSummaries.map((panel) => ({
    panelId: panel.id,
    view: panel.view,
    status: panel.status,
    routeLabel: panel.label,
    detail: panel.detail,
  }));
}

export function createMultiTrackSessionTrackSelections(
  snapshot: MultiTrackControllerSnapshot,
): MultiTrackSessionTrackSelection[] {
  return snapshot.trackSlots.map((slot) => ({
    trackSlotId: slot.id,
    selectedTitle: slot.loadedTitle,
    selectedSource: slot.sourceLabel,
    status: slot.readiness,
  }));
}

export function createDefaultMultiTrackSessionNotes(): MultiTrackSessionNote[] {
  return [
    {
      id: "listening-note-foundation",
      kind: "listening",
      title: "Listening notes",
      body: "Ready for human comparison notes once real Track A and Track B selections are wired.",
      status: "foundation",
    },
    {
      id: "decision-note-foundation",
      kind: "decision",
      title: "Decision notes",
      body: "Prepared for Match, Reference, Hybrid, or Reject decisions.",
      status: "foundation",
    },
    {
      id: "timeline-note-planned",
      kind: "timeline",
      title: "Timeline notes",
      body: "Planned for marker lanes, sync issues, hooks, transitions, and blend opportunities.",
      status: "planned",
    },
    {
      id: "ai-note-planned",
      kind: "ai",
      title: "AI notes",
      body: "Planned for future summaries, problem finding, and prompt-building routes.",
      status: "planned",
    },
  ];
}

export function createMultiTrackSessionFoundation(
  snapshot: MultiTrackControllerSnapshot,
): MultiTrackSessionFoundation {
  return {
    health: createMultiTrackSessionHealth(snapshot),
    notes: createDefaultMultiTrackSessionNotes(),
    routes: createMultiTrackSessionRoutes(snapshot),
    trackSelections: createMultiTrackSessionTrackSelections(snapshot),
  };
}