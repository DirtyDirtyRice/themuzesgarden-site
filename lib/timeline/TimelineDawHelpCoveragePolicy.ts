import type { TimelineDawStudioFocusArea } from "./TimelineDawStudioFocusPolicy";

export const TIMELINE_DAW_HELP_WORKFLOWS = [
  { id: "transport", title: "Play, stop, seek, loop, and navigate", area: "transport", guide: "Live Transport and visual DAW tutorial", controls: ["Play", "Pause", "Stop", "Previous Bar", "Next Bar", "Start"] },
  { id: "recording", title: "Record and review a take", area: "record", guide: "How do I record and save a take?", controls: ["Test Input", "Start Recording", "Stop & Save", "Audition Take", "Use as Preferred"] },
  { id: "import", title: "Import songs, stems, and versions", area: "arrange", guide: "Import Into Arrangement baby-step guide", controls: ["Place Selected Songs", "Import Into Arrangement", "Stop safely"] },
  { id: "arrangement", title: "Arrange and edit clips", area: "arrange", guide: "Arrangement Workspace baby-step guide", controls: ["Grid", "Slip", "Shuffle", "Spot", "Trim", "Split", "Copy", "Undo"] },
  { id: "regions", title: "Mark verses, choruses, bridges, and solos", area: "mix", guide: "Named Regions baby-step guide", controls: ["Set Region Start", "Save Region End", "Hear Region", "Loop Region", "Remove Label"] },
  { id: "riff-comparison", title: "Compare the same riff across three versions", area: "mix", guide: "Three-Version Riff Comparison baby-step guide", controls: ["Find Matching Riffs", "Hear Match", "Previous Match", "Next Match", "Stop"] },
  { id: "hybrid-edit", title: "Build a protected hybrid edit", area: "mix", guide: "Track 4 — Hybrid Edit baby-step guide", controls: ["Copy to Track 4", "Hear This Riff", "Move Earlier", "Move Later", "Play Track 4", "Clear Track 4"] },
  { id: "session-view", title: "Launch clips and scenes", area: "arrange", guide: "Session View — Clip and Scene Launcher baby-step guide", controls: ["Launch Clip", "Launch Scene", "Previous Scene", "Next Scene", "Stop All"] },
  { id: "midi", title: "Create and play MIDI parts", area: "arrange", guide: "MIDI baby-step guide", controls: ["Create MIDI Track", "Add Note", "Play MIDI", "Stop MIDI"] },
  { id: "mixing", title: "Mix tracks, buses, effects, and routing", area: "mix", guide: "Quick Mix baby-step guide", controls: ["Mute", "Solo", "Gain", "Pan", "Output", "Sound", "A/B Effects"] },
  { id: "recovery", title: "Save, restore, and recover work", area: "recover", guide: "Save or recover work baby-step guide", controls: ["Reload Saved Takes", "Create Snapshot", "Preview Restore", "Restore", "Undo", "Redo"] },
  { id: "export", title: "Render and download the song", area: "export", guide: "Export the song baby-step guide", controls: ["Render", "Download", "Verify"] },
  { id: "verbal-editing", title: "Describe and review an AI-assisted edit", area: "verbal", guide: "Verbal Editing protected workflow", controls: ["Describe Edit", "Build Plan", "Review Hold", "A/B Compare", "Accept", "Undo"] },
] as const satisfies readonly {
  id: string;
  title: string;
  area: TimelineDawStudioFocusArea;
  guide: string;
  controls: readonly string[];
}[];

export type TimelineDawHelpWorkflowId = typeof TIMELINE_DAW_HELP_WORKFLOWS[number]["id"];

export function findTimelineDawHelpWorkflow(id: unknown) {
  return typeof id === "string"
    ? TIMELINE_DAW_HELP_WORKFLOWS.find((workflow) => workflow.id === id) ?? null
    : null;
}

export function timelineDawHelpCoverageByArea(area: TimelineDawStudioFocusArea) {
  return TIMELINE_DAW_HELP_WORKFLOWS.filter((workflow) => workflow.area === area);
}
