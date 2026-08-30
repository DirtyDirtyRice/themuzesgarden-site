export type TimelineDawMixerViewMode = "full" | "compact";

export function timelineDawCompactMixerStorageKey(sessionId: string): string {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for mixer display settings.");
  return `muzes:daw:mixer-view:v1:${normalized}`;
}

export function parseTimelineDawMixerViewMode(value: unknown): TimelineDawMixerViewMode {
  return value === "compact" ? "compact" : "full";
}
