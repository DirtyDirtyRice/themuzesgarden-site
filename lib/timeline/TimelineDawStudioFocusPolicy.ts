export const TIMELINE_DAW_STUDIO_FOCUS_AREAS = [
  { id: "transport", label: "Play and stop the song", help: "Use the main transport and hear the song.", musician: true },
  { id: "arrange", label: "Tracks, editing, and MIDI", help: "Move and trim clips, organize tracks, and work with MIDI.", musician: true },
  { id: "record", label: "Record audio", help: "Choose an input, check its level, and save a take.", musician: true },
  { id: "mix", label: "Mix tracks and effects", help: "Set volume, pan, mute, solo, routing, and effects.", musician: true },
  { id: "recover", label: "Save or recover work", help: "Return to a protected checkpoint or recover a take.", musician: true },
  { id: "export", label: "Export the song", help: "Create and download a listening or delivery file.", musician: true },
  { id: "guide", label: "Lessons and owner checks", help: "Open learning guides and technical checks.", musician: false },
  { id: "beta", label: "Beta testing tools", help: "Manage musician testing and feedback.", musician: false },
  { id: "mastering", label: "Mastering and support tools", help: "Open advanced normalization and support records.", musician: false },
] as const;

export type TimelineDawStudioFocusArea = typeof TIMELINE_DAW_STUDIO_FOCUS_AREAS[number]["id"];

export function parseTimelineDawStudioFocusArea(value: unknown): TimelineDawStudioFocusArea | null {
  return typeof value === "string" && TIMELINE_DAW_STUDIO_FOCUS_AREAS.some((area) => area.id === value)
    ? value as TimelineDawStudioFocusArea
    : null;
}

export function findTimelineDawStudioFocusArea(value: unknown) {
  const id = parseTimelineDawStudioFocusArea(value);
  return id ? TIMELINE_DAW_STUDIO_FOCUS_AREAS.find((area) => area.id === id) ?? null : null;
}

export function timelineDawStudioFocusStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200) throw new Error("A valid DAW session is required for focus restore.");
  return `muzes:daw-studio-focus:${normalized}`;
}
