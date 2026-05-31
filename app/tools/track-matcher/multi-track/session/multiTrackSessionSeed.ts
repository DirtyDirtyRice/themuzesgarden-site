import type { MultiTrackSessionNote } from "./multiTrackSessionTypes";

export const DEFAULT_MULTI_TRACK_SESSION_NOTES: MultiTrackSessionNote[] = [
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