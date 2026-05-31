import type {
  MultiTrackAnalysisNoteRecord,
} from "./multiTrackAnalysisNoteTypes";

export const DEFAULT_MULTI_TRACK_ANALYSIS_NOTES: MultiTrackAnalysisNoteRecord[] =
  [
    {
      id: "analysis-note-listening-foundation",
      kind: "listening",
      priority: "high",
      title: "Listening comparison",
      body: "Capture what works, what clashes, and what needs a replay.",
      target: "pair",
      status: "foundation",
    },
    {
      id: "analysis-note-arrangement-foundation",
      kind: "arrangement",
      priority: "medium",
      title: "Arrangement space",
      body: "Track where instruments, vocals, hooks, and transitions compete or support each other.",
      target: "pair",
      status: "foundation",
    },
    {
      id: "analysis-note-timeline-planned",
      kind: "timeline",
      priority: "medium",
      title: "Timeline markers",
      body: "Future notes should attach to hooks, sections, sync issues, and blend moments.",
      target: "session",
      status: "planned",
    },
    {
      id: "analysis-note-prompt-planned",
      kind: "prompt",
      priority: "low",
      title: "Prompt extraction",
      body: "Future prompt notes should extract style, sound, instrument, and arrangement language.",
      target: "session",
      status: "planned",
    },
  ];