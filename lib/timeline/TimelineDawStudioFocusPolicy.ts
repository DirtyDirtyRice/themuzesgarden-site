export const TIMELINE_DAW_STUDIO_FOCUS_AREAS = [
  { id: "transport", menuLabel: "Transport", label: "Play and stop the song", help: "Use the main transport and hear the song.", musician: true },
  { id: "arrange", menuLabel: "Tracks & MIDI", label: "Tracks, editing, and MIDI", help: "Move and trim clips, organize tracks, and work with MIDI.", musician: true },
  { id: "record", menuLabel: "Record", label: "Record audio", help: "Choose an input, check its level, and save a take.", musician: true },
  { id: "mix", menuLabel: "Mix", label: "Mix tracks and effects", help: "Set volume, pan, mute, solo, routing, and effects.", musician: true },
  { id: "recover", menuLabel: "Save & Recover", label: "Save or recover work", help: "Return to a protected checkpoint or recover a take.", musician: true },
  { id: "export", menuLabel: "Export", label: "Export the song", help: "Create and download a listening or delivery file.", musician: true },
  { id: "verbal", menuLabel: "Verbal Editing", label: "Verbal Editing", help: "Describe a protected musical change in ordinary words.", musician: true },
  { id: "guide", menuLabel: "Lessons & Checks", label: "Lessons and owner checks", help: "Open learning guides and technical checks.", musician: false },
  { id: "beta", menuLabel: "Beta Tools", label: "Beta testing tools", help: "Manage musician testing and feedback.", musician: false },
  { id: "mastering", menuLabel: "Mastering & Support", label: "Mastering and support tools", help: "Open advanced normalization and support records.", musician: false },
  { id: "technical", menuLabel: "Engine Readiness", label: "Technical engine readiness", help: "Inspect readiness stages and advanced engine details.", musician: false },
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

export function timelineDawCompactMenuGroups() {
  return [
    { label: "Make music", areas: TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => area.musician) },
    { label: "Advanced and owner tools", areas: TIMELINE_DAW_STUDIO_FOCUS_AREAS.filter((area) => !area.musician) },
  ] as const;
}

export function shouldTimelineDawWorkspaceAreaOpen(area: unknown, selectedArea: unknown) {
  const areaId = parseTimelineDawStudioFocusArea(area);
  const selectedId = parseTimelineDawStudioFocusArea(selectedArea);
  return areaId !== null && selectedId !== null && areaId === selectedId;
}

export function timelineDawStudioFocusStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200) throw new Error("A valid DAW session is required for focus restore.");
  return `muzes:daw-studio-focus:${normalized}`;
}

export function timelineDawStudioScrollStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200) throw new Error("A valid DAW session is required for scroll restore.");
  return `muzes:daw-studio-scroll:${normalized}`;
}

export function parseTimelineDawStudioScrollPosition(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10_000_000, Math.round(parsed))) : 0;
}

export function resolveTimelineDawStudioRestoreState(areaValue: unknown, scrollValue: unknown) {
  return {
    area: parseTimelineDawStudioFocusArea(areaValue),
    scrollTop: parseTimelineDawStudioScrollPosition(scrollValue),
  } as const;
}
