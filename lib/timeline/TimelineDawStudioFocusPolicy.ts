export const TIMELINE_DAW_STUDIO_FOCUS_AREAS = [
  { id: "guide", label: "Guide and checks" },
  { id: "beta", label: "Beta workflow" },
  { id: "transport", label: "Transport and arrangement" },
  { id: "mastering", label: "Mastering and support" },
  { id: "mix", label: "Audio lanes and Quick Mix" },
  { id: "record", label: "Recording" },
  { id: "recover", label: "Recovery" },
  { id: "export", label: "Export" },
] as const;

export type TimelineDawStudioFocusArea = typeof TIMELINE_DAW_STUDIO_FOCUS_AREAS[number]["id"];

export function parseTimelineDawStudioFocusArea(value: unknown): TimelineDawStudioFocusArea | null {
  return typeof value === "string" && TIMELINE_DAW_STUDIO_FOCUS_AREAS.some((area) => area.id === value)
    ? value as TimelineDawStudioFocusArea
    : null;
}

export function timelineDawStudioFocusStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200) throw new Error("A valid DAW session is required for focus restore.");
  return `muzes:daw-studio-focus:${normalized}`;
}
